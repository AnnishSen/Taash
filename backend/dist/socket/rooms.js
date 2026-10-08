import { WebSocket } from "ws";
import prisma from "../lib/prisma.js";
import { addSocketToRoom, removeSocketFromRoom, getSocketUser, broadcastToRoom, sendToPlayer } from "./socketManager.js";
import { dealCards } from "./game.js";
import { hasGameState, getGameState, deleteGameState, deleteMatchDeck } from "./gameState.js";
export const joinRoom = async (ws, data) => {
    const room = await prisma.room.findUnique({
        where: {
            roomCode: data.roomCode,
        },
        include: {
            players: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            isOnline: true,
                        },
                    },
                },
                orderBy: { seat: "asc" },
            },
        },
    });
    if (!room) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Room not found",
        }));
        return;
    }
    if (ws._authPromise) {
        await ws._authPromise;
    }
    const userId = getSocketUser(ws);
    if (!userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
        }));
        return;
    }
    const player = room.players.find(p => p.userId === userId);
    if (!player) {
        ws.send(JSON.stringify({
            type: "error",
            message: "You are not a member of this room",
        }));
        return;
    }
    addSocketToRoom(room.roomCode, ws);
    // Send room snapshot directly to the joining WebSocket
    const snapshot = {
        type: "joined_room",
        roomCode: room.roomCode,
        hostId: room.hostId,
        status: room.status,
        players: room.players.map(p => ({
            userId: p.userId,
            username: p.user.username,
            seat: p.seat,
            isReady: p.isReady,
            isOnline: p.user.isOnline,
        })),
    };
    ws.send(JSON.stringify(snapshot));
    // Notify other players (excluding the newly joined socket)
    broadcastToRoom(room.roomCode, {
        type: "player_joined",
        userId,
    }, ws);
    // If game is in progress, send current game state directly to the joining socket for reconnection
    if (room.status === "PLAYING" && hasGameState(room.id)) {
        const gameState = getGameState(room.id);
        const syncPayload = {
            type: "game_sync",
            phase: gameState.phase,
            hand: gameState.hands.get(userId) || [],
            currentTurnUserId: gameState.currentTurnUserId,
            trickNumber: gameState.trickNumber,
            currentTrick: gameState.currentTrick,
            leadSuit: gameState.leadSuit,
            trumpOpened: gameState.trumpOpened,
            trumpSuit: gameState.trumpOpened ? gameState.trumpSuit : null,
            dealerUserId: gameState.dealerUserId,
            raangiUserId: gameState.raangiUserId,
            teamAScore: gameState.teamAScore,
            teamBScore: gameState.teamBScore,
            teamATricks: gameState.teamATricks,
            teamBTricks: gameState.teamBTricks,
            teamAMindis: gameState.teamAMindis,
            teamBMindis: gameState.teamBMindis,
            seats: gameState.players.map(p => ({
                seat: p.seat,
                userId: p.userId,
            })),
        };
        ws.send(JSON.stringify(syncPayload));
        // Resend choose_trump_request if raangi reconnects during choosing phase
        if (gameState.phase === "CHOOSING_TRUMP" && gameState.raangiUserId === userId) {
            ws.send(JSON.stringify({
                type: "choose_trump_request",
                hand: gameState.hands.get(userId) || [],
                message: "Choose one card as trump",
            }));
        }
    }
};
export const leaveRoom = async (ws, data) => {
    // Check authentication
    const userId = getSocketUser(ws);
    if (!userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
        }));
        return;
    }
    // Find room
    const room = await prisma.room.findUnique({
        where: {
            roomCode: data.roomCode,
        },
    });
    if (!room) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Room not found",
        }));
        return;
    }
    // Find THIS player
    const player = await prisma.roomPlayer.findFirst({
        where: {
            roomId: room.id,
            userId,
        },
    });
    if (!player) {
        ws.send(JSON.stringify({
            type: "error",
            message: "You are not in this room",
        }));
        return;
    }
    // Remove socket from room
    removeSocketFromRoom(room.roomCode, ws);
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
        sendToPlayer(userId, {
            type: "left_room",
            roomCode: room.roomCode,
        });
        return;
    }
    // Remove player from database
    await prisma.roomPlayer.delete({
        where: {
            id: player.id,
        },
    });
    // Tell everyone this player left
    broadcastToRoom(room.roomCode, {
        type: "player_left",
        userId,
    });
    // Check remaining players
    const remainingPlayers = await prisma.roomPlayer.findMany({
        where: {
            roomId: room.id,
        },
        orderBy: {
            seat: "asc",
        },
    });
    // Delete room if empty
    if (remainingPlayers.length === 0) {
        deleteGameState(room.id);
        deleteMatchDeck(room.id);
        await prisma.room.delete({
            where: {
                id: room.id,
            },
        });
        return;
    }
    // Transfer host if host left
    if (room.hostId === userId) {
        const newHost = remainingPlayers[0];
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
    // Success response to player who left
    sendToPlayer(userId, {
        type: "left_room",
        roomCode: room.roomCode,
    });
};
export const toggleReady = async (ws, data) => {
    const room = await prisma.room.findUnique({
        where: {
            roomCode: data.roomCode,
        },
    });
    if (!room) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Room not found",
        }));
        return;
    }
    const userId = getSocketUser(ws);
    if (!userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
        }));
        return;
    }
    const player = await prisma.roomPlayer.findFirst({
        where: {
            roomId: room.id,
            userId,
        },
    });
    if (!player) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Player not found",
        }));
        return;
    }
    const updatedPlayer = await prisma.roomPlayer.update({
        where: {
            id: player.id,
        },
        data: {
            isReady: !player.isReady,
        },
    });
    sendToPlayer(userId, {
        type: "ready_toggled",
        isReady: updatedPlayer.isReady,
    });
    // Notify everyone in the room
    broadcastToRoom(room.roomCode, {
        type: "player_ready",
        userId,
        isReady: updatedPlayer.isReady,
    });
};
export const startGame = async (ws, data) => {
    const room = await prisma.room.findUnique({
        where: {
            roomCode: data.roomCode,
        },
    });
    if (!room) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Room not found",
        }));
        return;
    }
    if (room.status !== "WAITING") {
        ws.send(JSON.stringify({
            type: "error",
            message: "Game has already started",
        }));
        return;
    }
    const userId = getSocketUser(ws);
    if (!userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "User not authenticated",
        }));
        return;
    }
    if ((room.hostId !== userId)) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Only host can start the game",
        }));
        return;
    }
    const players = await prisma.roomPlayer.findMany({
        where: {
            roomId: room.id,
        },
    });
    if (players.length !== 4) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Minimum 4 players required",
        }));
        return;
    }
    const allReady = players.every(player => player.isReady);
    if (!allReady) {
        ws.send(JSON.stringify({
            type: "error",
            message: "All players must be ready",
        }));
        return;
    }
    try {
        // testing dealCards  for now
        await dealCards(room.id);
        await prisma.room.update({
            where: {
                id: room.id,
            },
            data: {
                status: "PLAYING",
            },
        });
        // game_started is now broadcast from dealCards with full payload
    }
    catch (error) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Failed to start game",
        }));
    }
};
//# sourceMappingURL=rooms.js.map