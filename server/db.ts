import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { Complaint } from '../src/types/complaint.ts';
import { SEED_COMPLAINTS } from '../src/lib/seedData.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'nexus.db');

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      department TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `);

  const countRow = db.prepare('SELECT COUNT(*) as count FROM complaints').get() as { count: number };
  if (countRow.count === 0) {
    seedComplaints(db);
  }

  return db;
}

function seedComplaints(database: Database.Database): void {
  const insert = database.prepare(`
    INSERT OR REPLACE INTO complaints (id, category, severity, status, department, submitted_at, updated_at, payload)
    VALUES (@id, @category, @severity, @status, @department, @submitted_at, @updated_at, @payload)
  `);

  const tx = database.transaction((items: Complaint[]) => {
    for (const item of items) {
      insert.run({
        id: item.id,
        category: item.category,
        severity: item.severity,
        status: item.status,
        department: item.department,
        submitted_at: item.submittedAt,
        updated_at: item.updatedAt,
        payload: JSON.stringify(item),
      });
    }
  });

  tx(SEED_COMPLAINTS);
}

export function listComplaints(): Complaint[] {
  const database = initDatabase();
  const rows = database
    .prepare('SELECT payload FROM complaints ORDER BY submitted_at DESC')
    .all() as { payload: string }[];
  return rows.map((r) => JSON.parse(r.payload) as Complaint);
}

export function getComplaintById(id: string): Complaint | null {
  const database = initDatabase();
  const row = database
    .prepare('SELECT payload FROM complaints WHERE id = ?')
    .get(id) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as Complaint) : null;
}

export function saveComplaint(complaint: Complaint): Complaint {
  const database = initDatabase();
  database
    .prepare(`
      INSERT OR REPLACE INTO complaints (id, category, severity, status, department, submitted_at, updated_at, payload)
      VALUES (@id, @category, @severity, @status, @department, @submitted_at, @updated_at, @payload)
    `)
    .run({
      id: complaint.id,
      category: complaint.category,
      severity: complaint.severity,
      status: complaint.status,
      department: complaint.department,
      submitted_at: complaint.submittedAt,
      updated_at: complaint.updatedAt,
      payload: JSON.stringify(complaint),
    });
  return complaint;
}

export function resetDemoDatabase(): Complaint[] {
  const database = initDatabase();
  database.prepare('DELETE FROM complaints').run();
  seedComplaints(database);
  return listComplaints();
}
