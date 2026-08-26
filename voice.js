// ==================== VOICE ENTRY MODULE ====================
// Lets the user speak the check's four fields and auto-fills the SAME
// existing registration form (see app.js: applyExtractedCheckData).
// Uses the browser's built-in Web Speech API (SpeechRecognition) — no
// audio is sent anywhere except to the browser's own speech-recognition
// engine (on Chrome/Android this is Google's, which is how the browser
// itself implements the feature; nothing extra is added by this app).

let voiceRecognition = null;
let voiceFinalTranscript = '';
let voiceListening = false;

function isSpeechRecognitionSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function openVoiceEntry() {
    if (!isSpeechRecognitionSupported()) {
        showToast('⚠️', 'تشخیص صدا در این مرورگر پشتیبانی نمی‌شود. لطفاً از ورود دستی استفاده کنید.', 'error');
        return;
    }

    voiceFinalTranscript = '';
    const transcriptEl = document.getElementById('voiceTranscript');
    if (transcriptEl) transcriptEl.textContent = '';
    setVoiceStatus('برای شروع، دکمه میکروفون را بزنید');
    setVoiceMicState('idle');

    const modal = document.getElementById('voiceModal');
    if (modal) modal.classList.add('active');
}

function startVoiceRecording() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechRecognitionCtor();
    voiceRecognition.lang = 'fa-IR';
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = true;

    voiceRecognition.onstart = () => {
        voiceListening = true;
        setVoiceMicState('recording');
        setVoiceStatus('در حال شنیدن... اطلاعات چک را بگویید');
    };

    voiceRecognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                voiceFinalTranscript += transcript + ' ';
            } else {
                interim += transcript;
            }
        }
        const transcriptEl = document.getElementById('voiceTranscript');
        if (transcriptEl) transcriptEl.textContent = (voiceFinalTranscript + interim).trim();
    };

    voiceRecognition.onerror = (event) => {
        voiceListening = false;
        setVoiceMicState('idle');
        if (event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'service-not-allowed') {
            closeVoiceModal();
            showToast('⚠️', 'دسترسی به میکروفون برای ورود صوتی لازم است.', 'error');
        } else if (event.error === 'no-speech') {
            setVoiceStatus('صدایی شنیده نشد. دوباره میکروفون را بزنید یا دکمه توقف را بزنید.');
        } else {
            setVoiceStatus('خطا در تشخیص صدا. می‌توانید دوباره تلاش کنید.');
        }
    };

    voiceRecognition.onend = () => {
        voiceListening = false;
        const modal = document.getElementById('voiceModal');
        if (modal && modal.classList.contains('active')) {
            setVoiceMicState('idle');
        }
    };

    try {
        voiceRecognition.start();
    } catch (err) {
        console.error('Speech recognition failed to start:', err);
        showToast('⚠️', 'شروع ضبط صدا ناموفق بود.', 'error');
    }
}

function stopVoiceRecording() {
    if (voiceRecognition && voiceListening) {
        voiceRecognition.stop();
    }
    finishVoiceEntry();
}

function cancelVoiceEntry() {
    if (voiceRecognition && voiceListening) {
        voiceRecognition.onend = null; // don't let the auto-stop handler fire finishVoiceEntry
        voiceRecognition.stop();
    }
    voiceListening = false;
    closeVoiceModal();
}

function closeVoiceModal() {
    const modal = document.getElementById('voiceModal');
    if (modal) modal.classList.remove('active');
}

function setVoiceMicState(state) {
    const mic = document.getElementById('voiceMicBtn');
    if (mic) mic.classList.toggle('recording', state === 'recording');
}

function setVoiceStatus(text) {
    const el = document.getElementById('voiceStatusText');
    if (el) el.textContent = text;
}

function finishVoiceEntry() {
    const transcriptEl = document.getElementById('voiceTranscript');
    const text = (voiceFinalTranscript.trim() || (transcriptEl ? transcriptEl.textContent.trim() : ''));
    closeVoiceModal();

    if (!text) {
        showToast('⚠️', 'اطلاعات چک به طور کامل تشخیص داده نشد. لطفاً فیلدها را به صورت دستی تکمیل کنید.', 'error');
        showAddCheck();
        return;
    }

    const fields = window.CheckParser.parse(text);
    const gotAny = fields.owner || fields.amount || fields.date || fields.purpose;
    if (!gotAny) {
        showToast('⚠️', 'اطلاعات چک به طور کامل تشخیص داده نشد. لطفاً فیلدها را به صورت دستی تکمیل کنید.', 'error');
        showAddCheck();
        return;
    }

    applyExtractedCheckData(fields, '🎙️ ورود صوتی');
}
