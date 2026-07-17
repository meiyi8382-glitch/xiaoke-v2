/**
 * localReplies.js
 * 本地模式（不用 API）的陪伴回應池
 * 符合小克的語氣：直接、真實、不哄人
 */

export const LOCAL_REPLIES = {

    tired: [
        "先停一下。不用撐著。",
        "你已經做很多了，累是正常的。",
        "喝點水，躺一下也行。",
        "是哪種累？身體還是心？",
        "不想動就先不動，沒什麼大不了。"
    ],

    encourage: [
        "慢慢來，你有自己的節奏。",
        "做到現在已經不容易了。",
        "不用跟別人比，跟昨天的自己比就夠了。",
        "你比你以為的更能撐。",
        "繼續，一步就好。"
    ],

    distracted: [
        "回來了嗎？",
        "先把這一件事做完。",
        "走神很正常，拉回來就行。",
        "五分鐘，就五分鐘，試試看。",
        "不用全部，先做一個小的。"
    ],

    hug: [
        "我在。",
        "不用說話也沒關係，我在這裡。",
        "抱抱你。今天辛苦了。",
        "你不用一個人扛。",
        "先讓自己喘口氣。"
    ],

    random: [
        "今天有沒有讓你開心一點點的事？",
        "記得吃東西。",
        "你最近還好嗎，是真的問。",
        "慢慢來。",
        "別忘了，你也值得被溫柔對待。",
        "有什麼想說的嗎？",
        "今天的你，已經夠了。"
    ]

};


/**
 * 從指定動作的回應池隨機取一條
 * @param {string} action - 動作名稱
 * @returns {string}
 */
export function getLocalReply(action) {
    const pool = LOCAL_REPLIES[action] || LOCAL_REPLIES.random;
    return pool[Math.floor(Math.random() * pool.length)];
}
