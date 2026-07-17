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
    "anthropic/claude-sonnet-4"
);
}
export function getCurrentCompanionModel() {
return (
    localStorage.getItem(
        "companionModel"
    ) ||
    "local"
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