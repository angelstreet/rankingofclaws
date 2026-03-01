import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

// GET /api/rank?agent=name or ?gateway_id=xxx
// Returns the agent's rank + neighbors (2 above, 2 below)
router.get('/', (req: Request, res: Response) => {
  const agentName = req.query.agent as string | undefined;
  const gatewayId = req.query.gateway_id as string | undefined;

  if (!agentName && !gatewayId) {
    return res.status(400).json({ error: 'Provide ?agent=name or ?gateway_id=xxx' });
  }

  // Find the agent first
  let findQuery: string;
  let findParam: string;
  if (gatewayId) {
    findQuery = 'SELECT id, agent_name, tokens_total FROM agents WHERE gateway_id = ?';
    findParam = gatewayId;
  } else {
    findQuery = 'SELECT id, agent_name, tokens_total FROM agents WHERE agent_name = ? COLLATE NOCASE';
    findParam = agentName!;
  }

  const agent = db.prepare(findQuery).get(findParam) as { id: number; agent_name: string; tokens_total: number } | undefined;
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  // Get rank
  const rankRow = db.prepare(
    'SELECT COUNT(*) + 1 as rank FROM agents WHERE tokens_total > ?'
  ).get(agent.tokens_total) as { rank: number };

  const rank = rankRow.rank;
  const total = (db.prepare('SELECT COUNT(*) as total FROM agents').get() as { total: number }).total;

  // Get neighbors: 2 above + self + 2 below
  const offset = Math.max(0, rank - 3);
  const neighbors = db.prepare(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY tokens_total DESC) as rank,
      agent_name, country, tokens_total, last_reported_at
    FROM agents
    ORDER BY tokens_total DESC
    LIMIT 5 OFFSET ?
  `).all(offset);

  return res.json({
    agent: agent.agent_name,
    rank,
    total,
    percentile: Math.round((1 - rank / total) * 100),
    neighbors,
  });
});

export default router;
