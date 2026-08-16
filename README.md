# سرور اعلان Push (اختیاری)

این یک Worker کوچک و رایگان روی Cloudflare است که وظیفه‌اش فقط این است:
هر چند دقیقه یک‌بار چک کند کدام یادآوری‌ها سررسید شده‌اند و یک اعلان Push واقعی
به گوشی بفرستد — حتی وقتی برنامه و مرورگر کاملاً بسته باشند.

بدون این سرور هم برنامه کار می‌کند، ولی اعلان‌ها فقط وقتی برنامه باز یا در
پس‌زمینه مرورگر است نمایش داده می‌شوند (چون مرورگرها اجازه نمی‌دهند یک صفحه‌ی
وب معمولی، تایمر را وقتی کاملاً بسته است اجرا کند).

## مراحل نصب (حدود ۱۰ دقیقه، رایگان)

### ۱. نصب ابزار Wrangler
```bash
npm install -g wrangler
wrangler login
```

### ۲. ساخت پایگاه داده KV
```bash
cd worker
npx wrangler kv namespace create CHECK_REMINDERS_KV
```
خروجی چیزی شبیه این می‌دهد:
```
{ binding = "CHECK_REMINDERS_KV", id = "abcd1234..." }
```
مقدار `id` را کپی کنید و در فایل `wrangler.toml` به جای
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID` قرار دهید.

### ۳. ساخت کلیدهای VAPID
این کلیدها هویت سرور شما را برای سرویس‌های Push (گوگل/موزیلا/اپل) مشخص می‌کنند.
```bash
npx web-push generate-vapid-keys
```
دو مقدار `Public Key` و `Private Key` را نگه دارید.

### ۴. تنظیم Secret ها
```bash
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT
# برای VAPID_SUBJECT چیزی مثل: mailto:you@example.com وارد کنید
```

### ۵. دیپلوی
```bash
npx wrangler deploy
```
در پایان یک آدرس شبیه این می‌گیرید:
```
https://check-reminder-zare-push.YOUR_SUBDOMAIN.workers.dev
```

### ۶. اتصال برنامه به سرور
1. برنامه چک یاداور زارع را باز کنید → تنظیمات
2. در بخش «اعلان Push واقعی»:
   - آدرس سرور اعلان: همان آدرس workers.dev بالا
   - کلید عمومی VAPID: همان Public Key مرحله ۳
3. روی «اتصال اعلان Push» بزنید و اجازه اعلان را در مرورگر تایید کنید.

از این پس، هر بار که چکی اضافه/ویرایش/حذف کنید یا تنظیمات را عوض کنید،
برنامه به‌صورت خودکار اطلاعات را با سرور همگام می‌کند و سرور در زمان مقرر
اعلان واقعی ارسال می‌کند.

## تست سریع
می‌توانید با درخواست زیر یک اعلان تستی بفرستید (subscription را از
DevTools → Application → Service Workers → Push کپی کنید، یا بعد از اتصال
از طریق برنامه امتحان کنید):
```bash
curl -X POST https://YOUR_WORKER_URL/api/test-push \
  -H "Content-Type: application/json" \
  -d '{"subscription": { ... }}'
```

## نکات
- این Worker کاملاً روی پلن رایگان Cloudflare (KV + Cron Triggers) جواب می‌دهد.
- هر ۵ دقیقه یک‌بار اجرا می‌شود؛ یعنی اعلان‌ها ممکن است تا حداکثر چند دقیقه
  با زمان دقیق تنظیم‌شده اختلاف داشته باشند.
- اگر برنامه به‌صورت محلی یا در WebView اندروید اجرا می‌شود، لازم نیست تغییری در
  آدرس Worker بدهید — فقط این Worker جداگانه به‌عنوان «سرور اعلان» به آن وصل می‌شود.
