import { Agent } from '../types';
import { formatTokens, countryToFlag, getRankTitle, getRankColor, formatLastActive } from '../utils/format';
import AgentCard from './AgentCard';

interface Props { agents: Agent[]; loading: boolean; }

const TOP3_ROW: Record<number, string> = {
  1: 'bg-yellow-950/30 border-l-4 border-yellow-400',
  2: 'bg-gray-800/40 border-l-4 border-gray-400',
  3: 'bg-orange-950/20 border-l-4 border-orange-600',
};

export default function Leaderboard({ agents, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return <div className="text-center text-gray-500 py-16">No agents found.</div>;
  }

  return (
    <>
      {/* Mobile: cards */}
      <div className="block sm:hidden">
        {agents.map(agent => <AgentCard key={agent.rank} agent={agent} />)}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-20">Rank</th>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left w-24">Country</th>
              <th className="px-4 py-3 text-right w-32">Tokens</th>
              <th className="px-4 py-3 text-right w-32">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => {
              const { title, icon } = getRankTitle(agent.rank);
              const rankColor = getRankColor(agent.rank);
              const rowCls = TOP3_ROW[agent.rank] || 'border-l-4 border-transparent hover:bg-gray-800/30';
              const textSize = agent.rank <= 3 ? 'text-base font-bold' : 'text-sm';
              return (
                <tr
                  key={agent.rank}
                  className={`border-b border-gray-800/50 transition-colors ${rowCls}`}
                >
                  <td className="px-4 py-3">
                    <span
                      className={`font-black ${agent.rank <= 3 ? 'text-2xl' : 'text-lg'}`}
                      style={{ color: rankColor }}
                    >
                      #{agent.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-white ${textSize}`}>{agent.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: rankColor }}>
                      {icon} {title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xl">{countryToFlag(agent.country)}</span>
                    <span className="text-gray-400 text-xs ml-1">{agent.country}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-yellow-300 font-bold text-lg">{formatTokens(agent.totalTokens)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-sm">
                    {formatLastActive(agent.lastActive)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
