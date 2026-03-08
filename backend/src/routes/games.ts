import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

router.get('/leaderboard', (req: Request, res: Response) => {
  const game = req.query.game as string || 'all';
  const mode = req.query.mode as string || 'all';
  const session = req.query.session as string || '';

  let modeFilter = '';
  if (mode === 'pvp') modeFilter = "AND opponent_gateway_id IS NOT NULL AND opponent_gateway_id NOT LIKE 'ai-%'";
  else if (mode === 'pve') modeFilter = "AND (opponent_gateway_id LIKE 'ai-%' OR opponent_gateway_id IS NULL)";

  let sessionFilter = '';
  let sessionParams: any[] = [];
  if (session && session !== 'all') {
    if (session === 'world') {
      sessionFilter = "AND (session_name = 'World' OR session_id IS NULL)";
    } else {
      sessionFilter = "AND session_id = ?";
      sessionParams = [session];
    }
  }

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
      FROM game_results
      WHERE gateway_id NOT LIKE 'ai-%' ${modeFilter} ${sessionFilter}
      GROUP BY gateway_id
      ORDER BY wins DESC, best_elo DESC
      LIMIT 100
    `;
    params = [...sessionParams];
  } else {
    query = `
      SELECT gateway_id, game,
             SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
             SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
             SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
             COUNT(*) as total_games,
             MAX(elo_after) as best_elo,
             MAX(reported_at) as last_played
      FROM game_results
      WHERE game = ? AND gateway_id NOT LIKE 'ai-%' ${modeFilter} ${sessionFilter}
      GROUP BY gateway_id
      ORDER BY wins DESC, best_elo DESC
      LIMIT 100
    `;
    params = [game, ...sessionParams];
  }

  const results = db.prepare(query).all(...params) as any[];

  const enriched = results.map((r, i) => {
    const agent = db.prepare('SELECT agent_name, country FROM agents WHERE gateway_id = ?').get(r.gateway_id) as any;
    return {
      rank: i + 1,
      gateway_id: r.gateway_id,
      agent_name: agent?.agent_name || 'Unknown',
      country: agent?.country || 'unknown',
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      total_games: r.total_games,
      best_elo: r.best_elo,
      last_played: r.last_played,
    };
  });

  return res.json({ agents: enriched, game, mode, session: session || undefined });
});

router.get('/stats', (_req: Request, res: Response) => {
  const total = db.prepare('SELECT COUNT(DISTINCT match_id) as cnt FROM game_results').get() as any;
  const players = db.prepare("SELECT COUNT(DISTINCT gateway_id) as cnt FROM game_results WHERE gateway_id NOT LIKE 'ai-%'").get() as any;
  const games = db.prepare('SELECT DISTINCT game FROM game_results').all() as any[];

  return res.json({
    total_matches: total.cnt,
    total_players: players.cnt,
    available_games: games.map(g => g.game),
  });
});


// Player history
router.get('/player/:gatewayId/history', (req: Request, res: Response) => {
  const { gatewayId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const matches = db.prepare(`
    SELECT id, game, result, opponent_gateway_id, opponent_name,
           elo_before, elo_after, match_id, reported_at
    FROM game_results
    WHERE gateway_id = ?
    ORDER BY reported_at DESC
    LIMIT ?
  `).all(gatewayId, limit) as any[];

  const statsRow = db.prepare(`
    SELECT
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
      COUNT(*) as total,
      MAX(elo_after) as peak_elo
    FROM game_results WHERE gateway_id = ?
  `).get(gatewayId) as any;

  const agent = db.prepare('SELECT agent_name, country FROM agents WHERE gateway_id = ?').get(gatewayId) as any;

  return res.json({
    gateway_id: gatewayId,
    agent_name: agent?.agent_name || 'Unknown',
    stats: {
      wins: statsRow.wins || 0,
      losses: statsRow.losses || 0,
      draws: statsRow.draws || 0,
      total: statsRow.total || 0,
      peak_elo: statsRow.peak_elo || 1200,
      win_rate: statsRow.total ? ((statsRow.wins / statsRow.total) * 100).toFixed(1) : '0.0',
    },
    matches,
  });
});

// Match detail / replay
router.get('/match/:matchId', (req: Request, res: Response) => {
  const { matchId } = req.params;

  const rows = db.prepare(`
    SELECT gr.id, gr.gateway_id, gr.game, gr.result, gr.opponent_gateway_id,
           gr.opponent_name, gr.elo_before, gr.elo_after, gr.match_id, gr.reported_at,
           a.agent_name
    FROM game_results gr
    LEFT JOIN agents a ON a.gateway_id = gr.gateway_id
    WHERE gr.match_id = ?
    ORDER BY gr.id ASC
  `).all(matchId) as any[];

  if (!rows.length) return res.status(404).json({ error: 'Match not found' });

  return res.json({ match_id: matchId, participants: rows });
});

router.get('/sessions', (req: Request, res: Response) => {
  const game = (req.query.game as string) || '';
  if (!game) return res.json([]);
  const rows = db.prepare(`
    SELECT DISTINCT session_id, session_name, COUNT(*) as match_count,
           MAX(reported_at) as last_played
    FROM game_results
    WHERE game = ? AND session_id IS NOT NULL
    GROUP BY session_id, session_name
    ORDER BY last_played DESC
  `).all(game);
  return res.json(rows);
});

router.get('/models', (req: Request, res: Response) => {
  const game = (req.query.game as string) || '';
  const rows = db.prepare(`
    SELECT model,
           SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
           COUNT(*) as total_games,
           COUNT(DISTINCT gateway_id) as agent_count,
           MAX(elo_after) as best_elo,
           MAX(reported_at) as last_played
    FROM game_results
    WHERE model IS NOT NULL AND model != ''
    ${game ? 'AND game = ?' : ''}
    GROUP BY model
    ORDER BY wins DESC, total_games DESC
    LIMIT 50
  `).all(...(game ? [game] : []));
  return res.json({ models: rows, game: game || 'all' });
});

export default router;
