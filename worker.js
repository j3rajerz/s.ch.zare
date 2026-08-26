/**
 * چک یاداور زارع — Push Notification Backend
 * ----------------------------------------------
 * A small Cloudflare Worker that:
 *   1. Receives (via POST /api/sync) each device's push subscription +
 *      its list of checks + notification settings, and stores it in KV.
 *   2. Runs on a cron schedule (every 5 minutes) and, for every stored
 *      device, works out which reminders are due right now and sends a
 *      real Web Push notification — even if the phone/app is completely
 *      closed.
 *
 * No external npm packages are used; VAPID signing and payload
 * encryption (RFC 8291 / RFC 8292) are implemented directly with the
 * standard Web Crypto API so this runs on the Workers free tier as-is.
 *
 * Deployment instructions are in README.md next to this file.
 */

const RECORD_TTL_DAYS = 60; // stop tracking a device if it hasn't synced in this long
const FIRE_WINDOW_MS = 12 * 60 * 1000; // how "late" a due reminder can be and still fire (must be >= cron interval)
const STALE_MS = 3 * 24 * 60 * 60 * 1000; // ignore reminders more than this overdue (device was offline a long time)

// ==================== HTTP ROUTER ====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    try {
      if (url.pathname === '/api/sync' && request.method === 'POST') {
        const data = await request.json();
        if (!data.subscription || !data.subscription.endpoint) {
          return json({ error: 'missing subscription' }, 400, cors);
        }
        const key = 'device:' + (await sha256Hex(data.subscription.endpoint));
        const existing = await env.CHECK_REMINDERS_KV.get(key, 'json');
        const record = {
          subscription: data.subscription,
          checks: data.checks || [],
          settings: data.settings || {},
          firedTags: existing ? existing.firedTags || [] : [],
          updatedAt: Date.now(),
        };
        await env.CHECK_REMINDERS_KV.put(key, JSON.stringify(record));
        return json({ ok: true }, 200, cors);
      }

      if (url.pathname === '/api/test-push' && request.method === 'POST') {
        const data = await request.json();
        if (!data.subscription) return json({ error: 'missing subscription' }, 400, cors);
        await sendPush(data.subscription, { title: '✅ تست اعلان', body: 'اتصال Push با موفقیت کار می‌کند!' }, env);
        return json({ ok: true }, 200, cors);
      }

      if (url.pathname === '/api/health') {
        return json({ ok: true, time: new Date().toISOString() }, 200, cors);
      }

      return json({ error: 'not found' }, 404, cors);
    } catch (err) {
      return json({ error: String(err && err.message || err) }, 500, cors);
    }
  },

  // Cron trigger — see wrangler.toml for schedule
  async scheduled(event, env, ctx) {
    ctx.waitUntil(processAllReminders(env));
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
  });
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== REMINDER PROCESSING ====================
async function processAllReminders(env) {
  const list = await env.CHECK_REMINDERS_KV.list({ prefix: 'device:' });
  const now = Date.now();

  for (const entry of list.keys) {
    const record = await env.CHECK_REMINDERS_KV.get(entry.name, 'json');
    if (!record) continue;

    // Drop devices that stopped syncing long ago
    if (now - (record.updatedAt || 0) > RECORD_TTL_DAYS * 24 * 60 * 60 * 1000) {
      await env.CHECK_REMINDERS_KV.delete(entry.name);
      continue;
    }

    const settings = Object.assign({ notifications: true, daysBefore: 3, notifTime: '14:00', notifCount: 2 }, record.settings);
    if (!settings.notifications) continue;

    let changed = false;
    const firedTags = new Set(record.firedTags || []);

    for (const check of record.checks || []) {
      if (check.status !== 'pending') continue;

      const due = computeReminderTimes(check, settings);
      for (const item of due) {
        if (firedTags.has(item.tag)) continue;
        const diff = now - item.time;
        if (diff < 0) continue; // not due yet
        if (diff > STALE_MS) { firedTags.add(item.tag); changed = true; continue; } // too old, skip silently
        if (diff <= FIRE_WINDOW_MS) {
          const title = item.isDue ? '🔔 امروز سررسید چک!' : '⏰ یادآوری چک - دبزار زارع';
          try {
            await sendPush(record.subscription, {
              title,
              body: item.body,
              tag: item.tag,
              checkId: check.id,
            }, env);
          } catch (err) {
            console.log('push failed', err);
          }
          // Email is best-effort and independent of push: if the device
          // saved an email address and Resend is configured, also send an
          // email. Never lets an email failure stop the push flow above.
          if (settings.email && env.RESEND_API_KEY) {
            try {
              await sendEmail(settings.email, title, item.body, env);
            } catch (err) {
              console.log('email failed', err);
            }
          }
          firedTags.add(item.tag);
          changed = true;
        }
      }
    }

    if (changed) {
      record.firedTags = [...firedTags].slice(-500);
      await env.CHECK_REMINDERS_KV.put(entry.name, JSON.stringify(record));
    }
  }
}

function computeReminderTimes(check, settings) {
  const [hours, minutes] = (settings.notifTime || '14:00').split(':').map(Number);
  const [gy, gm, gd] = jalaliToGregorian(check.date[0], check.date[1], check.date[2]);
  const dueDate = new Date(gy, gm - 1, gd, hours, minutes).getTime();

  const results = [];
  const daysBefore = Number(settings.daysBefore) || 0;
  const notifCount = Number(settings.notifCount) || 1;

  const allDates = [];
  for (let i = daysBefore; i >= 0; i--) {
    allDates.push(dueDate - i * 24 * 60 * 60 * 1000);
  }
  const finalDates = allDates.slice(0, notifCount);

  finalDates.forEach((time, idx) => {
    const daysLeft = Math.round((dueDate - time) / (24 * 60 * 60 * 1000));
    results.push({
      tag: 'check-reminder-' + check.id + '-' + idx,
      time,
      isDue: false,
      body: `چک ${check.owner} - ${Number(check.amount).toLocaleString('en-US')} ریال - ${daysLeft > 0 ? daysLeft + ' روز تا سررسید' : 'امروز سررسید است!'}`,
    });
  });

  results.push({
    tag: 'check-due-' + check.id,
    time: dueDate,
    isDue: true,
    body: `چک ${check.owner} - ${Number(check.amount).toLocaleString('en-US')} ریال - امروز سررسید است. آیا پاس شده است؟`,
  });

  return results;
}

// Persian (Jalali) -> Gregorian, ported from the app's date utilities
function jalaliToGregorian(jy, jm, jd) {
  let gy = (jy <= 979) ? 0 : 1600;
  jy = (jy <= 979) ? jy - 1 : jy - 979;
  let days = 365 * jy + parseInt(jy / 33) * 8 + parseInt((jy % 33 + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * parseInt(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * parseInt(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * parseInt(days / 1461);
  days %= 1461;
  gy += parseInt((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  let gd = days + 1;
  let sal = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; i < 13 && gd > sal[i]; i++) {
    gd -= sal[i];
    gm = i;
  }
  return [gy, gm + 1, gd];
}

// ==================== EMAIL (via Resend, optional) ====================
// Uses Resend's simple REST API (https://resend.com) instead of Gmail
// directly, because Gmail has no way to accept mail from an anonymous
// Cloudflare Worker without full OAuth. Resend's free tier needs no domain
// verification as long as you send from "onboarding@resend.dev" to the
// same address you signed up with — which is exactly this single-user app's
// situation. See README.md for the 2-minute setup.
async function sendEmail(toAddress, title, body, env) {
  const from = env.RESEND_FROM || 'onboarding@resend.dev';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
    },
    body: JSON.stringify({
      from,
      to: [toAddress],
      subject: title,
      text: body,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('resend error ' + res.status + ' ' + text);
  }
}

// ==================== WEB PUSH (VAPID + aes128gcm) ====================
async function sendPush(subscription, payloadObj, env) {
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObj));
  const { body, headers: encHeaders } = await encryptPayload(payloadBytes, p256dh, auth);

  const audience = new URL(endpoint).origin;
  const vapidHeader = await buildVapidHeader(audience, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT || 'mailto:admin@example.com');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: Object.assign({
      TTL: '86400',
      Authorization: vapidHeader,
    }, encHeaders),
    body,
  });

  if (!res.ok && res.status !== 201) {
    const text = await res.text().catch(() => '');
    throw new Error('push endpoint error ' + res.status + ' ' + text);
  }
}

function b64urlToBytes(b64url) {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function bytesToB64url(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBytes(...arrs) {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrs) { out.set(a, offset); offset += a.length; }
  return out;
}

async function hmacSha256(keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, dataBytes);
  return new Uint8Array(sig);
}

async function hkdf(salt, ikm, infoBytes, length) {
  const prk = await hmacSha256(salt, ikm);
  const t1 = await hmacSha256(prk, concatBytes(infoBytes, new Uint8Array([1])));
  return t1.slice(0, length);
}

// Import the raw uncompressed P-256 public key bytes (65 bytes, 0x04||X||Y)
async function importRawP256PublicKey(rawBytes) {
  const x = bytesToB64url(rawBytes.slice(1, 33));
  const y = bytesToB64url(rawBytes.slice(33, 65));
  return crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x, y, ext: true },
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

async function encryptPayload(payloadBytes, p256dhB64, authB64) {
  const uaPublicRaw = b64urlToBytes(p256dhB64); // 65 bytes
  const authSecret = b64urlToBytes(authB64); // 16 bytes

  const uaPublicKey = await importRawP256PublicKey(uaPublicRaw);

  const asKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey)); // 65 bytes

  const sharedSecretBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPublicKey }, asKeyPair.privateKey, 256);
  const ecdhSecret = new Uint8Array(sharedSecretBits);

  // PRK_key = HMAC-SHA256(auth_secret, ecdh_secret)
  const prkKey = await hmacSha256(authSecret, ecdhSecret);

  // key_info = "WebPush: info" || 0x00 || ua_public || as_public
  const keyInfo = concatBytes(
    new TextEncoder().encode('WebPush: info'),
    new Uint8Array([0]),
    uaPublicRaw,
    asPublicRaw
  );
  const ikm = await hmacSha256(prkKey, concatBytes(keyInfo, new Uint8Array([1])));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  const plaintext = concatBytes(payloadBytes, new Uint8Array([2])); // padding delimiter, no extra padding
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertextBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plaintext);
  const ciphertext = new Uint8Array(ciphertextBuf);

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const idlen = new Uint8Array([asPublicRaw.length]);
  const header = concatBytes(salt, rs, idlen, asPublicRaw);

  const body = concatBytes(header, ciphertext);

  return {
    body,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
    },
  };
}

// ---- VAPID JWT (ES256) ----
async function importVapidPrivateKey(privateKeyB64, publicKeyB64) {
  const pub = b64urlToBytes(publicKeyB64); // 65 bytes, 0x04||X||Y
  const d = bytesToB64url(b64urlToBytes(privateKeyB64)); // 32 bytes raw 'd'
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d,
    ext: true,
  };
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

async function buildVapidHeader(audience, vapidPublicKey, vapidPrivateKey, subject) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };
  const encHeader = bytesToB64url(new TextEncoder().encode(JSON.stringify(header)));
  const encClaims = bytesToB64url(new TextEncoder().encode(JSON.stringify(claims)));
  const signingInput = encHeader + '.' + encClaims;

  const key = await importVapidPrivateKey(vapidPrivateKey, vapidPublicKey);
  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  const sig = bytesToB64url(new Uint8Array(sigBuf));

  const jwt = signingInput + '.' + sig;
  return `vapid t=${jwt}, k=${vapidPublicKey}`;
}
