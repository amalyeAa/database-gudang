import express from 'express';
import dotenv from 'dotenv';
import { pool } from './db/pool.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server Inventaris Gudang jalan!' });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ status: 'DB Connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'DB Error', error: (error as Error).message });
  }
});

// Semua API di bawah /api
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});