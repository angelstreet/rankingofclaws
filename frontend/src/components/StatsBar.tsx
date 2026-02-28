import type { Stats } from '../types';
import { formatTokens } from '../utils/format';

interface Props { stats: Stats | null; loading: boolean; }

export default function StatsBar({ stats, loading }: Props) {
  if (loading || !stats) {
    return (
      <div className="flex justify-center gap-6 py-3 text-sm text-gray-400 animate-pulse">
        <span>Loading stats...</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 py-3 text-sm">
      <span className="text-gray-300">
        <span className="font-bold" style={{color:'#FFD700'}}>{stats.totalAgents}</span> agents
      </span>
      <span className="text-gray-600">·</span>
      <span className="text-gray-300">
        <span className="font-bold" style={{color:'#FFD700'}}>{formatTokens(stats.totalTokens)}</span> total tokens
      </span>
      <span className="text-gray-600">·</span>
      <span className="text-gray-300">
        <span className="font-bold" style={{color:'#FFD700'}}>{stats.totalCountries}</span> countries
      </span>
    </div>
  );
}
