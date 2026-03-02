import { useEffect, useState, useMemo } from 'react';
import type { Agent, Stats, TimePeriod } from './types';
import Filters from './components/Filters';
import Leaderboard from './components/Leaderboard';
import GameLeaderboard from './components/GameLeaderboard';
import rankingClawsLogo from './assets/rankingofclaws2.png';

interface ApiAgent {
  rank: number;
  agent_name: string;
  country: string;
  tokens_total: number;
  last_reported_at: string;
}
interface ApiStats {
  total_agents: number;
  total_tokens: number;
  total_tokens_in?: number;
  top_country?: { country: string };
}
interface ApiLeaderboard {
  agents: ApiAgent[];
}

function mapAgent(a: ApiAgent, idx: number): Agent {
  return {
    rank: a.rank ?? idx + 1,
    name: a.agent_name,
    country: a.country || '',
    totalTokens: a.tokens_total,
    lastActive: a.last_reported_at,
  };
}

function mapStats(s: ApiStats): Stats {
  return {
    totalAgents: s.total_agents,
    totalTokens: s.total_tokens,
    totalCountries: 0,
  };
}

const fetchCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30 * 1000;
const REFRESH_INTERVAL_MS = 30 * 1000;

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  const cached = fetchCache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('bad response');
    const data = await res.json() as T;
    fetchCache.set(url, { data, ts: Date.now() });
    return data;
  } catch {
    return fallback;
  }
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.3rem 0.7rem',
    borderRadius: '2rem',
    border: '1px solid',
    borderColor: active ? '#FFD700' : '#374151',
    background: active ? '#FFD70015' : 'transparent',
    color: active ? '#FFD700' : '#9ca3af',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    transition: 'all 0.2s',
  };
}

function badgeStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? '#FFD70030' : '#1f2937',
    color: active ? '#FFD700' : '#6b7280',
    fontSize: '0.65rem',
    padding: '0.1rem 0.4rem',
    borderRadius: '9999px',
    fontWeight: 700,
    lineHeight: 1.4,
  };
}

export default function App() {
  const apiBase = import.meta.env.VITE_API_URL || (() => {
    // Match VoiceBox routing behavior:
    // - custom domain => /api
    // - VM path mode (:8080 + /rankingofclaws/) => /rankingofclaws/api
    const base = import.meta.env.BASE_URL || '/';
    if (base === '/rankingofclaws/' && !window.location.port) {
      return window.location.origin + '/';
    }
    return window.location.origin + base;
  })();
  const buildUrl = (path: string) =>
    apiBase.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats>({ totalAgents: 0, totalTokens: 0, totalCountries: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents'|'games'>('agents');
  const [country, setCountry] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('all');
  const [search, setSearch] = useState('');
  const [myAgent, setMyAgent] = useState<{ agent: string; rank: number; total: number; percentile: number } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const LS_KEY = 'rok_my_agent';

  async function fetchRank(name: string) {
    setSearchLoading(true);
    setSearchError('');
    try {
      const res = await fetch(buildUrl(`api/rank?agent=${encodeURIComponent(name.trim())}`));
      if (!res.ok) { setSearchError('Agent not found'); setSearchLoading(false); return; }
      const data = await res.json();
      setMyAgent(data);
      localStorage.setItem(LS_KEY, data.agent);
      setSearch('');
    } catch { setSearchError('Search failed'); }
    setSearchLoading(false);
  }

  function clearMyAgent() {
    setMyAgent(null);
    localStorage.removeItem(LS_KEY);
  }

  // Restore saved agent on mount
  useEffect(() => {
    const saved = localStorage.getItem('rok_my_agent');
    if (saved) fetchRank(saved);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [lbData, statsData] = await Promise.all([
        safeFetch<ApiLeaderboard | null>(buildUrl('api/leaderboard?limit=200'), null),
        safeFetch<ApiStats | null>(buildUrl('api/stats'), null),
      ]);
      if (lbData && Array.isArray(lbData.agents) && lbData.agents.length > 0) {
        const mapped = lbData.agents.map(mapAgent);
        setAgents(mapped);
        if (statsData) {
          const s = mapStats(statsData);
          s.totalCountries = new Set(mapped.map(a => a.country)).size;
          setStats(s);
        } else {
          setStats({
            totalAgents: mapped.length,
            totalTokens: mapped.reduce((sum, a) => sum + a.totalTokens, 0),
            totalCountries: new Set(mapped.map(a => a.country)).size,
          });
        }
      } else {
        setAgents([]);
        setStats({ totalAgents: 0, totalTokens: 0, totalCountries: 0 });
      }
      setLoading(false);
    };

    void loadData();
    const timer = setInterval(() => { void loadData(); }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .desktop-only { display: block; }
      .mobile-only { display: none; }
      .mob-hide { display: initial; }
      .mob-page-tabs { display: flex; }
      .mob-page-select { display: none; }
      @media (max-width: 768px) {
        .desktop-only { display: none !important; }
        .mobile-only { display: flex !important; }
        .mob-hide { display: none !important; }
        .mob-page-tabs { display: none !important; }
        .mob-page-select { display: block !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const countries = useMemo(() => Array.from(new Set(agents.map(a => a.country).filter(Boolean))).sort(), [agents]);
  const filtered = useMemo(() => country ? agents.filter(a => a.country === country) : agents, [agents, country]);

  function copyInstall() {
    navigator.clipboard.writeText('clawhub install ranking-of-claws');
    const el = document.getElementById('copy-toast');
    if (el) { el.style.opacity = '1'; setTimeout(() => { el.style.opacity = '0'; }, 1500); }
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0a0f', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header>
        {/* Centered title */}
        <div style={{ textAlign: 'center', padding: '1rem 1rem 0.5rem' }}>
          <div style={{ margin: '0 0 0.25rem', display: 'flex', justifyContent: 'center' }}>
            <img src={rankingClawsLogo} alt="Ranking of Claws" style={{ height: 'clamp(4rem, 12vw, 8rem)', width: 'auto', filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.4))' }} />
          </div>
          <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '1rem', margin: 0 }}>
            "Who <span style={{color:'#E8272C'}}>burns</span> the most tokens wins the throne"
          </p>
        </div>

        {/* Toolbar: tabs left · filters right */}
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="mob-page-tabs" style={{ display: 'flex', gap: '0.375rem' }}>
            <button onClick={() => setActiveTab('agents')} style={tabStyle(activeTab === 'agents')}>
              Agents
              <span style={badgeStyle(activeTab === 'agents')}>{stats.totalAgents}</span>
            </button>
            <button onClick={() => setActiveTab('games')} style={tabStyle(activeTab === 'games')}>
              Games
            </button>
          </div>
          <select
            className="mob-page-select"
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as any)}
            style={{ display: 'none', background: '#111118', border: '1px solid #374151', color: '#FFD700', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, minHeight: '36px' }}
          >
            <option value="agents">Agents ({stats.totalAgents})</option>
            <option value="games">Games</option>
          </select>
          <div className="mob-hide" style={{ display: 'flex', flex: 1, gap: '0.375rem', minWidth: 0, alignItems: 'center' }}>
            {myAgent ? (
              <>
                <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  #{myAgent.rank} {myAgent.agent}
                </span>
                <span style={{ color: '#6b7280', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                  Top {(100 - myAgent.percentile).toFixed(0)}%
                </span>
                <button onClick={clearMyAgent} style={{ background: 'transparent', border: '1px solid #374151', color: '#6b7280', borderRadius: '0.375rem', padding: '0.15rem 0.4rem', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1 }}>
                  ×
                </button>
              </>
            ) : (
              <>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchRank(search)}
                  placeholder="Find your agent..."
                  style={{ flex: 1, background: '#111118', border: '1px solid #374151', borderRadius: '0.375rem', padding: '0.3rem 0.625rem', color: '#f3f4f6', fontSize: '0.8rem', outline: 'none' }}
                />
                <button onClick={() => fetchRank(search)} disabled={searchLoading} style={{ background: '#FFD70020', border: '1px solid #FFD70050', color: '#FFD700', borderRadius: '0.375rem', padding: '0.3rem 0.625rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {searchLoading ? '...' : 'Find'}
                </button>
              </>
            )}
            {searchError && <span style={{ color: '#ef4444', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{searchError}</span>}
          </div>
          <Filters countries={countries} selectedCountry={country} onCountryChange={setCountry} period={period} onPeriodChange={setPeriod} />
        </div>
      </header>

      {/* ── Scrollable content area ── */}
      <main style={{ flex: 1, overflow: 'hidden', maxWidth: '56rem', width: '100%', margin: '0 auto', padding: '0.5rem 1rem 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', borderRadius: '0.75rem' }}>
          {activeTab === 'agents' ? (
            <Leaderboard agents={filtered} loading={loading} myAgentName={myAgent?.agent} />
          ) : (
            <GameLeaderboard apiBase={apiBase} buildUrl={buildUrl} />
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0.5rem 1rem', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem' }}>
          <div className="mob-hide" style={{ display: 'initial' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="mob-hide" style={{ display: 'inline', color: '#6b7280', fontSize: '0.8rem' }}>
              Powered by{' '}
              <a href="https://openclaw.ai" style={{ color: '#FFD700', textDecoration: 'none' }} target="_blank" rel="noreferrer">
                OpenClaw
              </a>
            </span>
            <span className="mob-hide" style={{ display: 'inline', color: '#374151', fontSize: '0.8rem' }}>·</span>
            <div
              onClick={copyInstall}
              title="Click to copy"
              style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#111118', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: '1px solid #FFD70033', color: '#d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
            >
              <span style={{ color: '#6b7280' }}>$</span>
              <span style={{ color: '#FFD700', fontWeight: 600 }}>clawhub install ranking-of-claws</span>
              <span id="copy-toast" style={{ color: '#22c55e', opacity: 0, transition: 'opacity 0.3s', fontSize: '0.75rem' }}>copied!</span>
            </div>
          </div>
          <div className="mob-hide" style={{ display: 'block', textAlign: 'right' }}>
            <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>
              Inspired by{' '}
              <a href="https://en.wikipedia.org/wiki/Ranking_of_Kings" target="_blank" rel="noopener" style={{ color: '#FFD700', textDecoration: 'none', opacity: 0.85 }}>
                Ranking of Kings
              </a>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
