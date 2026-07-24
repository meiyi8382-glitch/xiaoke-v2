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

import { saveMessage, loadMessages } from "../api/supabase.js";

const messagesContainer =
    document.getElementById("messages");

const input =
    document.getElementById("userInput");

const sendBtn =
    document.getElementById("sendBtn");

let chatHistory = [];


// ======================================
// Init
// ======================================

export function initChat() {

    sendBtn?.addEventListener(
        "click",
        sendUserMessage
    );

    input?.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage();
            }
        }
    );

}


// ======================================
// Send
// ======================================

async function sendUserMessage() {

    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);

    chatHistory.push({
        role: "user",
        content: text
    });

    input.value = "";

    const loadingBubble = addTypingBubble();

    try {

// 取記憶庫（按類型分組保底，避免重要記憶被最近的日常對話擠掉）
        const allMemories = await getAllMemories();
        const memories = pickMemoriesByType(allMemories);
        const memoryText = memories.length > 0
            ? "\n\n【記憶庫】\n" + memories.map(m => `- ${m.content}`).join("\n")
            : "";

        // 動態截斷：情緒關鍵詞時多保留
        const emotionWords = ["難過", "哭", "委屈", "害怕", "崩潰", "煩", "累", "痛","喜欢","爱你"];
        const isEmotional = emotionWords.some(w => text.includes(w));
        const limit = isEmotional ? 30 : 20;
        const recentHistory = chatHistory.slice(-limit);

        const chapterContext = getChapterContext();

        const systemContent = XIAOKE_SYSTEM_PROMPT + "\n\n" + getProfileContext();

        const messagesWithSystem = [
            {
                role: "system",
                content: systemContent + chapterContext + memoryText
            },
            ...recentHistory
        ];


        const result = await sendChatMessage(messagesWithSystem);

        loadingBubble.remove();

        addMessage("assistant", result.text);

        chatHistory.push({
            role: "assistant",
            content: result.text
        });

        saveChatHistory();

        // 自動提取記憶（背景執行，不影響聊天）
        extractAndSaveMemory(text, result.text);
        generateDiaryEntry(chatHistory);

tryGenerateChapter(chatHistory);

    } catch (error) {

        loadingBubble.remove();
        showToast("回覆失敗：" + (error.message || "未知錯誤"));
        console.error(error);

    }

}


// ======================================
// Message Bubble
// ======================================

function addMessage(role, content) {

    removeWelcome();

    const bubble = document.createElement("div");
    bubble.className = `message ${role}`;
    bubble.innerHTML = `
        <div class="bubble">
            ${escapeHtml(content)}
        </div>
    `;

    messagesContainer.appendChild(bubble);
    scrollBottom();

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
            date: m.date
        }));
        removeWelcome();
        chatHistory.forEach(msg => {
            addMessage(msg.role, msg.content);
        });
    } catch (e) {
        console.error("[chat] 載入失敗", e);
    }
}

async function saveChatHistory() {
    const today = new Date().toLocaleDateString("zh-TW");
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (!lastMsg) return;
    await saveMessage(lastMsg.role, lastMsg.content, today);
}


// ======================================
// Utils
// ======================================

// 按類型分組，每種類型至少保留幾條最新的，避免重要記憶被日常對話擠掉
function pickMemoriesByType(memories) {

    const PER_TYPE_LIMIT = {
        date:   5,   // 重要日期：保留較多，通常數量少但很重要
        moment: 5,   // 關係時刻
        quote:  5,   // 重要的話
        story:  5    // 敘事
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
