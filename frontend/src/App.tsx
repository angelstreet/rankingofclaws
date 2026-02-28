import { useEffect, useState, useMemo } from 'react';
import type { Agent, Stats, TimePeriod } from './types';
import { MOCK_AGENTS, MOCK_STATS } from './utils/mockData';
import StatsBar from './components/StatsBar';
import Filters from './components/Filters';
import Leaderboard from './components/Leaderboard';

const API_URL = import.meta.env.VITE_API_URL || '/rankingofclaws/api';

// Backend uses snake_case — map to our camelCase types
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
    totalCountries: 0, // not in API; will compute from agents
  };
}

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('bad response');
    return await res.json() as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [stats, setStats] = useState<Stats>(MOCK_STATS);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('all');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [lbData, statsData] = await Promise.all([
        safeFetch<ApiLeaderboard | null>(`${API_URL}/leaderboard?limit=50`, null),
        safeFetch<ApiStats | null>(`${API_URL}/stats`, null),
      ]);

      if (lbData && Array.isArray(lbData.agents) && lbData.agents.length > 0) {
        const mapped = lbData.agents.map(mapAgent);
        setAgents(mapped);
        if (statsData) {
          const s = mapStats(statsData);
          s.totalCountries = new Set(mapped.map(a => a.country)).size;
          setStats(s);
        } else {
          setStats({ ...MOCK_STATS, totalAgents: mapped.length, totalCountries: new Set(mapped.map(a => a.country)).size });
        }
      } else {
        setAgents(MOCK_AGENTS);
        setStats(MOCK_STATS);
      }
      setLoading(false);
    })();
  }, []);

  const countries = useMemo(() => Array.from(new Set(agents.map(a => a.country).filter(Boolean))).sort(), [agents]);
  const filtered = useMemo(() => country ? agents.filter(a => a.country === country) : agents, [agents, country]);

  return (
    <div style={{minHeight:'100vh', background:'#0a0a0f', fontFamily:'Inter, system-ui, sans-serif', color:'#fff'}}>
      <header style={{textAlign:'center', padding:'1rem 1rem 0.5rem'}}>
        <h1 style={{fontSize:'clamp(2rem, 6vw, 3.5rem)', fontWeight:900, letterSpacing:'-0.02em', margin:'0 0 0.5rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}>
          <span style={{color:'#FFD700', fontSize:'clamp(1.5rem, 5vw, 2.5rem)'}}>👑</span>
          <span>Ranking of Claws</span>
          <img src={`${import.meta.env.BASE_URL}openclaw.svg`} alt="OpenClaw" style={{height:'clamp(2rem, 5vw, 3rem)', width:'auto', filter:'drop-shadow(0 0 8px rgba(255,215,0,0.3))'}} />
        </h1>
        <p style={{color:'#9ca3af', fontStyle:'italic', fontSize:'1rem', margin:'0 0 0.75rem'}}>
          "Who burns the most tokens wins the throne"
        </p>
        <div style={{borderTop:'1px solid #1f2937', paddingTop:'0.75rem'}}>
          <StatsBar stats={stats} loading={loading} />
        </div>
      </header>

      <main style={{maxWidth:'56rem', margin:'0 auto', padding:'1rem 1rem 1.5rem'}}>
        <Filters
          countries={countries}
          selectedCountry={country}
          onCountryChange={setCountry}
          period={period}
          onPeriodChange={setPeriod}
        />
        <Leaderboard agents={filtered} loading={loading} />
      </main>

      <footer style={{textAlign:'center', padding:'1.5rem 1rem', borderTop:'1px solid #1f2937', color:'#9ca3af', fontSize:'1rem'}}>
        <div style={{marginBottom:'0.75rem'}}>
          Powered by{' '}
          <a href="https://openclaw.ai" style={{color:'#FFD700', textDecoration:'none'}} target="_blank" rel="noreferrer">
            OpenClaw
          </a>
        </div>
        <div
          onClick={() => {navigator.clipboard.writeText('clawhub install ranking-of-claws'); const el = document.getElementById('copy-toast'); if(el){el.style.opacity='1'; setTimeout(()=>el.style.opacity='0', 1500)}}}
          style={{fontFamily:'monospace', fontSize:'0.875rem', background:'#111118', display:'inline-block', padding:'0.5rem 1rem', borderRadius:'0.375rem', border:'1px solid #FFD70033', color:'#d1d5db', cursor:'pointer', transition:'border-color 0.2s'}}
          title="Click to copy"
        >
          <span style={{color:'#6b7280'}}>$</span> <span style={{color:'#FFD700', fontWeight:600}}>clawhub install ranking-of-claws</span> <span id="copy-toast" style={{color:'#22c55e', marginLeft:'0.5rem', opacity:0, transition:'opacity 0.3s', fontSize:'0.75rem'}}>copied!</span>
        </div>
      </footer>
    </div>
  );
}
