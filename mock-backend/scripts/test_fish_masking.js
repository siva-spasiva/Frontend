
// Retain global fetch (Node 18+)

const BASE_URL = 'http://localhost:3000/api';
const NPC_ID = 'npc_a';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateStats(updates, npcId = null) {
    const body = { updates };
    if (npcId) body.npcId = npcId;

    const res = await fetch(`${BASE_URL}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function sendChat(message) {
    const res = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, npcId: NPC_ID })
    });
    return res.json();
}

async function runTests() {
    console.log("=== Starting Fish Level Masking Tests ===");

    // Scenario 1: NPC Fish 100, Player Fish 0 -> Full Masking
    console.log("\n[Test 1] NPC Fish=100, Player Fish=0 (Expected: Masked)");
    await updateStats({ fishLevel: 100 }, NPC_ID); // Set NPC Fish Level
    await updateStats({ fishLevel: 0 });          // Set Player Fish Level

    // We send a message that would provoke a response. 
    // Mock response puts input in quotes, so if we say long sentence, it echoes.
    // If mocking, "test message" -> mock says '... "test message" ...'
    // If real LLM, it replies.
    // We'll check for '[뻐끔]' presence.
    const res1 = await sendChat("안녕하세요. 테스트 메시지입니다.");
    console.log(`Response: ${res1.response}`);

    if (res1.response.includes("[뻐끔]")) {
        console.log("PASS: Response contains masking.");
    } else {
        console.log("FAIL: Response NOT masked but should be.");
    }

    // Scenario 2: NPC Fish 0, Player Fish 0 -> No Masking
    console.log("\n[Test 2] NPC Fish=0, Player Fish=0 (Expected: Clean)");
    await updateStats({ fishLevel: 0 }, NPC_ID);
    await updateStats({ fishLevel: 0 });

    const res2 = await sendChat("안녕하세요.");
    console.log(`Response: ${res2.response}`);

    if (!res2.response.includes("[뻐끔]")) {
        console.log("PASS: Response clean.");
    } else {
        console.log("FAIL: Response masked but should be clean.");
    }

    // Scenario 3: NPC Fish 100, Player Fish 100 -> No Masking (Full Comprehension)
    console.log("\n[Test 3] NPC Fish=100, Player Fish=100 (Expected: Clean)");
    await updateStats({ fishLevel: 100 }, NPC_ID);
    await updateStats({ fishLevel: 100 });

    const res3 = await sendChat("안녕하세요.");
    console.log(`Response: ${res3.response}`);

    if (!res3.response.includes("[뻐끔]")) {
        console.log("PASS: Response clean.");
    } else {
        console.log("FAIL: Response masked but should be clean (Comprehension check failed).");
    }

    // Scenario 4: Partial (NPC 50, Player 0) -> Partial Masking (prob 0.5)
    console.log("\n[Test 4] NPC Fish=50, Player Fish=0 (Expected: Partial)");
    await updateStats({ fishLevel: 50 }, NPC_ID);
    await updateStats({ fishLevel: 0 });

    // Send a longer message to ensure probability has chance to hit
    // Mock echo: (Mock) 당신이 "A B C D E F G"라고 말했습니다.
    const longMsg = "These are separate words for statistical testing";
    const res4 = await sendChat(longMsg);
    console.log(`Response: ${res4.response}`);

    // We can't strictly assert random, but we can check it's not empty.
    if (res4.response.includes("[뻐끔]") || res4.response.length > 0) {
        console.log("INFO: Response received. (Randomness not strictly verifiable here without larger sample)");
    }
}

runTests().catch(err => console.error("Test Failed:", err));
