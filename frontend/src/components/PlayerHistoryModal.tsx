import { useEffect, useState } from 'react';

interface MatchRecord {
  id: number;
  gateway_id?: string;
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

interface MatchDetail {
  match_id: string;
  participants: Array<MatchRecord & { agent_name: string }>;
}

interface Props {
  gatewayId: string;
  agentName: string;
  buildUrl: (path: string) => string;
  onClose: () => void;
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

export default function PlayerHistoryModal({ gatewayId, agentName, buildUrl, onClose }: Props) {
  const [history, setHistory] = useState<PlayerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    fetch(buildUrl(`api/games/player/${encodeURIComponent(gatewayId)}/history`))
      .then(r => r.json())
      .then(d => { setHistory(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [gatewayId]);

  async function loadMatch(matchId: string) {
    if (!matchId) return;
    setMatchLoading(true);
    const data = await fetch(buildUrl(`api/games/match/${encodeURIComponent(matchId)}`))
      .then(r => r.json()).catch(() => null);
    setSelectedMatch(data);
    setMatchLoading(false);
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if ((e.target as HTMLElement).dataset.backdrop) onClose();
  }

  return (
    <div
      data-backdrop="1"
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        background: '#0d0d14',
        border: '1px solid #1f2937',
        borderRadius: '0.75rem',
        width: '100%', maxWidth: '640px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          borderBottom: '1px solid #1f2937',
          flexShrink: 0,
        }}>
          <div>
            {selectedMatch ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setSelectedMatch(null)}
                  style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}
                >
                  ←
                </button>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Match Replay</span>
              </div>
            ) : (
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{agentName}</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '0 0.25rem' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
          ) : !history ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No data found.</div>
          ) : selectedMatch ? (
            // ── Match Replay ──
            <MatchReplayView match={selectedMatch} loading={matchLoading} currentGatewayId={gatewayId} />
          ) : (
            // ── Player History ──
            <PlayerHistoryView
              history={history}
              onMatchClick={(matchId) => loadMatch(matchId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerHistoryView({ history, onMatchClick }: { history: PlayerHistory; onMatchClick: (id: string) => void }) {
  const { stats, matches } = history;
  const winRate = parseFloat(stats.win_rate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Stats summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
      }}>
        {[
          { label: 'Wins', value: stats.wins, color: '#22c55e' },
          { label: 'Losses', value: stats.losses, color: '#ef4444' },
          { label: 'Draws', value: stats.draws, color: '#9ca3af' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#111118', borderRadius: '0.5rem', padding: '0.625rem',
            textAlign: 'center', border: '1px solid #1f2937',
          }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: '1.3rem' }}>{s.value}</div>
            <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
      }}>
        <div style={{ background: '#111118', borderRadius: '0.5rem', padding: '0.625rem', border: '1px solid #1f2937', textAlign: 'center' }}>
          <div style={{ color: '#FFD700', fontWeight: 800, fontSize: '1.1rem' }}>{stats.win_rate}%</div>
          <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>Win Rate</div>
        </div>
        <div style={{ background: '#111118', borderRadius: '0.5rem', padding: '0.625rem', border: '1px solid #1f2937', textAlign: 'center' }}>
          <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: '1.1rem' }}>{stats.peak_elo}</div>
          <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>Peak ELO</div>
        </div>
      </div>

      {/* Win rate bar */}
      {stats.total > 0 && (
        <div style={{ background: '#111118', borderRadius: '0.375rem', height: '6px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${winRate}%`,
            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            borderRadius: '0.375rem',
            transition: 'width 0.5s ease',
          }} />
        </div>
      )}

      {/* Match list */}
      <div style={{ borderTop: '1px solid #1f2937', paddingTop: '0.625rem' }}>
        <div style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recent Matches ({matches.length})
        </div>
        {matches.length === 0 ? (
          <div style={{ color: '#4b5563', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>No matches yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {matches.map(m => {
              const eloChange = (m.elo_after || 0) - (m.elo_before || 0);
              const hasReplay = !!m.match_id;
              return (
                <div
                  key={m.id}
                  onClick={() => hasReplay && onMatchClick(m.match_id!)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    background: '#111118', borderRadius: '0.5rem',
                    padding: '0.5rem 0.625rem',
                    border: '1px solid #1f2937',
                    cursor: hasReplay ? 'pointer' : 'default',
                    transition: hasReplay ? 'border-color 0.15s' : undefined,
                  }}
                  onMouseEnter={e => { if (hasReplay) (e.currentTarget as HTMLDivElement).style.borderColor = '#374151'; }}
                  onMouseLeave={e => { if (hasReplay) (e.currentTarget as HTMLDivElement).style.borderColor = '#1f2937'; }}
                >
                  {/* Result badge */}
                  <div style={{
                    width: '1.5rem', height: '1.5rem',
                    background: resultColor(m.result) + '20',
                    border: `1px solid ${resultColor(m.result)}40`,
                    borderRadius: '0.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.75rem',
                    color: resultColor(m.result),
                    flexShrink: 0,
                  }}>
                    {resultLabel(m.result)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.opponent_name || m.opponent_gateway_id || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                      {m.game} · {timeAgo(m.reported_at)}
                    </div>
                  </div>

                  {/* ELO change */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: eloChange >= 0 ? '#22c55e' : '#ef4444' }}>
                      {eloChange >= 0 ? '+' : ''}{eloChange}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#4b5563' }}>{m.elo_after}</div>
                  </div>

                  {hasReplay && (
                    <div style={{ color: '#374151', fontSize: '0.65rem', flexShrink: 0 }}>▶</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchReplayView({ match, loading, currentGatewayId }: { match: MatchDetail; loading: boolean; currentGatewayId: string }) {
  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>;

  const me = match.participants.find(p => p.gateway_id === currentGatewayId);
  const opponent = match.participants.find(p => p.gateway_id !== currentGatewayId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ color: '#6b7280', fontSize: '0.7rem', textAlign: 'center' }}>
        Match · {me?.game || match.participants[0]?.game}
      </div>

      {/* Participants side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
        {/* Me */}
        <div style={{
          background: '#111118', borderRadius: '0.5rem', padding: '0.75rem',
          border: '1px solid #1f2937', textAlign: 'center',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {me?.agent_name || 'You'}
          </div>
          {me && (
            <>
              <div style={{ color: resultColor(me.result), fontWeight: 800, fontSize: '1rem' }}>
                {me.result.toUpperCase()}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                ELO: {me.elo_before} → {me.elo_after}
              </div>
              <div style={{ fontSize: '0.7rem', color: (me.elo_after - me.elo_before) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {(me.elo_after - me.elo_before) >= 0 ? '+' : ''}{me.elo_after - me.elo_before}
              </div>
            </>
          )}
        </div>

        <div style={{ color: '#4b5563', fontWeight: 700, fontSize: '0.85rem' }}>VS</div>

        {/* Opponent */}
        <div style={{
          background: '#111118', borderRadius: '0.5rem', padding: '0.75rem',
          border: '1px solid #1f2937', textAlign: 'center',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {opponent?.agent_name || me?.opponent_name || 'Opponent'}
          </div>
          {opponent && (
            <>
              <div style={{ color: resultColor(opponent.result), fontWeight: 800, fontSize: '1rem' }}>
                {opponent.result.toUpperCase()}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                ELO: {opponent.elo_before} → {opponent.elo_after}
              </div>
              <div style={{ fontSize: '0.7rem', color: (opponent.elo_after - opponent.elo_before) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {(opponent.elo_after - opponent.elo_before) >= 0 ? '+' : ''}{opponent.elo_after - opponent.elo_before}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Match metadata */}
      <div style={{
        background: '#111118', borderRadius: '0.5rem', padding: '0.625rem',
        border: '1px solid #1f2937',
      }}>
        <div style={{ color: '#6b7280', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
          Match Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: '#6b7280' }}>Match ID</span>
            <span style={{ color: '#d1d5db', fontFamily: 'monospace', fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>{match.match_id}</span>
          </div>
          {match.participants[0] && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#6b7280' }}>Played</span>
              <span style={{ color: '#d1d5db' }}>{timeAgo(match.participants[0].reported_at)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: '#6b7280' }}>Game</span>
            <span style={{ color: '#d1d5db', textTransform: 'capitalize' }}>{match.participants[0]?.game}</span>
          </div>
        </div>
      </div>

      {match.participants.length === 1 && (
        <div style={{ color: '#4b5563', fontSize: '0.7rem', textAlign: 'center' }}>
          Only one participant record found for this match.
        </div>
      )}
    </div>
  );
}
