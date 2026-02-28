import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

// In-memory rate limit store: gateway_id -> last reported timestamp
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

router.post('/', (req: Request, res: Response) => {
  const {
    gateway_id,
    agent_name,
    country,
    tokens_delta,
    tokens_in_delta = 0,
    tokens_out_delta = 0,
    model,
  } = req.body;

  // Validate required fields
  if (!gateway_id || !agent_name || tokens_delta === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: gateway_id, agent_name, tokens_delta',
    });
  }

  if (typeof tokens_delta !== 'number' || tokens_delta < 0) {
    return res.status(400).json({ error: 'tokens_delta must be a non-negative number' });
  }

  // Rate limit check by gateway_id
  const now = Date.now();
  const lastReported = rateLimitStore.get(gateway_id);
  if (lastReported && now - lastReported < RATE_LIMIT_MS) {
    const retryAfterSec = Math.ceil((RATE_LIMIT_MS - (now - lastReported)) / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded. Max 1 report per gateway per hour.',
      retry_after_seconds: retryAfterSec,
    });
  }

  // Upsert agent + insert report in a transaction
  const upsertAndReport = db.transaction(() => {
    // Upsert agent
    db.prepare(`
      INSERT INTO agents (gateway_id, agent_name, country, tokens_total, tokens_in, tokens_out, sessions_total, last_reported_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      ON CONFLICT(gateway_id) DO UPDATE SET
        agent_name = excluded.agent_name,
        country = COALESCE(excluded.country, agents.country),
        tokens_total = agents.tokens_total + excluded.tokens_total,
        tokens_in = agents.tokens_in + excluded.tokens_in,
        tokens_out = agents.tokens_out + excluded.tokens_out,
        sessions_total = agents.sessions_total + 1,
        last_reported_at = datetime('now'),
        updated_at = datetime('now')
    `).run(
      gateway_id,
      agent_name,
      country || 'unknown',
      tokens_delta,
      tokens_in_delta,
      tokens_out_delta,
    );

    // Insert report
    db.prepare(`
      INSERT INTO reports (gateway_id, tokens_delta, tokens_in_delta, tokens_out_delta, model)
      VALUES (?, ?, ?, ?, ?)
    `).run(gateway_id, tokens_delta, tokens_in_delta, tokens_out_delta, model || null);
  });

  upsertAndReport();
  rateLimitStore.set(gateway_id, now);

  // Fetch updated agent
  const agent = db.prepare('SELECT * FROM agents WHERE gateway_id = ?').get(gateway_id);
  return res.status(200).json({ success: true, agent });
});

export default router;
