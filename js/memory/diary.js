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
    if (!apiKey) return;

    const today = new Date().toLocaleDateString("zh-TW");
    const allHistory = JSON.parse(localStorage.getItem("xiaoke_chat_history") || "[]");
    const todayMessages = allHistory.filter(m => m.date === today && m.role !== "system");

    if (todayMessages.length < 2) return;

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

        if (!text || text === "無" || text.length < 5) return;

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

    } catch (err) {
        console.warn("[diary] 生成失敗", err);
    }

}


// ======================================
// 初始化（佔位，日記面板以後再做）
// ======================================

export function initDiary() {
    // 日記面板 UI 待實作
}
