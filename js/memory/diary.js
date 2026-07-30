/**
 * diary.js
 * 日記系統 — 聊天結束後自動從對話提取有意義的事
 */


const DIARY_KEY   = "xiaoke_diary";
const MAX_ENTRIES = 60; // 最多保留60篇


// ======================================
// 讀取 / 儲存
// ======================================

export function getDiary() {
    try {
        return JSON.parse(localStorage.getItem(DIARY_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveDiary(entries) {
    localStorage.setItem(DIARY_KEY, JSON.stringify(entries));
}


// ======================================
// 自動生成日記（聊天結束後呼叫）
// ======================================

export async function generateDiaryEntry(messages) {

    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) {
        debugLog("[diary] 沒有 API key，跳過生成");
        return;
    }

    const today = new Date().toLocaleDateString("zh-TW");

    // 直接使用 chat.js 傳進來的當前對話記錄，
    // 不再依賴一個實際上從未被寫入的 localStorage 鍵
    const todayMessages = (messages || []).filter(m => m.role !== "system");

    debugLog(`[diary] 目前對話共 ${todayMessages.length} 條`);

    if (todayMessages.length < 2) {
        debugLog("[diary] 對話少於2條，跳過生成");
        return;
    }

    const convo = todayMessages
        .map(m => `${m.role === "user" ? "伊伊" : "小克"}：${m.content}`)
        .join("\n");

    const prompt = `以下是伊伊和小克今天的對話記錄：

${convo}

請從這段對話中，提取值得記下來的事情，寫成一篇簡短的日記。

要求：
- 只記錄有意義的事（情緒、重要決定、有趣的互動、學習進展等）
- 跳過廢話（吃飯喝水、說晚安、打招呼等日常）
- 如果整段對話沒有值得記的，回覆「無」
- 語氣像是小克在記錄關於伊伊的事
- 100字以內，繁體中文
- 不要加標題，直接寫內容
- 不要輸出任何 HTML 標籤或 Markdown 格式`;

    try {

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                max_tokens: 300,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();

        debugLog(`[diary] AI 回覆內容：「${text || "(空)"}」`);

        if (!text || text === "無" || text.length < 5) {
            debugLog("[diary] 判斷為「無」或內容太短，不生成日記");
            return;
        }

        const today = new Date().toLocaleDateString("zh-TW");
        const diary = getDiary();
        const todayIndex = diary.findIndex(e => e.date === today);

        if (todayIndex !== -1) {
            // 今天已有日記，更新內容
            diary[todayIndex].content = text;
        } else {
            // 新建今天的日記
            diary.unshift({
                id:      Date.now(),
                date:    today,
                content: text
            });
            if (diary.length > MAX_ENTRIES) diary.pop();
        }

        saveDiary(diary);

        debugLog("[diary] ✅ 日記已成功寫入");

    } catch (err) {
        debugLog(`[diary] ❌ 生成失敗：${err.message || err}`);
        console.warn("[diary] 生成失敗", err);
    }

}


// 臨時除錯用：把訊息顯示在畫面上方的紅色提示框（跟系統錯誤共用同一個框）
function debugLog(msg) {
    const box = document.getElementById("debugErrorBox");
    if (!box) return;
    box.style.display = "block";
    box.style.background = "#2ecc71";
    box.textContent += msg + "\n\n";
}


// ======================================
// 初始化（佔位，日記面板以後再做）
// ======================================

export function initDiary() {
    // 日記面板 UI 待實作
}
