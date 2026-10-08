import { WebSocket } from "ws";
const onlineUsers = new Map();
const roomSockets = new Map();
const socketUsers = new WeakMap();
// =======================================================
// Socket <-> User Mapping
// =======================================================
export const setSocketUser = (ws, userId) => {
    socketUsers.set(ws, userId);
};
export const getSocketUser = (ws) => {
    return socketUsers.get(ws);
};
export const removeSocketUser = (ws) => {
    socketUsers.delete(ws);
};
// =======================================================
// Online Users
// =======================================================
export const addSocket = (userId, ws) => {
    // Close old socket if user reconnects
    const oldSocket = onlineUsers.get(userId);
    if (oldSocket && oldSocket !== ws && oldSocket.readyState === WebSocket.OPEN) {
        oldSocket.close();
    }
    onlineUsers.set(userId, ws);
};
export const getSocket = (userId) => {
    return onlineUsers.get(userId);
};
export const isOnline = (userId) => {
    return onlineUsers.has(userId);
};
// =======================================================
// Room Management
// =======================================================
export const addSocketToRoom = (roomCode, ws) => {
    let sockets = roomSockets.get(roomCode);
    if (!sockets) {
        sockets = new Set();
        roomSockets.set(roomCode, sockets);
    }
    sockets.add(ws);
    console.log(`Room ${roomCode}: ${sockets.size} player(s)`);
};
export const removeSocketFromRoom = (roomCode, ws) => {
    const sockets = roomSockets.get(roomCode);
    if (!sockets)
        return;
    sockets.delete(ws);
    if (sockets.size === 0) {
        roomSockets.delete(roomCode);
    }
};
export const getRoomSockets = (roomCode) => {
    return roomSockets.get(roomCode);
};
// =======================================================
// Send Message To One Player
// =======================================================
export const sendToPlayer = (userId, message) => {
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
export const broadcastToRoom = (roomCode, message, excludeWs) => {
    const sockets = roomSockets.get(roomCode);
    if (!sockets)
        return;
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
export const removeSocket = (ws) => {
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
//# sourceMappingURL=socketManager.js.map