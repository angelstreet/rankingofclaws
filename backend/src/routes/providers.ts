import { Router, Request, Response } from 'express';
import db from '../db/index';

const router = Router();

// Extract provider from model string (e.g. "anthropic/claude-sonnet-4" -> "anthropic")
function extractProvider(model: string | null): string {
  if (!model || model === 'mixed' || model === 'unknown') return 'unknown';
  if (model.includes('/')) return model.split('/')[0];
  // Guess from model name
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('codex')) return 'openai';
  if (model.startsWith('gemini')) return 'google';
  if (model.startsWith('llama') || model.startsWith('meta')) return 'meta';
  if (model.startsWith('mistral') || model.startsWith('mixtral')) return 'mistral';
  if (model.startsWith('qwen')) return 'qwen';
  if (model.startsWith('deepseek')) return 'deepseek';
  if (model.startsWith('minimax')) return 'minimax';
  return model;
}

// Provider metadata
const PROVIDER_META: Record<string, { name: string; color: string; logo?: string }> = {
  anthropic: { name: 'Anthropic', color: '#D4A574' },
  openai: { name: 'OpenAI', color: '#74AA9C' },
  google: { name: 'Google', color: '#4285F4' },
  meta: { name: 'Meta', color: '#0668E1' },
  mistral: { name: 'Mistral AI', color: '#FF7000' },
  qwen: { name: 'Qwen (Alibaba)', color: '#6F42C1' },
  deepseek: { name: 'DeepSeek', color: '#5B6ACD' },
  minimax: { name: 'MiniMax', color: '#00D4AA' },
  openrouter: { name: 'OpenRouter', color: '#6366F1' },
  unknown: { name: 'Unknown', color: '#6B7280' },
};

router.get('/', (_req: Request, res: Response) => {
  // Aggregate tokens by provider from reports table
  const rows = db.prepare(`
    SELECT model, 
           SUM(tokens_delta) as total_tokens,
           SUM(tokens_in_delta) as tokens_in,
           SUM(tokens_out_delta) as tokens_out,
           COUNT(*) as report_count,
           COUNT(DISTINCT gateway_id) as agent_count
    FROM reports 
    WHERE model IS NOT NULL
      AND LOWER(TRIM(model)) NOT IN ('mixed', 'unknown')
    GROUP BY model
  `).all() as any[];

  // Aggregate by provider
  const providerMap = new Map<string, {
    provider: string;
    name: string;
    color: string;
    total_tokens: number;
    tokens_in: number;
    tokens_out: number;
    report_count: number;
    agent_count: Set<string>;
    models: Set<string>;
  }>();

  for (const row of rows) {
    const provider = extractProvider(row.model);
    if (!providerMap.has(provider)) {
      const meta = PROVIDER_META[provider] || { name: provider, color: '#6B7280' };
      providerMap.set(provider, {
        provider,
        name: meta.name,
        color: meta.color,
        total_tokens: 0,
        tokens_in: 0,
        tokens_out: 0,
        report_count: 0,
        agent_count: new Set(),
        models: new Set(),
      });
    }
    const p = providerMap.get(provider)!;
    p.total_tokens += row.total_tokens;
    p.tokens_in += row.tokens_in;
    p.tokens_out += row.tokens_out;
    p.report_count += row.report_count;
    if (row.model) p.models.add(row.model);
  }

  // Also count distinct agents per provider
  const agentRows = db.prepare(`
    SELECT DISTINCT gateway_id, model
    FROM reports
    WHERE model IS NOT NULL
      AND LOWER(TRIM(model)) NOT IN ('mixed', 'unknown')
  `).all() as any[];
  
  for (const row of agentRows) {
    const provider = extractProvider(row.model);
    if (providerMap.has(provider)) {
      providerMap.get(provider)!.agent_count.add(row.gateway_id);
    }
  }

  const providers = Array.from(providerMap.values())
    .map(p => ({
      provider: p.provider,
      name: p.name,
      color: p.color,
      total_tokens: p.total_tokens,
      tokens_in: p.tokens_in,
      tokens_out: p.tokens_out,
      report_count: p.report_count,
      agent_count: p.agent_count.size,
      models: Array.from(p.models),
    }))
    .sort((a, b) => b.total_tokens - a.total_tokens);

  // Add rank
  const ranked = providers.map((p, i) => ({ ...p, rank: i + 1 }));

  return res.json(ranked);
});

export default router;
