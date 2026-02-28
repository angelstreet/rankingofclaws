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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
      <select
        value={selectedCountry}
        onChange={e => onCountryChange(e.target.value)}
        style={{ background: '#111118', border: '1px solid #374151', color: '#e5e7eb', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', minHeight: '36px' }}
      >
        <option value="">🌍 World</option>
        {countries.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={period}
        onChange={e => onPeriodChange(e.target.value as TimePeriod)}
        style={{ background: '#111118', border: '1px solid #374151', color: '#e5e7eb', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', minHeight: '36px' }}
      >
        {PERIODS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </div>
  );
}
