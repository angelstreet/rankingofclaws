import type { Agent } from '../types';
import { formatTokens, countryToFlag, getRankTitle, getRankColor, formatLastActive } from '../utils/format';

interface Props { agents: Agent[]; loading: boolean; }

const RANK_EMOJI: Record<number, string> = {
  1: '\u{1F451}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

export default function Leaderboard({ agents, loading }: Props) {
  if (loading) {
    return (
      <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{height:'5rem', background:'rgba(30,30,40,0.5)', borderRadius:'0.75rem'}} />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return <div style={{textAlign:'center', color:'#6b7280', padding:'4rem 0'}}>No agents found.</div>;
  }

  const maxTokens = agents[0]?.totalTokens || 1;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
      {agents.map(agent => {
        const pct = ((agent.totalTokens / maxTokens) * 100).toFixed(1);
        const rankColor = getRankColor(agent.rank);
        const { title } = getRankTitle(agent.rank);
        const emoji = RANK_EMOJI[agent.rank] || '';
        const isTop3 = agent.rank <= 3;
        const borderColor = isTop3 ? rankColor : '#1f2937';
        return (
          <div key={agent.rank} style={{
            background: '#111118',
            border: `1px solid ${borderColor}`,
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: '0.75rem',
            padding: '1rem',
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <span style={{fontWeight:700, color: rankColor, fontSize: isTop3 ? '1.1rem' : '0.9rem'}}>
                  {emoji} #{agent.rank}
                </span>
                <span style={{fontWeight:600, color:'#f3f4f6'}}>{agent.name}</span>
                <span style={{fontSize:'1.1rem'}}>{countryToFlag(agent.country)}</span>
              </div>
              <span style={{fontFamily:'monospace', color:'#FFD700', fontWeight:700, fontSize:'1.1rem'}}>{formatTokens(agent.totalTokens)}</span>
            </div>
            <div style={{height:6, background:'#1f2937', borderRadius:3, overflow:'hidden', marginBottom:'0.5rem'}}>
              <div style={{width:`${pct}%`, height:'100%', background: rankColor, borderRadius:3, transition:'width 0.5s'}} />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#6b7280'}}>
              <span>{title}</span>
              <span>{formatLastActive(agent.lastActive)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
