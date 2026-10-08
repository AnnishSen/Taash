import http from "http";
import { WebSocketServer } from "ws";

import { authenticate } from "./auth.js";
import {
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
} from "./rooms.js";
import { playCard, chooseTrump, openTrump, returnToLobby, startNextRound } from "./game.js";
import { removeSocket, getSocketUser, broadcastToRoom, isOnline, sendToPlayer } from "./socketManager.js";
import prisma from "../lib/prisma.js";

export const setupWebSocket = (
    
    server: http.Server
) => {

    const wss = new WebSocketServer({
        server,
    });

    

    wss.on("connection", (ws) => {
console.log("this line is running");
        console.log("Client Connected");

        ws.send(
            JSON.stringify({
                type: "connected",
                message: "Welcome to Taash WebSocket Server",
            })
        );

console.log("you can send data");
        ws.on("message", async (message) => {

            try {

       const data = JSON.parse(message.toString());
             
     switch (data.type) {

        case "auth":
       await authenticate(ws, data);
                   break;

      case "join_room":
      await joinRoom(ws, data);
                        break;

          case "leave_room":
           await leaveRoom(ws, data);
                        break;

                    case "toggle_ready":
            await toggleReady(ws, data);
                        break;

            case "start_game":
       await startGame(ws, data);
                        break;

                    case "play_card":
              await playCard(ws, data);
                        break;

                    case "choose_trump":
                        await chooseTrump(ws, data);
                        break;

                    case "open_trump":
                        await openTrump(ws);
                        break;

                    case "return_to_lobby":
                        await returnToLobby(ws, data);
                        break;

                    case "next_round":
                        await startNextRound(ws, data);
                        break;

                    case "invite_to_room": {
                        const callerId = getSocketUser(ws);
                        if (!callerId) {
                            ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
                            break;
                        }
                        const sender = await prisma.user.findUnique({
                            where: { id: callerId },
                            select: { username: true },
                        });
                        sendToPlayer(data.friendId, {
                            type: "room_invitation",
                            fromUserId: callerId,
                            fromUsername: sender?.username || "A friend",
                            roomCode: data.roomCode,
                        });
                        break;
                    }

                    // ==========================================
                    // In-Room WebRTC Voice Chat Signaling
                    // ==========================================
                    case "voice_offer": {
                        const callerId = getSocketUser(ws);
                        if (callerId && data.targetUserId) {
                            sendToPlayer(data.targetUserId, {
                                type: "voice_offer",
                                fromUserId: callerId,
                                sdp: data.sdp,
                                roomCode: data.roomCode,
                            });
                        }
                        break;
                    }

                    case "voice_answer": {
                        const callerId = getSocketUser(ws);
                        if (callerId && data.targetUserId) {
                            sendToPlayer(data.targetUserId, {
                                type: "voice_answer",
                                fromUserId: callerId,
                                sdp: data.sdp,
                                roomCode: data.roomCode,
                            });
                        }
                        break;
                    }

                    case "voice_candidate": {
                        const callerId = getSocketUser(ws);
                        if (callerId && data.targetUserId) {
                            sendToPlayer(data.targetUserId, {
                                type: "voice_candidate",
                                fromUserId: callerId,
                                candidate: data.candidate,
                                roomCode: data.roomCode,
                            });
                        }
                        break;
                    }

                    case "voice_status": {
                        const callerId = getSocketUser(ws);
                        if (callerId && data.roomCode) {
                            broadcastToRoom(data.roomCode, {
                                type: "voice_status",
                                userId: callerId,
                                isMuted: data.isMuted,
                                isDeafened: data.isDeafened,
                                isSpeaking: data.isSpeaking,
                            });
                        }
                        break;
                    }

                    case "voice_join": {
                        const callerId = getSocketUser(ws);
                        if (callerId && data.roomCode) {
                            broadcastToRoom(data.roomCode, {
                                type: "voice_join",
                                userId: callerId,
                            });
                        }
                        break;
                    }

                    case "voice_leave": {
                        const callerId = getSocketUser(ws);
                        if (callerId && data.roomCode) {
                            broadcastToRoom(data.roomCode, {
                                type: "voice_leave",
                                userId: callerId,
                            });
                        }
                        break;
                    }

                default:
                 ws.send(
                JSON.stringify({
                       type: "error",
                    message: "Unknown message type",
                  })
                        );
                }

            } catch (error) {

                console.error(error);

                ws.send(
                    JSON.stringify({
                        type: "error",
                        message: "Invalid message format",
                    })
                );

            }

        });

        ws.on("close", async () => {
            const userId = getSocketUser(ws);

            removeSocket(ws);

            if (userId) {
                // Only mark offline and broadcast if this was the active socket
                const stillOnline = isOnline(userId);
                if (!stillOnline) {
                    try {
                        await prisma.user.update({
                            where: { id: userId },
                            data: { isOnline: false },
                        });
                    } catch (e) {
                        // Ignore if user doesn't exist
                    }

                    // Notify room of disconnect
                    try {
                        const roomPlayer = await prisma.roomPlayer.findFirst({
                            where: { userId },
                        });
                        if (roomPlayer) {
                            const room = await prisma.room.findUnique({
                                where: { id: roomPlayer.roomId },
                            });
                            if (room) {
                                broadcastToRoom(room.roomCode, {
                                    type: "player_disconnected",
                                    userId,
                                });
                            }
                        }
                    } catch (e) {
                        // Ignore errors during disconnect cleanup
                    }
                }
            }

            console.log("Client Disconnected");
        });

    });

};