export type SignalType = 'JOIN_ROOM' | 'LEAVE_ROOM' | 'ROOM_JOINED' | 'USER_JOINED' | 'USER_LEFT' | 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'ROOM_USERS' | 'ERROR';
export interface PeerInfo {
    id: string;
    username: string;
    userId?: string;
    joinedAt: number;
    isHost?: boolean;
}
export interface SignalMessage<T = unknown> {
    type: SignalType;
    roomId: string;
    senderId: string;
    targetId?: string;
    payload?: T;
}
export interface JoinRoomPayload {
    username: string;
    userId?: string;
    email?: string;
}
export interface RoomJoinedPayload {
    selfId: string;
    roomId: string;
    roomName: string;
    peers: PeerInfo[];
}
export interface UserJoinedPayload {
    peerId: string;
    username: string;
    userId?: string;
    joinedAt: number;
}
export interface UserLeftPayload {
    peerId: string;
    reason?: string;
}
export interface OfferPayload {
    sdp: RTCSessionDescriptionInit;
}
export interface AnswerPayload {
    sdp: RTCSessionDescriptionInit;
}
export interface IceCandidatePayload {
    candidate: RTCIceCandidateInit;
}
export interface ErrorPayload {
    message: string;
    code?: string;
}
//# sourceMappingURL=signaling.d.ts.map