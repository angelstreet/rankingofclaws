import { useState, useEffect, useRef } from 'react';
import type { Agent } from '../types';
import { formatTokens, countryToFlag, getRankTitle, getRankColor, formatLastActive } from '../utils/format';

interface Props { agents: Agent[]; loading: boolean; myAgentName?: string; }

const RANK_EMOJI: Record<number, string> = {
  1: '\u{1F451}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

const PAGE_SIZE = 50;

export default function Leaderboard({ agents, loading, myAgentName }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const myRef = useRef<HTMLDivElement>(null);

  // Expand visible list + scroll when myAgentName changes
  useEffect(() => {
    if (!myAgentName || agents.length === 0) return;
    const idx = agents.findIndex(a => a.name.toLowerCase() === myAgentName.toLowerCase());
    if (idx >= 0 && idx >= visibleCount) {
      setVisibleCount(Math.ceil((idx + 1) / PAGE_SIZE) * PAGE_SIZE);
    }
    setTimeout(() => myRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }, [myAgentName, agents]);

  if (loading) {
    return (
      <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{height:'5rem', background:'rgba(30,30,40,0.5)', borderRadius:'0.75rem'}} />
        ))}
      </div>
    );
  }

  const visible = agents.slice(0, visibleCount);
  const hasMore = visibleCount < agents.length;
  const maxTokens = agents[0]?.totalTokens || 1;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
      {/* Agent cards */}
      {agents.length === 0 && <div style={{textAlign:'center', color:'#6b7280', padding:'4rem 0'}}>No agents found.</div>}
      {visible.map(agent => {
        const pct = ((agent.totalTokens / maxTokens) * 100).toFixed(1);
        const rankColor = getRankColor(agent.rank);
        const { title } = getRankTitle(agent.rank);
        const emoji = RANK_EMOJI[agent.rank] || '';
        const isTop3 = agent.rank <= 3;
        const isMe = myAgentName && agent.name.toLowerCase() === myAgentName.toLowerCase();
        const borderColor = isMe ? '#FFD700' : isTop3 ? rankColor : '#1f2937';
        return (
          <div
            key={agent.rank}
            ref={isMe ? myRef : undefined}
            style={{
              background: isMe ? '#FFD70010' : '#111118',
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${borderColor}`,
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: isMe ? '0 0 12px rgba(255,215,0,0.15)' : undefined,
            }}
          >
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <span style={{fontWeight:700, color: rankColor, fontSize: isTop3 ? '1.1rem' : '0.9rem'}}>
                  {emoji} #{agent.rank}
                </span>
                <span style={{fontWeight:600, color:'#f3f4f6'}}>{agent.name}</span>
                {isMe && <span style={{background:'#FFD70030', color:'#FFD700', fontSize:'0.65rem', padding:'0.1rem 0.4rem', borderRadius:'9999px', fontWeight:700}}>YOU</span>}
                <span style={{fontSize:'1.1rem'}}>{countryToFlag(agent.country)}</span>
              </div>
              <span style={{fontFamily:'monospace', color:'#FFD700', fontWeight:700, fontSize:'1.1rem'}}>{formatTokens(agent.totalTokens)}</span>
            </div>
            <div style={{height:6, background:'#1f2937', borderRadius:3, overflow:'hidden', marginBottom:'0.5rem'}}>
              <div style={{width:`${pct}%`, height:'100%', background: isMe ? '#FFD700' : rankColor, borderRadius:3, transition:'width 0.5s'}} />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#6b7280'}}>
              <span>{title}</span>
              <span>{formatLastActive(agent.lastActive)}</span>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} style={{
          background:'#111118', border:'1px solid #374151', color:'#9ca3af', borderRadius:'0.5rem',
          padding:'0.75rem', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', textAlign:'center'
        }}>
          Show more ({agents.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
