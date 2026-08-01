import {
    sendChatMessage
} from "../api/openrouter.js";
import {
    showToast
} from "../ui/toast.js";
import {
    extractAndSaveMemory
} from "../memory/memory.js";
import {
    XIAOKE_SYSTEM_PROMPT
} from "../config/prompts.js";
import { generateDiaryEntry } from "../memory/diary.js";
import { getProfileContext } from "../memory/profile.js";
import { getAllMemories } from "../memory/memory.js";
import { getChapterContext, tryGenerateChapter } from "../memory/chapters.js";
import { saveMessage, loadMessages, deleteMessageById } from "../api/supabase.js";
import { getDiaryDateKey, getCurrentDiaryDateKey, formatTaipeiTime, getCurrentTimeContext } from "../utils/timeUtils.js";

const messagesContainer =
    document.getElementById("messages");
const input =
    document.getElementById("userInput");
const sendBtn =
    document.getElementById("sendBtn");

let chatHistory = [];

// 記錄最後一次失敗的使用者訊息，方便「重試」按鈕重新發送
let lastFailedText = null;
let lastFailedBubble = null;

// ======================================
// Init
// ======================================
export function initChat() {
    sendBtn?.addEventListener(
        "click",
        () => sendUserMessage(input.value.trim())
    );

    input?.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage(input.value.trim());
            }
        }
    );

    // 用事件委派處理「重新生成」「重試」按鈕的點擊
    // （因為這些按鈕是動態產生的，要用委派才能監聽到）
    messagesContainer?.addEventListener("click", (e) => {
        const retryBtn = e.target.closest(".retry-send-btn");
        if (retryBtn) {
            retrySend();
            return;
        }
        const regenBtn = e.target.closest(".regen-btn");
        if (regenBtn) {
            regenerateReply(regenBtn);
            return;
        }
    });
}

// ======================================
// Send
// ======================================
async function sendUserMessage(text) {
    if (!text) return;

    const nowTime = formatTaipeiTime(new Date().toISOString());
    addMessage("user", text, nowTime);

    chatHistory.push({
        role: "user",
        content: text,
        // date 欄位不再由前端決定，改由 Supabase 的 created_at 回傳後才補上
        // 這裡先給一個暫時值，saveChatHistory 存檔成功後會用資料庫回傳的時間覆蓋
        date: getCurrentDiaryDateKey(),
        time: nowTime
    });

    input.value = "";

    await requestAndAddReply(text);
}

// 重新發送上一次失敗的訊息
function retrySend() {
    if (!lastFailedText) return;

    if (lastFailedBubble) {
        lastFailedBubble.remove();
        lastFailedBubble = null;
    }

    const text = lastFailedText;
    lastFailedText = null;
    requestAndAddReply(text);
}

// 重新生成某一句 AI 回覆（不新增使用者訊息，只是換一個回答）
async function regenerateReply(btn) {
    const bubble = btn.closest(".message.assistant");
    if (!bubble) return;

    // 找出這句回覆對應在 chatHistory 中的位置
    const allAssistantBubbles = Array.from(
        messagesContainer.querySelectorAll(".message.assistant")
    );
    const bubbleIndex = allAssistantBubbles.indexOf(bubble);

    // 找出 chatHistory 裡第 bubbleIndex 個 assistant 訊息的索引
    let count = -1;
    let historyIndex = -1;
    for (let i = 0; i < chatHistory.length; i++) {
        if (chatHistory[i].role === "assistant") {
            count++;
            if (count === bubbleIndex) {
                historyIndex = i;
                break;
            }
        }
    }
    if (historyIndex === -1) return;

    // 若這句回覆已經成功存到雲端，重新生成前先把舊的雲端記錄刪掉
    const oldEntry = chatHistory[historyIndex];
    if (oldEntry?.dbId) {
        await deleteMessageById(oldEntry.dbId);
    }

    // 找到觸發這句回覆的使用者訊息（往前找最近的一句 user）
    let userText = "";
    for (let i = historyIndex - 1; i >= 0; i--) {
        if (chatHistory[i].role === "user") {
            userText = chatHistory[i].content;
            break;
        }
    }

    // 截斷 chatHistory 到這句回覆之前（重新生成會取代它）
    chatHistory = chatHistory.slice(0, historyIndex);

    // 移除畫面上這句回覆之後的所有訊息氣泡
    let node = bubble;
    while (node) {
        const next = node.nextSibling;
        node.remove();
        node = next;
    }

    await requestAndAddReply(userText);
}

// 實際呼叫 API 並把回覆加到畫面上（發送 / 重試 / 重新生成 共用）
async function requestAndAddReply(userText) {
    const loadingBubble = addTypingBubble();

    try {
        // 取記憶庫（按類型分組保底，避免重要記憶被最近的日常對話擠掉）
        const allMemories = await getAllMemories();
        const memories = pickMemoriesByType(allMemories);
        const memoryText = memories.length > 0
            ? "\n\n【記憶庫】\n" + memories.map(m => `- ${m.content}`).join("\n")
            : "";

        // 動態截斷：情緒關鍵詞時多保留
        const emotionWords = ["難過", "哭", "委屈", "害怕", "崩潰", "煩", "累", "痛", "喜欢", "爱你"];
        const isEmotional = emotionWords.some(w => userText.includes(w));
        const limit = isEmotional ? 30 : 20;
        const recentHistory = chatHistory.slice(-limit);

        const chapterContext = getChapterContext();
        const systemContent = XIAOKE_SYSTEM_PROMPT + "\n\n" + getCurrentTimeContext() + "\n\n" + getProfileContext();

        const messagesWithSystem = [
            {
                role: "system",
                content: systemContent + chapterContext + memoryText
            },
            ...recentHistory
        ];

        const result = await sendChatMessage(messagesWithSystem);
        loadingBubble.remove();
        const nowTime = formatTaipeiTime(new Date().toISOString());
        addMessage("assistant", result.text, nowTime);

        chatHistory.push({
            role: "assistant",
            content: result.text,
            date: getCurrentDiaryDateKey(),
            time: nowTime
        });

        await saveChatHistory();

        // 自動提取記憶（背景執行，不影響聊天）
        extractAndSaveMemory(userText, result.text);
        generateDiaryEntry(chatHistory);
        tryGenerateChapter(chatHistory);

    } catch (error) {
        loadingBubble.remove();
        // 記錄失敗的訊息，並顯示可重試的錯誤氣泡
        lastFailedText = userText;
        lastFailedBubble = addRetryBubble(
            "回覆失敗：" + (error.message || "未知錯誤")
        );
        showToast("回覆失敗，點下方訊息可重試");
        console.error(error);
    }
}

// ======================================
// Message Bubble
// ======================================
function addMessage(role, content, time) {
    removeWelcome();

    const bubble = document.createElement("div");
    bubble.className = `message ${role}`;
    bubble.innerHTML = `
        <div class="bubble">
            ${escapeHtml(content)}
        </div>
        ${role === "assistant" ? `
        <button class="regen-btn" title="重新生成這句回覆">🔄</button>
        ` : ""}
        ${time ? `<span class="msg-time">${time}</span>` : ""}
    `;

    messagesContainer.appendChild(bubble);
    scrollBottom();
}

// 顯示一個失敗提示氣泡，帶有「重試」按鈕
function addRetryBubble(errorText) {
    const bubble = document.createElement("div");
    bubble.className = "message assistant retry-bubble";
    bubble.innerHTML = `
        <div class="bubble retry-failed">
            ${escapeHtml(errorText)}
            <button class="retry-send-btn">重試</button>
        </div>
    `;
    messagesContainer.appendChild(bubble);
    scrollBottom();
    return bubble;
}

// ======================================
// Typing
// ======================================
function addTypingBubble() {
    removeWelcome();

    const bubble = document.createElement("div");
    bubble.className = "message assistant";
    bubble.innerHTML = `
        <div class="bubble typing">
            小克正在思考...
        </div>
    `;
    messagesContainer.appendChild(bubble);
    scrollBottom();
    return bubble;
}

// ======================================
// History
// ======================================
export async function loadChatHistory() {
    try {
        const messages = await loadMessages();
        if (!messages || messages.length === 0) return;

        chatHistory = messages.map(m => ({
            role: m.role,
            content: m.content,
            // 用資料庫的 created_at（UTC）換算出正確的「日記日期」
            // 凌晨0-4點發的訊息會自動歸到前一天
            date: m.created_at ? getDiaryDateKey(m.created_at) : m.date,
            time: m.created_at ? formatTaipeiTime(m.created_at) : "",
            dbId: m.id
        }));

        removeWelcome();
        chatHistory.forEach(msg => {
            addMessage(msg.role, msg.content, msg.time);
        });
    } catch (e) {
        console.error("[chat] 載入失敗", e);
    }
}

async function saveChatHistory() {
    // 只儲存「還沒有 dbId」的新訊息，避免重新生成時把已經存過的
    // 使用者訊息重複插入一次
    for (const msg of chatHistory) {
        if (msg.dbId) continue;
        // date 欄位仍會存一份（方便後台肉眼查看），
        // 但真正判斷「今天/凌晨算昨天」一律以資料庫的 created_at 為準
        const saved = await saveMessage(msg.role, msg.content, msg.date);
        if (saved) {
            msg.dbId = saved.id;
            if (saved.created_at) {
                msg.date = getDiaryDateKey(saved.created_at);
                msg.time = formatTaipeiTime(saved.created_at);
            }
        }
    }
}

// ======================================
// Utils
// ======================================
// 按類型分組，每種類型至少保留幾條最新的，避免重要記憶被日常對話擠掉
function pickMemoriesByType(memories) {
    const PER_TYPE_LIMIT = {
        date: 5,   // 重要日期：保留較多，通常數量少但很重要
        moment: 5, // 關係時刻
        quote: 5,  // 重要的話
        story: 5   // 敘事
    };
    const TOTAL_LIMIT = 18; // 總量上限，避免 prompt 太長

    const grouped = {};
    memories.forEach(m => {
        if (!grouped[m.type]) grouped[m.type] = [];
        grouped[m.type].push(m);
    });

    let picked = [];
    Object.keys(PER_TYPE_LIMIT).forEach(type => {
        const list = grouped[type] || [];
        // memories 假設已經是新到舊排序（saveMemory 用 unshift）
        picked = picked.concat(list.slice(0, PER_TYPE_LIMIT[type]));
    });

    // 其他未分類的類型，也給予基本保留
    Object.keys(grouped).forEach(type => {
        if (!PER_TYPE_LIMIT[type]) {
            picked = picked.concat(grouped[type].slice(0, 3));
        }
    });

    // 按時間新到舊重新排序，並套總量上限
    picked.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return picked.slice(0, TOTAL_LIMIT);
}

function scrollBottom() {
    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}

function removeWelcome() {
    const welcome = document.querySelector(".welcome");
    if (welcome) welcome.remove();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
