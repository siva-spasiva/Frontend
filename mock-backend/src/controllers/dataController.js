import { getGameData } from '../data/gameData.js';
import { getAllNpcLocations, getNpcsInRoom, getScheduleData } from '../data/npcSchedule.js';

export const getStaticData = (req, res) => {
    const data = getGameData();
    // Include full schedule data for frontend
    data.scheduleData = getScheduleData();
    res.json(data);
};

/**
 * GET /api/schedule?day=1&period=morning[&roomId=cafeteria]
 * roomId 있으면 해당 방의 NPC 목록, 없으면 전체 NPC 위치 맵
 */
export const getSchedule = (req, res) => {
    const { day = 0, period = 'morning', roomId } = req.query;
    const dayNum = parseInt(day);

    if (roomId) {
        const npcs = getNpcsInRoom(dayNum, period, roomId);
        res.json({ day: dayNum, period, roomId, npcs });
    } else {
        const locations = getAllNpcLocations(dayNum, period);
        res.json({ day: dayNum, period, locations });
    }
};
