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
    await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ role, content, date })
    });
}

export async function loadMessages() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/messages?order=created_at.asc`,
        { headers }
    );
    return await res.json();
}

export async function clearMessages() {
    await fetch(`${SUPABASE_URL}/rest/v1/messages?id=gte.0`, {
        method: "DELETE",
        headers
    });
}


// ======================================
// 記憶
// ======================================

export async function saveMemoryCloud(memory) {
    await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
        method: "POST",
        headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify(memory)
    });
}

export async function loadMemories() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/memories?order=created_at.desc`,
        { headers }
    );
    return await res.json();
}

export async function deleteMemoryCloud(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/memories?id=eq.${id}`, {
        method: "DELETE",
        headers
    });
}


// ======================================
// 章節摘要
// ======================================

export async function saveChapterCloud(chapter) {
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
}

export async function loadChapters() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chapters?order=index.asc`,
        { headers }
    );
    return await res.json();
}
