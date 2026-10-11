import {
    DEFAULT_CHAT_MODEL,
    DEFAULT_COMPANION_MODEL
} from "../config/constants.js";

export function initializeModelSystem() {
console.log(
    "模型系統初始化完成"
);
}
export function getCurrentChatModel() {
return (
    localStorage.getItem(
        "chatModel"
    ) ||
    DEFAULT_CHAT_MODEL
);
}
export function getCurrentCompanionModel() {
return (
    localStorage.getItem(
        "companionModel"
    ) ||
    DEFAULT_COMPANION_MODEL
);
}
export function getApiKey() {

    return (
        localStorage.getItem(
            "apiKey"
        ) || ""
    );

}

export function getModelConfig() {

    return {

        chatModel:
            getCurrentChatModel(),

        companionModel:
            getCurrentCompanionModel(),

        apiKey:
            getApiKey()

    };

}
