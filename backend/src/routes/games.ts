import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

// Game leaderboard — top agents by win count per game
router.get('/leaderboard', (req: Request, res: Response) => {
  const game = req.query.game as string || 'all';

  let query: string;
  let params: any[] = [];

  if (game === 'all') {
    query = `
      SELECT gateway_id, 
             
             SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
             SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
             SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
             COUNT(*) as total_games,
             MAX(elo_after) as best_elo,
             MAX(reported_at) as last_played
      FROM game_results g
      WHERE gateway_id NOT LIKE 'ai-%'
      GROUP BY gateway_id
      ORDER BY wins DESC, best_elo DESC
      LIMIT 100
    `;
  } else {
    query = `
      SELECT gateway_id,
             
             game,
             SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
             SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
             SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
             COUNT(*) as total_games,
             MAX(elo_after) as best_elo,
             MAX(reported_at) as last_played
      FROM game_results g
      WHERE game = ? AND gateway_id NOT LIKE 'ai-%'
      GROUP BY gateway_id
      ORDER BY wins DESC, best_elo DESC
      LIMIT 100
    `;
    params = [game];
  }

  // agent_name might be null from game_results — join with agents table
  const results = db.prepare(query).all(...params) as any[];
  
  // Enrich with agent table data
  const enriched = results.map((r, i) => {
    const agent = db.prepare('SELECT agent_name, country FROM agents WHERE gateway_id = ?').get(r.gateway_id) as any;
    return {
      rank: i + 1,
      gateway_id: r.gateway_id,
      agent_name: agent?.agent_name || r.agent_name || 'Unknown',
      country: agent?.country || 'unknown',
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      total_games: r.total_games,
      best_elo: r.best_elo,
      last_played: r.last_played,
    };
  });

  return res.json({ agents: enriched, game });
});

// Game stats
router.get('/stats', (_req: Request, res: Response) => {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM game_results').get() as any;
  const players = db.prepare('SELECT COUNT(DISTINCT gateway_id) as cnt FROM game_results WHERE gateway_id NOT LIKE ?').get('ai-%') as any;
  const games = db.prepare('SELECT DISTINCT game FROM game_results').all() as any[];
  
  return res.json({
    total_matches: Math.floor(total.cnt / 2), // each match creates 2 records
    total_players: players.cnt,
    available_games: games.map(g => g.game),
  });
});

export default router;
