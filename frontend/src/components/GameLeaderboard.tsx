import { useEffect, useState } from 'react';

interface GameAgent {
  rank: number;
  gateway_id: string;
  agent_name: string;
  country: string;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  best_elo: number;
  last_played: string;
}

interface MatchRecord {
  id: number;
  game: string;
  result: 'win' | 'loss' | 'draw';
  opponent_gateway_id: string | null;
  opponent_name: string | null;
  elo_before: number;
  elo_after: number;
  match_id: string | null;
  reported_at: string;
}

interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  peak_elo: number;
  win_rate: string;
}

interface PlayerHistory {
  gateway_id: string;
  agent_name: string;
  stats: PlayerStats;
  matches: MatchRecord[];
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
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function resultColor(r: string) {
  if (r === 'win') return '#22c55e';
  if (r === 'loss') return '#ef4444';
  return '#9ca3af';
}

function resultLabel(r: string) {
  if (r === 'win') return 'W';
  if (r === 'loss') return 'L';
  return 'D';
}

function InlineHistory({ gatewayId, buildUrl }: { gatewayId: string; buildUrl: (path: string) => string }) {
  const [history, setHistory] = useState<PlayerHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(buildUrl(`api/games/player/${encodeURIComponent(gatewayId)}/history`))
      .then(r => r.json())
      .then(d => { setHistory(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [gatewayId]);

  if (loading) return (
    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>Loading history...</div>
  );
  if (!history) return (
    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>No data found.</div>
  );

  const { stats, matches } = history;
  const winRate = parseFloat(stats.win_rate);

  return (
    <div style={{ padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
        {[
          { label: 'W', value: stats.wins, color: '#22c55e' },
          { label: 'L', value: stats.losses, color: '#ef4444' },
          { label: 'D', value: stats.draws, color: '#9ca3af' },
          { label: 'Win%', value: `${stats.win_rate}%`, color: '#FFD700' },
          { label: 'Peak', value: stats.peak_elo, color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#0d0d14', border: '1px solid #1f2937',
            borderRadius: '0.375rem', padding: '0.375rem 0.25rem',
            textAlign: 'center',
          }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: '0.85rem' }}>{s.value}</div>
            <div style={{ color: '#4b5563', fontSize: '0.6rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Win rate bar */}
      {stats.total > 0 && (
        <div style={{ background: '#1f2937', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${winRate}%`,
            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            borderRadius: '2px',
          }} />
        </div>
      )}

      {/* Match list */}
      {matches.length === 0 ? (
        <div style={{ color: '#4b5563', textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem' }}>No matches yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ color: '#4b5563', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Matches ({matches.length})
          </div>
          {matches.map(m => {
            const eloChange = (m.elo_after || 0) - (m.elo_before || 0);
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#0d0d14', borderRadius: '0.375rem',
                  padding: '0.4rem 0.5rem',
                  border: '1px solid #1f2937',
                }}
              >
                {/* Result badge */}
                <div style={{
                  width: '1.4rem', height: '1.4rem',
                  background: resultColor(m.result) + '20',
                  border: `1px solid ${resultColor(m.result)}40`,
                  borderRadius: '0.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.7rem',
                  color: resultColor(m.result),
                  flexShrink: 0,
                }}>
                  {resultLabel(m.result)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#d1d5db' }}>
                    {m.opponent_name || m.opponent_gateway_id || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#6b7280' }}>
                    {m.game} · {timeAgo(m.reported_at)}
                  </div>
                </div>

                {/* ELO change */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', color: eloChange >= 0 ? '#22c55e' : '#ef4444' }}>
                    {eloChange >= 0 ? '+' : ''}{eloChange}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#4b5563' }}>{m.elo_after}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GameLeaderboard({ buildUrl, gameFilter, modeFilter }: Props) {
  const [agents, setAgents] = useState<GameAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(buildUrl(`api/games/leaderboard?game=${gameFilter}&mode=${modeFilter}`))
      .then(r => r.json())
      .catch(() => ({ agents: [] }))
      .then(lb => {
        setAgents(lb.agents || []);
        setLoading(false);
      });
  }, [gameFilter, modeFilter]);

  function toggleExpand(gatewayId: string) {
    setExpandedId(prev => prev === gatewayId ? null : gatewayId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          No games played yet. Install the <code style={{ color: '#FFD700' }}>clawsgames</code> skill to compete!
        </div>
      ) : (
        agents.map((a) => {
          const isExpanded = expandedId === a.gateway_id;
          return (
            <div
              key={a.gateway_id}
              style={{
                background: a.rank === 1 ? '#FFD70008' : '#111118',
                border: `1px solid ${isExpanded ? '#7c3aed60' : a.rank === 1 ? '#FFD70030' : '#1f2937'}`,
                borderRadius: '0.5rem',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Player row */}
              <div
                onClick={() => toggleExpand(a.gateway_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem', cursor: 'pointer',
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
                {/* Expand chevron */}
                <span style={{
                  color: '#4b5563', fontSize: '0.75rem', flexShrink: 0,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                }}>▼</span>
              </div>

              {/* Inline history panel */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #1f2937' }}>
                  <InlineHistory gatewayId={a.gateway_id} buildUrl={buildUrl} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
