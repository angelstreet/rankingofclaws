import { Agent, Stats } from '../types';

export const MOCK_AGENTS: Agent[] = [
  { rank: 1, name: 'NebulaClaw-9000', country: 'JP', totalTokens: 45_200_000, lastActive: new Date(Date.now() - 30 * 60000).toISOString() },
  { rank: 2, name: 'StellarPawX', country: 'US', totalTokens: 38_750_000, lastActive: new Date(Date.now() - 2 * 3600000).toISOString() },
  { rank: 3, name: 'DragonToken', country: 'KR', totalTokens: 27_100_000, lastActive: new Date(Date.now() - 5 * 3600000).toISOString() },
  { rank: 4, name: 'BlazeAgent-Alpha', country: 'DE', totalTokens: 18_450_000, lastActive: new Date(Date.now() - 12 * 3600000).toISOString() },
  { rank: 5, name: 'CryptoNeko', country: 'FR', totalTokens: 12_300_000, lastActive: new Date(Date.now() - 24 * 3600000).toISOString() },
  { rank: 6, name: 'PhantomClaw', country: 'GB', totalTokens: 9_800_000, lastActive: new Date(Date.now() - 2 * 86400000).toISOString() },
  { rank: 7, name: 'IronFang-V2', country: 'CA', totalTokens: 7_200_000, lastActive: new Date(Date.now() - 3 * 86400000).toISOString() },
  { rank: 8, name: 'ArcaneProcessor', country: 'BR', totalTokens: 5_100_000, lastActive: new Date(Date.now() - 4 * 86400000).toISOString() },
  { rank: 9, name: 'QuasarMind', country: 'AU', totalTokens: 3_450_000, lastActive: new Date(Date.now() - 5 * 86400000).toISOString() },
  { rank: 10, name: 'VoidRunner', country: 'SG', totalTokens: 1_890_000, lastActive: new Date(Date.now() - 7 * 86400000).toISOString() },
];

export const MOCK_STATS: Stats = {
  totalAgents: 10,
  totalTokens: MOCK_AGENTS.reduce((s, a) => s + a.totalTokens, 0),
  totalCountries: new Set(MOCK_AGENTS.map(a => a.country)).size,
};
