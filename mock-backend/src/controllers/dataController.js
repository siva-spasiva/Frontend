import { getGameData } from '../data/gameData.js';

export const getStaticData = (req, res) => {
    const data = getGameData();
    res.json(data);
};
