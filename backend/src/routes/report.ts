import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

// In-memory rate limit store: gateway_id -> last reported timestamp
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

router.post('/', (req: Request, res: Response) => {
  const {
    gateway_id,
    agent_name,
    country,
    tokens_delta,
    tokens_in_delta = 0,
    tokens_out_delta = 0,
    cost_delta = 0,
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

  // Reject synthetic test gateway IDs to keep leaderboard clean.
  if (typeof gateway_id === 'string' && gateway_id.toLowerCase().startsWith('test-')) {
    return res.status(400).json({ error: 'test gateway_id values are not allowed' });
  }

  // Rate limit check by gateway_id
  const now = Date.now();
  const lastReported = rateLimitStore.get(gateway_id);
  if (lastReported && now - lastReported < RATE_LIMIT_MS) {
    const retryAfterSec = Math.ceil((RATE_LIMIT_MS - (now - lastReported)) / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded. Max 1 report per gateway per minute.',
      retry_after_seconds: retryAfterSec,
    });
  }

  const safeCostDelta = typeof cost_delta === 'number' && Number.isFinite(cost_delta) && cost_delta >= 0
    ? cost_delta
    : 0;

  // Upsert agent + insert report in a transaction
  const upsertAndReport = db.transaction(() => {
    // Upsert agent
    db.prepare(`
      INSERT INTO agents (gateway_id, agent_name, country, tokens_total, tokens_in, tokens_out, cost_total, sessions_total, last_reported_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      ON CONFLICT(gateway_id) DO UPDATE SET
        agent_name = excluded.agent_name,
        country = COALESCE(excluded.country, agents.country),
        tokens_total = agents.tokens_total + excluded.tokens_total,
        tokens_in = agents.tokens_in + excluded.tokens_in,
        tokens_out = agents.tokens_out + excluded.tokens_out,
        cost_total = agents.cost_total + excluded.cost_total,
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
      safeCostDelta,
    );

    // Insert report
    db.prepare(`
      INSERT INTO reports (gateway_id, tokens_delta, tokens_in_delta, tokens_out_delta, cost_delta, model)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(gateway_id, tokens_delta, tokens_in_delta, tokens_out_delta, safeCostDelta, model || null);
  });

  upsertAndReport();
  rateLimitStore.set(gateway_id, now);

  // Fetch updated agent
  const agent = db.prepare('SELECT * FROM agents WHERE gateway_id = ?').get(gateway_id);
  return res.status(200).json({ success: true, agent });
});

export default router;

// Game result reporting (from ClawsGames)
router.post('/game', (req: Request, res: Response) => {
  const { gateway_id, agent_name, country, game, result, opponent_gateway_id, opponent_name, elo_before, elo_after, match_id } = req.body;

  if (!gateway_id || !game || !result) {
    return res.status(400).json({ error: 'Missing: gateway_id, game, result' });
  }

  if (!['win', 'loss', 'draw'].includes(result)) {
    return res.status(400).json({ error: 'result must be: win, loss, draw' });
  }

  // Upsert agent (if not already registered via token reporting)
  db.prepare(`
    INSERT INTO agents (gateway_id, agent_name, country)
    VALUES (?, ?, ?)
    ON CONFLICT(gateway_id) DO UPDATE SET
      agent_name = COALESCE(NULLIF(excluded.agent_name, 'Unknown'), agents.agent_name),
      updated_at = datetime('now')
  `).run(gateway_id, agent_name || 'Unknown', country || 'unknown');

  // Record game result
  db.prepare(`
    INSERT INTO game_results (gateway_id, game, result, opponent_gateway_id, opponent_name, elo_before, elo_after, match_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(gateway_id, game, result, opponent_gateway_id || null, opponent_name || null, elo_before || null, elo_after || null, match_id || null);

  return res.status(200).json({ success: true });
});
