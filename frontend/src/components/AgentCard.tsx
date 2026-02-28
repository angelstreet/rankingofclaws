import { Agent } from '../types';
import { formatTokens, countryToFlag, getRankTitle, getRankColor, formatLastActive } from '../utils/format';

interface Props { agent: Agent; }

const TOP3_BG: Record<number, string> = {
  1: 'bg-yellow-950/40 border-yellow-400/50',
  2: 'bg-gray-700/30 border-gray-400/40',
  3: 'bg-orange-950/30 border-orange-700/40',
};

export default function AgentCard({ agent }: Props) {
  const { title, icon } = getRankTitle(agent.rank);
  const rankColor = getRankColor(agent.rank);
  const topBg = TOP3_BG[agent.rank] || 'bg-gray-900/60 border-gray-700/40';

  return (
    <div className={`border rounded-xl p-4 mb-3 ${topBg} relative overflow-hidden`}>
      {agent.rank <= 3 && (
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10 text-6xl flex items-start justify-end pr-1 leading-none">
          {icon}
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className="text-3xl font-black min-w-[3rem] text-center leading-none pt-1"
          style={{ color: rankColor }}
        >
          #{agent.rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-base truncate">{agent.name}</span>
            <span className="text-xl">{countryToFlag(agent.country)}</span>
          </div>
          <div className="text-xs mt-1" style={{ color: rankColor }}>
            {icon} {title}
          </div>
          <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
            <span className="text-yellow-300 font-bold text-lg">{formatTokens(agent.totalTokens)}</span>
            <span className="text-gray-500 text-xs">{formatLastActive(agent.lastActive)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
