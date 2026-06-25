const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.VERCEL ? ':memory:' : '/home/team/shared/directoryjet.db';

let SQL;
let db;

async function getDb() {
  if (db) return db;
  if (!SQL) {
    SQL = await initSqlJs();
  }
  
  if (DB_PATH !== ':memory:' && fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('Connected to the SQLite database from file:', DB_PATH);
    } catch (e) {
      console.error('Error loading database file, starting fresh:', e);
      db = new SQL.Database();
      initSchema(db);
    }
  } else {
    console.log('Starting with in-memory database');
    db = new SQL.Database();
    initSchema(db);
  }
  return db;
}

function persist() {
  if (DB_PATH !== ':memory:') {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function initSchema(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS startups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website_url TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      keywords TEXT,
      category TEXT,
      founder_name TEXT,
      founder_email TEXT,
      founder_twitter TEXT,
      founder_linkedin TEXT,
      logo_url TEXT,
      screenshot_url TEXT,
      plan TEXT DEFAULT 'essential',
      payment_status TEXT DEFAULT 'pending',
      created_at TEXT,
      updated_at TEXT
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      startup_id TEXT NOT NULL,
      directory_name TEXT NOT NULL,
      directory_url TEXT,
      status TEXT DEFAULT 'pending',
      link TEXT,
      submission_date TEXT,
      updated_at TEXT,
      FOREIGN KEY (startup_id) REFERENCES startups (id) ON DELETE CASCADE
    )
  `);
  persist();
}

async function run(sql, params = []) {
  const database = await getDb();
  database.run(sql, params);
  
  let lastID = null;
  if (sql.trim().toUpperCase().startsWith('INSERT')) {
    const res = database.exec("SELECT last_insert_rowid() as id");
    lastID = res[0].values[0][0];
  }
  
  persist();
  return { id: lastID, changes: database.getRowsModified() };
}

async function get(sql, params = []) {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const hasResult = stmt.step();
  const result = hasResult ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}

async function all(sql, params = []) {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = {
  run,
  get,
  all,
  DB_PATH
};
