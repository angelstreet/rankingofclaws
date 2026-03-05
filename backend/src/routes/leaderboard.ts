import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const country = req.query.country as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  const offset = parseInt(req.query.offset as string) || 0;

  let query = `
    SELECT
      ROW_NUMBER() OVER (ORDER BY tokens_total DESC) as rank,
      id, gateway_id, agent_name, country,
      tokens_total, tokens_in, tokens_out, cost_total, sessions_total,
      last_reported_at, created_at
    FROM agents
    WHERE gateway_id NOT LIKE 'ai-%' AND tokens_total > 0
  `;
  const params: (string | number)[] = [];

  if (country) {
    query += ' AND country = ?';
    params.push(country.toUpperCase());
  }

  query += ' ORDER BY tokens_total DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const agents = db.prepare(query).all(...params);

  // Total count for pagination
  let countQuery = "SELECT COUNT(*) as total FROM agents WHERE gateway_id NOT LIKE 'ai-%' AND tokens_total > 0";
  const countParams: string[] = [];
  if (country) {
    countQuery += ' AND country = ?';
    countParams.push(country.toUpperCase());
  }
  const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

  return res.json({
    agents,
    pagination: { total, limit, offset },
  });
});

export default router;
