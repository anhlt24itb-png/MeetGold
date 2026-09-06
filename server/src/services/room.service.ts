import { v4 as uuidv4 } from 'uuid';
import { Room, RoomDetails, CreateRoomDto } from '@meetdraw/shared';
import { RoomModel } from '../models/room.model';

export class RoomService {
  static async createRoom(dto: CreateRoomDto, ownerId: string): Promise<Room> {
    // Generate clean readable room ID (e.g. 9 chars like meet: xxx-xxxx-xxx or 8-char hex)
    const shortCode = Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
    const room: Room = {
      id: shortCode,
      name: dto.name.trim() || `Room ${shortCode.toUpperCase()}`,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await RoomModel.create(room);
    await RoomModel.addMember(room.id, ownerId);

    return room;
  }

  static async getRoomDetails(roomId: string): Promise<RoomDetails | null> {
    return RoomModel.findById(roomId);
  }

  static async saveWhiteboardSnapshot(roomId: string, data: string): Promise<void> {
    await RoomModel.saveSnapshot(roomId, data);
  }

  static async getWhiteboardSnapshot(roomId: string): Promise<string | null> {
    return RoomModel.getLatestSnapshot(roomId);
  }

  static async getUserRooms(userId: string): Promise<RoomDetails[]> {
    return RoomModel.findUserRooms(userId);
  }

  static async joinRoom(roomId: string, userId: string): Promise<RoomDetails> {
    const room = await RoomModel.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    await RoomModel.addMember(roomId, userId);
    return room;
  }
}
