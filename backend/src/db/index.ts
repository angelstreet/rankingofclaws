import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'tokenboard.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// Safe column additions (idempotent — ALTER TABLE fails silently if column exists)
try { db.exec("ALTER TABLE game_results ADD COLUMN session_id TEXT"); } catch {}
try { db.exec("ALTER TABLE game_results ADD COLUMN session_name TEXT"); } catch {}
try { db.exec("ALTER TABLE game_results ADD COLUMN model TEXT"); } catch {}
// HeartClaws dimension scores
try { db.exec("ALTER TABLE game_results ADD COLUMN score_territory REAL"); } catch {}
try { db.exec("ALTER TABLE game_results ADD COLUMN score_economy REAL"); } catch {}
try { db.exec("ALTER TABLE game_results ADD COLUMN score_military REAL"); } catch {}
try { db.exec("ALTER TABLE game_results ADD COLUMN score_influence REAL"); } catch {}
try { db.exec("ALTER TABLE game_results ADD COLUMN score_composite REAL"); } catch {}

export default db;
