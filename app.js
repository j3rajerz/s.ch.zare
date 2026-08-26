// ==================== PERSIAN DATE UTILITIES ====================
const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const persianDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

// Convert Gregorian to Persian (Jalali)
function gregorianToJalali(gy, gm, gd) {
    let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy = (gy <= 1600) ? gy - 1 : gy - 1600;
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 365 * gy + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100) + parseInt((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * parseInt(days / 12053);
    days %= 12053;
    jy += 4 * parseInt(days / 1461);
    days %= 1461;
    jy += parseInt((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
    let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return [jy, jm, jd];
}

// Convert Persian (Jalali) to Gregorian
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

// Get today's Persian date
function getTodayPersian() {
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// Format Persian date
function formatPersianDate(jy, jm, jd) {
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

// Format Persian date with month name
function formatPersianDateFull(jy, jm, jd) {
    return `${jd} ${persianMonths[jm - 1]} ${jy}`;
}

// Convert Persian number to English
function persianToEnglish(str) {
    const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = str;
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(persian[i], 'g'), english[i]);
    }
    return result;
}

// Convert English number to Persian
function englishToPersian(str) {
    const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = String(str);
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(english[i], 'g'), persian[i]);
    }
    return result;
}

// Format number with commas (Persian)
function formatNumber(num) {
    return englishToPersian(Number(num).toLocaleString('en-US'));
}

// Number to Persian words
function numberToWords(num) {
    const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const thousands = ['', 'هزار', 'میلیون', 'میلیارد'];

    if (num === 0) return 'صفر';
    if (num < 0) return 'منفی ' + numberToWords(-num);

    let result = '';
    let i = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk !== 0) {
            let chunkStr = '';
            let h = Math.floor(chunk / 100);
            let t = Math.floor((chunk % 100) / 10);
            let o = chunk % 10;

            if (h > 0) chunkStr += hundreds[h] + ' و ';
            if (t >= 2) {
                chunkStr += tens[t];
                if (o > 0) chunkStr += ' و ' + ones[o];
            } else if (t === 1) {
                chunkStr += teens[o];
            } else if (o > 0) {
                chunkStr += ones[o];
            }

            chunkStr = chunkStr.replace(/ و $/, '');
            if (i > 0) chunkStr += ' ' + thousands[i];
            if (result) chunkStr += ' و ';
            result = chunkStr + result;
        }
        num = Math.floor(num / 1000);
        i++;
    }

    return result + ' ریال';
}

// Escape text before injecting into innerHTML, so names/descriptions
// containing quotes, < > or other characters can never break the markup
// or the buttons that come after them (this was the root cause of the
// delete button silently failing for certain check entries).
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ==================== APP STATE ====================
let currentUser = null;
let checks = [];
let settings = {
    notifications: false, // OFF by default; the user must explicitly turn this on
                           // from Settings, which triggers a real browser permission
                           // request (see enableNotifications()).
    daysBefore: 3,
    notifTime: '14:00',
    notifCount: 2,
    workerUrl: '',
    vapidKey: '',
    pushSubscribed: false,
    email: '' // optional: address to also receive reminders by email (via the Worker backend)
};
let currentStep = 1;
let selectedDate = null;
let currentMonth = null;
let currentYear = null;
let modalCallback = null;
let editingCheckId = null; // null = adding a new check, otherwise editing this check's id

// ==================== STORAGE ====================
function loadData() {
    const savedChecks = localStorage.getItem('zare_checks');
    const savedSettings = localStorage.getItem('zare_settings');
    const savedUser = localStorage.getItem('zare_user');

    if (savedChecks) checks = JSON.parse(savedChecks);
    if (savedSettings) settings = Object.assign(settings, JSON.parse(savedSettings));
    if (savedUser) currentUser = JSON.parse(savedUser);

    // Safety net: if notifications were left "on" from an older version of the
    // app (back when the toggle didn't actually do anything) but the browser
    // was never actually granted permission, turn the setting back off so the
    // Settings screen honestly reflects reality instead of showing a toggle
    // that looks active but silently does nothing.
    if (settings.notifications && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        settings.notifications = false;
    }
}

function saveData() {
    localStorage.setItem('zare_checks', JSON.stringify(checks));
    localStorage.setItem('zare_settings', JSON.stringify(settings));
    if (currentUser) localStorage.setItem('zare_user', JSON.stringify(currentUser));
}

// ==================== AUTH ====================
function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Default credentials
    let storedPassword = localStorage.getItem('zare_password');
    if (!storedPassword) storedPassword = '1335';

    if (username === 'zare' && password === storedPassword) {
        currentUser = { username: 'zare' };
        saveData();
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appHeader').style.display = 'flex';
        document.getElementById('bottomNav').style.display = 'flex';
        showDashboard();
        showToast('✓', 'خوش آمدید آقای زارع!', 'success');

        // Schedule notifications
        scheduleNotifications();
        syncToWorker();
    } else {
        document.getElementById('loginError').classList.add('show');
        setTimeout(() => document.getElementById('loginError').classList.remove('show'), 3000);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('zare_user');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appHeader').style.display = 'none';
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('addCheckScreen').style.display = 'none';
    document.getElementById('checksListScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('loginPassword').value = '';
}

// ==================== NAVIGATION ====================
function hideAllScreens() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('addCheckScreen').style.display = 'none';
    document.getElementById('checksListScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
}

function showDashboard() {
    hideAllScreens();
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'داشبورد';
    document.getElementById('navDashboard').classList.add('active');
    updateStats();
}

function showAddCheck() {
    editingCheckId = null;
    hideAllScreens();
    document.getElementById('addCheckScreen').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'ثبت چک جدید';
    document.getElementById('addCheckTitle').textContent = 'ثبت چک جدید';
    document.getElementById('submitCheckBtn').textContent = '✓ ثبت چک';
    document.getElementById('navAdd').classList.add('active');
    resetForm();
}

function showEditCheck(id) {
    const check = checks.find(c => c.id === id);
    if (!check) return;

    editingCheckId = id;
    hideAllScreens();
    document.getElementById('addCheckScreen').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'ویرایش چک';
    document.getElementById('addCheckTitle').textContent = 'ویرایش چک';
    document.getElementById('submitCheckBtn').textContent = '✓ ذخیره تغییرات';

    // Pre-fill the form with the existing check's data
    currentStep = 1;
    selectedDate = check.date.slice();
    document.getElementById('checkOwner').value = check.owner;
    document.getElementById('checkAmount').value = formatNumber(check.amount);
    document.getElementById('amountWords').textContent = numberToWords(check.amount);
    document.getElementById('checkDesc').value = check.description;
    document.getElementById('selectedDateDisplay').textContent = formatPersianDateFull(check.date[0], check.date[1], check.date[2]);

    currentYear = check.date[0];
    currentMonth = check.date[1];
    renderDatePicker();
    updateStepUI();
}

function showChecksList() {
    hideAllScreens();
    document.getElementById('checksListScreen').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'چک‌های ثبت شده';
    document.getElementById('navList').classList.add('active');
    checksListShowAll = false;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    renderChecksList();
}

function showSettings() {
    hideAllScreens();
    document.getElementById('settingsScreen').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'تنظیمات';
    document.getElementById('navSettings').classList.add('active');
    loadSettingsUI();
}

// ==================== STATS ====================
function updateStats() {
    const total = checks.length;
    const paid = checks.filter(c => c.status === 'paid').length;
    const unpaid = checks.filter(c => c.status === 'unpaid').length;
    const upcoming = checks.filter(c => c.status === 'pending').length;

    document.getElementById('statTotal').textContent = englishToPersian(total);
    document.getElementById('statPaid').textContent = englishToPersian(paid);
    document.getElementById('statUnpaid').textContent = englishToPersian(unpaid);
    document.getElementById('statUpcoming').textContent = englishToPersian(upcoming);
}

// ==================== ADD CHECK FORM ====================
function resetForm() {
    currentStep = 1;
    selectedDate = null;
    document.getElementById('checkOwner').value = '';
    document.getElementById('checkAmount').value = '';
    document.getElementById('checkDesc').value = '';
    document.getElementById('amountWords').textContent = '';
    document.getElementById('selectedDateDisplay').textContent = 'لطفاً تاریخ را انتخاب کنید';

    // Initialize date picker
    const today = getTodayPersian();
    currentYear = today[0];
    currentMonth = today[1];
    renderDatePicker();

    updateStepUI();
    disableFreeStepNavigation();
    dismissExtractionBanner();
    setActiveMethodButton('manual');

    // Focus first input
    setTimeout(() => document.getElementById('checkOwner').focus(), 100);
}

// Manual-entry button in the method selector: start a clean form, same as
// showAddCheck() but callable while already on the add-check screen (e.g.
// to discard OCR/voice-extracted data and start over by hand).
function startManualEntry() {
    resetForm();
}

// ==================== SCAN / VOICE -> FORM BRIDGE ====================
// Called by ocr.js and voice.js once they've parsed the four fields out of
// recognized text. Populates the SAME registration form manual entry uses,
// shows a review banner, and lets the user freely jump between steps to
// check/correct anything before saving. Nothing is saved here — saving
// still only happens when the user presses the existing "ثبت چک" button.
function applyExtractedCheckData(fields, sourceLabel) {
    showAddCheck(); // resets the form + date picker, sets currentStep = 1

    if (fields.owner) {
        document.getElementById('checkOwner').value = fields.owner;
    }

    if (fields.amount) {
        document.getElementById('checkAmount').value = formatNumber(fields.amount);
        document.getElementById('amountWords').textContent = numberToWords(fields.amount);
    }

    if (fields.date) {
        selectedDate = fields.date;
        currentYear = fields.date[0];
        currentMonth = fields.date[1];
        document.getElementById('selectedDateDisplay').textContent =
            formatPersianDateFull(fields.date[0], fields.date[1], fields.date[2]);
        renderDatePicker();
    }

    if (fields.purpose) {
        document.getElementById('checkDesc').value = fields.purpose;
    }

    // Land on the first still-missing field, but make every step reachable
    // via the dots so the user can freely review/correct any of the four.
    currentStep = !fields.owner ? 1 : !fields.amount ? 2 : !fields.date ? 3 : 4;
    updateStepUI();
    enableFreeStepNavigation();

    showExtractionBanner(sourceLabel);
    showToast('✓', 'اطلاعات استخراج شد. لطفاً بررسی و در صورت نیاز اصلاح کنید', 'success');
}

function enableFreeStepNavigation() {
    document.querySelectorAll('.step-dot').forEach((el, i) => {
        el.onclick = () => { currentStep = i + 1; updateStepUI(); };
        el.style.cursor = 'pointer';
    });
}

function disableFreeStepNavigation() {
    document.querySelectorAll('.step-dot').forEach((el) => {
        el.onclick = null;
        el.style.cursor = 'default';
    });
}

function showExtractionBanner(sourceLabel) {
    const banner = document.getElementById('extractionBanner');
    const textEl = document.getElementById('extractionBannerText');
    if (!banner || !textEl) return;
    textEl.textContent = sourceLabel + ' — اطلاعات استخراج شد. لطفاً هر ۴ فیلد را بررسی و در صورت نیاز اصلاح کنید، سپس «ثبت چک» را بزنید.';
    banner.style.display = 'flex';
}

function dismissExtractionBanner() {
    const banner = document.getElementById('extractionBanner');
    if (banner) banner.style.display = 'none';
}

function setActiveMethodButton(method) {
    document.querySelectorAll('.method-btn').forEach(el => {
        el.classList.toggle('active', el.dataset.method === method);
    });
}

function updateStepUI() {
    document.querySelectorAll('.form-step').forEach((el, i) => {
        el.classList.toggle('active', i + 1 === currentStep);
    });
    document.querySelectorAll('.step-dot').forEach((el, i) => {
        el.classList.toggle('active', i + 1 === currentStep);
    });
}

function nextStep(step) {
    if (step === 1) {
        const owner = document.getElementById('checkOwner').value.trim();
        if (!owner) {
            showToast('⚠️', 'لطفاً نام صاحب چک را وارد کنید', 'error');
            return;
        }
    }
    if (step === 2) {
        const amount = persianToEnglish(document.getElementById('checkAmount').value).replace(/,/g, '');
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            showToast('⚠️', 'لطفاً مبلغ صحیح وارد کنید', 'error');
            return;
        }
    }
    if (step === 3) {
        if (!selectedDate) {
            showToast('⚠️', 'لطفاً تاریخ سررسید را انتخاب کنید', 'error');
            return;
        }
    }

    currentStep = step + 1;
    updateStepUI();

    // Focus next input
    setTimeout(() => {
        if (currentStep === 2) document.getElementById('checkAmount').focus();
        if (currentStep === 4) document.getElementById('checkDesc').focus();
    }, 100);
}

function prevStep(step) {
    currentStep = step - 1;
    updateStepUI();
}

// Amount input handler
let amountTimeout;
document.addEventListener('DOMContentLoaded', function() {
    const amountInput = document.getElementById('checkAmount');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            clearTimeout(amountTimeout);
            const val = persianToEnglish(this.value).replace(/[^0-9]/g, '');
            if (val) {
                this.value = formatNumber(val);
                amountTimeout = setTimeout(() => {
                    document.getElementById('amountWords').textContent = numberToWords(Number(val));
                }, 300);
            } else {
                document.getElementById('amountWords').textContent = '';
            }
        });
    }
});

// ==================== DATE PICKER ====================
function renderDatePicker() {
    document.getElementById('monthYear').textContent = persianMonths[currentMonth - 1] + ' ' + englishToPersian(currentYear);

    const grid = document.getElementById('dateGrid');
    grid.innerHTML = '';

    // Day headers
    persianDays.forEach(day => {
        const div = document.createElement('div');
        div.className = 'day-header';
        div.textContent = day;
        grid.appendChild(div);
    });

    // Get first day of month
    const gregDate = jalaliToGregorian(currentYear, currentMonth, 1);
    const firstDay = new Date(gregDate[0], gregDate[1] - 1, gregDate[2]).getDay();
    const persianFirstDay = (firstDay + 1) % 7; // Adjust for Persian calendar (Saturday = 0)

    // Days in month
    const daysInMonth = (currentMonth <= 6) ? 31 : (currentMonth === 12 && !isLeapYear(currentYear)) ? 29 : 30;

    // Previous month days
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevDaysInMonth = (prevMonth <= 6) ? 31 : (prevMonth === 12 && !isLeapYear(prevYear)) ? 29 : 30;

    for (let i = persianFirstDay - 1; i >= 0; i--) {
        const div = document.createElement('div');
        div.className = 'day other-month';
        div.textContent = englishToPersian(prevDaysInMonth - i);
        grid.appendChild(div);
    }

    // Current month days
    const today = getTodayPersian();
    for (let d = 1; d <= daysInMonth; d++) {
        const div = document.createElement('div');
        div.className = 'day';
        div.textContent = englishToPersian(d);

        if (currentYear === today[0] && currentMonth === today[1] && d === today[2]) {
            div.classList.add('today');
        }

        if (selectedDate && selectedDate[0] === currentYear && selectedDate[1] === currentMonth && selectedDate[2] === d) {
            div.classList.add('selected');
        }

        div.onclick = () => selectDate(d);
        grid.appendChild(div);
    }

    // Next month days
    const remaining = (7 - ((persianFirstDay + daysInMonth) % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        const div = document.createElement('div');
        div.className = 'day other-month';
        div.textContent = englishToPersian(i);
        grid.appendChild(div);
    }
}

function isLeapYear(year) {
    const arr = [1, 5, 9, 13, 17, 22, 26, 30];
    const b = year % 33;
    return arr.includes(b);
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    renderDatePicker();
}

function selectDate(day) {
    selectedDate = [currentYear, currentMonth, day];
    document.getElementById('selectedDateDisplay').textContent = formatPersianDateFull(currentYear, currentMonth, day);
    renderDatePicker();
}

// ==================== SUBMIT CHECK ====================
function submitCheck() {
    const owner = document.getElementById('checkOwner').value.trim();
    const amount = Number(persianToEnglish(document.getElementById('checkAmount').value).replace(/,/g, ''));
    const desc = document.getElementById('checkDesc').value.trim() || 'بدون توضیحات';

    if (!owner || !amount || !selectedDate) {
        showToast('⚠️', 'لطفاً همه فیلدها را تکمیل کنید', 'error');
        return;
    }

    if (editingCheckId !== null) {
        const check = checks.find(c => c.id === editingCheckId);
        if (!check) {
            showToast('⚠️', 'چک مورد نظر یافت نشد', 'error');
            editingCheckId = null;
            showDashboard();
            return;
        }
        check.owner = owner;
        check.amount = amount;
        check.date = selectedDate;
        check.dateStr = formatPersianDate(selectedDate[0], selectedDate[1], selectedDate[2]);
        check.description = desc;

        saveData();
        showToast('✓', 'تغییرات چک ذخیره شد', 'success');

        if (settings.notifications) {
            clearScheduledNotificationsFor(check.id);
            if (check.status === 'pending') scheduleCheckNotification(check);
        }
        syncToWorker();

        editingCheckId = null;
        setTimeout(() => showDashboard(), 800);
        return;
    }

    const check = {
        id: Date.now(),
        owner: owner,
        amount: amount,
        date: selectedDate,
        dateStr: formatPersianDate(selectedDate[0], selectedDate[1], selectedDate[2]),
        description: desc,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    checks.push(check);
    saveData();

    showToast('✓', 'چک با موفقیت ثبت شد', 'success');

    // Schedule notification for this check
    if (settings.notifications) {
        scheduleCheckNotification(check);
    }
    syncToWorker();

    setTimeout(() => {
        showDashboard();
    }, 1000);
}

// ==================== CHECKS LIST ====================
const CHECKS_LIST_PAGE_SIZE = 5;
let checksListShowAll = false;

// Sort so that whichever check's due date is CLOSEST to today (in either
// direction) comes first. Still-pending checks are grouped ahead of
// paid/unpaid ones so the things the user actually needs to act on are
// always what they see first.
function sortChecksByProximity(list) {
    const today = getTodayPersian();
    const todayVal = today[0] * 10000 + today[1] * 100 + today[2];

    return list.slice().sort((a, b) => {
        const aPending = a.status === 'pending' ? 0 : 1;
        const bPending = b.status === 'pending' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;

        const aVal = a.date[0] * 10000 + a.date[1] * 100 + a.date[2];
        const bVal = b.date[0] * 10000 + b.date[1] * 100 + b.date[2];
        return Math.abs(aVal - todayVal) - Math.abs(bVal - todayVal);
    });
}

function renderChecksList(filter = '') {
    const list = document.getElementById('checksList');
    const moreBox = document.getElementById('checksListMore');
    list.innerHTML = '';

    // Searching by owner name, amount, "بابت"/description, or date (any of
    // the formats the date is shown/stored in) always searches the FULL
    // list — the 5-item cap below only applies to the default, unfiltered view.
    let filtered = checks;
    if (filter) {
        // Normalize both the query and every searchable field to plain
        // English digits + lowercase, so it doesn't matter whether the user
        // types Persian or English numerals, or searches by owner name,
        // amount, "بابت"/description, or the check's date (in any format:
        // 1404/06/04, "4 شهریور 1404", etc).
        const f = persianToEnglish(filter).toLowerCase().trim();
        filtered = checks.filter(c => {
            const fullDatePersian = persianToEnglish(formatPersianDateFull(c.date[0], c.date[1], c.date[2])).toLowerCase();
            return c.owner.toLowerCase().includes(f) ||
                c.amount.toString().includes(f) ||
                c.dateStr.includes(f) ||
                fullDatePersian.includes(f) ||
                (c.description || '').toLowerCase().includes(f);
        });
    }

    filtered = sortChecksByProximity(filtered);

    const totalMatches = filtered.length;
    const isTruncated = !filter && !checksListShowAll && totalMatches > CHECKS_LIST_PAGE_SIZE;
    if (isTruncated) {
        filtered = filtered.slice(0, CHECKS_LIST_PAGE_SIZE);
    }

    if (totalMatches === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>${filter ? 'چکی با این مشخصات یافت نشد' : 'هنوز چکی ثبت نشده است'}</p>
            </div>
        `;
        if (moreBox) moreBox.innerHTML = '';
        return;
    }

    filtered.forEach(check => {
        const card = document.createElement('div');
        card.className = `check-card ${check.status}`;
        card.dataset.id = String(check.id);
        card.innerHTML = `
            <div class="check-card-header">
                <div class="check-owner">${escapeHtml(check.owner || '')}</div>
                <div class="check-amount">${formatNumber(check.amount || 0)} ریال</div>
            </div>
            <div class="check-card-body">
                <div class="check-date">
                    <span>📅</span>
                    <span>${check.dateStr || formatPersianDate(check.date[0], check.date[1], check.date[2])}</span>
                </div>
                <div class="check-status ${check.status}">
                    ${check.status === 'paid' ? '✓ پاس شده' : check.status === 'unpaid' ? '✗ پاس نشده' : '⏳ در انتظار'}
                </div>
            </div>
            <div style="margin-top:8px; font-size:12px; color:var(--text-muted);">${escapeHtml(check.description || '')}</div>
            <div class="check-actions">
                ${check.status !== 'paid' ? `<button class="btn-mark-paid" data-action="paid">✓ پاس شده</button>` : ''}
                ${check.status !== 'unpaid' ? `<button class="btn-mark-unpaid" data-action="unpaid">✗ پاس نشده</button>` : ''}
                <button class="btn-edit" data-action="edit">✏️ ویرایش</button>
                <button class="btn-delete" data-action="delete">🗑️ حذف</button>
            </div>
        `;
        list.appendChild(card);
    });

    if (moreBox) {
        if (isTruncated) {
            moreBox.innerHTML = `<button class="btn-show-all" id="btnShowAllChecks">نمایش همه چک‌ها (${englishToPersian(totalMatches)})</button>`;
            document.getElementById('btnShowAllChecks').onclick = () => {
                checksListShowAll = true;
                renderChecksList(document.getElementById('searchInput').value);
            };
        } else if (!filter && checksListShowAll && totalMatches > CHECKS_LIST_PAGE_SIZE) {
            moreBox.innerHTML = `<button class="btn-show-all" id="btnShowLessChecks">نمایش ۵ چک نزدیک‌تر</button>`;
            document.getElementById('btnShowLessChecks').onclick = () => {
                checksListShowAll = false;
                renderChecksList(document.getElementById('searchInput').value);
            };
        } else {
            moreBox.innerHTML = '';
        }
    }
}

// Event delegation for check card actions — more robust than inline onclick
// strings, and works correctly no matter what characters are in the owner
// name or description.
document.addEventListener('click', function(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    e.preventDefault();

    const card = btn.closest('.check-card');
    if (!card) return;

    const id = Number(card.dataset.id);
    if (Number.isNaN(id)) return;

    const action = btn.dataset.action;

    if (action === 'paid') markCheck(id, 'paid');
    else if (action === 'unpaid') markCheck(id, 'unpaid');
    else if (action === 'delete') deleteCheck(id);
    else if (action === 'edit') showEditCheck(id);
});

function searchChecks() {
    const filter = document.getElementById('searchInput').value;
    renderChecksList(filter);
}

function markCheck(id, status) {
    const check = checks.find(c => c.id === id);
    if (check) {
        check.status = status;
        saveData();
        renderChecksList(document.getElementById('searchInput').value);
        updateStats();
        clearScheduledNotificationsFor(id);
        if (status === 'pending' && settings.notifications) scheduleCheckNotification(check);
        syncToWorker();
        showToast('✓', status === 'paid' ? 'چک به عنوان پاس شده علامت‌گذاری شد' : 'چک به عنوان پاس نشده علامت‌گذاری شد', 'success');
    }
}

function deleteCheck(id) {
    showModal('🗑️', 'حذف چک', 'آیا از حذف این چک اطمینان دارید؟', () => {
        checks = checks.filter(c => c.id !== id);
        saveData();
        renderChecksList(document.getElementById('searchInput').value);
        updateStats();
        clearScheduledNotificationsFor(id);
        syncToWorker();
        showToast('✓', 'چک حذف شد', 'success');
    });
}

function confirmDeleteAll() {
    showModal('⚠️', 'حذف همه چک‌ها', 'تمام چک‌های ثبت شده حذف خواهند شد. این عمل قابل بازگشت نیست!', () => {
        checks = [];
        saveData();
        updateStats();
        if (window.notifTimeouts) window.notifTimeouts.forEach(t => clearTimeout(t));
        window.notifTimeouts = [];
        localStorage.removeItem('zare_pending_notifs');
        syncToWorker();
        showToast('✓', 'همه چک‌ها حذف شدند', 'success');
    });
}

// ==================== SETTINGS ====================
function loadSettingsUI() {
    document.getElementById('daysBefore').value = settings.daysBefore;
    document.getElementById('notifTime').value = settings.notifTime;
    document.getElementById('notifCount').value = settings.notifCount;
    document.getElementById('notifToggle').classList.toggle('active', settings.notifications);
    document.getElementById('workerUrl').value = settings.workerUrl || '';
    document.getElementById('vapidKey').value = settings.vapidKey || '';
    const emailInput = document.getElementById('notifEmail');
    if (emailInput) emailInput.value = settings.email || '';
    document.getElementById('pushStatus').textContent = settings.pushSubscribed
        ? '✓ اعلان Push فعال است (حتی وقتی برنامه بسته است)'
        : '';

    // Show the "enable notifications" banner whenever the setting is off, or
    // the browser hasn't actually granted permission yet — so the banner
    // never lies about the real state.
    const banner = document.getElementById('notifPermission');
    if (banner) {
        const permitted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        banner.classList.toggle('active', !(settings.notifications && permitted));
    }
}

// Ask the browser for real notification permission and, if granted, make
// sure a service worker is registered so notifications can be shown by the
// OS even when this tab isn't focused. Returns true only on real success.
async function enableNotifications() {
    if (typeof Notification === 'undefined') {
        showToast('⚠️', 'این مرورگر از اعلان پشتیبانی نمی‌کند', 'error');
        return false;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
        permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
        showToast('⚠️', 'اجازه اعلان داده نشد. از تنظیمات مرورگر آن را فعال کنید', 'error');
        return false;
    }

    await registerServiceWorker();
    return true;
}

function toggleSetting(key) {
    if (key !== 'notifications') return;

    if (!settings.notifications) {
        // Turning ON: this is the moment we actually ask the browser for
        // permission — nothing is switched on until the user approves it.
        enableNotifications().then(granted => {
            settings.notifications = granted;
            document.getElementById('notifToggle').classList.toggle('active', granted);
            loadSettingsUI();
            saveData();
            if (granted) {
                scheduleNotifications();
                showToast('✓', 'اعلان‌ها فعال شدند', 'success');
                // If a Push server is already configured, (re)subscribe now
                // so closed-app delivery starts working immediately too.
                if (settings.workerUrl && settings.vapidKey) connectPush();
                else syncToWorker();
            }
        });
    } else {
        settings.notifications = false;
        document.getElementById('notifToggle').classList.toggle('active', false);
        loadSettingsUI();
        saveData();
        syncToWorker();
    }
}

function saveSettings() {
    settings.daysBefore = parseInt(document.getElementById('daysBefore').value) || 3;
    settings.notifTime = document.getElementById('notifTime').value || '14:00';
    settings.notifCount = parseInt(document.getElementById('notifCount').value) || 2;
    const emailInput = document.getElementById('notifEmail');
    if (emailInput) settings.email = emailInput.value.trim();
    saveData();

    if (settings.notifications) {
        scheduleNotifications();
    }
    syncToWorker();

    showToast('✓', 'تنظیمات ذخیره شد', 'success');
}

function changePassword() {
    const current = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirm = document.getElementById('confirmPass').value;

    const storedPassword = localStorage.getItem('zare_password') || '1335';

    if (current !== storedPassword) {
        showToast('⚠️', 'رمز فعلی اشتباه است', 'error');
        return;
    }

    if (!newPass || newPass.length < 4) {
        showToast('⚠️', 'رمز جدید باید حداقل ۴ رقم باشد', 'error');
        return;
    }

    if (newPass !== confirm) {
        showToast('⚠️', 'رمز جدید و تکرار آن مطابقت ندارند', 'error');
        return;
    }

    localStorage.setItem('zare_password', newPass);
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
    showToast('✓', 'رمز عبور با موفقیت تغییر یافت', 'success');
}

// ==================== NOTIFICATIONS ====================
// Show a REAL, OS-level notification (via the service worker registration
// when available, otherwise the plain Notification API), so it shows up in
// the phone's notification shade like any other app — not just a toast
// inside the page. Falls back to a couple of legacy native-wrapper hooks
// (kept for anyone still shipping this inside an Android WebView), and
// finally to the in-app toast if nothing else is available (e.g. permission
// was never granted).
async function dispatchReminderNotification(title, body, check) {
    const payload = {
        title,
        body,
        icon: 'icon-192.png',
        checkId: check ? check.id : null
    };

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
            const reg = ('serviceWorker' in navigator) ? await navigator.serviceWorker.getRegistration() : null;
            if (reg && reg.showNotification) {
                await reg.showNotification(title, {
                    body,
                    icon: 'icon-192.png',
                    badge: 'icon-192.png',
                    tag: 'check-reminder-' + (check ? check.id : Date.now()),
                    data: payload
                });
            } else {
                new Notification(title, { body, icon: 'icon-192.png', data: payload });
            }
            return true;
        } catch (e) {
            // fall through to the legacy/toast paths below
        }
    }

    try {
        if (window.AndroidBridge && typeof window.AndroidBridge.showNotification === 'function') {
            window.AndroidBridge.showNotification(JSON.stringify(payload));
            return true;
        }
    } catch (e) {
        // Fall back to the in-app toast below.
    }

    try {
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.androidNotification) {
            window.webkit.messageHandlers.androidNotification.postMessage(payload);
            return true;
        }
    } catch (e) {
        // Fall back to the in-app toast below.
    }

    showToast('🔔', body, 'info');
    return false;
}

function requestNotification() {
    enableNotifications().then(granted => {
        settings.notifications = granted;
        saveData();
        loadSettingsUI();
        if (granted) {
            showToast('✓', 'اعلان‌ها فعال شدند', 'success');
            scheduleNotifications();
            syncToWorker();
        }
    });
}

// ==================== SERVICE WORKER / PUSH ====================
let swRegistration = null;

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
        swRegistration = await navigator.serviceWorker.register('./sw.js');
        // Let the "پاس شده / پاس نشده" action buttons on a notification
        // update the check even if the page was reopened by tapping it.
        navigator.serviceWorker.addEventListener('message', event => {
            const msg = event.data || {};
            if ((msg.action === 'paid' || msg.action === 'unpaid') && msg.checkId != null) {
                markCheck(Number(msg.checkId), msg.action);
            }
        });
        return swRegistration;
    } catch (e) {
        console.error('Service worker registration failed:', e);
        return null;
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

// ---- Fired-notification tracking (prevents re-firing the same reminder
// every time the app is reopened, and lets us catch up on reminders that
// were due while the app/tab was completely closed). ----
function getFiredTags() {
    try { return JSON.parse(localStorage.getItem('zare_fired_notifs') || '[]'); }
    catch (e) { return []; }
}
function markTagFired(tag) {
    const fired = getFiredTags();
    if (!fired.includes(tag)) {
        fired.push(tag);
        while (fired.length > 500) fired.shift();
        localStorage.setItem('zare_fired_notifs', JSON.stringify(fired));
    }
}

function clearScheduledNotificationsFor(checkId) {
    if (window.notifTimeouts) window.notifTimeouts.forEach(t => clearTimeout(t));
    window.notifTimeouts = [];
    if (settings.notifications) scheduleNotifications();
}

function scheduleNotifications() {
    if (!settings.notifications) return;

    if (window.notifTimeouts) {
        window.notifTimeouts.forEach(t => clearTimeout(t));
    }
    window.notifTimeouts = [];

    checks.forEach(check => {
        if (check.status === 'pending') {
            scheduleCheckNotification(check);
        }
    });
}

function scheduleCheckNotification(check) {
    if (!settings.notifications) return;

    const [hours, minutes] = settings.notifTime.split(':').map(Number);
    const gregDate = jalaliToGregorian(check.date[0], check.date[1], check.date[2]);
    const dueDate = new Date(gregDate[0], gregDate[1] - 1, gregDate[2], hours, minutes);
    const now = new Date();
    const STALE_MS = 3 * 24 * 60 * 60 * 1000; // ignore reminders more than 3 days overdue

    const allDates = [];
    for (let i = settings.daysBefore; i >= 0; i--) {
        const notifDate = new Date(dueDate);
        notifDate.setDate(notifDate.getDate() - i);
        allDates.push(notifDate);
    }
    const finalDates = allDates.slice(0, settings.notifCount);

    finalDates.forEach((date, idx) => {
        const tag = 'check-reminder-' + check.id + '-' + idx;
        if (getFiredTags().includes(tag)) return;

        const delay = date.getTime() - now.getTime();
        if (delay > 0) {
            const timeout = setTimeout(() => {
                showNotification(check);
                markTagFired(tag);
            }, delay);
            if (!window.notifTimeouts) window.notifTimeouts = [];
            window.notifTimeouts.push(timeout);
        } else if (now.getTime() - date.getTime() < STALE_MS) {
            showNotification(check);
            markTagFired(tag);
        }
    });

    const dueTag = 'check-due-' + check.id;
    if (!getFiredTags().includes(dueTag)) {
        const dueDelay = dueDate.getTime() - now.getTime();
        if (dueDelay > 0) {
            const timeout = setTimeout(() => {
                showDueDateNotification(check);
                markTagFired(dueTag);
            }, dueDelay);
            if (!window.notifTimeouts) window.notifTimeouts = [];
            window.notifTimeouts.push(timeout);
        } else if (now.getTime() - dueDate.getTime() < STALE_MS) {
            showDueDateNotification(check);
            markTagFired(dueTag);
        }
    }
}

function showNotification(check) {
    const daysLeft = getDaysLeft(check.date);
    const title = '⏰ یادآوری چک - دبزار زارع';
    const body = `چک ${check.owner} - ${formatNumber(check.amount)} ریال - ${daysLeft > 0 ? daysLeft + ' روز تا سررسید' : 'امروز سررسید است!'}`;
    dispatchReminderNotification(title, body, check);
}

function showDueDateNotification(check) {
    const title = '🔔 امروز سررسید چک!';
    const body = `چک ${check.owner} - ${formatNumber(check.amount)} ریال - امروز ${formatPersianDateFull(check.date[0], check.date[1], check.date[2])} سررسید است. آیا پاس شده است؟`;
    dispatchReminderNotification(title, body, check);
}

function getDaysLeft(date) {
    const today = getTodayPersian();
    const todayVal = today[0] * 10000 + today[1] * 100 + today[2];
    const dateVal = date[0] * 10000 + date[1] * 100 + date[2];
    return dateVal - todayVal;
}

// Re-check for due/missed reminders whenever the app becomes visible again
// (covers the case where the tab was backgrounded or the phone was locked).
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser && settings.notifications) {
        scheduleNotifications();
    }
});

// ==================== REAL PUSH (works even with the app fully closed) ====================
// Subscribes this device to real Web Push through the Cloudflare Worker
// backend (see worker.js/README.md) so reminders keep arriving even when
// the browser/app is completely closed — not just backgrounded.
async function connectPush() {
    const workerUrl = document.getElementById('workerUrl').value.trim().replace(/\/$/, '');
    const vapidKey = document.getElementById('vapidKey').value.trim();
    const statusEl = document.getElementById('pushStatus');

    if (!workerUrl || !vapidKey) {
        showToast('⚠️', 'برای اعلان Push واقعی، هم آدرس سرور و هم کلید VAPID لازم است', 'error');
        return;
    }

    const granted = await enableNotifications();
    if (!granted) return;

    try {
        settings.workerUrl = workerUrl;
        settings.vapidKey = vapidKey;

        const reg = swRegistration || await registerServiceWorker();
        if (!reg) throw new Error('service worker not available');
        await navigator.serviceWorker.ready;

        let subscription = await reg.pushManager.getSubscription();
        if (!subscription || subscription.options?.applicationServerKey == null) {
            if (subscription) await subscription.unsubscribe();
            subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });
        }

        settings.pushSubscription = subscription.toJSON();
        settings.pushSubscribed = true;
        saveData();

        await syncToWorker();

        statusEl.textContent = '✓ اعلان Push فعال است (حتی وقتی برنامه بسته است)';
        showToast('✓', 'اعلان Push واقعی متصل شد', 'success');
    } catch (err) {
        console.error('Push subscription failed:', err);
        settings.pushSubscribed = false;
        saveData();
        statusEl.textContent = '';
        showToast('⚠️', 'اتصال اعلان Push ناموفق بود. آدرس/کلید را بررسی کنید', 'error');
    }
}

// Sends a real test email through the Worker backend so the user can
// confirm reminders will actually reach their Gmail (or any inbox) even
// when the app/browser is fully closed — independent of Web Push.
async function testEmailNotification() {
    const statusEl = document.getElementById('emailTestStatus');
    const email = document.getElementById('notifEmail').value.trim();
    const workerUrl = document.getElementById('workerUrl').value.trim().replace(/\/$/, '');

    if (!email) {
        showToast('⚠️', 'اول ایمیل خود را وارد کنید', 'error');
        return;
    }
    if (!workerUrl) {
        showToast('⚠️', 'برای تست ایمیل، آدرس سرور اعلان (Worker) را در بالا وارد کنید', 'error');
        return;
    }

    settings.email = email;
    saveData();

    if (statusEl) statusEl.textContent = 'در حال ارسال ایمیل تست...';

    try {
        const res = await fetch(workerUrl + '/api/test-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
            if (statusEl) statusEl.textContent = '✓ ایمیل تست ارسال شد. صندوق ورودی (و اسپم) جیمیل را چک کنید';
            showToast('✓', 'ایمیل تست ارسال شد', 'success');
        } else {
            if (statusEl) statusEl.textContent = '';
            showToast('⚠️', data.error === 'email not configured'
                ? 'سرور برای ارسال ایمیل تنظیم نشده (RESEND_API_KEY را در Cloudflare اضافه کنید)'
                : 'ارسال ایمیل تست ناموفق بود', 'error');
        }
    } catch (err) {
        console.error('Email test failed:', err);
        if (statusEl) statusEl.textContent = '';
        showToast('⚠️', 'اتصال به سرور اعلان ناموفق بود. آدرس Worker را بررسی کنید', 'error');
    }
}

// Sends the current subscription + checks + settings (incl. optional email)
// to the Worker backend so it can fire real push notifications (and,
// if configured, emails) on its own schedule — independent of this tab
// being open at all.
async function syncToWorker() {
    if (!settings.workerUrl || !settings.pushSubscription) return;
    if (!settings.notifications) return;

    try {
        await fetch(settings.workerUrl.replace(/\/$/, '') + '/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: settings.pushSubscription,
                checks: checks,
                settings: {
                    notifications: settings.notifications,
                    daysBefore: settings.daysBefore,
                    notifTime: settings.notifTime,
                    notifCount: settings.notifCount,
                    email: settings.email || ''
                }
            })
        });
    } catch (err) {
        // Silent by design — this runs after every add/edit/delete and a
        // sync failure (e.g. offline) shouldn't interrupt the user.
        console.error('Worker sync failed:', err);
    }
}

// ==================== MODAL & TOAST ====================
function showModal(icon, title, text, onConfirm) {
    document.getElementById('modalIcon').textContent = icon;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    document.getElementById('modal').classList.add('active');
    modalCallback = onConfirm;

    document.getElementById('modalConfirm').onclick = () => {
        const callback = modalCallback;
        closeModal();
        if (callback) callback();
    };
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    modalCallback = null;
}

function showToast(icon, text, type) {
    const toast = document.getElementById('toast');
    document.getElementById('toastIcon').textContent = icon;
    document.getElementById('toastText').textContent = text;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== KEYBOARD NAVIGATION ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (document.getElementById('loginScreen').style.display !== 'none') {
            doLogin();
            return;
        }

        if (document.getElementById('addCheckScreen').style.display !== 'none') {
            if (currentStep < 4) {
                nextStep(currentStep);
            } else {
                submitCheck();
            }
        }
    }
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    loadData();

    // Register the service worker up front (offline caching + it's what
    // lets real OS-level notifications and Push work at all). This does
    // NOT ask for notification permission by itself — that only happens
    // when the user turns the toggle on in Settings.
    registerServiceWorker();

    // Grey out (but don't hide) "ورود صوتی" if this browser has no speech
    // recognition support at all, so the user isn't invited to tap a button
    // that can only ever show an error (manual entry always stays available).
    if (typeof isSpeechRecognitionSupported === 'function' && !isSpeechRecognitionSupported()) {
        const voiceBtn = document.getElementById('voiceMethodBtn');
        if (voiceBtn) {
            voiceBtn.style.opacity = '0.4';
            voiceBtn.title = 'تشخیص صدا در این مرورگر پشتیبانی نمی‌شود';
        }
    }

    // Check if already logged in
    if (currentUser) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appHeader').style.display = 'flex';
        document.getElementById('bottomNav').style.display = 'flex';
        showDashboard();

        scheduleNotifications();
        syncToWorker();
    }

    // Auto-focus password if username is pre-filled
    if (document.getElementById('loginUsername').value === 'zare') {
        document.getElementById('loginPassword').focus();
    }
});
