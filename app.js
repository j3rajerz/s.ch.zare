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
    notifications: true,
    daysBefore: 3,
    notifTime: '14:00',
    notifCount: 2,
    workerUrl: '',
    vapidKey: '',
    pushSubscribed: false
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
    if (savedSettings) settings = JSON.parse(savedSettings);
    if (savedUser) currentUser = JSON.parse(savedUser);
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

        // Keep the reminder UI available without relying on browser notifications.
        if (document.getElementById('notifPermission')) {
            document.getElementById('notifPermission').classList.remove('active');
        }

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

    // Focus first input
    setTimeout(() => document.getElementById('checkOwner').focus(), 100);
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
function renderChecksList(filter = '') {
    const list = document.getElementById('checksList');
    list.innerHTML = '';

    let filtered = checks;
    if (filter) {
        const f = filter.toLowerCase();
        filtered = checks.filter(c => 
            c.owner.toLowerCase().includes(f) ||
            c.amount.toString().includes(f) ||
            c.dateStr.includes(f) ||
            c.description.toLowerCase().includes(f)
        );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
        const da = a.date[0] * 10000 + a.date[1] * 100 + a.date[2];
        const db = b.date[0] * 10000 + b.date[1] * 100 + b.date[2];
        return db - da;
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>${filter ? 'چکی با این مشخصات یافت نشد' : 'هنوز چکی ثبت نشده است'}</p>
            </div>
        `;
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
                    <span>${formatPersianDateFull(check.date[0], check.date[1], check.date[2])}</span>
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
    document.getElementById('pushStatus').textContent = settings.pushSubscribed
        ? '✓ اعلان Push فعال است'
        : '';
}

function toggleSetting(key) {
    if (key === 'notifications') {
        settings.notifications = !settings.notifications;
        document.getElementById('notifToggle').classList.toggle('active', settings.notifications);
        saveData();
        if (settings.notifications) {
            scheduleNotifications();
        }
        syncToWorker();
    }
}

function saveSettings() {
    settings.daysBefore = parseInt(document.getElementById('daysBefore').value) || 3;
    settings.notifTime = document.getElementById('notifTime').value || '14:00';
    settings.notifCount = parseInt(document.getElementById('notifCount').value) || 2;
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
function dispatchReminderNotification(title, body, check) {
    const payload = {
        title,
        body,
        icon: 'icon-192.png',
        checkId: check ? check.id : null
    };

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
    const key = 'zare_notification_mode';
    const enabled = localStorage.getItem(key) === 'enabled';

    if (!enabled) {
        localStorage.setItem(key, 'enabled');
    }

    document.getElementById('notifPermission').classList.remove('active');
    showToast('✓', 'اعلان‌های درون‌برنامه برای یادآوری‌ها فعال شدند', 'success');
    scheduleNotifications();
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

// ==================== LOCAL REMINDER MODE ====================
async function connectPush() {
    const workerUrl = document.getElementById('workerUrl').value.trim().replace(/\/$/, '');
    const vapidKey = document.getElementById('vapidKey').value.trim();
    const statusEl = document.getElementById('pushStatus');

    if (!workerUrl) {
        showToast('⚠️', 'برای حالت یادآوری محلی، آدرس را وارد کنید', 'error');
        return;
    }

    try {
        settings.workerUrl = workerUrl;
        settings.vapidKey = vapidKey;
        settings.pushSubscribed = false;
        saveData();

        statusEl.textContent = '✓ حالت یادآوری محلی فعال است';
        showToast('✓', 'یادآوری‌ها در این محیط به‌صورت محلی آماده‌اند', 'success');
    } catch (err) {
        console.error('Local reminder setup failed:', err);
        statusEl.textContent = '';
        showToast('⚠️', 'راه‌اندازی حالت یادآوری محلی ناموفق بود', 'error');
    }
}

async function syncToWorker() {
    return;
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

// ==================== LOCAL/OFFLINE INIT ====================
// Service workers are intentionally not registered for this Android WebView build.

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    loadData();

    // Check if already logged in
    if (currentUser) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appHeader').style.display = 'flex';
        document.getElementById('bottomNav').style.display = 'flex';
        showDashboard();

        if (document.getElementById('notifPermission')) {
            document.getElementById('notifPermission').classList.remove('active');
        }

        scheduleNotifications();
        syncToWorker();
    }

    // Auto-focus password if username is pre-filled
    if (document.getElementById('loginUsername').value === 'zare') {
        document.getElementById('loginPassword').focus();
    }
});
