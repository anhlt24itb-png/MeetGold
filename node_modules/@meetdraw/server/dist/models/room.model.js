"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomModel = void 0;
const database_1 = require("../config/database");
const inMemoryRooms = new Map();
const inMemoryMembers = new Map(); // roomId -> Set of userIds
const inMemorySnapshots = new Map(); // roomId -> data
class RoomModel {
    static async create(room) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                await pool.query('INSERT INTO rooms (id, name, owner_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', [room.id, room.name, room.ownerId]);
            }
            catch (err) {
                console.error('[RoomModel.create] DB Error:', err);
            }
        }
        inMemoryRooms.set(room.id, { ...room });
        return room;
    }
    static async findById(id) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                const [rows] = await pool.query(`SELECT r.id, r.name, r.owner_id, r.created_at, u.username as owner_name,
            (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) as member_count
           FROM rooms r
           LEFT JOIN users u ON r.owner_id = u.id
           WHERE r.id = ?`, [id]);
                if (rows.length > 0) {
                    const r = rows[0];
                    return {
                        id: r.id,
                        name: r.name,
                        ownerId: r.owner_id,
                        ownerName: r.owner_name,
                        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                        memberCount: parseInt(r.member_count || '0', 10),
                    };
                }
                return null;
            }
            catch (err) {
                console.error('[RoomModel.findById] DB Error:', err);
            }
        }
        const room = inMemoryRooms.get(id);
        if (!room)
            return null;
        const members = inMemoryMembers.get(id) || new Set();
        return {
            id: room.id,
            name: room.name,
            ownerId: room.ownerId,
            ownerName: room.ownerName || 'Host',
            createdAt: room.createdAt,
            memberCount: members.size,
        };
    }
    static async addMember(roomId, userId) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                await pool.query('INSERT IGNORE INTO room_members (id, room_id, user_id, joined_at) VALUES (UUID(), ?, ?, NOW())', [roomId, userId]);
            }
            catch (err) {
                console.error('[RoomModel.addMember] DB Error:', err);
            }
        }
        if (!inMemoryMembers.has(roomId)) {
            inMemoryMembers.set(roomId, new Set());
        }
        inMemoryMembers.get(roomId).add(userId);
    }
    static async removeMember(roomId, userId) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                await pool.query('DELETE FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, userId]);
            }
            catch (err) {
                console.error('[RoomModel.removeMember] DB Error:', err);
            }
        }
        const members = inMemoryMembers.get(roomId);
        if (members) {
            members.delete(userId);
        }
    }
    static async saveSnapshot(roomId, data) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                await pool.query('INSERT IGNORE INTO rooms (id, name, owner_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', [roomId, `Whiteboard ${roomId}`, 'system']);
                await pool.query('INSERT INTO whiteboard_snapshots (id, room_id, data, created_at) VALUES (UUID(), ?, ?, NOW())', [roomId, data]);
            }
            catch (err) {
                console.error('[RoomModel.saveSnapshot] DB Error:', err);
            }
        }
        inMemorySnapshots.set(roomId, data);
    }
    static async getLatestSnapshot(roomId) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                const [rows] = await pool.query('SELECT data FROM whiteboard_snapshots WHERE room_id = ? ORDER BY created_at DESC LIMIT 1', [roomId]);
                if (rows.length > 0) {
                    return rows[0].data;
                }
                return null;
            }
            catch (err) {
                console.error('[RoomModel.getLatestSnapshot] DB Error:', err);
            }
        }
        return inMemorySnapshots.get(roomId) || null;
    }
    static async findUserRooms(userId) {
        const pool = (0, database_1.getDbPool)();
        if (pool) {
            try {
                const [rows] = await pool.query(`SELECT r.id, r.name, r.owner_id, r.created_at, u.username as owner_name,
            (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) as member_count
           FROM rooms r
           LEFT JOIN users u ON r.owner_id = u.id
           WHERE r.owner_id = ? OR r.id IN (SELECT room_id FROM room_members WHERE user_id = ?)
           ORDER BY r.created_at DESC LIMIT 20`, [userId, userId]);
                return rows.map((r) => ({
                    id: r.id,
                    name: r.name,
                    ownerId: r.owner_id,
                    ownerName: r.owner_name || 'Host',
                    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                    memberCount: parseInt(r.member_count || '0', 10),
                }));
            }
            catch (err) {
                console.error('[RoomModel.findUserRooms] DB Error:', err);
            }
        }
        return Array.from(inMemoryRooms.values())
            .filter((r) => r.ownerId === userId)
            .map((r) => ({
            id: r.id,
            name: r.name,
            ownerId: r.ownerId,
            ownerName: r.ownerName || 'Host',
            createdAt: r.createdAt,
            memberCount: 1,
        }));
    }
}
exports.RoomModel = RoomModel;
