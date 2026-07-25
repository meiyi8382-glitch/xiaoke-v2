import { showToast }
    from "./toast.js";

import {
    DEFAULT_CHAT_MODEL,
    DEFAULT_COMPANION_MODEL
} from "../config/constants.js";


// ======================================
// Load
// ======================================

export async function loadSettings() {

    const chatModel =
        document.getElementById(
            "chatModelSelect"
        );

    const companionModel =
        document.getElementById(
            "companionModelSelect"
        );

    const apiKey =
        document.getElementById(
            "apiKeyInput"
        );

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );

    if (chatModel) {
        chatModel.value =
            localStorage.getItem(
                "chatModel"
            ) ||
            DEFAULT_CHAT_MODEL;
    }

    if (companionModel) {
        companionModel.value =
            localStorage.getItem(
                "companionModel"
            ) ||
            DEFAULT_COMPANION_MODEL;
    }

    if (apiKey) {
        apiKey.value =
            localStorage.getItem(
                "apiKey"
            ) || "";
    }

    // 讀取並套用已儲存的主題
    const savedTheme =
        localStorage.getItem("theme") || "dark";

    applyTheme(savedTheme);

    if (themeToggle) {

        themeToggle.checked =
            savedTheme === "dark";

        themeToggle.addEventListener(
            "change",
            () => {
                const newTheme =
                    themeToggle.checked
                        ? "dark"
                        : "light";
                applyTheme(newTheme);
                localStorage.setItem(
                    "theme",
                    newTheme
                );
            }
        );

    }


    // 聲音開關
    const sndToggle = document.getElementById("soundToggle");
    if (sndToggle) {
        sndToggle.checked = localStorage.getItem("xiaoke_sound") !== "false";
        sndToggle.addEventListener("change", () => {
            localStorage.setItem("xiaoke_sound", sndToggle.checked);
        });
    }

    // 清除本地緩存（保留 API key 和模型設定，只清聊天/記憶相關的舊資料）
    document
        .getElementById("clearCacheBtn")
        ?.addEventListener("click", () => {
            const confirmed = window.confirm(
                "確定要清除本地緩存嗎？\n\n這會清掉手機上殘留的舊聊天/記憶資料（雲端記憶不受影響），API key 和模型設定會保留。"
            );
            if (!confirmed) return;

            localStorage.removeItem("xiaoke_memory_v1");
            localStorage.removeItem("xiaoke_chapters_v1");
            localStorage.removeItem("xiaoke_diary_v1");
            localStorage.removeItem("xiaoke_chat_history");

            showToast("本地緩存已清除，請重新整理頁面");
        });

    // 打開設定視窗
    document
        .getElementById("settingsBtn")
        ?.addEventListener(
            "click",
            () => {
                document
                    .getElementById(
                        "settingsPanel"
                    )
                    ?.classList.remove(
                        "hidden"
                    );
            }
        );

    // 關閉設定視窗
    document
        .getElementById(
            "closeSettingsBtn"
        )
        ?.addEventListener(
            "click",
            () => {
                saveSettings();
                document
                    .getElementById(
                        "settingsPanel"
                    )
                    ?.classList.add(
                        "hidden"
                    );
            }
        );

}


// ======================================
// Theme
// ======================================

function applyTheme(theme) {

    document.body.setAttribute(
        "data-theme",
        theme
    );

}


// ======================================
// Save
// ======================================

function saveSettings() {

    localStorage.setItem(
        "chatModel",
        document.getElementById(
            "chatModelSelect"
        ).value
    );

    localStorage.setItem(
        "companionModel",
        document.getElementById(
            "companionModelSelect"
        ).value
    );

    localStorage.setItem(
        "apiKey",
        document.getElementById(
            "apiKeyInput"
        ).value
    );

    showToast("設定已儲存");

}
