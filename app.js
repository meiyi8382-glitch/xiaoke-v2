/**
 * 小克 v2.0
 * Application Bootstrap
 */

import { loadSettings } from "./ui/settings.js";
import { initGuide } from "./ui/guide.js";
import { initModal } from "./ui/modal.js";

import {
    initChat,
    loadChatHistory
} from "./chat/chat.js";

import {
    initCompanion
} from "./chat/companion.js";

import {
    initClickInteraction
} from "./chat/clickInteraction.js";

import {
    initTimer,
    restoreTimerState
} from "./timer/timer.js";

import {
    initMemory
} from "./memory/memory.js";

import {
    initDiary
} from "./memory/diary.js";

import {
    initProfile
} from "./memory/profile.js";

import {
    loadUsageStats
} from "./api/usage.js";

import {
    initializeModelSystem
} from "./api/models.js";

import {
    showToast
} from "./ui/toast.js";

import {
    APP_NAME,
    APP_VERSION
} from "./config/constants.js";


// ========================================
// Application Start
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log(
        `%c${APP_NAME} v${APP_VERSION}`,
        "color:#E8824A;font-size:16px;font-weight:bold;"
    );

    try {

        // ----------------------------
        // 1. 初始化設定
        // ----------------------------

        await loadSettings();

        // ----------------------------
        // 2. 初始化模型系統
        // ----------------------------

        initializeModelSystem();

        // ----------------------------
        // 3. 初始化記憶系統
        // ----------------------------

        initMemory();

        initDiary();

        initProfile();

        // ----------------------------
        // 4. 初始化聊天系統
        // ----------------------------

        initChat();

        await loadChatHistory();

        // ----------------------------
        // 5. 初始化陪伴系統
        // ----------------------------

        initCompanion();

        // ----------------------------
        // 6. 初始化點擊互動
        // ----------------------------

        initClickInteraction();

        // ----------------------------
        // 7. 初始化計時器
        // ----------------------------

        initTimer();

        restoreTimerState();

        // ----------------------------
        // 8. API 使用量統計
        // ----------------------------

        loadUsageStats();

        // ----------------------------
        // 9. 新手引導
        // ----------------------------

        initGuide();

        // ----------------------------
        // 10. Modal 統一管理
        // ----------------------------

        initModal();

        // ----------------------------
        // 10. 全域事件
        // ----------------------------

        registerGlobalEvents();

        console.log("小克 v2.0 啟動完成");

    } catch (error) {

        console.error(error);

        showToast(
            "初始化失敗，請重新整理頁面"
        );

    }

});


// ========================================
// Global Events
// ========================================

function registerGlobalEvents() {

    // 視窗關閉前儲存資料

    window.addEventListener(
        "beforeunload",
        saveAllData
    );

    // 回到頁面

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    // ESC 關閉 Modal

    document.addEventListener(
        "keydown",
        (e) => {

            if (e.key === "Escape") {

                const modal =
                    document.querySelector(
                        ".modal.open"
                    );

                if (modal) {

                    modal.classList.remove("open");

                }

            }

        }
    );

}


// ========================================
// Save All
// ========================================

function saveAllData() {

    try {

        const state = {

            lastOpen:
                Date.now()

        };

        localStorage.setItem(
            "xiaoke_state",
            JSON.stringify(state)
        );

    } catch (e) {

        console.warn(
            "保存失敗",
            e
        );

    }

}


// ========================================
// Visibility
// ========================================

function handleVisibilityChange() {

    if (
        document.visibilityState ===
        "visible"
    ) {

        console.log(
            "小克重新回到前台"
        );

    }

}


// ========================================
// Debug Mode
// ========================================

window.XIAOKE = {

    version: APP_VERSION,

    clearStorage() {

        localStorage.clear();

        location.reload();

    },

    showStorage() {

        console.log(localStorage);

    }

};