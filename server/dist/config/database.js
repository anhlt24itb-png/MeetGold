"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDbPool = getDbPool;
exports.isDbConnected = isDbConnected;
const promise_1 = __importDefault(require("mysql2/promise"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const env_1 = require("./env");
let pool = null;
let isConnected = false;
async function initDatabase() {
    try {
        console.log(`[Database] Connecting to Docker MySQL at ${env_1.ENV.DB.HOST}:${env_1.ENV.DB.PORT} with user '${env_1.ENV.DB.USER}'...`);
        // 1. Connect to MySQL server to ensure DB exists
        const adminConnection = await promise_1.default.createConnection({
            host: env_1.ENV.DB.HOST,
            port: env_1.ENV.DB.PORT,
            user: env_1.ENV.DB.USER,
            password: env_1.ENV.DB.PASSWORD,
            connectTimeout: 5000,
        });
        await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${env_1.ENV.DB.NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await adminConnection.end();
        // 2. Create pool connected to the database
        pool = promise_1.default.createPool({
            host: env_1.ENV.DB.HOST,
            port: env_1.ENV.DB.PORT,
            user: env_1.ENV.DB.USER,
            password: env_1.ENV.DB.PASSWORD,
            database: env_1.ENV.DB.NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });
        // 3. Create tables if not exist
        await createTables(pool);
        // 4. Seed demo users into MySQL
        await seedDemoUsers(pool);
        isConnected = true;
        console.log(`[Database] ✅ Successfully connected to Docker MySQL database: ${env_1.ENV.DB.NAME} on port ${env_1.ENV.DB.PORT}`);
        return true;
    }
    catch (error) {
        console.warn(`[Database] ⚠️ MySQL connection failed (${error.message}). Running with in-memory fallback store.`);
        isConnected = false;
        return false;
    }
}
async function createTables(pool) {
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
async function seedDemoUsers(pool) {
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
        const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
        if (rows.length === 0) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const hash = await bcryptjs_1.default.hash(u.password, salt);
            const id = (0, uuid_1.v4)();
            await pool.query('INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())', [id, u.username, u.email, hash]);
            console.log(`[Database] Seeded demo user: ${u.email} (pass: ${u.password})`);
        }
    }
}
function getDbPool() {
    return pool;
}
function isDbConnected() {
    return isConnected;
}
