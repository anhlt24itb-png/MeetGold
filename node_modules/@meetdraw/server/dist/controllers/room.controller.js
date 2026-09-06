"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomController = void 0;
const room_service_1 = require("../services/room.service");
const uuid_1 = require("uuid");
class RoomController {
    static async create(req, res) {
        try {
            const { name } = req.body;
            if (name !== undefined && typeof name !== 'string') {
                return res.status(400).json({ message: 'Room name must be a string' });
            }
            const ownerId = req.user?.id || (0, uuid_1.v4)();
            const room = await room_service_1.RoomService.createRoom({ name: name || '' }, ownerId);
            return res.status(201).json(room);
        }
        catch (err) {
            return res.status(500).json({ message: err.message || 'Failed to create room' });
        }
    }
    static async getById(req, res) {
        try {
            const id = (req.params.id || '').trim();
            if (!id) {
                return res.status(400).json({ message: 'Room ID is required' });
            }
            const room = await room_service_1.RoomService.getRoomDetails(id);
            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }
            return res.status(200).json(room);
        }
        catch (err) {
            return res.status(500).json({ message: err.message || 'Failed to get room details' });
        }
    }
    static async saveSnapshot(req, res) {
        try {
            const id = req.params.id;
            const { data } = req.body;
            if (!data) {
                return res.status(400).json({ message: 'Snapshot data is required' });
            }
            await room_service_1.RoomService.saveWhiteboardSnapshot(id, typeof data === 'string' ? data : JSON.stringify(data));
            return res.status(200).json({ success: true });
        }
        catch (err) {
            return res.status(500).json({ message: err.message || 'Failed to save snapshot' });
        }
    }
    static async getSnapshot(req, res) {
        try {
            const id = req.params.id;
            const snapshot = await room_service_1.RoomService.getWhiteboardSnapshot(id);
            return res.status(200).json({ data: snapshot });
        }
        catch (err) {
            return res.status(500).json({ message: err.message || 'Failed to get snapshot' });
        }
    }
    static async getMyRooms(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const rooms = await room_service_1.RoomService.getUserRooms(userId);
            return res.status(200).json(rooms);
        }
        catch (err) {
            return res.status(500).json({ message: err.message || 'Failed to fetch user rooms' });
        }
    }
    static async join(req, res) {
        try {
            const roomId = req.params.id;
            if (!roomId || !roomId.trim()) {
                return res.status(400).json({ message: 'Room ID is required' });
            }
            const existingRoom = await room_service_1.RoomService.getRoomDetails(roomId);
            if (!existingRoom) {
                return res.status(404).json({ message: 'Room not found' });
            }
            const userId = req.user?.id;
            if (userId) {
                await room_service_1.RoomService.joinRoom(roomId, userId);
            }
            return res.status(200).json({ success: true, room: existingRoom });
        }
        catch (err) {
            if (err.message === 'Room not found') {
                return res.status(404).json({ message: err.message });
            }
            return res.status(500).json({ message: err.message || 'Failed to join room' });
        }
    }
}
exports.RoomController = RoomController;
