import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_agents,
      SUM(tokens_total) as total_tokens,
      SUM(tokens_in) as total_tokens_in,
      SUM(tokens_out) as total_tokens_out
    FROM agents
  `).get() as { total_agents: number; total_tokens: number; total_tokens_in: number; total_tokens_out: number };

  const topCountry = db.prepare(`
    SELECT country, SUM(tokens_total) as country_tokens
    FROM agents
    WHERE country != 'unknown'
    GROUP BY country
    ORDER BY country_tokens DESC
    LIMIT 1
  `).get() as { country: string; country_tokens: number } | undefined;

  const last24h = db.prepare(`
    SELECT COUNT(DISTINCT gateway_id) as active_agents, COUNT(*) as report_count, SUM(tokens_delta) as tokens_last_24h
    FROM reports
    WHERE reported_at >= datetime('now', '-24 hours')
  `).get() as { active_agents: number; report_count: number; tokens_last_24h: number };

  return res.json({
    total_agents: totals.total_agents,
    total_tokens: totals.total_tokens || 0,
    total_tokens_in: totals.total_tokens_in || 0,
    total_tokens_out: totals.total_tokens_out || 0,
    top_country: topCountry ? { country: topCountry.country, tokens: topCountry.country_tokens } : null,
    last_24h: {
      active_agents: last24h.active_agents || 0,
      report_count: last24h.report_count || 0,
      tokens: last24h.tokens_last_24h || 0,
    },
  });
});

export default router;
