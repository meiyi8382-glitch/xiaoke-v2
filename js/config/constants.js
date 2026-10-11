export const APP_NAME = "小克";
export const APP_VERSION = "2.0";

// "~...-latest" 是 OpenRouter 的別名，會自動指向該系列最新的模型
export const DEFAULT_CHAT_MODEL = "~anthropic/claude-sonnet-latest";
export const DEFAULT_COMPANION_MODEL = "local";

// 背景任務（記憶提取、日記、章節摘要）使用的便宜模型
export const BACKGROUND_MODEL = "~anthropic/claude-haiku-latest";

export const STORAGE_KEYS = {
    SETTINGS: "xiaoke_settings",
    CHAT_HISTORY: "xiaoke_chat_history",
    MEMORY: "xiaoke_memory",
    TIMER: "xiaoke_timer",
    USAGE: "xiaoke_usage"
};
