let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.error('Failed to load sqlite3:', e);
  // Mock sqlite3 for Vercel if it fails to load
  sqlite3 = {
    Database: class {
      constructor(path, callback) {
        console.log('Using Mock Database');
        if (callback) setTimeout(callback, 0);
      }
      serialize(callback) { callback(); }
      run(sql, params, callback) { if (callback) callback(); }
      get(sql, params, callback) { if (callback) callback(null, null); }
      all(sql, params, callback) { if (callback) callback(null, []); }
    },
    verbose: () => sqlite3
  };
}
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.VERCEL ? ':memory:' : '/home/team/shared/directoryjet.db';

// Ensure the directory exists if not in memory
if (DB_PATH !== ':memory:') {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', DB_PATH);
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // 1. Create startups table
    db.run(`
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
    `, (err) => {
      if (err) console.error('Error creating startups table:', err.message);
    });

    // 2. Create submissions table
    db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        startup_id TEXT NOT NULL,
        directory_name TEXT NOT NULL,
        directory_url TEXT,
        status TEXT DEFAULT 'pending', -- pending, submitting, submitted, approved, failed
        link TEXT,                      -- matching lead's requested column name "link"
        submission_date TEXT,           -- matching lead's requested column name "submission_date"
        updated_at TEXT,
        FOREIGN KEY (startup_id) REFERENCES startups (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating submissions table:', err.message);
    });
  });
}

// Wrapper functions for async usage
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  DB_PATH
};
