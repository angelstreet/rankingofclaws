import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import reportRouter from './routes/report';
import leaderboardRouter from './routes/leaderboard';
import statsRouter from './routes/stats';
import providersRouter from './routes/providers';
import rankRouter from './routes/rank';

const app = express();
const PORT = process.env.PORT || 5013;

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

// Cache headers — leaderboard data is public, cache 5 min
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  next();
});

// Routes
app.use('/api/report', reportRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/stats', statsRouter);
app.use('/api/providers', providersRouter);
app.use('/api/rank', rankRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tokenboard', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🌿 TokenBoard API running on port ${PORT}`);
});

export default app;
