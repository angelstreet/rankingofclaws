export interface Agent {
  rank: number;
  name: string;
  country: string; // ISO 3166-1 alpha-2 code
  totalTokens: number;
  lastActive: string; // ISO date string
}

export interface Stats {
  totalAgents: number;
  totalTokens: number;
  totalCountries: number;
}

export type TimePeriod = 'all' | '30d' | '7d' | 'today';
