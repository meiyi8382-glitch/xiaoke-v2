import {
    showToast
} from "../ui/toast.js";

export function initClickInteraction() {

    initAvatarInteraction();

    initLogoInteraction();

    initStatusInteraction();

}


// =====================================
// Avatar
// =====================================

function initAvatarInteraction() {

    const avatar =
        document.querySelector(
            ".avatar"
        );

    if (!avatar) return;

    avatar.addEventListener(
        "click",
        () => {

            showToast(
                getRandomAvatarText()
            );

        }
    );

}


// =====================================
// Logo
// =====================================

function initLogoInteraction() {

    const logo =
        document.querySelector(
            ".welcome-logo"
        );

    if (!logo) return;

    logo.addEventListener(
        "click",
        () => {

            appendAssistantMessage(
                getRandomLogoReply()
            );

        }
    );

}


// =====================================
// Status
// =====================================

function initStatusInteraction() {

    const status =
        document.getElementById(
            "statusText"
        );

    if (!status) return;

    status.addEventListener(
        "click",
        () => {

            const texts = [

                "在這裡陪著你",

                "慢慢來也沒關係",

                "別忘了喝水",

                "今天辛苦了",

                "休息一下吧 ❤️"

            ];

            const next =
                texts[
                    Math.floor(
                        Math.random() *
                        texts.length
                    )
                ];

            status.textContent =
                next;

        }
    );

}


// =====================================
// Assistant Message
// =====================================

function appendAssistantMessage(
    text
) {

    const messages =
        document.getElementById(
            "messages"
        );

    if (!messages) return;

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


// =====================================
// Random Text
// =====================================

function getRandomAvatarText() {

    const list = [

        "我在 ❤️",

        "今天過得還好嗎？",

        "別太勉強自己",

        "辛苦啦",

        "想聊聊嗎？"

    ];

    return list[
        Math.floor(
            Math.random() *
            list.length
        )
    ];

}


function getRandomLogoReply() {

    const list = [

        "歡迎回來。",

        "很高興看到你。",

        "今天想做些什麼呢？",

        "我會一直在這裡。",

        "慢慢來，不著急。"

    ];

    return list[
        Math.floor(
            Math.random() *
            list.length
        )
    ];

}
