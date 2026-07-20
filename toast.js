export function showToast(message) {
const container =
    document.getElementById(
        "toastContainer"
    );

if (!container) return;

const toast =
    document.createElement("div");

toast.className = "toast";

toast.textContent = message;

container.appendChild(toast);

setTimeout(() => {

    toast.remove();

}, 3000);
}
