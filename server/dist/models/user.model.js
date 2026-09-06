"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = require("../config/database");
// In-memory fallback repository
const inMemoryUsers = new Map();
class UserModel {
    static async findByEmail(email) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                const [rows] = await pool.query('SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?', [email]);
                if (rows.length > 0) {
                    const r = rows[0];
                    return {
                        id: r.id,
                        username: r.username,
                        email: r.email,
                        password_hash: r.password_hash,
                        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                    };
                }
                return null;
            }
            catch (err) {
                console.error('[UserModel.findByEmail] DB Error:', err);
            }
        }
        // Fallback
        for (const user of inMemoryUsers.values()) {
            if (user.email.toLowerCase() === email.toLowerCase()) {
                return user;
            }
        }
        return null;
    }
    static async findByUsername(username) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                const [rows] = await pool.query('SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?', [username]);
                if (rows.length > 0) {
                    const r = rows[0];
                    return {
                        id: r.id,
                        username: r.username,
                        email: r.email,
                        password_hash: r.password_hash,
                        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                    };
                }
                return null;
            }
            catch (err) {
                console.error('[UserModel.findByUsername] DB Error:', err);
            }
        }
        // Fallback
        for (const user of inMemoryUsers.values()) {
            if (user.username.toLowerCase() === username.toLowerCase()) {
                return user;
            }
        }
        return null;
    }
    static async findById(id) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                const [rows] = await pool.query('SELECT id, username, email, password_hash, created_at FROM users WHERE id = ?', [id]);
                if (rows.length > 0) {
                    const r = rows[0];
                    return {
                        id: r.id,
                        username: r.username,
                        email: r.email,
                        password_hash: r.password_hash,
                        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                    };
                }
                return null;
            }
            catch (err) {
                console.error('[UserModel.findById] DB Error:', err);
            }
        }
        return inMemoryUsers.get(id) || null;
    }
    static async create(user) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                await pool.query('INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())', [user.id, user.username, user.email, user.password_hash]);
            }
            catch (err) {
                console.error('[UserModel.create] DB Error:', err);
            }
        }
        inMemoryUsers.set(user.id, user);
        return user;
    }
}
exports.UserModel = UserModel;
