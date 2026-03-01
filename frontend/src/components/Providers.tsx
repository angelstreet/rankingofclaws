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

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};
const RANK_EMOJI: Record<number, string> = {
  1: '\u{1F451}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

export default function Providers({ apiUrl, country, period, onLoad }: { apiUrl: string; country?: string; period?: string; onLoad?: (count: number) => void }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  void period;

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
    <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
      {providers.map(p => {
        const pct = ((p.total_tokens / maxTokens) * 100).toFixed(1);
        const isTop3 = p.rank <= 3;
        const rankColor = RANK_COLORS[p.rank] || '#6b7280';
        const emoji = RANK_EMOJI[p.rank] || '';
        const borderColor = isTop3 ? rankColor : '#1f2937';
        return (
          <div key={p.provider} style={{
            background: '#111118',
            border: `1px solid ${borderColor}`,
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: '0.75rem',
            padding: '1rem',
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <span style={{fontWeight:700, color: rankColor, fontSize: isTop3 ? '1.1rem' : '0.9rem'}}>
                  {emoji} #{p.rank}
                </span>
                <div style={{width:10, height:10, borderRadius:'50%', background: p.color}} />
                <span style={{fontWeight:600, color:'#f3f4f6'}}>{p.name}</span>
              </div>
              <span style={{fontFamily:'monospace', color:'#FFD700', fontWeight:700, fontSize:'1.1rem'}}>{formatTokens(p.total_tokens)}</span>
            </div>
            <div style={{height:6, background:'#1f2937', borderRadius:3, overflow:'hidden', marginBottom:'0.5rem'}}>
              <div style={{width:`${pct}%`, height:'100%', background: p.color, borderRadius:3, transition:'width 0.5s'}} />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#6b7280'}}>
              <span>{p.agent_count} agent{p.agent_count !== 1 ? 's' : ''}</span>
              <span>{p.models.slice(0, 3).map(m => m.split('/').pop()).join(', ')}{p.models.length > 3 ? ` +${p.models.length - 3}` : ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
