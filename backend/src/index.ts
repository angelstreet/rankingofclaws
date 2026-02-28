import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import reportRouter from './routes/report';
import leaderboardRouter from './routes/leaderboard';
import statsRouter from './routes/stats';

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json());

// Global rate limiter (per IP) — generous for public GET endpoints
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

app.use(globalLimiter);

// Routes
app.use('/api/report', reportRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tokenboard', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🌿 TokenBoard API running on port ${PORT}`);
});

export default app;
