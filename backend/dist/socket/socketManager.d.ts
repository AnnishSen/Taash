import { WebSocket } from "ws";
export declare const setSocketUser: (ws: WebSocket, userId: string) => void;
export declare const getSocketUser: (ws: WebSocket) => string | undefined;
export declare const removeSocketUser: (ws: WebSocket) => void;
export declare const addSocket: (userId: string, ws: WebSocket) => void;
export declare const getSocket: (userId: string) => WebSocket | undefined;
export declare const isOnline: (userId: string) => boolean;
export declare const addSocketToRoom: (roomCode: string, ws: WebSocket) => void;
export declare const removeSocketFromRoom: (roomCode: string, ws: WebSocket) => void;
export declare const getRoomSockets: (roomCode: string) => Set<WebSocket> | undefined;
export declare const sendToPlayer: (userId: string, message: unknown) => void;
export declare const broadcastToRoom: (roomCode: string, message: unknown, excludeWs?: WebSocket) => void;
export declare const removeSocket: (ws: WebSocket) => void;
//# sourceMappingURL=socketManager.d.ts.map