import * as PROMPTS from '../utils/prompts.js';
import { generateAIResponse } from '../services/aiService.js';
import { getState, updateGlobalState, getNpcState, updateNpcState } from '../services/stateService.js';
import { NPC_DATA } from '../data/gameData.js';
import { getFishTier, getMaskingRate } from '../utils/fishLevelUtils.js';

// Helper: Determine friendly tier for tiered prompt selection
const getFriendlyTier = (friendly) => {
    if (friendly <= 19) return 'BAD';
    if (friendly <= 45) return 'NORMAL';
    if (friendly <= 75) return 'GOOD';
    return 'PERFECT';
};

// Helper to get prompt by npcId (supports per-stat tiered prompts)
const getPromptForNpc = (npcId, npcStats = {}) => {
    const npc = NPC_DATA[npcId];
    if (!npc) return PROMPTS.DETECTIVE_KANG_PROMPT;

    // New unified prompts structure: prompts.friendly.{TIER|DEFAULT}
    if (npc.prompts?.friendly) {
        const friendlyPrompts = npc.prompts.friendly;
        // If has tiered prompts (BAD/NORMAL/GOOD/PERFECT)
        if (friendlyPrompts.BAD || friendlyPrompts.NORMAL || friendlyPrompts.GOOD || friendlyPrompts.PERFECT) {
            const tier = getFriendlyTier(npcStats.friendly ?? 50);
            console.log(`[Prompt Tier] NPC: ${npcId}, Friendly: ${npcStats.friendly}, Tier: ${tier}`);
            return friendlyPrompts[tier] || friendlyPrompts.DEFAULT || PROMPTS.DETECTIVE_KANG_PROMPT;
        }
        // Single prompt via DEFAULT
        if (friendlyPrompts.DEFAULT) {
            return friendlyPrompts.DEFAULT;
        }
    }

    // Legacy fallback: promptTiers / prompt
    if (npc.promptTiers) {
        const tier = getFriendlyTier(npcStats.friendly ?? 50);
        return npc.promptTiers[tier] || npc.prompt || PROMPTS.DETECTIVE_KANG_PROMPT;
    }

    return npc.prompt || PROMPTS.DETECTIVE_KANG_PROMPT;
};

// Masking Logic — Tier 기반
const applyFishMasking = (text, npcFishLevel, playerFishLevel = 0) => {
    if (!text) return text;

    const npcTier = getFishTier(npcFishLevel);
    const playerTier = getFishTier(playerFishLevel);
    const maskProb = getMaskingRate(npcTier, playerTier);

    if (maskProb <= 0) return text;

    console.log(`[Masking] NPC Tier: ${npcTier}, Player Tier: ${playerTier}, Rate: ${(maskProb * 100).toFixed(0)}%`);

    return text.split(' ').map(token => {
        if (!token) return token;

        if (Math.random() < maskProb) {
            const match = token.match(/^(.+?)([.,!?~]+)$/);
            if (match) {
                return `[뻐끔]${match[2]}`;
            }
            return "[뻐끔]";
        }
        return token;
    }).join(' ');
};

export const handleChat = async (req, res) => {
    const { userId = 'default_user', message, npcId = 'npc_a', presentedItem = null } = req.body;

    // 1. Get NPC Logic (Stats)
    const npcStats = getNpcState(userId, npcId);

    // 2. Get User/Global Stats (if needed for context)
    const globalState = getState(userId).global;

    // 3. Get Prompt Template (tiered prompt 지원)
    let systemPrompt = getPromptForNpc(npcId, npcStats);

    // 4. Replace Placeholders with NPC Stats
    systemPrompt = systemPrompt.replace(/{current_stats\['Friendly'\]}/g, npcStats.friendly);
    systemPrompt = systemPrompt.replace(/{current_stats\['Faith'\]}/g, npcStats.faith);
    // Fish_Level removed from prompt injection
    // systemPrompt = systemPrompt.replace(/{current_stats\['Fish_Level'\]}/g, npcStats.fishLevel);

    // Standard placeholders
    systemPrompt = systemPrompt.replace(/{Friendly}/g, npcStats.friendly);
    systemPrompt = systemPrompt.replace(/{Faith}/g, npcStats.faith);
    // Fish_Level removed from prompt injection
    // systemPrompt = systemPrompt.replace(/{Fish_Level}/g, npcStats.fishLevel);

    // Handle {retrieved_lore} placeholder
    systemPrompt = systemPrompt.replace(/{retrieved_lore}/g, "특별한 정보 없음");

    // 5. Stat Instruction Logic based on NPC STATS
    let statInstruction = "";
    if (npcStats.faith >= 80) {
        statInstruction = "당신은 교주 전광어에 대한 신뢰가 절대적입니다. 유저의 모든 말을 교리적으로 해석하고 축복하세요.";
    } else if (npcStats.faith < 40 && npcStats.friendly >= 70) {
        statInstruction = "당신은 교단에 의구심을 느끼며 유저를 의지합니다. 교단의 비밀을 은밀히 흘리거나 탈출을 돕고 싶어 합니다.";
    } else if (npcStats.friendly < 30) {
        statInstruction = "당신은 유저를 불쾌한 이물질로 취급합니다. 매우 차갑고 서늘하게 대하며 곧 정화될 운명임을 경고하세요.";
    } else {
        statInstruction = "당신은 친절하지만 눈동자에 초점이 없는 기괴한 신도입니다.";
    }
    systemPrompt = systemPrompt.replace(/{stat_instruction}/g, statInstruction);

    // [New] Inject Player Stats for context
    // Only inject for Cultist NPCs (not friend_a)
    let playerStatsContext = "";
    if (npcId !== 'detective_kang') {
        playerStatsContext = `
[User Status]
- HP(체력): ${globalState.hp}/100
- FishLevel(변이도): ${globalState.fishLevel}% (높을수록 당신의 '뻐끔' 언어를 알아듣습니다)
- UmiLevel(신앙등급): ${globalState.umiLevel} (높을수록 교단 기밀에 접근할 권한이 있습니다)

// [Interaction Rule: Trust vs Friendly] - Trust removed
// (Trust is removed, so Friendly stands alone as the relationship metric)


// [Interaction Rule: Faith (관점의 차이)]
// 1. 변이(FishLevel) 관련 지침 삭제됨 (LLM에 전달하지 않음)

2. 호의(Friendly)의 목적성:
   - High Faith + High Friendly: 유저를 '구원(전도)'하려 합니다. 교단에 귀의시키는 것이 당신을 돕는 길이라 믿습니다.
   - Low Faith + High Friendly: 유저를 '탈출'시키려 합니다. 교단은 미쳤으니 도망쳐야 한다고 믿습니다.
`;
    }

    // [New] Inject Presented Item Context
    let presentedItemContext = "";
    if (presentedItem) {
        presentedItemContext = `
[ITEM PRESENTED - 아이템 제시됨]
플레이어가 당신에게 [${presentedItem.name}]을(를) 제시했습니다.
아이템 설명: ${presentedItem.description || '(설명 없음)'}
아이템 유형: ${presentedItem.type === 'transcript' ? '녹음된 대화 기록' : presentedItem.type === 'key_item' ? '핵심 아이템' : '일반 아이템'}
${presentedItem.type === 'transcript' && presentedItem.transcriptSummary ? `녹음 내용 요약: ${presentedItem.transcriptSummary}` : ''}

[제시 반응 지침]
- 이 아이템을 인식하고, 캐릭터답게 반응하세요.
- 아이템이 당신(${npcId})과 관련이 있다면 강하게 반응하세요.
- 관련이 없다면 미적지근하게 반응하거나 무관심하게 대응하세요.
- 반응은 SAY에 자연스럽게 녹여내세요.
`;
    }

    // Construct full prompt
    const fullPrompt = `${systemPrompt}\n${playerStatsContext}\n${presentedItemContext}\nUser: ${message}\nCharacter:`;


    try {
        const rawResponse = await generateAIResponse(fullPrompt);

        // Parse Response
        let thought = "";
        let newNpcStats = null;
        let say = rawResponse;

        // Extract THOUGHT
        const thoughtMatch = rawResponse.match(/THOUGHT:\s*([\s\S]*?)(?=UPDATED_STATS:|SAY:|$)/);
        if (thoughtMatch) thought = thoughtMatch[1].trim();

        // Extract UPDATED_STATS
        const statsMatch = rawResponse.match(/UPDATED_STATS:\s*({[\s\S]*?})/);
        if (statsMatch) {
            try {
                let jsonStr = statsMatch[1].trim();
                jsonStr = jsonStr.replace(/'/g, '"');
                const rawUpdates = JSON.parse(jsonStr);

                // Map PascalCase updates from AI back to camelCase for storage
                const cleanUpdates = {};
                for (const [key, val] of Object.entries(rawUpdates)) {
                    // Try to match specific known keys, else lowercase first char
                    if (key === 'Friendly') cleanUpdates.friendly = val;
                    else if (key === 'Faith') cleanUpdates.faith = val;
                    else if (key === 'Fish_Level') cleanUpdates.fishLevel = val; // This might be NPC or Player? 
                    // Warning: 'Fish_Level' is ambiguous if both have it. 
                    // Protocol: 'Fish_Level' -> NPC Stat. 'Player_Fish_Level' -> Player Stat?
                    // For now, assuming AI controls NPC stats mostly. 
                    // But if AI wants to damage player HP:
                    else if (key === 'Hp') cleanUpdates.hp = val; // Global
                    // else if (key === 'Trust') cleanUpdates.trust = val; // Removed
                    else if (key === 'Umi_Level') cleanUpdates.umiLevel = val; // Global
                    else {
                        // generic fallback
                        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                        cleanUpdates[camelKey] = val;
                    }
                }

                // Split updates into NPC and Global
                const npcUpdates = {};
                const globalUpdates = {};

                Object.keys(cleanUpdates).forEach(k => {
                    if (['friendly', 'faith'].includes(k)) {
                        npcUpdates[k] = cleanUpdates[k];
                    } else if (['hp', 'umiLevel'].includes(k)) {
                        globalUpdates[k] = cleanUpdates[k];
                    } else if (k === 'fishLevel') {
                        // FORCE IGNORE: Do not allow AI to update FishLevel.
                        // FishLevel is a manual/scenario stat, usually stable.
                        // AI tends to reset it to 0 if not instructed, breaking the masking.
                        // So we ignore AI's opinion on this stat.
                        console.log(`[Stats Protection] Ignoring AI's attempt to update FishLevel to ${cleanUpdates[k]}`);
                    } else {
                        // Unknown keys -> maybe NPC?
                        npcUpdates[k] = cleanUpdates[k];
                    }
                });

                if (Object.keys(npcUpdates).length > 0) {
                    newNpcStats = updateNpcState(userId, npcId, npcUpdates);
                }

                if (Object.keys(globalUpdates).length > 0) {
                    updateGlobalState(userId, globalUpdates); // Update global state
                }

            } catch (e) {
                console.warn("Failed to parse stats JSON:", statsMatch[1], e);
            }
        }

        // Extract SAY
        const sayMatch = rawResponse.match(/SAY:\s*([\s\S]*)/);
        if (sayMatch) {
            say = sayMatch[1].trim();
            if (say.startsWith('"') && say.endsWith('"')) {
                say = say.slice(1, -1);
            }
        } else {
            // Fallback cleanup
            let cleanText = rawResponse;
            if (thoughtMatch) cleanText = cleanText.replace(thoughtMatch[0], '');
            if (statsMatch) cleanText = cleanText.replace(statsMatch[0], '');
            cleanText = cleanText.replace('THOUGHT:', '').replace('UPDATED_STATS:', '').trim();
            if (cleanText) say = cleanText;
        }

        // ... existing parse logic ...

        // 6. Apply Masking based on UPDATED fishLevel
        // Use new stats if updated, else current
        const currentNpcFishLevel = newNpcStats ? newNpcStats.fishLevel : npcStats.fishLevel;
        const playerFishLevel = globalState.fishLevel || 0; // Use global player stat

        console.log(`[DEBUG Masking] NPC Fish: ${npcStats.fishLevel} -> ${currentNpcFishLevel} (AI New Stats: ${!!newNpcStats})`);
        console.log(`[DEBUG Masking] Player Fish: ${playerFishLevel}`);

        say = applyFishMasking(say, currentNpcFishLevel, playerFishLevel);

        // ... existing res.json ...
        res.json({
            response: say,
            thought: thought,
            updatedStats: newNpcStats || npcStats,
            currentStats: { ...globalState, npc: npcStats }, // Debug info
            debug: { // Add extra debug to response
                rawAI: rawResponse,
                npcFishOriginal: npcStats.fishLevel,
                npcFishFinal: currentNpcFishLevel
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "AI processing failed", details: error.message });
    }
};
