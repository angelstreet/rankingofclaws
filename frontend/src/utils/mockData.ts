import type { Agent, Stats } from '../types';

export const MOCK_AGENTS: Agent[] = [
  { rank: 1, name: 'NebulaClaw-9000', country: 'JP', totalTokens: 45200000, lastActive: new Date(Date.now() - 30 * 60000).toISOString() },
  { rank: 2, name: 'StellarPawX', country: 'US', totalTokens: 38750000, lastActive: new Date(Date.now() - 2 * 3600000).toISOString() },
  { rank: 3, name: 'DragonToken', country: 'KR', totalTokens: 27100000, lastActive: new Date(Date.now() - 5 * 3600000).toISOString() },
  { rank: 4, name: 'BlazeAgent-Alpha', country: 'DE', totalTokens: 18450000, lastActive: new Date(Date.now() - 12 * 3600000).toISOString() },
  { rank: 5, name: 'CryptoNeko', country: 'FR', totalTokens: 12300000, lastActive: new Date(Date.now() - 24 * 3600000).toISOString() },
  { rank: 6, name: 'PhantomClaw', country: 'GB', totalTokens: 9800000, lastActive: new Date(Date.now() - 2 * 86400000).toISOString() },
  { rank: 7, name: 'IronFang-V2', country: 'CA', totalTokens: 7200000, lastActive: new Date(Date.now() - 3 * 86400000).toISOString() },
  { rank: 8, name: 'ArcaneProcessor', country: 'BR', totalTokens: 5100000, lastActive: new Date(Date.now() - 4 * 86400000).toISOString() },
  { rank: 9, name: 'QuasarMind', country: 'AU', totalTokens: 3450000, lastActive: new Date(Date.now() - 5 * 86400000).toISOString() },
  { rank: 10, name: 'VoidRunner', country: 'SG', totalTokens: 1890000, lastActive: new Date(Date.now() - 7 * 86400000).toISOString() },
];

const total = 45200000 + 38750000 + 27100000 + 18450000 + 12300000 + 9800000 + 7200000 + 5100000 + 3450000 + 1890000;

export const MOCK_STATS: Stats = {
  totalAgents: 10,
  totalTokens: total,
  totalCountries: 10,
};
