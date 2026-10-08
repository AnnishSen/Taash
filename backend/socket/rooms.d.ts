import { WebSocket } from "ws";
interface JoinRoomMessage {
    type: "join_room";
    roomCode: string;
}
interface LeaveRoomMessage {
    type: "leave_room";
    roomCode: string;
}
interface ToggleReadyMessage {
    type: "toggle_ready";
    roomCode: string;
}
interface StartGameMessage {
    type: "start_game";
    roomCode: string;
}
export declare const joinRoom: (ws: WebSocket, data: JoinRoomMessage) => Promise<void>;
export declare const leaveRoom: (ws: WebSocket, data: LeaveRoomMessage) => Promise<void>;
export declare const toggleReady: (ws: WebSocket, data: ToggleReadyMessage) => Promise<void>;
export declare const startGame: (ws: WebSocket, data: StartGameMessage) => Promise<void>;
export {};
//# sourceMappingURL=rooms.d.ts.map