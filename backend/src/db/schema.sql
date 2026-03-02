CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gateway_id TEXT UNIQUE NOT NULL,
  agent_name TEXT NOT NULL,
  country TEXT DEFAULT 'unknown',
  tokens_total INTEGER DEFAULT 0,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  sessions_total INTEGER DEFAULT 0,
  last_reported_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gateway_id TEXT NOT NULL,
  tokens_delta INTEGER NOT NULL,
  tokens_in_delta INTEGER DEFAULT 0,
  tokens_out_delta INTEGER DEFAULT 0,
  model TEXT,
  reported_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (gateway_id) REFERENCES agents(gateway_id)
);

CREATE TABLE IF NOT EXISTS game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gateway_id TEXT NOT NULL,
  game TEXT NOT NULL,
  result TEXT NOT NULL,
  opponent_gateway_id TEXT,
  opponent_name TEXT,
  elo_before INTEGER,
  elo_after INTEGER,
  match_id TEXT,
  reported_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (gateway_id) REFERENCES agents(gateway_id)
);
