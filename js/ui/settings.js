import { showToast }
    from "./toast.js";

import {
    DEFAULT_CHAT_MODEL,
    DEFAULT_COMPANION_MODEL
} from "../config/constants.js";

import {
    getProfileCandidates,
    dismissProfileCandidate,
    adoptProfileCandidate
} from "../memory/memory.js";


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

    // 個人資料建議：更新數量標示，並綁定點擊開啟列表
    refreshCandidateCount();

    document
        .getElementById("profileCandidatesBtn")
        ?.addEventListener("click", showProfileCandidatesDialog);

    // 清除本地緩存 + 雲端資料（並回報結果，方便驗證是否真的清乾淨）
    document
        .getElementById("clearCacheBtn")
        ?.addEventListener("click", async () => {

            const confirmed = window.confirm(
                "確定要徹底清除嗎？\n\n這會清掉手機本地資料，以及 Supabase 雲端的 messages、memories、chapters 三張表全部內容。這個動作無法復原。API key 和模型設定會保留。"
            );
            if (!confirmed) return;

            // 清本地
            localStorage.removeItem("xiaoke_memory_v1");
            localStorage.removeItem("xiaoke_chapters_v1");
            localStorage.removeItem("xiaoke_diary_v1");
            localStorage.removeItem("xiaoke_chat_history");

            showToast("正在清除雲端資料，請稍候...");

            // 清雲端，並拿到清空前後的筆數
            const { wipeAllCloudData } = await import("../api/supabase.js");
            const result = await wipeAllCloudData();

            const msg =
                `清除完成\n\n` +
                `messages：${result.before.messages} → ${result.after.messages}\n` +
                `memories：${result.before.memories} → ${result.after.memories}\n` +
                `chapters：${result.before.chapters} → ${result.after.chapters}\n\n` +
                (result.after.messages === 0 && result.after.memories === 0 && result.after.chapters === 0
                    ? "✅ 雲端已完全清空"
                    : "⚠️ 還有殘留資料，可能需要重試一次");

            window.alert(msg);

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


// ======================================
// 個人資料建議
// ======================================

function refreshCandidateCount() {
    const countEl = document.getElementById("candidateCount");
    if (!countEl) return;
    const list = getProfileCandidates();
    countEl.textContent = list.length > 0 ? `(${list.length})` : "";
}

function showProfileCandidatesDialog() {

    const list = getProfileCandidates();

    if (list.length === 0) {
        window.alert("目前沒有待確認的資料。\n\n聊天中如果提到長期性的個人資訊（例如興趣、習慣、家人），會自動出現在這裡。");
        return;
    }

    // 用簡單的逐條 confirm 讓使用者一條一條決定，避免另外做一個複雜的彈窗 UI
    for (const item of list) {

        const choice = window.confirm(
            `發現一條可能的個人資料：\n\n「${item.content}」\n\n要採納加入他對妳的了解嗎？\n\n（確定 = 採納，取消 = 忽略）`
        );

        if (choice) {
            adoptProfileCandidate(item.id);
        } else {
            dismissProfileCandidate(item.id);
        }

    }

    refreshCandidateCount();
    showToast("已處理完待確認資料");

}
