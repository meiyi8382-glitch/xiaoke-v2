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