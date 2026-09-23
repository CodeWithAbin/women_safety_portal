const { createClient } = require('@libsql/client');
const path = require('path');

// Determine database connection URL and auth token
const getDatabaseConfig = () => {
  if (process.env.NODE_ENV === 'test') {
    const testDbPath = process.env.DB_PATH || path.join(__dirname, '..', 'safety_portal.db');
    return {
      url: 'file:' + testDbPath.replace(/\\/g, '/')
    };
  }

  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || process.env.TURSO_DATABASE_TOKEN
    };
  }

  // Fallback to local SQLite file for seamless local development
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'safety_portal.db');
  const normalizedPath = 'file:' + dbPath.replace(/\\/g, '/');
  return {
    url: normalizedPath
  };
};

const client = createClient(getDatabaseConfig());

// Schema Initialization
let initPromise = null;

const initializeDatabase = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Enable foreign keys
    try {
      await client.execute('PRAGMA foreign_keys = ON;');
    } catch (e) {
      // Ignored for remote servers where managed automatically
    }

    // 1. Users Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Places Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        photo TEXT NOT NULL,
        rating INTEGER NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // 3. Notifications Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        place_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'status_update',
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL
      );
    `);

    // 4. Indexes for high performance querying
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_places_state_district_status ON places (state, district, status);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, is_read);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);
  })();

  return initPromise;
};

// Automatic initialization trigger
initializeDatabase().catch((err) => {
  console.error('❌ Database initialization error:', err.message);
});

// Lightweight database interface for controllers
const db = {
  client,
  initializeDatabase,

  async get(sql, params = []) {
    await initializeDatabase();
    const result = await client.execute({ sql, args: params });
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  async all(sql, params = []) {
    await initializeDatabase();
    const result = await client.execute({ sql, args: params });
    return result.rows;
  },

  async run(sql, params = []) {
    await initializeDatabase();
    const result = await client.execute({ sql, args: params });
    return {
      lastInsertRowid: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : undefined,
      rowsAffected: result.rowsAffected
    };
  },

  async execute(stmt) {
    await initializeDatabase();
    return client.execute(stmt);
  },

  async transaction(fn) {
    await initializeDatabase();
    const tx = await client.transaction('write');
    try {
      const result = await fn(tx);
      await tx.commit();
      return result;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  async close() {
    client.close();
  }
};

module.exports = db;
