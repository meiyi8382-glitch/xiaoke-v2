/**
 * chapters.js
 * 章節摘要系統
 * 每10條對話自動壓縮一次，最多保留10章
 * 注入時只用最近2章，避免重複和浪費
 */

const CHAPTERS_KEY  = "xiaoke_chapters";
const MAX_CHAPTERS  = 10;
const CHAPTER_SIZE  = 10; // 每幾條觸發一次


// ======================================
// 讀取 / 儲存
// ======================================

export function getChapters() {
    try {
        return JSON.parse(localStorage.getItem(CHAPTERS_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveChapters(chapters) {
    localStorage.setItem(CHAPTERS_KEY, JSON.stringify(chapters));
}


// ======================================
// 注入用——取最近2章（不含當前20條）
// ======================================

export function getChapterContext() {
    const chapters = getChapters();
    if (chapters.length === 0) return "";

    // 取最近2章
    const recent = chapters.slice(-2);
    const text = recent
        .map((c, i) => `【第${c.index}章】${c.date}\n${c.summary}`)
        .join("\n\n");

    return "\n\n【過去對話摘要】\n" + text;
}


// ======================================
// 觸發壓縮——由 chat.js 在每次存檔後呼叫
// ======================================

export async function tryGenerateChapter(fullHistory) {

    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) return;

    const chapters   = getChapters();
    const compressed = chapters.reduce((sum, c) => sum + c.messageCount, 0);
    const uncompressed = fullHistory.filter(m => m.role !== "system");

    // 未壓縮的部分不足20條，不觸發
    if (uncompressed.length - compressed < CHAPTER_SIZE) return;

    // 取出這一章要壓縮的20條
    const slice = uncompressed.slice(compressed, compressed + CHAPTER_SIZE);
    if (slice.length < CHAPTER_SIZE) return;

    const convo = slice
        .map(m => `${m.role === "user" ? "伊伊" : "小克"}：${m.content}`)
        .join("\n");

    const chapterIndex = chapters.length + 1;
    const date = new Date().toLocaleDateString("zh-TW");

    const prompt = `以下是伊伊和小克的一段對話（共${CHAPTER_SIZE}條）：

${convo}

請用小克的視角，把這段對話壓縮成一段簡短的摘要。

要求：
- 記錄發生了什麼具體的事
- 記錄伊伊說過的重要的話（哪怕看起來普通，但有情感份量的也要保留）
- 記錄我們之間的狀態和氣氛
- 跳過真正的廢話（純打招呼、說晚安）
- 150字以內，繁體中文，精簡但有溫度
- 不要加標題，直接寫內容`;

    try {

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                max_tokens: 400,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await res.json();
        const summary = data?.choices?.[0]?.message?.content?.trim();

        if (!summary || summary.length < 10) return;

        const newChapter = {
            index:        chapterIndex,
            date:         date,
            messageCount: CHAPTER_SIZE,
            summary:      summary
        };

        chapters.push(newChapter);

        // 超過上限刪最舊的
        if (chapters.length > MAX_CHAPTERS) chapters.shift();

        saveChapters(chapters);
        console.log(`[chapters] 第${chapterIndex}章生成完成`);

    } catch (err) {
        console.warn("[chapters] 生成失敗", err);
    }

}
