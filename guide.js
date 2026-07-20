/**
 * guide.js
 * 新手引導 — 第一次開啟時顯示
 */

const STEPS = [
    {
        title: "歡迎來到小克 👋",
        body: "小克是你的學習陪伴夥伴。\n計時、聊天、記憶，都在這裡。"
    },
    {
        title: "計時器",
        body: "選擇 25 / 45 / 60 分鐘開始專注。\n計時中介面會自動收起，不打擾你。"
    },
    {
        title: "快捷陪伴",
        body: "底部三個按鈕是快捷回應。\n累了、需要擁抱、或者想聊聊都可以。"
    },
    {
        title: "聊天",
        body: "下方輸入框可以直接跟小克說話。\n需要先在設定裡填入 API Key 才能使用。"
    },
    {
        title: "記憶庫 🧠",
        body: "每次聊天後小克會自動記住重要的事。\n點右上角腦袋圖示可以查看和管理。"
    },
    {
        title: "準備好了",
        body: "先去設定填入 API Key，\n然後就可以開始了。"
    }
];

export function initGuide() {

    const overlay = document.getElementById("guideOverlay");
    if (!overlay) return;

    // 已經看過就不顯示
    if (localStorage.getItem("guideShown")) return;

    let current = 0;

    const content  = document.getElementById("guideContent");
    const nextBtn  = document.getElementById("guideNextBtn");
    const prevBtn  = document.getElementById("guidePrevBtn");

    function render() {
        const step = STEPS[current];
        content.innerHTML = `
            <h2>${step.title}</h2>
            <p>${step.body.replace(/\n/g, "<br>")}</p>
            <p style="margin-top:16px;font-size:12px;color:var(--text-soft)">
                ${current + 1} / ${STEPS.length}
            </p>
        `;
        prevBtn.style.display = current === 0 ? "none" : "";
        nextBtn.textContent   = current === STEPS.length - 1 ? "開始使用" : "下一步";
    }

    nextBtn?.addEventListener("click", () => {
        if (current < STEPS.length - 1) {
            current++;
            render();
        } else {
            overlay.classList.add("hidden");
            localStorage.setItem("guideShown", "1");
        }
    });

    prevBtn?.addEventListener("click", () => {
        if (current > 0) { current--; render(); }
    });

    overlay.classList.remove("hidden");
    render();

}
