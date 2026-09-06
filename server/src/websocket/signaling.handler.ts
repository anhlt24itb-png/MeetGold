import { WebSocket } from 'ws';
import {
  SignalMessage,
  SignalType,
  JoinRoomPayload,
  RoomJoinedPayload,
  UserJoinedPayload,
  UserLeftPayload,
} from '@meetdraw/shared';
import { roomManager } from './room.manager';
import { RoomService } from '../services/room.service';

export class SignalingHandler {
  static handleMessage(ws: WebSocket, senderId: string, rawData: string): void {
    try {
      const message: SignalMessage = JSON.parse(rawData);
      const { type, roomId, targetId, payload } = message;

      if (!type || !roomId) {
        this.sendError(ws, roomId || 'unknown', senderId, 'Invalid signal format: missing type or roomId');
        return;
      }

      switch (type) {
        case 'JOIN_ROOM':
          this.handleJoinRoom(ws, roomId, senderId, payload as JoinRoomPayload);
          break;

        case 'LEAVE_ROOM':
          this.handleLeaveRoom(senderId);
          break;

        case 'OFFER':
        case 'ANSWER':
        case 'ICE_CANDIDATE':
          this.handleP2PSignal(message);
          break;

        default:
          console.warn(`[SignalingHandler] Unknown signal type: ${type}`);
          this.sendError(ws, roomId, senderId, `Unknown signal type: ${type}`);
      }
    } catch (err: any) {
      console.error('[SignalingHandler] Error handling message:', err);
      this.sendError(ws, 'unknown', senderId, 'Malformed JSON signal packet');
    }
  }

  private static async handleJoinRoom(
    ws: WebSocket,
    roomId: string,
    peerId: string,
    payload: JoinRoomPayload
  ): Promise<void> {
    const username = (payload && payload.username) ? payload.username.trim() : `User-${peerId.substring(0, 4)}`;
    const userId = payload && payload.userId ? payload.userId : undefined;

    // Verify or fetch room info
    const roomDetails = await RoomService.getRoomDetails(roomId);
    const roomName = roomDetails ? roomDetails.name : `Room ${roomId}`;

    // Join in roomManager
    const { peers, isHost } = roomManager.joinRoom(roomId, peerId, username, ws, userId);

    // 1. Send back confirmation with existing peers list
    const roomJoinedMsg: SignalMessage<RoomJoinedPayload> = {
      type: 'ROOM_JOINED',
      roomId,
      senderId: 'server',
      targetId: peerId,
      payload: {
        selfId: peerId,
        roomId,
        roomName,
        peers,
      },
    };
    ws.send(JSON.stringify(roomJoinedMsg));

    // 2. Broadcast to other peers that a new user joined
    const userJoinedMsg: SignalMessage<UserJoinedPayload> = {
      type: 'USER_JOINED',
      roomId,
      senderId: peerId,
      payload: {
        peerId,
        username,
        userId,
        joinedAt: Date.now(),
      },
    };
    roomManager.broadcastToRoom(roomId, userJoinedMsg, peerId);
  }

  public static handleLeaveRoom(peerId: string): void {
    const result = roomManager.leaveRoom(peerId);
    if (result) {
      const { roomId, peer } = result;
      const userLeftMsg: SignalMessage<UserLeftPayload> = {
        type: 'USER_LEFT',
        roomId,
        senderId: peerId,
        payload: {
          peerId,
          reason: 'User disconnected',
        },
      };
      roomManager.broadcastToRoom(roomId, userLeftMsg);
    }
  }

  private static handleP2PSignal(message: SignalMessage): void {
    const { roomId, senderId, targetId, type } = message;
    if (!targetId) {
      console.warn(`[SignalingHandler] ${type} message missing targetId from peer ${senderId}`);
      return;
    }

    const delivered = roomManager.sendToPeer(roomId, targetId, message);
    if (!delivered) {
      console.warn(`[SignalingHandler] Failed to route ${type} from ${senderId} to ${targetId} in room ${roomId}`);
    }
  }

  private static sendError(ws: WebSocket, roomId: string, senderId: string, message: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      const errorMsg: SignalMessage = {
        type: 'ERROR',
        roomId,
        senderId: 'server',
        targetId: senderId,
        payload: { message },
      };
      ws.send(JSON.stringify(errorMsg));
    }
  }
}
