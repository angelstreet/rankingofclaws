import type { Agent } from '../types';
import { formatTokens, countryToFlag, getRankTitle, getRankColor, formatLastActive } from '../utils/format';
import AgentCard from './AgentCard';

interface Props { agents: Agent[]; loading: boolean; }

export default function Leaderboard({ agents, loading }: Props) {
  if (loading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{height:'3.5rem', background:'rgba(30,30,40,0.5)', borderRadius:'0.75rem', marginBottom:'0.5rem'}} />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return <div style={{textAlign:'center', color:'#6b7280', padding:'4rem 0'}}>No agents found.</div>;
  }

  const TOP3_BG: Record<number, string> = {
    1: 'rgba(120,90,0,0.2)',
    2: 'rgba(80,80,80,0.2)',
    3: 'rgba(100,60,20,0.15)',
  };
  const TOP3_BORDER_LEFT: Record<number, string> = {
    1: '4px solid #FFD700',
    2: '4px solid #C0C0C0',
    3: '4px solid #CD7F32',
  };

  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden">
        {agents.map(agent => <AgentCard key={agent.rank} agent={agent} />)}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block" style={{borderRadius:'1rem', overflow:'hidden', border:'1px solid #1f2937'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#0d0d14'}}>
              {['Rank','Agent','Country','Tokens','Last Active'].map(h => (
                <th key={h} style={{padding:'0.75rem 1rem', textAlign: h==='Tokens'||h==='Last Active' ? 'right' : 'left', color:'#6b7280', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => {
              const { title, icon } = getRankTitle(agent.rank);
              const rankColor = getRankColor(agent.rank);
              const bg = TOP3_BG[agent.rank] || 'transparent';
              const bl = TOP3_BORDER_LEFT[agent.rank] || '4px solid transparent';
              return (
                <tr key={agent.rank} style={{background:bg, borderLeft:bl, borderBottom:'1px solid #1f293780', transition:'background 0.15s'}}>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <span style={{color:rankColor, fontWeight:900, fontSize:agent.rank<=3?'1.75rem':'1.2rem'}}>
                      #{agent.rank}
                    </span>
                  </td>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <div style={{color:'#fff', fontWeight: agent.rank<=3?700:400, fontSize:agent.rank<=3?'1rem':'0.875rem'}}>{agent.name}</div>
                    <div style={{color:rankColor, fontSize:'0.7rem', marginTop:'0.2rem'}}>{icon} {title}</div>
                  </td>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <span style={{fontSize:'1.25rem'}}>{countryToFlag(agent.country)}</span>
                    <span style={{color:'#6b7280', fontSize:'0.75rem', marginLeft:'0.25rem'}}>{agent.country}</span>
                  </td>
                  <td style={{padding:'0.75rem 1rem', textAlign:'right'}}>
                    <span style={{color:'#fde047', fontWeight:700, fontSize:'1.1rem'}}>{formatTokens(agent.totalTokens)}</span>
                  </td>
                  <td style={{padding:'0.75rem 1rem', textAlign:'right', color:'#6b7280', fontSize:'0.875rem'}}>
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
