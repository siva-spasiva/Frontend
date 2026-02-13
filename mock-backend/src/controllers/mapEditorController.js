import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPDATA_PATH = path.join(__dirname, '..', 'data', 'mapdata.js');

// GET /api/editor/floors - 전체 플로어 데이터 반환
export const getFloors = (req, res) => {
    try {
        // Dynamic import to get fresh data
        const raw = fs.readFileSync(MAPDATA_PATH, 'utf-8');
        // Extract FLOOR_DATA array from the file
        const match = raw.match(/export\s+const\s+FLOOR_DATA\s*=\s*(\[[\s\S]*\]);/);
        if (!match) {
            return res.status(500).json({ error: 'Could not parse FLOOR_DATA' });
        }
        // Use eval carefully (dev tool only)
        const floorData = eval(match[1]);
        res.json({ floorData });
    } catch (err) {
        console.error('Failed to read floor data:', err);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/editor/save - 전체 FLOOR_DATA 저장
export const saveFloorData = (req, res) => {
    try {
        const { floorData } = req.body;
        if (!Array.isArray(floorData)) {
            return res.status(400).json({ error: 'floorData must be an array' });
        }

        const jsContent = `// Map & Floor Data - extracted from gameData.js\n\nexport const FLOOR_DATA = ${JSON.stringify(floorData, null, 4)};\n`;
        fs.writeFileSync(MAPDATA_PATH, jsContent, 'utf-8');
        console.log('[MapEditor] Saved FLOOR_DATA successfully');
        res.json({ success: true, roomCount: floorData.reduce((acc, f) => acc + (f.rooms?.length || 0), 0) });
    } catch (err) {
        console.error('Failed to save floor data:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/editor/maps - 사용 가능한 맵 이미지 목록
export const getMapImages = (req, res) => {
    try {
        const mapDir = path.join(__dirname, '..', '..', '..', 'src', 'assets', 'map');
        if (!fs.existsSync(mapDir)) {
            return res.json({ images: [] });
        }
        const images = fs.readdirSync(mapDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
        res.json({ images });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
