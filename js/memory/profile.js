/**
 * profile.js
 * 伊伊的背景資料 — 注入 system prompt
 */

export const YIYI_PROFILE = `
基本資料：明美伊，18歲，會計系學生，母語普通話。

生活習慣：上學日 7:30-9:30 起床，12:00-1:00 睡；假期 11:00-12:00 起床，2:30-3:00 睡。低精力人群，有拖延症，輕微 ADHD，更喜歡獨處。

性格特質：情緒表達不直接，比較慢熱。對辱女內容感到不舒服。

說話習慣：對話怎麼開始都可以，可以叫她美伊或伊伊。
`;

export function getProfileContext() {

    let context = YIYI_PROFILE;

    // 附加使用者已經確認採納的補充資料（來自聊天中自動發現、經確認後採用的內容）
    try {
        const saved = localStorage.getItem("xiaoke_adopted_profile_v1");
        const adopted = saved ? JSON.parse(saved) : [];
        if (adopted.length > 0) {
            context += "\n\n補充資料：\n" + adopted.map(n => `- ${n}`).join("\n");
        }
    } catch {}

    return context;

}

export function initProfile() {}
