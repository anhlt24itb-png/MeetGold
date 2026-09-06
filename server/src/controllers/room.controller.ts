import { Request, Response } from 'express';
import { RoomService } from '../services/room.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

export class RoomController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name } = req.body;
      if (name !== undefined && typeof name !== 'string') {
        return res.status(400).json({ message: 'Room name must be a string' });
      }
      const ownerId = req.user?.id || uuidv4();
      const room = await RoomService.createRoom({ name: name || '' }, ownerId);
      return res.status(201).json(room);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Failed to create room' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = (req.params.id as string || '').trim();
      if (!id) {
        return res.status(400).json({ message: 'Room ID is required' });
      }
      const room = await RoomService.getRoomDetails(id);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      return res.status(200).json(room);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Failed to get room details' });
    }
  }

  static async saveSnapshot(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: 'Snapshot data is required' });
      }
      await RoomService.saveWhiteboardSnapshot(id, typeof data === 'string' ? data : JSON.stringify(data));
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Failed to save snapshot' });
    }
  }

  static async getSnapshot(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const snapshot = await RoomService.getWhiteboardSnapshot(id);
      return res.status(200).json({ data: snapshot });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Failed to get snapshot' });
    }
  }

  static async getMyRooms(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const rooms = await RoomService.getUserRooms(userId);
      return res.status(200).json(rooms);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Failed to fetch user rooms' });
    }
  }

  static async join(req: AuthenticatedRequest, res: Response) {
    try {
      const roomId = req.params.id as string;
      if (!roomId || !roomId.trim()) {
        return res.status(400).json({ message: 'Room ID is required' });
      }

      const existingRoom = await RoomService.getRoomDetails(roomId);
      if (!existingRoom) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const userId = req.user?.id;
      if (userId) {
        await RoomService.joinRoom(roomId, userId);
      }
      return res.status(200).json({ success: true, room: existingRoom });
    } catch (err: any) {
      if (err.message === 'Room not found') {
        return res.status(404).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message || 'Failed to join room' });
    }
  }
}
