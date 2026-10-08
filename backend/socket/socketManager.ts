import { WebSocket } from "ws";

const onlineUsers = new Map<string, WebSocket>();
const roomSockets = new Map<string, Set<WebSocket>>();
const socketUsers = new WeakMap<WebSocket, string>();

// =======================================================
// Socket <-> User Mapping
// =======================================================


export const setSocketUser = (
    ws: WebSocket,
    userId: string
): void => {
    socketUsers.set(ws, userId);
};

export const getSocketUser = (
    ws: WebSocket
): string | undefined => {
    return socketUsers.get(ws);
};

export const removeSocketUser = (
    ws: WebSocket
): void => {
    socketUsers.delete(ws);
};

// =======================================================
// Online Users
// =======================================================

export const addSocket = (
    userId: string,
    ws: WebSocket
): void => {

    // Close old socket if user reconnects
    const oldSocket = onlineUsers.get(userId);
    if (oldSocket && oldSocket !== ws && oldSocket.readyState === WebSocket.OPEN) {
        oldSocket.close();
    }

    onlineUsers.set(userId, ws);

};

export const getSocket = (
    userId: string
): WebSocket | undefined => {

    return onlineUsers.get(userId);

};

export const isOnline = (
    userId: string
): boolean => {

    return onlineUsers.has(userId);

};

// =======================================================
// Room Management
// =======================================================

export const addSocketToRoom = (
    roomCode: string,
    ws: WebSocket
): void => {

    let sockets = roomSockets.get(roomCode);

    if (!sockets) {

        sockets = new Set<WebSocket>();

        roomSockets.set(roomCode, sockets);

    }

    sockets.add(ws);

    console.log(
        `Room ${roomCode}: ${sockets.size} player(s)`
    );

};

export const removeSocketFromRoom = (
    roomCode: string,
    ws: WebSocket
): void => {

    const sockets = roomSockets.get(roomCode);

    if (!sockets) return;

    sockets.delete(ws);

    if (sockets.size === 0) {

        roomSockets.delete(roomCode);

    }

};

export const getRoomSockets = (
    roomCode: string
): Set<WebSocket> | undefined => {

    return roomSockets.get(roomCode);

};

// =======================================================
// Send Message To One Player
// =======================================================

export const sendToPlayer = (
    userId: string,
    message: unknown
): void => {

    const socket = getSocket(userId);

    if (!socket) {

        console.log(`${userId} is offline`);

        return;

    }

    if (socket.readyState !== WebSocket.OPEN) {

        console.log(`${userId} socket is closed`);

        return;

    }

    socket.send(JSON.stringify(message));

};

// =======================================================
// Broadcast To Whole Room
// =======================================================

export const broadcastToRoom = (
    roomCode: string,
    message: unknown,
    excludeWs?: WebSocket
): void => {

    const sockets = roomSockets.get(roomCode);

    if (!sockets) return;

    const data = JSON.stringify(message);

    for (const socket of sockets) {

        if (socket.readyState !== WebSocket.OPEN) {
            continue;
        }

        if (excludeWs && socket === excludeWs) {
            continue;
        }

        socket.send(data);

    }

};

// =======================================================
// Remove Socket Completely
// =======================================================

export const removeSocket = (
    ws: WebSocket
): void => {

    // Find user immediately
    const userId = getSocketUser(ws);

    if (userId) {

        // Only remove from onlineUsers if this IS the current socket
        // (prevents a stale close from removing a newer reconnected socket)
        const currentSocket = onlineUsers.get(userId);
        if (currentSocket === ws) {
            onlineUsers.delete(userId);
            console.log(`${userId} disconnected`);
        }

    }

    // Remove socket from every room
    for (const [roomCode, sockets] of roomSockets) {

        sockets.delete(ws);

        if (sockets.size === 0) {

            roomSockets.delete(roomCode);

        }

    }

    // Remove socket -> user mapping
    removeSocketUser(ws);

};