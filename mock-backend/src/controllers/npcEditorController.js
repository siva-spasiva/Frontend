import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMEDATA_PATH = path.join(__dirname, '..', 'data', 'gameData.js');
const SCHEDULE_PATH = path.join(__dirname, '..', 'data', 'npcSchedule.js');
const ITEMS_PATH = path.join(__dirname, '..', 'data', 'items.js');
const PROMPTS_PATH = path.join(__dirname, '..', 'utils', 'prompts.js');

// GET /api/editor/npcs - NPC 원본 데이터 + 프롬프트 + 스케줄 반환
export const getNpcEditorData = (req, res) => {
    try {
        // Read prompts
        const promptsRaw = fs.readFileSync(PROMPTS_PATH, 'utf-8');
        const promptExports = {};
        const promptRegex = /export\s+const\s+(\w+)\s*=\s*`([\s\S]*?)`;/g;
        let match;
        while ((match = promptRegex.exec(promptsRaw)) !== null) {
            promptExports[match[1]] = match[2];
        }

        // Read schedule
        const scheduleRaw = fs.readFileSync(SCHEDULE_PATH, 'utf-8');
        const scheduleMatch = scheduleRaw.match(/const\s+NPC_SCHEDULE\s*=\s*(\{[\s\S]*?\n\};)/);
        let scheduleData = {};
        if (scheduleMatch) {
            try { scheduleData = eval('(' + scheduleMatch[1].replace(/\};$/, '}') + ')'); } catch (e) { console.error('Schedule parse error:', e); }
        }

        // Read items
        const itemsRaw = fs.readFileSync(ITEMS_PATH, 'utf-8');
        const itemsMatch = itemsRaw.match(/export\s+const\s+ITEM_DEFINITIONS\s*=\s*(\{[\s\S]*\});/);
        let itemData = {};
        if (itemsMatch) {
            try { itemData = eval('(' + itemsMatch[1] + ')'); } catch (e) { console.error('Items parse error:', e); }
        }

        // Read NPC_DATA from gameData.js
        const gameDataRaw = fs.readFileSync(GAMEDATA_PATH, 'utf-8');
        const npcMatch = gameDataRaw.match(/const\s+NPC_DATA\s*=\s*(\{[\s\S]*?\n\};)/);
        let npcRawData = {};
        if (npcMatch) {
            // We can't eval this because it references PROMPTS.*
            // Instead, parse the structure and inject prompt names
            const npcBlock = npcMatch[1];
            // Extract each NPC block
            const npcIdRegex = /(\w+):\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
            let m;
            while ((m = npcIdRegex.exec(npcBlock)) !== null) {
                const npcId = m[1];
                const body = m[2];

                const npc = { id: npcId };

                // Extract name
                const nameMatch = body.match(/name:\s*'([^']*)'/);
                if (nameMatch) npc.name = nameMatch[1];

                // Extract prompt reference (legacy: prompt: PROMPTS.X)
                const promptMatch = body.match(/prompt:\s*PROMPTS\.(\w+)/);
                if (promptMatch) npc.promptKey = promptMatch[1];

                // Extract new unified prompts structure: prompts.friendly.{TIER|DEFAULT}
                const allPromptRefs = [...body.matchAll(/(\w+):\s*PROMPTS\.(\w+)/g)];
                const friendlyTiers = {};
                allPromptRefs.forEach(tm => {
                    if (['BAD', 'NORMAL', 'GOOD', 'PERFECT', 'DEFAULT'].includes(tm[1])) {
                        friendlyTiers[tm[1]] = tm[2];
                    }
                });
                if (Object.keys(friendlyTiers).length > 0) {
                    npc.prompts = { friendly: friendlyTiers };
                }

                // Legacy fallback: Extract promptTiers (old format)
                if (!npc.prompts) {
                    const tierMatches = [...body.matchAll(/(\w+):\s*PROMPTS\.(\w+)/g)];
                    const tiers = {};
                    tierMatches.forEach(tm => {
                        if (['BAD', 'NORMAL', 'GOOD', 'PERFECT'].includes(tm[1])) {
                            tiers[tm[1]] = tm[2];
                        }
                    });
                    if (Object.keys(tiers).length > 0) npc.promptTiers = tiers;
                }

                // Extract initialStats
                const statsMatch = body.match(/initialStats:\s*\{([^}]+)\}/);
                if (statsMatch) {
                    const statsBody = statsMatch[1];
                    npc.initialStats = {};
                    const statPairs = [...statsBody.matchAll(/(\w+):\s*(\d+)/g)];
                    statPairs.forEach(sp => { npc.initialStats[sp[1]] = parseInt(sp[2]); });
                }

                // Extract initialInventory
                const invMatch = body.match(/initialInventory:\s*\[([^\]]*)\]/);
                if (invMatch) {
                    npc.initialInventory = invMatch[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
                }

                // Extract portraits
                const portraitMatch = body.match(/portraits:\s*\{([^}]+)\}/);
                if (portraitMatch) {
                    npc.portraits = {};
                    const pPairs = [...portraitMatch[1].matchAll(/(\w+):\s*'([^']+)'/g)];
                    pPairs.forEach(pp => { npc.portraits[pp[1]] = pp[2]; });
                }

                // initialPortrait
                const ipMatch = body.match(/initialPortrait:\s*'([^']+)'/);
                if (ipMatch) npc.initialPortrait = ipMatch[1];

                // apiConfig
                const apiMatch = body.match(/model:\s*'([^']+)'/);
                if (apiMatch) npc.apiModel = apiMatch[1];

                npcRawData[npcId] = npc;
            }
        }

        res.json({
            npcs: npcRawData,
            prompts: promptExports,
            schedule: scheduleData,
            items: itemData,
        });
    } catch (err) {
        console.error('NPC editor data error:', err);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/editor/npc/schedule - 스케줄 저장
export const saveNpcSchedule = (req, res) => {
    try {
        const { schedule } = req.body;
        if (!schedule || typeof schedule !== 'object') {
            return res.status(400).json({ error: 'Invalid schedule data' });
        }

        const lines = [
            '/**',
            ' * NPC 스케줄 컨트롤러 — 중앙 집중 관리',
            ' * ',
            ' * 구조: { npcId: { day: { period: roomId } } }',
            ' * - day: 0(튜토리얼) ~ 7(최종일)',
            " * - period: 'morning' | 'afternoon' | 'evening'",
            ' * - roomId: gameData.js FLOOR_DATA의 room.id와 매칭',
            ' * ',
            " * 'default' 키: 특정 일차에 일정이 없으면 default 일정 사용",
            ' * null: 해당 시간대에 맵에 등장하지 않음 (부재)',
            ' */',
            '',
            `const NPC_SCHEDULE = ${JSON.stringify(schedule, null, 4)};`,
            '',
            '',
            '// Helper Functions',
            'export const getNpcLocation = (day, period, npcId) => {',
            '    const schedule = NPC_SCHEDULE[npcId];',
            '    if (!schedule) return null;',
            '    const daySchedule = schedule[day] ?? schedule.default;',
            '    if (!daySchedule) return null;',
            '    return daySchedule[period] ?? null;',
            '};',
            '',
            'export const getNpcsInRoom = (day, period, roomId) => {',
            '    const npcsInRoom = [];',
            '    for (const npcId in NPC_SCHEDULE) {',
            '        const location = getNpcLocation(day, period, npcId);',
            '        if (location === roomId) npcsInRoom.push(npcId);',
            '    }',
            '    return npcsInRoom;',
            '};',
            '',
            'export const getAllNpcLocations = (day, period) => {',
            '    const locations = {};',
            '    for (const npcId in NPC_SCHEDULE) {',
            '        locations[npcId] = getNpcLocation(day, period, npcId);',
            '    }',
            '    return locations;',
            '};',
            '',
            'export const getScheduleData = () => NPC_SCHEDULE;',
            '',
            'export default NPC_SCHEDULE;',
            '',
        ];

        fs.writeFileSync(SCHEDULE_PATH, lines.join('\n'), 'utf-8');
        console.log('[NPC Editor] Schedule saved');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/editor/npc/prompt - 프롬프트 저장
export const saveNpcPrompt = (req, res) => {
    try {
        const { promptKey, promptText } = req.body;
        if (!promptKey || typeof promptText !== 'string') {
            return res.status(400).json({ error: 'Invalid prompt data' });
        }

        let content = fs.readFileSync(PROMPTS_PATH, 'utf-8');
        const regex = new RegExp(`(export\\s+const\\s+${promptKey}\\s*=\\s*\`)([\\s\\S]*?)(\`;)`, 'm');

        if (regex.test(content)) {
            content = content.replace(regex, `$1${promptText}$3`);
            fs.writeFileSync(PROMPTS_PATH, content, 'utf-8');
            console.log(`[NPC Editor] Prompt '${promptKey}' saved`);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: `Prompt '${promptKey}' not found` });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/editor/npc/update - NPC 이름, 인벤토리 등 수정
export const updateNpc = (req, res) => {
    try {
        const { npcId, updates } = req.body;
        if (!npcId || !updates) {
            return res.status(400).json({ error: 'Missing npcId or updates' });
        }

        let content = fs.readFileSync(GAMEDATA_PATH, 'utf-8');

        // Update name
        if (updates.name !== undefined) {
            // Match: npcId: { ... name: 'xxx' ... }
            const nameRegex = new RegExp(`(${npcId}:\\s*\\{[^}]*?)name:\\s*'[^']*'`);
            if (nameRegex.test(content)) {
                content = content.replace(nameRegex, `$1name: '${updates.name}'`);
            }
        }

        // Update initialInventory
        if (updates.initialInventory !== undefined) {
            const items = updates.initialInventory;
            const itemsStr = items.map(i => `'${i}'`).join(', ');

            // Try to replace existing initialInventory
            const invRegex = new RegExp(`(${npcId}:\\s*\\{[\\s\\S]*?)initialInventory:\\s*\\[[^\\]]*\\]`);
            if (invRegex.test(content)) {
                content = content.replace(invRegex, `$1initialInventory: [${itemsStr}]`);
            } else if (items.length > 0) {
                // Add initialInventory before apiConfig or closing brace
                const addInvRegex = new RegExp(`(${npcId}:\\s*\\{[\\s\\S]*?)(\\s*apiConfig:|\\s*\\},)`);
                if (addInvRegex.test(content)) {
                    content = content.replace(addInvRegex, `$1\n        initialInventory: [${itemsStr}],$2`);
                }
            }
        }

        fs.writeFileSync(GAMEDATA_PATH, content, 'utf-8');
        console.log(`[NPC Editor] NPC '${npcId}' updated:`, Object.keys(updates));
        res.json({ success: true });
    } catch (err) {
        console.error('NPC update error:', err);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/editor/npc/create - 새 NPC 추가
export const createNpc = (req, res) => {
    try {
        const { npcId, name, promptType } = req.body;
        if (!npcId || !name) {
            return res.status(400).json({ error: 'Missing npcId or name' });
        }

        // Validate npcId format (lowercase, alphanumeric + underscore)
        if (!/^[a-z][a-z0-9_]*$/.test(npcId)) {
            return res.status(400).json({ error: 'npcId는 소문자 영문으로 시작하며, 소문자/숫자/밑줄만 사용 가능합니다.' });
        }

        let content = fs.readFileSync(GAMEDATA_PATH, 'utf-8');

        // Check if NPC already exists
        const existsRegex = new RegExp(`\\b${npcId}:\\s*\\{`);
        if (existsRegex.test(content)) {
            return res.status(409).json({ error: `NPC '${npcId}'이(가) 이미 존재합니다.` });
        }

        // Generate prompt key(s)
        const upperNpcId = npcId.toUpperCase();
        let promptBlock;
        let newPrompts = '';

        if (promptType === 'tiered') {
            // Create 4-tier prompts
            const tiers = ['BAD', 'NORMAL', 'GOOD', 'PERFECT'];
            const promptKeys = tiers.map(t => `${upperNpcId}_PROMPT_${t}`);

            promptBlock = `prompts: {
            friendly: {
                BAD: PROMPTS.${promptKeys[0]},         // 0-19
                NORMAL: PROMPTS.${promptKeys[1]},   // 20-45
                GOOD: PROMPTS.${promptKeys[2]},       // 46-75
                PERFECT: PROMPTS.${promptKeys[3]},  // 76-100
            },
        },`;

            // Create prompt exports
            newPrompts = tiers.map(t =>
                `\nexport const ${upperNpcId}_PROMPT_${t} = \`\n[${name} - ${t} Tier Prompt]\n여기에 프롬프트를 작성하세요.\n\`;`
            ).join('\n');
        } else {
            // Single DEFAULT prompt
            const promptKey = `${upperNpcId}_PROMPT`;
            promptBlock = `prompts: {
            friendly: {
                DEFAULT: PROMPTS.${promptKey},
            },
        },`;
            newPrompts = `\nexport const ${promptKey} = \`\n[${name} Prompt]\n여기에 프롬프트를 작성하세요.\n\`;`;
        }

        // Build NPC block
        const npcBlock = `\n    ${npcId}: {
        id: '${npcId}',
        name: '${name}',
        ${promptBlock}
    },`;

        // Insert before closing }; of NPC_DATA
        // Find the last NPC entry and insert after it
        const insertPos = content.lastIndexOf('\n};');
        if (insertPos === -1) {
            return res.status(500).json({ error: 'Cannot find NPC_DATA closing bracket' });
        }
        content = content.substring(0, insertPos) + npcBlock + content.substring(insertPos);

        fs.writeFileSync(GAMEDATA_PATH, content, 'utf-8');

        // Add prompts to prompts.js
        let promptsContent = fs.readFileSync(PROMPTS_PATH, 'utf-8');
        promptsContent += newPrompts + '\n';
        fs.writeFileSync(PROMPTS_PATH, promptsContent, 'utf-8');

        console.log(`[NPC Editor] NPC '${npcId}' created (${promptType || 'single'})`);
        res.json({ success: true, npcId });
    } catch (err) {
        console.error('NPC create error:', err);
        res.status(500).json({ error: err.message });
    }
};
