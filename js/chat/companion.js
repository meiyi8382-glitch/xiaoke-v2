import {
    getCurrentCompanionModel
} from "../api/models.js";

import {
    sendCompanionMessage
} from "../api/openrouter.js";

import {
    showToast
} from "../ui/toast.js";

import {
    COMPANION_PROMPTS
} from "../config/prompts.js";

import {
    getLocalReply
} from "../config/localReplies.js";


// =====================================
// Init
// =====================================

export function initCompanion() {

    const buttons =
        document.querySelectorAll(
            "#companionBar button"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.action;

                    handleAction(
                        action
                    );

                }
            );

        }
    );

}


// =====================================
// Handle
// =====================================

async function handleAction(
    action
) {

    const model =
        getCurrentCompanionModel();

    try {

        let text = "";

        if (
            model === "local"
        ) {

            text =
                getLocalReply(
                    action
                );

        } else {

            const result =
                await sendCompanionMessage(
                    COMPANION_PROMPTS[action]
                );

            text =
                result.text;

        }

        appendCompanionMessage(
            text
        );

    } catch (error) {

        console.error(
            error
        );

        showToast(
            "陪伴訊息失敗"
        );

    }

}


// =====================================
// UI
// =====================================

function appendCompanionMessage(
    text
) {

    const messages =
        document.getElementById(
            "messages"
        );

    const welcome =
        document.querySelector(
            ".welcome"
        );

    if (welcome) {

        welcome.remove();

    }

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message assistant";

    message.innerHTML =
        `
        <div class="bubble">
            ${text}
        </div>
        `;

    messages.appendChild(
        message
    );

    messages.scrollTop =
        messages.scrollHeight;

}
