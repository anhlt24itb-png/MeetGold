"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomService = void 0;
const room_model_1 = require("../models/room.model");
class RoomService {
    static async createRoom(dto, ownerId) {
        // Generate clean readable room ID (e.g. 9 chars like meet: xxx-xxxx-xxx or 8-char hex)
        const shortCode = Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
        const room = {
            id: shortCode,
            name: dto.name.trim() || `Room ${shortCode.toUpperCase()}`,
            ownerId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await room_model_1.RoomModel.create(room);
        await room_model_1.RoomModel.addMember(room.id, ownerId);
        return room;
    }
    static async getRoomDetails(roomId) {
        return room_model_1.RoomModel.findById(roomId);
    }
    static async saveWhiteboardSnapshot(roomId, data) {
        await room_model_1.RoomModel.saveSnapshot(roomId, data);
    }
    static async getWhiteboardSnapshot(roomId) {
        return room_model_1.RoomModel.getLatestSnapshot(roomId);
    }
    static async getUserRooms(userId) {
        return room_model_1.RoomModel.findUserRooms(userId);
    }
    static async joinRoom(roomId, userId) {
        const room = await room_model_1.RoomModel.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        await room_model_1.RoomModel.addMember(roomId, userId);
        return room;
    }
}
exports.RoomService = RoomService;
