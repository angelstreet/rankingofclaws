import type { TimePeriod } from '../types';

interface Props {
  countries: string[];
  selectedCountry: string;
  onCountryChange: (c: string) => void;
  period: TimePeriod;
  onPeriodChange: (p: TimePeriod) => void;
}

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30d' },
  { value: '7d', label: 'Last 7d' },
  { value: 'today', label: 'Today' },
];

export default function Filters({ countries, selectedCountry, onCountryChange, period, onPeriodChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-6">
      <select
        value={selectedCountry}
        onChange={e => onCountryChange(e.target.value)}
        style={{background:'#111118', border:'1px solid #374151', color:'#e5e7eb', borderRadius:'0.5rem', padding:'0.5rem 0.75rem', fontSize:'0.875rem', minHeight:'44px'}}
      >
        <option value="">🌐 All countries</option>
        {countries.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div style={{display:'flex', background:'#111118', border:'1px solid #374151', borderRadius:'0.5rem', overflow:'hidden'}}>
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            style={{
              padding:'0.5rem 0.75rem',
              fontSize:'0.875rem',
              minHeight:'44px',
              border:'none',
              cursor:'pointer',
              transition:'all 0.15s',
              background: period === p.value ? '#FFD700' : 'transparent',
              color: period === p.value ? '#000' : '#9ca3af',
              fontWeight: period === p.value ? '700' : '400',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
