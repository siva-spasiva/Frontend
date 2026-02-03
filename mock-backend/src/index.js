import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('UMI Protocol Mock Backend is running.');
});

app.listen(PORT, () => {
    console.log(`Mock Server running on port ${PORT}`);
    const mode = process.env.USE_OLLAMA === 'true' ? 'Real AI (Ollama)' : 'Standalone Mock';
    console.log(`- Mode: ${mode}`);
    console.log(`- Endpoint: http://localhost:${PORT}`);
});
