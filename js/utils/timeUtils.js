/**
 * timeUtils.js
 * 時間工具 — 統一處理「UTC 轉台灣時間」與「凌晨歸屬前一天」的邏輯
 *
 * 為什麼需要這個檔案：
 * Supabase 的 created_at 存的是 UTC 時間（世界標準時間），
 * 跟台灣時間差 8 小時。如果直接拿 created_at 來判斷「今天/昨天」，
 * 會出現誤差。這個檔案負責把時間换算正確，並处理「凌晨算前一晚」的邏輯。
 */

// 把 UTC 時間字串轉成台灣時間的 Date 物件
export function toTaipeiDate(utcString) {
    const utcDate = new Date(utcString);
    // 台灣是 UTC+8，所以加 8 小時
    return new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
}

// 取得某個時間對應的「日記日期」
// 規則：凌晨 0:00 ~ 4:59 算前一天的延續（因為通常是熬夜還沒睡）
// 例如：7/27 凌晨 2:00 發的訊息 → 算 7/26 的日記
export function getDiaryDateKey(utcString) {
    const taipeiTime = toTaipeiDate(utcString);
    const hour = taipeiTime.getUTCHours(); // 因為我們手動加了8小時，這裡要用 getUTCHours 讀出正確的「台灣時」

    // 如果是凌晨 0-4 點，日期往前推一天
    if (hour >= 0 && hour < 5) {
        taipeiTime.setUTCDate(taipeiTime.getUTCDate() - 1);
    }

    const y = taipeiTime.getUTCFullYear();
    const m = taipeiTime.getUTCMonth() + 1;
    const d = taipeiTime.getUTCDate();
    return `${y}/${m}/${d}`;
}

// 取得精確到分鐘的顯示時間，例如「14:32」或「凌晨 02:15」
export function formatTaipeiTime(utcString) {
    const taipeiTime = toTaipeiDate(utcString);
    const hour = taipeiTime.getUTCHours();
    const minute = taipeiTime.getUTCMinutes();
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");

    const prefix = (hour >= 0 && hour < 5) ? "凌晨 " : "";
    return `${prefix}${hh}:${mm}`;
}

// 取得現在（呼叫當下）的日記日期 key，用法跟 getDiaryDateKey 一樣的凌晨規則
export function getCurrentDiaryDateKey() {
    const now = new Date();
    return getDiaryDateKey(now.toISOString());
}
