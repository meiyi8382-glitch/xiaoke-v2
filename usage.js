// =====================================
// 模型單價表（每 1M token 的美元價格）
// 來源：OpenRouter 定價，僅供估算
// =====================================

const MODEL_PRICING = {
    "anthropic/claude-opus-4":      { input: 15,   output: 75   },
    "anthropic/claude-sonnet-4":    { input: 3,    output: 15   },
    "anthropic/claude-sonnet-4-5":  { input: 3,    output: 15   },
	 "anthropic/claude-sonnet-4-6":  { input: 3,    output: 15   },
    "anthropic/claude-3.7-sonnet":  { input: 3,    output: 15   },
    "anthropic/claude-3.5-sonnet":  { input: 3,    output: 15   },
    "deepseek-chat":                { input: 0.14, output: 0.28 },
    "google/gemini-2.5-flash":      { input: 0.075,output: 0.3  },
    "gemini-2.0-flash":             { input: 0.1,  output: 0.4  },
    "qwen-turbo":                   { input: 0.05, output: 0.2  },
};

const STORAGE_KEY = "xiaoke_usage_v2";
const MAX_HISTORY_DAYS = 30;


// =====================================
// Init
// =====================================

export function loadUsageStats() {

    updateUsageUI();

    // 打開面板
    document
        .getElementById("usageBtn")
        ?.addEventListener("click", () => {
            updateUsageUI();
            document
                .getElementById("usagePanel")
                ?.classList.remove("hidden");
        });

    // 關閉面板
    document
        .getElementById("closeUsageBtn")
        ?.addEventListener("click", () => {
            document
                .getElementById("usagePanel")
                ?.classList.add("hidden");
        });

}


// =====================================
// Record（由 openrouter.js 呼叫）
// =====================================

export function recordUsage({
    model = "unknown",
    inputTokens = 0,
    outputTokens = 0
} = {}) {

    const data = getStorageData();
    const today = getTodayKey();

    // 確保今天的紀錄存在
    if (!data.daily[today]) {
        data.daily[today] = {
            total: { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
            models: {}
        };
    }

    const day = data.daily[today];

    // 計算費用
    const pricing = MODEL_PRICING[model] || { input: 0, output: 0 };
    const cost =
        (inputTokens  * pricing.input  / 1_000_000) +
        (outputTokens * pricing.output / 1_000_000);

    // 更新今日總計
    day.total.requests    += 1;
    day.total.inputTokens += inputTokens;
    day.total.outputTokens+= outputTokens;
    day.total.cost        += cost;

    // 更新該模型明細
    if (!day.models[model]) {
        day.models[model] = {
            requests: 0, inputTokens: 0, outputTokens: 0, cost: 0
        };
    }
    day.models[model].requests    += 1;
    day.models[model].inputTokens += inputTokens;
    day.models[model].outputTokens+= outputTokens;
    day.models[model].cost        += cost;

    // 清理超過 30 天的舊資料
    pruneOldData(data);

    saveStorageData(data);
    updateUsageUI();

}


// =====================================
// UI
// =====================================

function updateUsageUI() {

    const data  = getStorageData();
    const today = getTodayKey();
    const day   = data.daily[today];

    const container = document.getElementById("usageStats");
    if (!container) return;

    if (!day) {
        container.innerHTML =
            `<p style="color:var(--text-soft);text-align:center;padding:20px;">
                今天還沒有使用紀錄
            </p>`;
        renderHistory(data);
        return;
    }

    const t = day.total;

    // 今日總覽
    let html = `
        <div class="usage-section">
            <h3 class="usage-subtitle">今日總覽</h3>
            <div class="usage-row">
                <span>請求次數</span>
                <span>${t.requests} 次</span>
            </div>
            <div class="usage-row">
                <span>輸入 Token</span>
                <span>${t.inputTokens.toLocaleString()}</span>
            </div>
            <div class="usage-row">
                <span>輸出 Token</span>
                <span>${t.outputTokens.toLocaleString()}</span>
            </div>
            <div class="usage-row usage-cost">
                <span>預估花費</span>
                <span>$${t.cost.toFixed(5)}</span>
            </div>
        </div>
    `;

// 週統計
    const weekCost = calcPeriodCost(data, 7);
    const weekTokens = calcPeriodTokens(data, 7);
    html += `
        <div class="usage-section">
            <h3 class="usage-subtitle">本週（7天）</h3>
            <div class="usage-row">
                <span>總 Token</span>
                <span>${(weekTokens.input + weekTokens.output).toLocaleString()}</span>
            </div>
            <div class="usage-row usage-cost">
                <span>預估花費</span>
                <span>$${weekCost.toFixed(4)}</span>
            </div>
        </div>
    `;

    // 總量統計
    const totalCost = calcPeriodCost(data, 999);
    const totalTokens = calcPeriodTokens(data, 999);
    html += `
        <div class="usage-section">
            <h3 class="usage-subtitle">累計總量</h3>
            <div class="usage-row">
                <span>總 Token</span>
                <span>${(totalTokens.input + totalTokens.output).toLocaleString()}</span>
            </div>
            <div class="usage-row usage-cost">
                <span>預估花費</span>
                <span>$${totalCost.toFixed(4)}</span>
            </div>
        </div>
    `;

    // 各模型明細
    const modelKeys = Object.keys(day.models);
    if (modelKeys.length > 0) {
        html += `<div class="usage-section"><h3 class="usage-subtitle">各模型明細</h3>`;
        modelKeys.forEach(model => {
            const m = day.models[model];
            const shortName = model.split("/").pop();
            html += `
                <div class="usage-model-block">
                    <div class="usage-model-name">${shortName}</div>
                    <div class="usage-row">
                        <span>請求</span><span>${m.requests} 次</span>
                    </div>
                    <div class="usage-row">
                        <span>輸入</span><span>${m.inputTokens.toLocaleString()} tokens</span>
                    </div>
                    <div class="usage-row">
                        <span>輸出</span><span>${m.outputTokens.toLocaleString()} tokens</span>
                    </div>
                    <div class="usage-row usage-cost">
                        <span>花費</span><span>$${m.cost.toFixed(5)}</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    renderHistory(data);

}

function renderHistory(data) {

    const container = document.getElementById("usageHistory");
    if (!container) return;

    const today = getTodayKey();
    const days  = Object.keys(data.daily)
        .filter(d => d !== today)
        .sort()
        .reverse()
        .slice(0, 7);

    if (days.length === 0) {
        container.innerHTML =
            `<p style="color:var(--text-soft);font-size:13px;text-align:center;">
                暫無歷史紀錄
            </p>`;
        return;
    }

    let html = `<div class="usage-section"><h3 class="usage-subtitle">最近 7 天</h3>`;
    days.forEach(day => {
        const t = data.daily[day].total;
        html += `
            <div class="usage-row">
                <span>${day}</span>
                <span>$${t.cost.toFixed(5)}</span>
            </div>
        `;
    });
    html += `</div>`;

    container.innerHTML = html;

}

function calcPeriodCost(data, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return Object.entries(data.daily)
        .filter(([k]) => new Date(k) >= cutoff)
        .reduce((sum, [, v]) => sum + v.total.cost, 0);
}

function calcPeriodTokens(data, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return Object.entries(data.daily)
        .filter(([k]) => new Date(k) >= cutoff)
        .reduce((acc, [, v]) => {
            acc.input  += v.total.inputTokens;
            acc.output += v.total.outputTokens;
            return acc;
        }, { input: 0, output: 0 });
}

// =====================================
// Storage
// =====================================

function getStorageData() {

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { daily: {} };

    try {
        return JSON.parse(saved);
    } catch (e) {
        return { daily: {} };
    }

}

function saveStorageData(data) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}

function pruneOldData(data) {

    const keys = Object.keys(data.daily).sort();
    while (keys.length > MAX_HISTORY_DAYS) {
        const oldest = keys.shift();
        delete data.daily[oldest];
    }

}

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}