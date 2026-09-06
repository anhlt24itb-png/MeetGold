import { User } from '@meetdraw/shared';
import { getDbPool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface UserRecord extends User {
  password_hash: string;
}

// In-memory fallback repository
const inMemoryUsers: Map<string, UserRecord> = new Map();

export class UserModel {
  static async findByEmail(email: string): Promise<UserRecord | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?',
          [email]
        );
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
      } catch (err) {
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

  static async findByUsername(username: string): Promise<UserRecord | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?',
          [username]
        );
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
      } catch (err) {
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

  static async findById(id: string): Promise<UserRecord | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          'SELECT id, username, email, password_hash, created_at FROM users WHERE id = ?',
          [id]
        );
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
      } catch (err) {
        console.error('[UserModel.findById] DB Error:', err);
      }
    }

    return inMemoryUsers.get(id) || null;
  }

  static async create(user: UserRecord): Promise<UserRecord> {
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())',
          [user.id, user.username, user.email, user.password_hash]
        );
      } catch (err) {
        console.error('[UserModel.create] DB Error:', err);
      }
    }

    inMemoryUsers.set(user.id, user);
    return user;
  }
}
