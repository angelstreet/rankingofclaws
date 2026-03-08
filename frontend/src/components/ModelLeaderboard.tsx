import { useEffect, useState } from 'react';

interface ModelEntry {
  model: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  agent_count: number;
  best_elo: number;
  last_played: string;
}

interface Props {
  buildUrl: (path: string) => string;
  game: string;
  session?: string;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function tierEmoji(elo: number): string {
  if (elo >= 1400) return '\u{1F451}';
  if (elo >= 1300) return '\u{2B50}';
  if (elo >= 1200) return '\u{1F6E1}';
  return '\u{1F43E}';
}

export default function ModelLeaderboard({ buildUrl, game, session }: Props) {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `api/games/models?game=${game}`;
    if (session) url += `&session=${encodeURIComponent(session)}`;
    fetch(buildUrl(url))
      .then(r => r.json())
      .catch(() => ({ models: [] }))
      .then(data => {
        setModels(data.models || []);
        setLoading(false);
      });
  }, [game, session]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
      ) : models.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          No model data available yet.
        </div>
      ) : (
        models.map((m, idx) => {
          const rank = idx + 1;
          const winRate = m.total_games > 0 ? (m.wins / m.total_games) * 100 : 0;
          return (
            <div
              key={m.model}
              style={{
                background: rank === 1 ? '#FFD70008' : '#111118',
                border: `1px solid ${rank === 1 ? '#FFD70030' : '#1f2937'}`,
                borderRadius: '0.5rem',
                padding: '0.6rem 0.75rem',
              }}
            >
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: '2rem', textAlign: 'center', fontWeight: 800,
                  fontSize: '0.9rem', color: rank <= 3 ? '#FFD700' : '#6b7280',
                }}>
                  {rank}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.model}</span>
                    <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                      {m.agent_count} agent{m.agent_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.15rem' }}>
                    {m.wins}W · {m.losses}L · {m.draws}D · {m.total_games} games
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFD700' }}>
                    {tierEmoji(m.best_elo)} {m.best_elo}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#4b5563' }}>
                    {m.last_played ? timeAgo(m.last_played) : ''}
                  </div>
                </div>
              </div>

              {/* Win rate bar */}
              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  flex: 1, background: '#1f2937', borderRadius: '2px',
                  height: '4px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${winRate}%`,
                    background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                    borderRadius: '2px',
                  }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}>
                  {winRate.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
