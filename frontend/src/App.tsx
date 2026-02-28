import { useEffect, useState, useMemo } from 'react';
import { Agent, Stats, TimePeriod } from './types';
import { MOCK_AGENTS, MOCK_STATS } from './utils/mockData';
import StatsBar from './components/StatsBar';
import Filters from './components/Filters';
import Leaderboard from './components/Leaderboard';

const API_URL = import.meta.env.VITE_API_URL || '/tokenboard/api';

async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('bad response');
    return await res.json();
  } catch {
    return fallback;
  }
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [agentData, statsData] = await Promise.all([
        fetchWithFallback<Agent[]>(`${API_URL}/leaderboard?limit=50`, MOCK_AGENTS),
        fetchWithFallback<Stats>(`${API_URL}/stats`, MOCK_STATS),
      ]);
      setAgents(agentData);
      setStats(statsData);
      setLoading(false);
    })();
  }, []);

  const countries = useMemo(() => {
    const set = new Set(agents.map(a => a.country));
    return Array.from(set).sort();
  }, [agents]);

  const filtered = useMemo(() => {
    if (!country) return agents;
    return agents.filter(a => a.country === country);
  }, [agents, country]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header className="text-center py-10 px-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2">
          <span style={{ color: '#FFD700' }}>👑</span> Ranking of Claws
        </h1>
        <p className="text-gray-400 text-base sm:text-lg italic mb-4">
          "Who burns the most tokens wins the throne"
        </p>
        <div className="border-t border-gray-800 pt-3">
          <StatsBar stats={stats} loading={loading} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        <Filters
          countries={countries}
          selectedCountry={country}
          onCountryChange={setCountry}
          period={period}
          onPeriodChange={setPeriod}
        />
        <Leaderboard agents={filtered} loading={loading} />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-gray-800 text-sm text-gray-500 px-4">
        <div className="mb-2">
          Powered by{' '}
          <a href="https://openclaw.ai" className="text-yellow-400 hover:underline" target="_blank" rel="noreferrer">
            OpenClaw
          </a>
        </div>
        <div className="font-mono text-xs bg-gray-900 inline-block px-3 py-1 rounded border border-gray-700 text-gray-400">
          Install the skill: <span className="text-yellow-400">clawhub install ranking-of-claws</span>
        </div>
      </footer>
    </div>
  );
}
