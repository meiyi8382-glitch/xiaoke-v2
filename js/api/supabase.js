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
        const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
            method: "POST",
            headers: { ...headers, "Prefer": "return=representation" },
            body: JSON.stringify({ role, content, date })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`saveMessage 被拒絕 (${res.status}): ${errText}`);
        }

        const data = await res.json();
        // 回傳整筆資料（包含資料庫自動產生的 id 跟 created_at）
        // created_at 是精確到微秒的 UTC 時間戳，用來判斷凌晨訊息歸屬哪一天
        return data?.[0] ?? null;
    } catch (e) {
        console.warn("[supabase] saveMessage 失敗", e);
        throw e;
    }
}

export async function deleteMessageById(id) {
    if (!id) return;
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
            method: "DELETE",
            headers
        });
    } catch (e) {
        console.warn("[supabase] deleteMessageById 失敗", e);
    }
}

export async function loadMessages() {
    try {
        // 重要：Supabase/PostgREST 對單次查詢有服務器端強制的預設上限
        // （通常是 1000 筆），這個限制不受 URL 上的 limit 參數影響。
        // 如果用「從最早開始排序」去查，訊息一多，最新的內容就會被
        // 直接擋在 1000 筆之外，完全撈不到。
        //
        // 解法：反過來查——用 created_at 倒序（新到舊）先抓最新一批，
        // 抓到之後在程式裡再反轉成正序給畫面顯示。這樣不管訊息總數
        // 多大，最新的內容永遠優先被撈到。
        const MAX_MESSAGES = 500; // 保留最近 500 筆，涵蓋近期所有對話

        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/messages?order=created_at.desc&limit=${MAX_MESSAGES}`,
            { headers }
        );

        if (!res.ok) {
            const errText = await res.text();
            console.error("[supabase] loadMessages 請求失敗", res.status, errText);
            return [];
        }

        const data = await res.json();
        // 撈到的是新到舊，反轉回正序（舊到新）給畫面顯示
        return Array.isArray(data) ? data.reverse() : [];
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

// 查詢某張表目前的資料筆數
async function countRows(table) {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/${table}?select=id`,
            { headers }
        );
        const data = await res.json();
        return Array.isArray(data) ? data.length : -1;
    } catch (e) {
        return -1;
    }
}

// 徹底清空三張雲端表格，並回傳清空前後的筆數，方便驗證
export async function wipeAllCloudData() {
    const before = {
        messages: await countRows("messages"),
        memories: await countRows("memories"),
        chapters: await countRows("chapters")
    };

    try {
        await fetch(`${SUPABASE_URL}/rest/v1/messages?id=gte.0`, { method: "DELETE", headers });
        await fetch(`${SUPABASE_URL}/rest/v1/memories?id=gte.0`, { method: "DELETE", headers });
        await fetch(`${SUPABASE_URL}/rest/v1/chapters?id=gte.0`, { method: "DELETE", headers });
    } catch (e) {
        console.warn("[supabase] wipeAllCloudData 失敗", e);
    }

    const after = {
        messages: await countRows("messages"),
        memories: await countRows("memories"),
        chapters: await countRows("chapters")
    };

    return { before, after };
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
