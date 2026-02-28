import { TimePeriod } from '../types';

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
        className="bg-gray-900 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 min-h-[44px]"
      >
        <option value="">🌐 All countries</option>
        {countries.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`px-3 py-2 text-sm min-h-[44px] transition-colors ${
              period === p.value
                ? 'bg-yellow-400 text-black font-bold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
