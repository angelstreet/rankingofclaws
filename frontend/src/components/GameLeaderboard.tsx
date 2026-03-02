import { useEffect, useState } from 'react';

interface GameAgent {
  rank: number;
  agent_name: string;
  country: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  best_elo: number;
  last_played: string;
}

interface GameStats {
  total_matches: number;
  total_players: number;
  available_games: string[];
}

interface Props {
  apiBase: string;
  buildUrl: (path: string) => string;
  gameFilter: string;
  modeFilter: string;
}

function tierEmoji(elo: number): string {
  if (elo >= 1400) return '\u{1F451}';
  if (elo >= 1300) return '\u{2B50}';
  if (elo >= 1200) return '\u{1F6E1}';
  return '\u{1F43E}';
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function GameLeaderboard({ buildUrl, gameFilter, modeFilter }: Props) {
  const [agents, setAgents] = useState<GameAgent[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(buildUrl(`api/games/leaderboard?game=${gameFilter}&mode=${modeFilter}`)).then(r => r.json()).catch(() => ({ agents: [] })),
      fetch(buildUrl('api/games/stats')).then(r => r.json()).catch(() => null),
    ]).then(([lb, st]) => {
      setAgents(lb.agents || []);
      if (st) setStats(st);
      setLoading(false);
    });
  }, [gameFilter, modeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {stats && (
        <div style={{ padding: '0.25rem 0', color: '#6b7280', fontSize: '0.7rem' }}>
          {stats.total_matches} matches · {stats.total_players} players
        </div>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          No games played yet. Install the <code style={{ color: '#FFD700' }}>clawsgames</code> skill to compete!
        </div>
      ) : (
        agents.map((a) => (
          <div
            key={a.gateway_id}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: a.rank === 1 ? '#FFD70008' : '#111118',
              border: `1px solid ${a.rank === 1 ? '#FFD70030' : '#1f2937'}`,
              borderRadius: '0.5rem', padding: '0.6rem 0.75rem',
            }}
          >
            <span style={{ width: '2rem', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: a.rank <= 3 ? '#FFD700' : '#6b7280' }}>
              {a.rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{a.agent_name}</span>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{a.country !== 'unknown' ? a.country : ''}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.15rem' }}>
                {a.wins}W · {a.losses}L · {a.draws}D ({a.total_games} games)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFD700' }}>
                {tierEmoji(a.best_elo)} {a.best_elo}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#4b5563' }}>
                {a.last_played ? timeAgo(a.last_played) : ''}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
