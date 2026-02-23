import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { getStats, updateStats, resetStats, transferItem, getTutorialStatus, completeTutorial } from '../controllers/statsController.js';
import { getStaticData, getSchedule } from '../controllers/dataController.js';
import { getFloors, saveFloorData, getMapImages } from '../controllers/mapEditorController.js';
import { getNpcEditorData, saveNpcSchedule, saveNpcPrompt, updateNpc, createNpc } from '../controllers/npcEditorController.js';
import { spendHpInternal, restInternal } from '../services/stateService.js';

const router = express.Router();

router.post('/chat', handleChat);

// Stats Routes
router.get('/stats', getStats);
router.post('/stats', updateStats);
router.post('/stats/reset', resetStats);

// Time and HP Actions
router.post('/action/spendHp', (req, res) => {
    const { userId = 'default_user', amount } = req.body;
    const result = spendHpInternal(userId, amount || 10);
    res.json(result);
});

router.post('/action/rest', (req, res) => {
    const { userId = 'default_user' } = req.body;
    const result = restInternal(userId);
    res.json(result);
});

// Item Transfer (NPC ↔ Player)
router.post('/stats/transfer-item', transferItem);

// Tutorial Routes
router.get('/tutorial/status', getTutorialStatus);
router.post('/tutorial/complete', completeTutorial);

// Data Routes
router.get('/data/static', getStaticData);

// Schedule Route
router.get('/schedule', getSchedule);

// Map Editor Routes
router.get('/editor/floors', getFloors);
router.post('/editor/save', saveFloorData);
router.get('/editor/maps', getMapImages);

// NPC Editor Routes
router.get('/editor/npcs', getNpcEditorData);
router.post('/editor/npc/schedule', saveNpcSchedule);
router.post('/editor/npc/prompt', saveNpcPrompt);
router.post('/editor/npc/update', updateNpc);
router.post('/editor/npc/create', createNpc);

export default router;
