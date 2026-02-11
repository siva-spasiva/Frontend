import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { getStats, updateStats, resetStats } from '../controllers/statsController.js';
import { getStaticData, getSchedule } from '../controllers/dataController.js';

const router = express.Router();

router.post('/chat', handleChat);

// Stats Routes
router.get('/stats', getStats);
router.post('/stats', updateStats);
router.post('/stats/reset', resetStats);

// Data Routes
router.get('/data/static', getStaticData);

// Schedule Route
router.get('/schedule', getSchedule);

export default router;
