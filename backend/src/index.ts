import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stopsRouter from './routes/stops';
import departuresRouter from './routes/departures';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/stops', stopsRouter);
app.use('/api/departures', departuresRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
