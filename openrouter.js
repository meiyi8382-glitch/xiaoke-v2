import {
    getApiKey,
    getCurrentChatModel,
    getCurrentCompanionModel
} from "./models.js";

import {
    recordUsage
} from "./usage.js";

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";


// =====================================
// Chat
// =====================================

export async function sendChatMessage(
    messages = []
) {

    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error(
            "請先設定 OpenRouter API Key"
        );
    }

    const model = getCurrentChatModel();

    const response = await fetch(
        OPENROUTER_URL,
        {
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer":  location.origin,
                "X-Title":       "XiaoKe"
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.8,
                max_tokens:  4000
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
    }

    const data = await response.json();

    // 記錄用量（輸入/輸出分開，才能準確算費用）
    recordUsage({
        model,
        inputTokens:  data.usage?.prompt_tokens     || 0,
        outputTokens: data.usage?.completion_tokens || 0
    });

    return {
        text:  data.choices?.[0]?.message?.content || "",
        usage: data.usage || {}
    };

}


// =====================================
// Companion
// =====================================

export async function sendCompanionMessage(
    prompt
) {

    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error(
            "請先設定 OpenRouter API Key"
        );
    }

    const model = getCurrentCompanionModel();

    if (model === "local") {
        return { text: "我在這裡陪著你。" };
    }

    const response = await fetch(
        OPENROUTER_URL,
        {
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role:    "system",
                        content: "你是小克，一個溫柔、簡潔、不說教的陪伴助手。"
                    },
                    {
                        role:    "user",
                        content: prompt
                    }
                ],
                temperature: 0.9,
                max_tokens:  300
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
    }

    const data = await response.json();

    // 記錄用量
    recordUsage({
        model,
        inputTokens:  data.usage?.prompt_tokens     || 0,
        outputTokens: data.usage?.completion_tokens || 0
    });

    return {
        text: data.choices?.[0]?.message?.content || ""
    };

}