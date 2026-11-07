import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()), credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', service: 'MY WALLET API', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'disconnected' }); }
});
app.use('/api', apiRoutes);
app.use((req, res) => res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (['ECONNREFUSED','ER_BAD_DB_ERROR','ER_ACCESS_DENIED_ERROR','ER_NO_SUCH_TABLE','PROTOCOL_CONNECTION_LOST'].includes(err.code)) {
    return res.status(503).json({ message: 'Base MySQL indisponible. Démarrez MySQL, importez backend/database/my_wallet.sql et vérifiez backend/.env.' });
  }
  const status = err.status || (err.code === 'ER_DUP_ENTRY' ? 409 : 500);
  res.status(status).json({ message: status === 500 ? 'Erreur interne du serveur.' : err.message });
});
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`MY WALLET API démarrée : http://localhost:${port}/api`));
