import prisma from "../lib/prisma.js";
import { broadcastToRoom, sendToPlayer } from "../socket/socketManager.js";
import { dealCards } from "../socket/game.js";
import { deleteGameState } from "../socket/gameState.js";
export const createRoom = async (req, res) => {
    const userId = req.user.userId;
    const existingRoom = await prisma.roomPlayer.findFirst({
        where: {
            userId: userId,
            room: { status: { in: ["WAITING", "PLAYING"] } },
        },
    });
    if (existingRoom) {
        return res.status(400).json({
            success: false,
            message: "You are already in an active room",
        });
    }
    function generateRoomCode(length = 6) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    let roomCode = generateRoomCode();
    // Ensure the room code is unique
    while (await prisma.room.findUnique({ where: { roomCode } })) {
        roomCode = generateRoomCode();
    }
    // Create room
    const room = await prisma.room.create({
        data: {
            roomCode,
            hostId: userId,
        },
    });
    // Add host to the room
    await prisma.roomPlayer.create({
        data: {
            roomId: room.id,
            userId,
            seat: 1,
            // isReady defaults to false
        },
    });
    const fullRoom = await prisma.room.findUnique({
        where: { id: room.id },
        include: {
            host: {
                select: { id: true, username: true, email: true, isOnline: true },
            },
            players: {
                include: {
                    user: { select: { id: true, username: true, email: true, isOnline: true } },
                },
                orderBy: { seat: "asc" },
            },
        },
    });
    // Return response
    return res.status(201).json({
        success: true,
        message: "Room created successfully",
        room: fullRoom,
    });
};
export const joinRoom = async (req, res) => {
    const userId = req.user.userId;
    const { roomCode } = req.body;
    const room = await prisma.room.findUnique({
        where: {
            roomCode: roomCode,
        }
    });
    if (!room) {
        return res.status(404).json({
            success: false,
            message: "Room not found",
        });
    }
    const existingPlayer = await prisma.roomPlayer.findFirst({
        where: {
            roomId: room.id,
            userId,
        },
    });
    if (existingPlayer) {
        // Player is rejoining their existing room & seat
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, isOnline: true },
        });
        broadcastToRoom(room.roomCode, {
            type: "player_joined",
            userId,
            username: user?.username || "Player",
            seat: existingPlayer.seat,
            isReady: existingPlayer.isReady,
            isOnline: user?.isOnline ?? true,
            roomCode: room.roomCode,
        });
        return res.status(200).json({
            success: true,
            message: "Rejoined room successfully",
            roomCode: room.roomCode,
            seat: existingPlayer.seat,
        });
    }
    // Check if user is already in another active room
    const inAnotherRoom = await prisma.roomPlayer.findFirst({
        where: {
            userId,
            roomId: { not: room.id },
            room: { status: { in: ["WAITING", "PLAYING"] } },
        },
        include: { room: true },
    });
    if (inAnotherRoom) {
        return res.status(400).json({
            success: false,
            message: `You are already in room ${inAnotherRoom.room.roomCode}. Leave it first.`,
        });
    }
    // For new players, room must be in WAITING state
    if (room.status !== "WAITING") {
        return res.status(400).json({
            success: false,
            message: "Game has already started",
        });
    }
    const playerCount = await prisma.roomPlayer.count({
        where: {
            roomId: room.id,
        },
    });
    if (playerCount >= 4) {
        return res.status(400).json({
            success: false,
            message: "Room is full",
        });
    }
    const players = await prisma.roomPlayer.findMany({
        where: {
            roomId: room.id,
        },
        select: {
            seat: true,
        }
    });
    let seat = 1;
    while (players.some(player => player.seat === seat)) {
        seat++;
    }
    await prisma.roomPlayer.create({
        data: {
            roomId: room.id,
            userId,
            seat,
        },
    });
    // Notify existing room sockets
    const newUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, isOnline: true },
    });
    broadcastToRoom(room.roomCode, {
        type: "player_joined",
        userId,
        username: newUser?.username || "Player",
        seat,
        isReady: false,
        isOnline: newUser?.isOnline ?? true,
        roomCode: room.roomCode,
    });
    return res.status(200).json({
        success: true,
        message: "Joined room successfully",
        roomCode: room.roomCode,
        seat,
    });
};
export const leaveRoom = async (req, res) => {
    const userId = req.user.userId;
    const roomPlayer = await prisma.roomPlayer.findFirst({
        where: {
            userId: userId,
        },
    });
    if (!roomPlayer) {
        return res.status(404).json({
            success: false,
            message: "You are not in any room",
        });
    }
    const room = await prisma.room.findUnique({
        where: {
            id: roomPlayer.roomId,
        },
    });
    if (!room) {
        return res.status(404).json({
            success: false,
            message: "Room not found",
        });
    }
    // If game is in progress, cancel game and clean up so players aren't stuck
    if (room.status === "PLAYING") {
        broadcastToRoom(room.roomCode, {
            type: "game_cancelled",
            reason: "A player left the game",
            userId,
        });
        await prisma.room.update({
            where: { id: room.id },
            data: { status: "FINISHED" },
        });
        deleteGameState(room.id);
        await prisma.roomPlayer.deleteMany({
            where: { roomId: room.id },
        });
        return res.status(200).json({
            success: true,
            message: "Game cancelled as player left",
        });
    }
    await prisma.roomPlayer.delete({
        where: {
            id: roomPlayer.id,
        },
    });
    // Tell sockets this player left
    broadcastToRoom(room.roomCode, {
        type: "player_left",
        userId,
    });
    const remainingPlayers = await prisma.roomPlayer.findMany({
        where: {
            roomId: room.id,
        },
    });
    if (remainingPlayers.length === 0) {
        await prisma.room.delete({
            where: {
                id: room.id,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Room deleted successfully",
        });
    }
    const newHost = remainingPlayers[0];
    if (room.hostId === userId && newHost) {
        await prisma.room.update({
            where: {
                id: room.id,
            },
            data: {
                hostId: newHost.userId,
            },
        });
        broadcastToRoom(room.roomCode, {
            type: "host_changed",
            hostId: newHost.userId,
        });
    }
    return res.status(200).json({
        success: true,
        message: "left room successfully",
    });
};
export const getRoom = async (req, res) => {
    const roomCode = req.params.roomCode; // non-null assertion
    // Find room with host and players
    const room = await prisma.room.findUnique({
        where: {
            roomCode,
        },
        include: {
            host: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isOnline: true,
                },
            },
            players: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            isOnline: true,
                        },
                    },
                },
                orderBy: {
                    seat: "asc",
                },
            },
        },
    });
    if (!room) {
        return res.status(404).json({
            success: false,
            message: "Room not found",
        });
    }
    return res.status(200).json({
        success: true,
        room,
    });
};
export const toggleReady = async (req, res) => {
    console.log("here");
    const userId = req.user.userId;
    const roomPlayer = await prisma.roomPlayer.findFirst({
        where: {
            userId,
        },
    });
    if (!roomPlayer) {
        return res.status(404).json({
            success: false,
            message: "You are not in any room",
        });
    }
    const updatedPlayer = await prisma.roomPlayer.update({
        where: {
            id: roomPlayer.id,
        },
        data: {
            isReady: !roomPlayer.isReady,
        },
    });
    // Broadcast ready status change via WebSocket
    const room = await prisma.room.findUnique({
        where: { id: roomPlayer.roomId },
    });
    if (room) {
        broadcastToRoom(room.roomCode, {
            type: "player_ready",
            userId,
            isReady: updatedPlayer.isReady,
        });
    }
    return res.status(200).json({
        success: true,
        message: updatedPlayer.isReady
            ? "Player is ready"
            : "Player is not ready",
        isReady: updatedPlayer.isReady,
    });
};
export const startGame = async (req, res) => {
    const userId = req.user.userId;
    const roomPlayer = await prisma.roomPlayer.findFirst({
        where: {
            userId,
        },
    });
    if (!roomPlayer) {
        return res.status(404).json({
            success: false,
            message: "You are not in any room",
        });
    }
    const room = await prisma.room.findUnique({
        where: {
            id: roomPlayer.roomId,
        },
    });
    if (!room) {
        return res.status(404).json({
            success: false,
            message: "Room not found",
        });
    }
    if (room.status !== "WAITING") {
        return res.status(400).json({
            success: false,
            message: "Game has already started",
        });
    }
    if (room.hostId !== userId) {
        return res.status(403).json({
            success: false,
            message: "Only the host can start the game",
        });
    }
    const players = await prisma.roomPlayer.findMany({
        where: {
            roomId: room.id,
        },
    });
    if (players.length !== 4) {
        return res.status(400).json({
            success: false,
            message: "Exactly 4 players are required",
        });
    }
    const allReady = players.every(player => player.isReady);
    if (!allReady) {
        return res.status(400).json({
            success: false,
            message: "All players must be ready",
        });
    }
    try {
        await dealCards(room.id);
        await prisma.room.update({
            where: {
                id: room.id,
            },
            data: {
                status: "PLAYING",
            },
        });
        return res.status(200).json({
            success: true,
            message: "Game started successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to start game",
        });
    }
};
export const getRooms = async (req, res) => {
    try {
        const rooms = await prisma.room.findMany({
            where: {
                status: { in: ["WAITING", "PLAYING"] },
            },
            include: {
                host: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                players: {
                    select: {
                        userId: true,
                        seat: true,
                        isReady: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
            take: 20,
        });
        return res.status(200).json({
            success: true,
            rooms: rooms.map(r => ({
                id: r.id,
                roomCode: r.roomCode,
                hostId: r.hostId,
                hostUsername: r.host.username,
                status: r.status,
                playerCount: r.players.length,
                players: r.players,
            })),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch rooms",
        });
    }
};
export const inviteToRoom = async (req, res) => {
    const userId = req.user.userId;
    const { friendId, roomCode } = req.body;
    if (!friendId || !roomCode) {
        return res.status(400).json({
            success: false,
            message: "friendId and roomCode are required",
        });
    }
    const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
    });
    sendToPlayer(friendId, {
        type: "room_invitation",
        fromUserId: userId,
        fromUsername: sender?.username || "A friend",
        roomCode,
    });
    return res.status(200).json({
        success: true,
        message: "Invitation sent successfully",
    });
};
//# sourceMappingURL=room.js.map