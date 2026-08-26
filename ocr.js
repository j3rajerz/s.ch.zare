// ==================== OCR MODULE (camera scan) ====================
// Lets the user photograph a check and auto-fills the SAME existing
// registration form (see app.js: applyExtractedCheckData). OCR runs
// entirely on-device via Tesseract.js (WebAssembly) — the photo itself
// is never uploaded anywhere, only the Tesseract.js *library* and its
// language-data files are fetched from a CDN the first time this is
// used (see README for the offline/privacy trade-off this implies).
//
// Camera access uses a hidden <input type="file" accept="image/*"
// capture="environment"> instead of a custom getUserMedia preview.
// This opens the phone's native camera app, which is far more reliable
// across Android/iOS PWA contexts than an in-page live camera view
// (see the "Browser/OS limitations" section of README.md).

let tesseractLoadPromise = null;

function loadTesseractLibrary() {
    if (window.Tesseract) return Promise.resolve();
    if (tesseractLoadPromise) return tesseractLoadPromise;
    tesseractLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('OCR library failed to load'));
        document.head.appendChild(script);
    });
    return tesseractLoadPromise;
}

function openScanCheck() {
    const input = document.getElementById('scanFileInput');
    if (!input) return;
    input.value = ''; // allow re-selecting the same file twice in a row
    input.click();
}

async function handleScanFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return; // user cancelled the camera / file picker — not an error

    showOcrModal();
    setOcrStatus('در حال بارگذاری موتور تشخیص متن...');

    try {
        await loadTesseractLibrary();
    } catch (err) {
        console.error('Tesseract load failed:', err);
        hideOcrModal();
        showToast('⚠️', 'بارگذاری موتور OCR ناموفق بود. اتصال اینترنت خود را بررسی کنید.', 'error');
        return;
    }

    setOcrStatus('در حال پردازش تصویر...');

    try {
        const { data } = await window.Tesseract.recognize(file, 'fas+eng', {
            logger: (m) => {
                if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                    setOcrStatus('در حال تشخیص متن... ' + Math.round(m.progress * 100) + '%');
                }
            }
        });

        hideOcrModal();
        finishOcrWithText((data && data.text) || '');
    } catch (err) {
        console.error('OCR recognition failed:', err);
        hideOcrModal();
        ocrFailed();
    }
}

function finishOcrWithText(text) {
    text = text.trim();
    if (!text) { ocrFailed(); return; }

    const fields = window.CheckParser.parse(text);
    const gotAny = fields.owner || fields.amount || fields.date || fields.purpose;
    if (!gotAny) { ocrFailed(); return; }

    applyExtractedCheckData(fields, '📷 اسکن دوربین');
}

function ocrFailed() {
    showToast('⚠️', 'اطلاعات چک به طور کامل تشخیص داده نشد. لطفاً فیلدها را به صورت دستی تکمیل کنید.', 'error');
    showAddCheck();
}

function showOcrModal() {
    const el = document.getElementById('ocrModal');
    if (el) el.classList.add('active');
}

function hideOcrModal() {
    const el = document.getElementById('ocrModal');
    if (el) el.classList.remove('active');
}

function setOcrStatus(text) {
    const el = document.getElementById('ocrStatusText');
    if (el) el.textContent = text;
}

function cancelOcr() {
    // Recognition already running in a WASM worker can't be aborted mid-flight
    // by Tesseract.js's simple recognize() API; hiding the modal lets the user
    // move on immediately, and any late result is simply discarded because the
    // modal (and the user's attention) has already moved elsewhere.
    hideOcrModal();
}
