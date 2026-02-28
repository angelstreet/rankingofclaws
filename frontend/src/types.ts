export interface Agent {
  rank: number;
  name: string;
  country: string;
  totalTokens: number;
  lastActive: string;
}

export interface Stats {
  totalAgents: number;
  totalTokens: number;
  totalCountries: number;
}

export type TimePeriod = 'all' | '30d' | '7d' | 'today';
