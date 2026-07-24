/**
 * supabase.js
 * 雲端存儲 — 聊天記錄、記憶、章節
 */

const SUPABASE_URL = "https://pfimxijgyravbkuxrjsv.supabase.co";
const SUPABASE_KEY = "sb_publishable_EFhQu4ejMhay2rNOaORbSg_f2fLHrFg";

const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`
};


// ======================================
// 聊天記錄
// ======================================

export async function saveMessage(role, content, date) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({ role, content, date })
        });
    } catch (e) {
        console.warn("[supabase] saveMessage 失敗", e);
    }
}

export async function loadMessages() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/messages?order=created_at.asc`,
            { headers }
        );
        return await res.json();
    } catch (e) {
        console.warn("[supabase] loadMessages 失敗", e);
        return [];
    }
}

export async function clearMessages() {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/messages?id=gte.0`, {
            method: "DELETE",
            headers
        });
    } catch (e) {
        console.warn("[supabase] clearMessages 失敗", e);
    }
}


// ======================================
// 記憶
// ======================================

export async function saveMemoryCloud(memory) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
            method: "POST",
            headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify(memory)
        });
    } catch (e) {
        console.warn("[supabase] saveMemoryCloud 失敗", e);
    }
}

export async function loadMemories() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/memories?order=created_at.desc`,
            { headers }
        );
        return await res.json();
    } catch (e) {
        console.warn("[supabase] loadMemories 失敗", e);
        return [];
    }
}

export async function deleteMemoryCloud(id) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/memories?id=eq.${id}`, {
            method: "DELETE",
            headers
        });
    } catch (e) {
        console.warn("[supabase] deleteMemoryCloud 失敗", e);
    }
}


// ======================================
// 章節摘要
// ======================================

export async function saveChapterCloud(chapter) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/chapters`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                index: chapter.index,
                date: chapter.date,
                message_count: chapter.messageCount,
                summary: chapter.summary
            })
        });
    } catch (e) {
        console.warn("[supabase] saveChapterCloud 失敗", e);
    }
}

export async function loadChapters() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/chapters?order=index.asc`,
            { headers }
        );
        return await res.json();
    } catch (e) {
        console.warn("[supabase] loadChapters 失敗", e);
        return [];
    }
}
