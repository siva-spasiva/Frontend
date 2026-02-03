// using global fetch

// Actually let's assume global fetch or just import it.
// If using "type": "module", we can import if needed. But let's try standard fetch.

const OLLAMA_CONFIG = {
    apiUrl: 'http://localhost:11434/api/generate',
    model: 'gpt-oss:20b-cloud',
    stream: false
};

export const generateAIResponse = async (fullPrompt, config = {}) => {
    // 1. Check if we should use Real Ollama (via Env or Config)
    // You can set USE_OLLAMA=true in .env to enable this
    const useRealAI = process.env.USE_OLLAMA === 'true';

    if (useRealAI) {
        return generateOllamaResponse(fullPrompt, config);
    }

    // 2. Default: Mock Response
    console.log("Mock AI Service called (set USE_OLLAMA=true to use real AI)");
    return generateMockResponse(fullPrompt);
};

// Mock Implementation
const generateMockResponse = async (fullPrompt) => {
    // Extract user message for echoing (Simple regex based on controller's prompt structure)
    // Pattern: User: ${message}\nCharacter:
    const userMatch = fullPrompt.match(/User:\s*(.*?)\nCharacter:/);
    const userMessage = userMatch ? userMatch[1].trim() : "unknown";

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple logic to vary stats based on keywords
    let friendly = 50;
    if (userMessage.includes("안녕") || userMessage.includes("반가")) friendly = 70;
    if (userMessage.includes("싫어") || userMessage.includes("꺼져")) friendly = 30;

    const mockStats = {
        "Friendly": friendly,
        "Faith": 50
        // "Fish_Level": 0 // Don't enforce 0, let it stay as is
    };

    const mockResponseText = `(Mock) 당신이 "${userMessage}"라고 말했습니다.`;
    const mockThought = `Processing mock response for: ${userMessage}`;

    // Return format expected by chatController
    return `THOUGHT: ${mockThought}
UPDATED_STATS: ${JSON.stringify(mockStats)}
SAY: "${mockResponseText}"`;
}

// Real Ollama Implementation
const generateOllamaResponse = async (fullPrompt, config = {}) => {
    const finalConfig = { ...OLLAMA_CONFIG, ...config };

    const payload = {
        model: finalConfig.model,
        prompt: fullPrompt,
        stream: finalConfig.stream
    };

    try {
        console.log("Sending request to AI (Ollama):", finalConfig.apiUrl, payload.model);

        // AbortController for Timeout (e.g. 120 seconds for slow local models)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch(finalConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || data.text || "......";

    } catch (error) {
        console.warn("AI Service Failed (Ollama):", error.message);
        console.warn("Falling back to Mock Response...");
        return generateMockResponse(fullPrompt);
    }
};
