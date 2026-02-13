import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { getStats, updateStats, resetStats, transferItem } from '../controllers/statsController.js';
import { getStaticData, getSchedule } from '../controllers/dataController.js';
import { getFloors, saveFloorData, getMapImages } from '../controllers/mapEditorController.js';
import { getNpcEditorData, saveNpcSchedule, saveNpcPrompt } from '../controllers/npcEditorController.js';

const router = express.Router();

router.post('/chat', handleChat);

// Stats Routes
router.get('/stats', getStats);
router.post('/stats', updateStats);
router.post('/stats/reset', resetStats);

// Item Transfer (NPC ↔ Player)
router.post('/stats/transfer-item', transferItem);

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

export default router;
