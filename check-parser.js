// ==================== CHECK PARSER MODULE ====================
// Shared text-understanding logic used by BOTH new input methods
// (ocr.js and voice.js) to turn raw recognized text into the four
// existing check fields: owner name, date, amount, purpose.
//
// Kept in its own file (per the "modular architecture" requirement) so
// camera-OCR and voice-entry reuse exactly the same parsing rules
// instead of duplicating them.
//
// IMPORTANT: this module only ever *extracts* data. It never touches
// the DOM, never saves anything, and never calls the app's storage
// functions — populating the form and reviewing/saving stays entirely
// in app.js / ocr.js / voice.js.

window.CheckParser = (function () {

    // ---- digit helpers: Persian + Arabic-Indic -> English ----
    function normalizeDigits(str) {
        if (!str) return str;
        const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const arabic  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        let out = String(str);
        for (let i = 0; i < 10; i++) {
            out = out.replace(new RegExp(persian[i], 'g'), String(i));
            out = out.replace(new RegExp(arabic[i], 'g'), String(i));
        }
        return out;
    }

    const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

    // ---- Persian day-name (spoken/ordinal) -> number, e.g. "پانزدهم" -> 15 ----
    const DAY_ONES = { 'یک': 1, 'یکم': 1, 'اول': 1, 'دو': 2, 'دوم': 2, 'سه': 3, 'سوم': 3,
        'چهار': 4, 'چهارم': 4, 'پنج': 5, 'پنجم': 5, 'شش': 6, 'ششم': 6, 'هفت': 7, 'هفتم': 7,
        'هشت': 8, 'هشتم': 8, 'نه': 9, 'نهم': 9 };
    const DAY_TEENS = { 'ده': 10, 'دهم': 10, 'یازده': 11, 'یازدهم': 11, 'دوازده': 12, 'دوازدهم': 12,
        'سیزده': 13, 'سیزدهم': 13, 'چهارده': 14, 'چهاردهم': 14, 'پانزده': 15, 'پانزدهم': 15,
        'شانزده': 16, 'شانزدهم': 16, 'هفده': 17, 'هفدهم': 17, 'هجده': 18, 'هجدهم': 18,
        'نوزده': 19, 'نوزدهم': 19 };
    const DAY_TENS_BASE = { 'بیست': 20, 'سی': 30 };

    function persianDayWordToNumber(raw) {
        const t = String(raw).trim();
        if (DAY_TEENS[t] !== undefined) return DAY_TEENS[t];
        if (DAY_ONES[t] !== undefined) return DAY_ONES[t];
        if (DAY_TENS_BASE[t] !== undefined) return DAY_TENS_BASE[t];
        // compounds like "بیست و سوم" / "بیست و یک" / "سی و یکم"
        const m = t.match(/^(بیست|سی)(?:ام|م)?(?:\s*و\s*(.+))?$/);
        if (m) {
            const base = DAY_TENS_BASE[m[1]];
            if (!m[2]) return base;
            const rest = m[2].trim();
            if (DAY_ONES[rest] !== undefined) return base + DAY_ONES[rest];
        }
        return null;
    }

    // ---- Persian number words -> integer (e.g. "پانصد میلیون" -> 500000000) ----
    const W_ONES = { 'صفر': 0, 'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5, 'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9 };
    const W_TEENS = { 'ده': 10, 'یازده': 11, 'دوازده': 12, 'سیزده': 13, 'چهارده': 14, 'پانزده': 15,
        'شانزده': 16, 'هفده': 17, 'هجده': 18, 'نوزده': 19 };
    const W_TENS = { 'بیست': 20, 'سی': 30, 'چهل': 40, 'پنجاه': 50, 'شصت': 60, 'هفتاد': 70, 'هشتاد': 80, 'نود': 90 };
    const W_HUNDREDS = { 'یکصد': 100, 'صد': 100, 'دویست': 200, 'سیصد': 300, 'چهارصد': 400,
        'پانصد': 500, 'ششصد': 600, 'هفتصد': 700, 'هشتصد': 800, 'نهصد': 900 };
    const W_SCALES = { 'هزار': 1000, 'میلیون': 1000000, 'میلیارد': 1000000000 };

    // All recognized Persian number words + the conjunction "و", used to build
    // a regex alternation that matches ONLY legitimate number-word sequences
    // (see extractAmount's word-based fallback and extractDate's word-year
    // fallback below). Sorted longest-first so e.g. "چهارده" isn't cut short
    // by an earlier, shorter alternative branch.
    const NUMBER_WORD_KEYS = Object.keys(W_ONES)
        .concat(Object.keys(W_TEENS), Object.keys(W_TENS), Object.keys(W_HUNDREDS), Object.keys(W_SCALES), ['و'])
        .sort((a, b) => b.length - a.length);
    const NUMBER_WORD_ALT = NUMBER_WORD_KEYS.join('|');

    function persianWordsToNumber(text) {
        const tokens = String(text).replace(/[،,]/g, ' ').split(/\s+/).filter(Boolean);
        let total = 0, chunk = 0, matchedAny = false;
        for (const tok of tokens) {
            if (tok === 'و') continue;
            if (W_ONES[tok] !== undefined) { chunk += W_ONES[tok]; matchedAny = true; continue; }
            if (W_TEENS[tok] !== undefined) { chunk += W_TEENS[tok]; matchedAny = true; continue; }
            if (W_TENS[tok] !== undefined) { chunk += W_TENS[tok]; matchedAny = true; continue; }
            if (W_HUNDREDS[tok] !== undefined) { chunk += W_HUNDREDS[tok]; matchedAny = true; continue; }
            if (W_SCALES[tok] !== undefined) {
                chunk = chunk || 1;
                total += chunk * W_SCALES[tok];
                chunk = 0;
                matchedAny = true;
                continue;
            }
            // unknown token inside the number phrase — ignore and keep going,
            // since surrounding filler words ("مبلغ", "است", ...) may be caught
            // up in the matched span
        }
        total += chunk;
        return matchedAny ? total : null;
    }

    // ==================== AMOUNT EXTRACTION ====================
    // Handles: "۵۰۰ میلیون تومان", "500 میلیون تومان", "۵۰۰,۰۰۰,۰۰۰",
    // "500,000,000", "پانصد میلیون تومان", "پانصد میلیون ریال".
    //
    // Convention (matches how Iranian checks/bank forms work): the app's
    // amount field is in RIAL. "تومان" (Toman) amounts are ×10 into Rial.
    // A bare number with no unit word is assumed to already be Rial (this
    // matches manual entry, where the placeholder/label is explicitly
    // "مبلغ چک (ریال)").
    function extractAmount(rawText) {
        const text = normalizeDigits(rawText);
        let best = null;

        // 1) Digit-based: optional scale word + optional unit word.
        // The first alternative only accepts *proper* thousand-grouped runs
        // (each extra group exactly 3 digits, e.g. "500,000,000" or
        // "500 000 000") so it can never swallow an unrelated neighboring
        // number (like a "15" day-of-month) through a stray space; the
        // second alternative matches a single contiguous digit run only
        // (no internal spaces), which is what OCR/typed amounts look like.
        const digitRe = /(\d{1,3}(?:[,.\x20]\d{3})+|\d+)\s*(هزار|میلیون|میلیارد)?\s*(تومان|ریال)?/g;
        let m;
        while ((m = digitRe.exec(text)) !== null) {
            const numStr = m[1].replace(/[,.\s]/g, '');
            if (numStr.length < 2) continue; // ignore lone digits (likely a date fragment)
            let value = parseInt(numStr, 10);
            if (!value) continue;
            const scale = m[2], unit = m[3];
            if (scale === 'هزار') value *= 1000;
            else if (scale === 'میلیون') value *= 1000000;
            else if (scale === 'میلیارد') value *= 1000000000;
            if (unit === 'تومان') value *= 10;

            const confidence = (unit ? 2 : 0) + (scale ? 1 : 0) + (numStr.length >= 6 ? 1 : 0);
            if (!best || confidence > best.confidence) {
                best = { value, confidence, raw: m[0] };
            }
        }

        // 2) Word-based amount, only trusted if nothing more confident was found
        if (!best || best.confidence === 0) {
            // IMPORTANT: the group before the scale word must only ever match
            // actual Persian NUMBER words (plus the conjunction "و"), never
            // "any Persian word". An earlier version used [\u0600-\u06FF]+
            // here, which matches *any* Persian word — so on a sentence like
            // "صاحب چک علی احمدی مبلغ چک پانصد میلیون تومان" it would greedily
            // swallow "صاحب چک علی احمدی مبلغ چک پانصد" as if it were all part
            // of the amount, deleting the owner's name from the text. Building
            // the alternation from the same NUMBER_WORD_KEYS used to actually
            // parse the value below prevents that.
            const wordRe = new RegExp('((?:(?:' + NUMBER_WORD_ALT + ')\\s+){0,6}(?:' + NUMBER_WORD_ALT + '))\\s*(هزار|میلیون|میلیارد)\\s*(تومان|ریال)?');
            const wm = text.match(wordRe);
            if (wm) {
                const num = persianWordsToNumber(wm[1] + ' ' + wm[2]);
                if (num) {
                    let value = num;
                    if (wm[3] === 'تومان') value *= 10;
                    best = { value, confidence: 3, raw: wm[0] };
                }
            }
        }

        return best; // { value, raw } or null
    }

    // ==================== DATE EXTRACTION ====================
    // Returns Jalali [year, month, day] — the SAME internal format the app
    // already stores dates in (selectedDate / check.date), so no further
    // conversion is ever needed by callers. Handles:
    // ۱۴۰۵/۰۷/۱۵ , 1405/07/15 , ۱۵/۰۷/۱۴۰۵ , 15/07/1405 ,
    // ۱۵ مهر ۱۴۰۵ , پانزدهم مهر ۱۴۰۵
    function extractDate(rawText) {
        const text = normalizeDigits(rawText);

        // Numeric, year-first (4-digit year in the first group)
        let m = text.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
        if (m) {
            const r = normalizeJalali(Number(m[1]), Number(m[2]), Number(m[3]));
            if (r) return { date: r, raw: m[0] };
        }

        // Numeric, year-last (4-digit year in the last group) — day/month order
        m = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
        if (m) {
            const r = normalizeJalali(Number(m[3]), Number(m[2]), Number(m[1]));
            if (r) return { date: r, raw: m[0] };
        }

        // Month-name based, day either as digits or a spoken/ordinal word,
        // in either "day month year" or "month day year" order.
        //
        // DAY_WORD allows a compound ordinal like "بیست و دوم" (twenty and
        // second) — not just a single word — since that's how two-digit days
        // are naturally spoken; persianDayWordToNumber() already knows how to
        // parse that whole compound once captured as one piece.
        // MONTH_OPT allows an optional trailing "ماه" ("month") after the
        // month name itself, e.g. "دی ماه", which is extremely common in
        // spoken Persian ("...دی ماه هزار و چهارصد...").
        const DAY_WORD = '(?:[\\u0600-\\u06FF]+(?:\\s+و\\s+[\\u0600-\\u06FF]+)?|\\d{1,2})';
        for (let mi = 0; mi < PERSIAN_MONTHS.length; mi++) {
            const month = PERSIAN_MONTHS[mi] + '(?:\\s*ماه)?';
            let re = new RegExp('(' + DAY_WORD + ')\\s*' + month + '\\s*(\\d{4})');
            let mm = text.match(re);
            if (mm) {
                const day = /^\d+$/.test(mm[1]) ? Number(mm[1]) : persianDayWordToNumber(mm[1]);
                const year = Number(mm[2]);
                const r = normalizeJalali(year, mi + 1, day);
                if (r) return { date: r, raw: mm[0] };
            }
            re = new RegExp(month + '\\s*(' + DAY_WORD + ')\\s*(\\d{4})');
            mm = text.match(re);
            if (mm) {
                const day = /^\d+$/.test(mm[1]) ? Number(mm[1]) : persianDayWordToNumber(mm[1]);
                const year = Number(mm[2]);
                const r = normalizeJalali(year, mi + 1, day);
                if (r) return { date: r, raw: mm[0] };
            }

            // Fully spoken date, e.g. "پانزدهم مهر هزار و چهارصد و پنج" — the
            // year has no digits at all (very common when the whole check is
            // dictated by voice rather than read off digit by digit). Without
            // this, extractDate() returns null for the entire date, and the
            // day/month/year WORDS are never removed from the working text —
            // they just leak through and get glued onto the owner name by
            // extractOwner() further down, since it keeps whatever's left over.
            // The year phrase itself is matched only from known number words
            // (NUMBER_WORD_ALT), same restriction as the amount fix above, so
            // it can't swallow unrelated name/label words; normalizeJalali's
            // 1300-1500 range check guards against a bad parse besides.
            const wordYearRe = new RegExp('(' + DAY_WORD + ')\\s*' + month +
                '\\s*((?:(?:' + NUMBER_WORD_ALT + ')\\s*){1,7})');
            mm = text.match(wordYearRe);
            if (mm) {
                const day = /^\d+$/.test(mm[1]) ? Number(mm[1]) : persianDayWordToNumber(mm[1]);
                const year = persianWordsToNumber(mm[2]);
                const r = normalizeJalali(year, mi + 1, day);
                if (r) return { date: r, raw: mm[0] };
            }
        }

        return null;
    }

    function normalizeJalali(y, m, d) {
        if (!y || !m || !d) return null;
        if (m < 1 || m > 12 || d < 1 || d > 31) return null;
        if (y < 1300 || y > 1500) return null; // sanity range for a Shamsi year
        return [y, m, d];
    }

    // ==================== PURPOSE EXTRACTION ====================
    // "بابت خرید کالا", "برای ...", "جهت ...", or the English "for"/"regarding".
    function extractPurpose(rawText) {
        const re = /(?:بابت|برای|جهت|به منظور|regarding|for)\s*[:\-]?\s*(.+)$/i;
        const m = String(rawText).match(re);
        if (!m) return null;
        let purpose = m[1].trim();
        purpose = purpose.replace(/\s*(است|میباشد|می‌باشد)\.?\s*$/, '').trim();
        purpose = purpose.replace(/[.,،]+$/, '').trim();
        if (!purpose) return null;
        return { purpose, raw: m[0] };
    }

    // ==================== OWNER EXTRACTION (leftover-based) ====================
    // After the amount, date and purpose spans have been removed from the
    // text, whatever plausibly-Persian-name text remains is treated as the
    // check owner's name, once known field-label keywords are stripped out.
    const STRIP_WORDS = ['نام و نام خانوادگی', 'نام خانوادگی', 'صاحب چک', 'صاحب', 'نام',
        'مبلغ چک', 'مبلغ', 'چک', 'تاریخ', 'است', 'میباشد', 'می‌باشد', 'و',
        'owner', 'name', 'check', 'date', 'amount', 'is', 'the', 'purpose'];

    function extractOwner(remainderText) {
        let t = String(remainderText || '');
        // Normalize punctuation to spaces FIRST so a keyword sitting directly
        // against a comma/period (e.g. "است،") still gets recognized as a
        // whole word by the whitespace-boundary check below.
        t = t.replace(/[.,،:\-]+/g, ' ');
        STRIP_WORDS.forEach(w => {
            t = t.replace(new RegExp('(^|\\s)' + w + '(?=\\s|$)', 'gi'), ' ');
        });
        t = t.replace(/\s+/g, ' ').trim();
        return t || null;
    }

    // ==================== MAIN ENTRY POINT ====================
    // parse(rawText) -> { owner, date, amount, purpose, raw }
    // date is Jalali [y, m, d] or null; amount is a plain number (Rial) or null.
    function parse(rawText) {
        const original = String(rawText || '').trim();
        // Normalize digits ONCE up front and use that normalized string for
        // every subsequent match + removal. This matters because
        // extractAmount()/extractDate() internally normalize digits before
        // matching, so the `raw` span they return is already in English
        // digits — removing it from a working copy that still has Persian
        // digits would silently fail to match, leaving date/amount digits
        // behind to pollute the owner-name leftover. Normalizing digits
        // never changes Persian letters, so this is safe for the
        // owner/purpose word-matching below too.
        let working = normalizeDigits(original);
        const result = { owner: null, date: null, amount: null, purpose: null, raw: original };

        const purposeMatch = extractPurpose(working);
        if (purposeMatch) {
            result.purpose = purposeMatch.purpose;
            working = working.split(purposeMatch.raw).join(' ');
        }

        const amountMatch = extractAmount(working);
        if (amountMatch) {
            result.amount = amountMatch.value;
            working = working.split(amountMatch.raw).join(' ');
        }

        const dateMatch = extractDate(working);
        if (dateMatch) {
            result.date = dateMatch.date;
            working = working.split(dateMatch.raw).join(' ');
        }

        result.owner = extractOwner(working);

        return result;
    }

    return {
        parse,
        normalizeDigits,
        extractAmount,
        extractDate,
        extractPurpose,
        extractOwner,
        persianWordsToNumber,
        persianDayWordToNumber
    };
})();
