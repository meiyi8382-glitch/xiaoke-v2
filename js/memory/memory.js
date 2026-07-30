import { getApiKey } from "../api/models.js";
import { getDiary } from "./diary.js";
import { saveMemoryCloud, loadMemories, deleteMemoryCloud } from "../api/supabase.js";

const STORAGE_KEY = "xiaoke_memory_v1";
const PROFILE_CANDIDATES_KEY = "xiaoke_profile_candidates_v1";

// 記憶類型定義
const MEMORY_TYPES = {
    date:     { label: "重要日期", icon: "📅" },
    moment:   { label: "關係時刻", icon: "💛" },
    story:    { label: "敘事",     icon: "📖" },
    quote:    { label: "重要的話", icon: "💬" }
};

// 用便宜但夠用的模型做記憶提取
const EXTRACT_MODEL = "google/gemini-2.5-flash";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";


// =====================================
// Init
// =====================================

export function initMemory() {

    // 打開面板
    document
        .getElementById("memoryBtn")
        ?.addEventListener("click", () => {
            renderMemoryPanel();
            document
                .getElementById("memoryPanel")
                ?.classList.remove("hidden");
        });

    // 關閉面板
    document
        .getElementById("closeMemoryBtn")
        ?.addEventListener("click", () => {
            document
                .getElementById("memoryPanel")
                ?.classList.add("hidden");
        });
    // Tab 切換
    document.querySelectorAll(".memory-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".memory-tab")
                .forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const which = tab.dataset.tab;
            document.getElementById("memoryContent")
                .classList.toggle("hidden", which !== "memory");
            document.getElementById("diaryContent")
                .classList.toggle("hidden", which !== "diary");

            if (which === "diary") renderDiaryPanel();
        });
    });


}


// =====================================
// 自動提取記憶（由 chat.js 呼叫）
// =====================================

export async function extractAndSaveMemory(
    userMessage,
    assistantMessage
) {

    const apiKey = getApiKey();
    if (!apiKey) return; // 沒有 key 就不提取

    const prompt = `你是記憶助手。根據以下對話，判斷有沒有值得長期記住的內容。

記憶類型（只能用這五種）：
- date：重要日期（紀念日、生日、考試日、截止日等具體日期）
- moment：關係時刻（感情升溫、波動、爭執、和好、說了重要的話的那個時刻）
- story：敘事（發生了什麼具體的事，要有細節，不能只寫心情）
- quote：重要的話（格式必須是「伊伊：原話」或「小克：原話」，有份量的，值得記住原文）
- profile_candidate：基本資料候選（伊伊透露的長期性、穩定性的個人資訊，例如興趣愛好、飲食習慣、寵物、家人、長期的生活狀態、價值觀等——不是單次事件，而是「以後大概率都是這樣」的資訊）

提取原則（嚴格執行，寧可少記也不要記瑣碎內容）：
- 必須有具體內容，不能只寫「用戶感到難過」這種空話
- 排除純粹的日常閒聊、生活小事的討論（例如睡姿、枕頭怎麼放、吃了什麼），除非這段對話裡包含明顯的情緒起伏或關係進展
- story 要寫清楚發生了什麼、前因後果，而且要是「有意義的事件」，不是任何一段對話的流水帳摘要
- quote 只挑真正有份量、之後可能會被重新提起的話，不是隨口的一句話
- profile_candidate 只挑真正長期穩定的資訊，單次的心情或暫時的狀態不算
- 大部分平淡的對話應該回傳 []，不要為了「有東西可記」而硬找
- 不要重複提取已經記過的內容

以 JSON 陣列回傳（只回傳 JSON，不要其他文字）：
[{"type":"story","content":"具體描述發生了什麼"}]

對話：
伊伊：${userMessage}
小克：${assistantMessage}`;

    try {

        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: EXTRACT_MODEL,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 300
            })
        });

        if (!response.ok) return;

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "[]";

        // 解析 JSON（AI 有時會多包一層 markdown）
        const clean = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const items = JSON.parse(clean);

        if (!Array.isArray(items) || items.length === 0) return;

        for (const item of items) {
            if (!item.type || !item.content) continue;

            if (item.type === "profile_candidate") {
                addProfileCandidate(item.content);
            } else {
                await saveMemory({
                    type:    item.type,
                    content: item.content
                });
            }
        }

    } catch (e) {
        // 提取失敗不影響主要聊天功能
        console.warn("[memory] 提取失敗", e);
    }

}


// =====================================
// CRUD
// =====================================

export async function saveMemory({ type, content }) {

    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const existing = await getAllMemories();

    const cleaned = existing.filter(m => {
        if (m.type !== "date") return true;
        if (!m.expiresAt) return true;
        return now < m.expiresAt + THREE_DAYS;
    });

    const newMemory = {
        id:        Date.now().toString(),
        type:      type || "keypoint",
        content,
        date:      new Date().toLocaleDateString("zh-TW"),
        createdAt: Date.now()
    };

    cleaned.unshift(newMemory);

    if (cleaned.length > 200) cleaned.splice(200);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));

    await saveMemoryCloud({
        id:        newMemory.id,
        type:      newMemory.type,
        content:   newMemory.content,
        date:      newMemory.date,
        created_at: newMemory.createdAt
    });

}

export async function getAllMemories() {
    try {
        const cloud = await loadMemories();
        if (cloud && cloud.length > 0) return cloud;
    } catch {}
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export async function deleteMemory(id) {
    await deleteMemoryCloud(id);
    const memories = (await getAllMemories()).filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    renderMemoryPanel();
}


// =====================================
// UI
// =====================================

async function renderMemoryPanel() {

    const container =
        document.getElementById("memoryContent");

    if (!container) return;

    const memories = await getAllMemories();

    if (memories.length === 0) {
        container.innerHTML = `
            <p style="
                color:var(--text-soft);
                text-align:center;
                padding:30px 0;
                font-size:14px;
            ">
                還沒有記憶<br>
                <span style="font-size:12px;">聊天之後會自動記錄重要內容</span>
            </p>
        `;
        return;
    }

    // 按類型分組
    const grouped = {};
    memories.forEach(m => {
        if (!grouped[m.type]) grouped[m.type] = [];
        grouped[m.type].push(m);
    });

    let html = "";

    Object.keys(MEMORY_TYPES).forEach(type => {

        if (!grouped[type]) return;

        const { label, icon } = MEMORY_TYPES[type];

        html += `
            <div class="memory-group">
                <div class="memory-group-title">
                    ${icon} ${label}
                </div>
        `;

        grouped[type].forEach(m => {
            html += `
                <div class="memory-item">
                    <div class="memory-item-content">
                        ${escapeHtml(m.content)}
                    </div>
                    <div class="memory-item-footer">
                        <span class="memory-date">${m.date}</span>
                        <button
                            class="memory-delete-btn"
                            onclick="window.__deleteMemory('${m.id}')"
                        >刪除</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

    });

    container.innerHTML = html;

    // 把刪除函數掛在 window 上（讓 onclick 能呼叫）
    window.__deleteMemory = deleteMemory;

}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

export async function renderDiaryPanel() {

    const container = document.getElementById("diaryContent");
    if (!container) return;

    const entries = getDiary();

    if (entries.length === 0) {
        container.innerHTML = `
            <p style="
                color:var(--text-soft);
                text-align:center;
                padding:30px 0;
                font-size:14px;
            ">
                還沒有日記<br>
                <span style="font-size:12px;">聊天之後會自動生成</span>
            </p>
        `;
        return;
    }

    container.innerHTML = entries.map(e => `
        <div class="memory-item">
            <div class="memory-item-content">
                ${escapeHtml(e.content)}
            </div>
            <div class="memory-item-footer">
                <span class="memory-date">${e.date}</span>
            </div>
        </div>
    `).join("");

}


// =====================================
// 基本資料候選（Profile Candidates）
// 由 AI 從聊天中發現的、可能適合加進 profile.js 的
// 長期性個人資訊。存在本地，等使用者手動確認才會真正採用。
// =====================================

function addProfileCandidate(content) {

    const list = getProfileCandidates();

    // 避免重複加入完全一樣的內容
    if (list.some(c => c.content === content)) return;

    list.unshift({
        id: Date.now().toString(),
        content,
        createdAt: Date.now()
    });

    // 最多保留 30 條候選，避免無限累積
    if (list.length > 30) list.splice(30);

    localStorage.setItem(PROFILE_CANDIDATES_KEY, JSON.stringify(list));

}

export function getProfileCandidates() {
    try {
        const saved = localStorage.getItem(PROFILE_CANDIDATES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

// 忽略某條候選（使用者覺得不需要，直接刪掉）
export function dismissProfileCandidate(id) {
    const list = getProfileCandidates().filter(c => c.id !== id);
    localStorage.setItem(PROFILE_CANDIDATES_KEY, JSON.stringify(list));
}

// 採納某條候選：回傳內容給呼叫方（設定面板）去實際更新 profile.js 的顯示
// 因為 profile.js 的內容是寫在程式碼裡的常數，無法在瀏覽器端直接修改原始檔案，
// 所以這裡只負責把「已採納」的內容额外存到 localStorage，
// 並在 getProfileContext() 時一併附加上去，讓 AI 讀得到。
const ADOPTED_PROFILE_KEY = "xiaoke_adopted_profile_v1";

export function adoptProfileCandidate(id) {

    const list = getProfileCandidates();
    const target = list.find(c => c.id === id);
    if (!target) return;

    const adopted = getAdoptedProfileNotes();
    adopted.push(target.content);
    localStorage.setItem(ADOPTED_PROFILE_KEY, JSON.stringify(adopted));

    dismissProfileCandidate(id);

}

export function getAdoptedProfileNotes() {
    try {
        const saved = localStorage.getItem(ADOPTED_PROFILE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}
