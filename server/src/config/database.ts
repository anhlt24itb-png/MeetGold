import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from './env';

let pool: mysql.Pool | null = null;
let isConnected = false;

export async function initDatabase(): Promise<boolean> {
  try {
    console.log(`[Database] Connecting to MySQL at ${ENV.DB.HOST}:${ENV.DB.PORT} with user '${ENV.DB.USER}'...`);

    const sslConfig = ENV.DB.SSL ? { rejectUnauthorized: false } : undefined;

    // 1. Try to ensure DB exists (works for local Docker, may skip for managed Cloud DBs)
    try {
      const adminConnection = await mysql.createConnection({
        host: ENV.DB.HOST,
        port: ENV.DB.PORT,
        user: ENV.DB.USER,
        password: ENV.DB.PASSWORD,
        ssl: sslConfig,
        connectTimeout: 5000,
      });

      await adminConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${ENV.DB.NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await adminConnection.end();
    } catch (adminErr: any) {
      // Cloud databases like TiDB / Aiven usually already have the database created and may forbid CREATE DATABASE
      console.log(`[Database] Notice: Admin DB check skipped/passed: ${adminErr.message}`);
    }

    // 2. Create pool connected to the database
    pool = mysql.createPool({
      host: ENV.DB.HOST,
      port: ENV.DB.PORT,
      user: ENV.DB.USER,
      password: ENV.DB.PASSWORD,
      database: ENV.DB.NAME,
      ssl: sslConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Test connection
    await pool.query('SELECT 1');

    // 3. Create tables if not exist
    await createTables(pool);

    // 4. Seed demo users into MySQL
    await seedDemoUsers(pool);

    isConnected = true;
    console.log(`[Database] ✅ Successfully connected to MySQL database: ${ENV.DB.NAME} on ${ENV.DB.HOST}:${ENV.DB.PORT}`);
    return true;
  } catch (error: any) {
    console.warn(`[Database] ⚠️ MySQL connection failed (${error.message}). Running with in-memory fallback store.`);
    isConnected = false;
    return false;
  }
}

async function createTables(pool: mysql.Pool): Promise<void> {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      owner_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_owner (owner_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS room_members (
      id VARCHAR(36) PRIMARY KEY,
      room_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_room_user (room_id, user_id),
      INDEX idx_room (room_id),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS whiteboard_snapshots (
      id VARCHAR(36) PRIMARY KEY,
      room_id VARCHAR(36) NOT NULL,
      data LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_room_snapshots (room_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ];

  for (const q of queries) {
    await pool.query(q);
  }
}

async function seedDemoUsers(pool: mysql.Pool): Promise<void> {
  const demoUsers = [
    {
      username: 'Alex (Tech Lead)',
      email: 'alex@meetdraw.io',
      password: 'password123',
    },
    {
      username: 'Chloe (UI/UX)',
      email: 'chloe@meetdraw.io',
      password: 'password123',
    },
    {
      username: 'Sarah (NetOps)',
      email: 'sarah@meetdraw.io',
      password: 'password123',
    },
    {
      username: 'Admin',
      email: 'admin@meetdraw.io',
      password: 'password123',
    },
  ];

  for (const u of demoUsers) {
    const [rows]: any = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);
      const id = uuidv4();
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())',
        [id, u.username, u.email, hash]
      );
      console.log(`[Database] Seeded demo user: ${u.email} (pass: ${u.password})`);
    }
  }
}

export function getDbPool(): mysql.Pool | null {
  return pool;
}

export function isDbConnected(): boolean {
  return isConnected;
}
