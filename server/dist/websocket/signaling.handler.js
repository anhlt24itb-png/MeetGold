"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalingHandler = void 0;
const ws_1 = require("ws");
const room_manager_1 = require("./room.manager");
const room_service_1 = require("../services/room.service");
class SignalingHandler {
    static handleMessage(ws, senderId, rawData) {
        try {
            const message = JSON.parse(rawData);
            const { type, roomId, targetId, payload } = message;
            if (!type || !roomId) {
                this.sendError(ws, roomId || 'unknown', senderId, 'Invalid signal format: missing type or roomId');
                return;
            }
            switch (type) {
                case 'JOIN_ROOM':
                    this.handleJoinRoom(ws, roomId, senderId, payload);
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
        }
        catch (err) {
            console.error('[SignalingHandler] Error handling message:', err);
            this.sendError(ws, 'unknown', senderId, 'Malformed JSON signal packet');
        }
    }
    static async handleJoinRoom(ws, roomId, peerId, payload) {
        const username = (payload && payload.username) ? payload.username.trim() : `User-${peerId.substring(0, 4)}`;
        const userId = payload && payload.userId ? payload.userId : undefined;
        // Verify or fetch room info
        const roomDetails = await room_service_1.RoomService.getRoomDetails(roomId);
        const roomName = roomDetails ? roomDetails.name : `Room ${roomId}`;
        // Join in roomManager
        const { peers, isHost } = room_manager_1.roomManager.joinRoom(roomId, peerId, username, ws, userId);
        // 1. Send back confirmation with existing peers list
        const roomJoinedMsg = {
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
        const userJoinedMsg = {
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
        room_manager_1.roomManager.broadcastToRoom(roomId, userJoinedMsg, peerId);
    }
    static handleLeaveRoom(peerId) {
        const result = room_manager_1.roomManager.leaveRoom(peerId);
        if (result) {
            const { roomId, peer } = result;
            const userLeftMsg = {
                type: 'USER_LEFT',
                roomId,
                senderId: peerId,
                payload: {
                    peerId,
                    reason: 'User disconnected',
                },
            };
            room_manager_1.roomManager.broadcastToRoom(roomId, userLeftMsg);
        }
    }
    static handleP2PSignal(message) {
        const { roomId, senderId, targetId, type } = message;
        if (!targetId) {
            console.warn(`[SignalingHandler] ${type} message missing targetId from peer ${senderId}`);
            return;
        }
        const delivered = room_manager_1.roomManager.sendToPeer(roomId, targetId, message);
        if (!delivered) {
            console.warn(`[SignalingHandler] Failed to route ${type} from ${senderId} to ${targetId} in room ${roomId}`);
        }
    }
    static sendError(ws, roomId, senderId, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            const errorMsg = {
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
exports.SignalingHandler = SignalingHandler;
