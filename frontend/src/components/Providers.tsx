import { useState, useEffect } from 'react';
import { formatTokens } from '../utils/format';

interface Provider {
  rank: number;
  provider: string;
  name: string;
  color: string;
  total_tokens: number;
  tokens_in: number;
  tokens_out: number;
  report_count: number;
  agent_count: number;
  models: string[];
}

const RANK_LABELS: Record<number, { title: string; emoji: string }> = {
  1: { title: 'Supreme Kingdom', emoji: '👑' },
  2: { title: 'Royal Kingdom', emoji: '🥈' },
  3: { title: 'Noble Kingdom', emoji: '🥉' },
};

export default function Providers({ apiUrl, country, period, onLoad }: { apiUrl: string; country?: string; period?: string; onLoad?: (count: number) => void }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/providers${country ? `?country=${country}` : ''}`)
      .then(r => r.json())
      .then(data => { setProviders(data); setLoading(false); onLoad?.(data.length); })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  if (loading) return <div style={{textAlign:'center', color:'#6b7280', padding:'2rem'}}>Loading providers...</div>;
  if (!providers.length) return <div style={{textAlign:'center', color:'#6b7280', padding:'2rem'}}>No provider data yet</div>;

  const maxTokens = providers[0]?.total_tokens || 1;

  return (
    <div>
      {/* Desktop table */}
      <div className="desktop-only" style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.95rem'}}>
          <thead>
            <tr style={{borderBottom:'2px solid #1f2937', color:'#9ca3af', textTransform:'uppercase', fontSize:'0.75rem', letterSpacing:'0.05em'}}>
              <th style={{padding:'0.75rem 1rem', textAlign:'left'}}>Rank</th>
              <th style={{padding:'0.75rem 1rem', textAlign:'left'}}>Provider</th>
              <th style={{padding:'0.75rem 1rem', textAlign:'right'}}>Total Tokens</th>
              <th style={{padding:'0.75rem 1rem', textAlign:'right'}}>Agents</th>
              <th style={{padding:'0.75rem 1rem', textAlign:'left'}}>Models</th>
              <th style={{padding:'0.75rem 1rem', textAlign:'left', width:'30%'}}>Share</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(p => {
              const rl = RANK_LABELS[p.rank];
              const pct = ((p.total_tokens / maxTokens) * 100).toFixed(1);
              return (
                <tr key={p.provider} style={{borderBottom:'1px solid #1f2937', transition:'background 0.2s'}}
                    onMouseEnter={e => (e.currentTarget.style.background = '#111118')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{padding:'0.75rem 1rem', fontWeight:700, color: p.rank <= 3 ? '#FFD700' : '#d1d5db'}}>
                    {rl ? `${rl.emoji} #${p.rank}` : `#${p.rank}`}
                  </td>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <div style={{width:12, height:12, borderRadius:'50%', background: p.color, flexShrink:0}} />
                      <span style={{fontWeight:600, color:'#f3f4f6'}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{padding:'0.75rem 1rem', textAlign:'right', fontFamily:'monospace', color:'#FFD700', fontWeight:600}}>
                    {formatTokens(p.total_tokens)}
                  </td>
                  <td style={{padding:'0.75rem 1rem', textAlign:'right', color:'#9ca3af'}}>
                    {p.agent_count}
                  </td>
                  <td style={{padding:'0.75rem 1rem', color:'#6b7280', fontSize:'0.8rem'}}>
                    {p.models.slice(0, 3).map(m => m.split('/').pop()).join(', ')}
                    {p.models.length > 3 ? ` +${p.models.length - 3}` : ''}
                  </td>
                  <td style={{padding:'0.75rem 1rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <div style={{flex:1, height:8, background:'#1f2937', borderRadius:4, overflow:'hidden'}}>
                        <div style={{width:`${pct}%`, height:'100%', background: p.color, borderRadius:4, transition:'width 0.5s'}} />
                      </div>
                      <span style={{fontSize:'0.75rem', color:'#6b7280', minWidth:'3rem', textAlign:'right'}}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only" style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
        {providers.map(p => {
          const rl = RANK_LABELS[p.rank];
          const pct = ((p.total_tokens / maxTokens) * 100).toFixed(1);
          return (
            <div key={p.provider} style={{background:'#111118', border:'1px solid #1f2937', borderRadius:'0.75rem', padding:'1rem',
              borderLeft: p.rank <= 3 ? `3px solid ${p.color}` : undefined}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem'}}>
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <span style={{fontWeight:700, color: p.rank <= 3 ? '#FFD700' : '#9ca3af'}}>
                    {rl ? `${rl.emoji} #${p.rank}` : `#${p.rank}`}
                  </span>
                  <div style={{width:10, height:10, borderRadius:'50%', background: p.color}} />
                  <span style={{fontWeight:600, color:'#f3f4f6'}}>{p.name}</span>
                </div>
                <span style={{fontFamily:'monospace', color:'#FFD700', fontWeight:600}}>{formatTokens(p.total_tokens)}</span>
              </div>
              <div style={{height:6, background:'#1f2937', borderRadius:3, overflow:'hidden', marginBottom:'0.5rem'}}>
                <div style={{width:`${pct}%`, height:'100%', background: p.color, borderRadius:3}} />
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#6b7280'}}>
                <span>{p.agent_count} agent{p.agent_count !== 1 ? 's' : ''}</span>
                <span>{p.models.slice(0, 2).map(m => m.split('/').pop()).join(', ')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
