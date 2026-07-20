/**
 * modal.js
 * 統一管理所有面板的開關與點擊背景關閉
 */


// =====================================
// 初始化（由 app.js 呼叫，或各模組自行呼叫）
// =====================================

export function initModal() {

    // 點擊背景關閉面板
    document.querySelectorAll(".modal").forEach(modal => {

        modal.addEventListener("click", (e) => {

            if (e.target === modal) {
                closeModal(modal.id);
            }

        });

    });

}


// =====================================
// 開啟
// =====================================

export function openModal(id) {

    document.getElementById(id)?.classList.remove("hidden");

}


// =====================================
// 關閉
// =====================================

export function closeModal(id) {

    document.getElementById(id)?.classList.add("hidden");

}


// =====================================
// 切換
// =====================================

export function toggleModal(id) {

    const el = document.getElementById(id);
    if (!el) return;

    if (el.classList.contains("hidden")) {
        openModal(id);
    } else {
        closeModal(id);
    }

}
