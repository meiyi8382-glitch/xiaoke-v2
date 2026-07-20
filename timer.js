import { showToast } from "../ui/toast.js";

let timerInterval  = null;
let remainingSeconds = 0;
let isPaused       = false;
let collapseTimeout = null;

const COLLAPSE_DELAY = 10000; // 10秒无操作自动收起


// ======================================
// Init
// ======================================

export function initTimer() {

    // 点击收起态展开
    document
        .getElementById("timerCollapsed")
        ?.addEventListener("click", expandTimer);

    // 时间按钮
    document.querySelectorAll("[data-minutes]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-minutes]")
                .forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            startTimer(Number(btn.dataset.minutes));
        });
    });

    // 暂停/继续
    document
        .getElementById("stopTimerBtn")
        ?.addEventListener("click", togglePause);

    // 自订
    const customBtn = document.getElementById("customTimerBtn");
    const dialog    = document.getElementById("customTimerDialog");
    const input     = document.getElementById("customMinutesInput");

    customBtn?.addEventListener("click", () => {
        input.value = "";
        dialog.showModal();
    });

    document.getElementById("cancelCustomTimer")
        ?.addEventListener("click", () => dialog.close());

    document.getElementById("confirmCustomTimer")
        ?.addEventListener("click", () => {
            const minutes = Number(input.value);
            if (!minutes || minutes < 1 || minutes > 180) {
                dialog.close();
                return;
            }
            dialog.close();
            startTimer(minutes);
        });

    // 展开区任意点击重置收起计时
    document
        .getElementById("timerExpanded")
        ?.addEventListener("click", resetCollapseTimer);

    // 預設收起
    collapseTimer();

}


// ======================================
// Start
// ======================================

export function startTimer(minutes) {

    localStorage.setItem("lastTimerMinutes", minutes);
    unlockAudio();

    clearInterval(timerInterval);
    isPaused = false;
    remainingSeconds = minutes * 60;

    updateDisplay(remainingSeconds);
    updateStopBtn();

    timerInterval = setInterval(tick, 1000);

    // 开始计时后延迟收起
    scheduleCollapse();

}


// ======================================
// Tick
// ======================================

function tick() {
    remainingSeconds--;
    updateDisplay(remainingSeconds);

    if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        updateStopBtn();
        showToast("專注時間結束 🎉");
        triggerTimerEnd();

        expandTimer(); // 结束时展开让用户看到
    }
}


// ======================================
// Pause / Resume
// ======================================

function togglePause() {

    if (remainingSeconds <= 0 && !timerInterval) return;

    if (isPaused) {
        isPaused = false;
        timerInterval = setInterval(tick, 1000);
        updateStopBtn();
        scheduleCollapse();
    } else {
        clearInterval(timerInterval);
        timerInterval = null;
        isPaused = true;
        updateStopBtn();
        showToast("已暫停");
        // 暂停时展开，让用户能操作
        expandTimer();
        clearTimeout(collapseTimeout);
    }

}


// ======================================
// Collapse / Expand
// ======================================

function expandTimer() {
    document.getElementById("timerCollapsed")?.classList.add("hidden");
    document.getElementById("timerExpanded")?.classList.remove("hidden");
    resetCollapseTimer();
}

function collapseTimer() {
    document.getElementById("timerCollapsed")?.classList.remove("hidden");
    document.getElementById("timerExpanded")?.classList.add("hidden");
}

function scheduleCollapse() {
    clearTimeout(collapseTimeout);
    collapseTimeout = setTimeout(collapseTimer, COLLAPSE_DELAY);
}

function resetCollapseTimer() {
    // 只有计时中才自动收起
    if (timerInterval) {
        scheduleCollapse();
    }
}


// ======================================
// Update Stop Button Label
// ======================================

function updateStopBtn() {
    const btn = document.getElementById("stopTimerBtn");
    if (!btn) return;
    if (isPaused)         btn.textContent = "繼續";
    else if (timerInterval) btn.textContent = "暫停";
    else                  btn.textContent = "停止";
}


// ======================================
// Display — 同步更新两处
// ======================================

function updateDisplay(seconds) {

    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    const text = min + ":" + sec;

    // 收起态的数字
    const collapsed = document.getElementById("timerDisplay");
    if (collapsed) collapsed.textContent = text;

    // 展开态的数字
    const full = document.getElementById("timerDisplayFull");
    if (full) full.textContent = text;

}


// ======================================
// Restore
// ======================================

export function restoreTimerState() {
    const saved = localStorage.getItem("lastTimerMinutes");
    if (!saved) return;
    const text = saved + ":00";
    const collapsed = document.getElementById("timerDisplay");
    const full      = document.getElementById("timerDisplayFull");
    if (collapsed) collapsed.textContent = text;
    if (full)      full.textContent = text;
}

// ======================================
// 預熱音頻（解決 iOS 自動播放限制）
// ======================================

let audioCtx = null;

function unlockAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
}

// ======================================
// 計時結束反饋
// ======================================

function triggerTimerEnd() {

    const sound = localStorage.getItem("xiaoke_sound") !== "false";

    if (sound && audioCtx) {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 520;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.8);
    }

}
