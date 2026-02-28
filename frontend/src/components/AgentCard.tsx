import type { Agent } from '../types';
import { formatTokens, countryToFlag, getRankTitle, getRankColor, formatLastActive } from '../utils/format';

interface Props { agent: Agent; }

const TOP3_BG: Record<number, string> = {
  1: 'rgba(120,90,0,0.25)',
  2: 'rgba(100,100,100,0.2)',
  3: 'rgba(100,60,20,0.2)',
};
const TOP3_BORDER: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export default function AgentCard({ agent }: Props) {
  const { title, icon } = getRankTitle(agent.rank);
  const rankColor = getRankColor(agent.rank);
  const bg = TOP3_BG[agent.rank] || 'rgba(17,17,24,0.8)';
  const border = TOP3_BORDER[agent.rank] ? `1px solid ${TOP3_BORDER[agent.rank]}55` : '1px solid #374151';

  return (
    <div style={{background:bg, border, borderRadius:'0.75rem', padding:'1rem', marginBottom:'0.75rem', position:'relative', overflow:'hidden'}}>
      {agent.rank <= 3 && (
        <div style={{position:'absolute', top:0, right:4, fontSize:'5rem', opacity:0.07, lineHeight:1}}>{icon}</div>
      )}
      <div style={{display:'flex', gap:'0.75rem', alignItems:'flex-start'}}>
        <div style={{color:rankColor, fontSize:agent.rank<=3?'2rem':'1.5rem', fontWeight:900, minWidth:'3rem', textAlign:'center', lineHeight:1, paddingTop:'0.25rem'}}>
          #{agent.rank}
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap'}}>
            <span style={{color:'#fff', fontWeight:700, fontSize:'1rem'}}>{agent.name}</span>
            <span style={{fontSize:'1.25rem'}}>{countryToFlag(agent.country)}</span>
          </div>
          <div style={{color:rankColor, fontSize:'0.75rem', marginTop:'0.25rem'}}>{icon} {title}</div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.5rem', flexWrap:'wrap', gap:'0.25rem'}}>
            <span style={{color:'#fde047', fontWeight:700, fontSize:'1.25rem'}}>{formatTokens(agent.totalTokens)}</span>
            <span style={{color:'#6b7280', fontSize:'0.75rem'}}>{formatLastActive(agent.lastActive)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
