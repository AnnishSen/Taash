import { Router } from "express";
import { authMiddleware } from "../middleware/authMidleware.js";

const router = Router();

import { 
    createRoom,
    joinRoom,
    leaveRoom,
    getRoom,
    getRooms,
    toggleReady,
    startGame,
    inviteToRoom
 } from "../controllers/room.js";

router.get("/", authMiddleware, getRooms);

router.post("/create",authMiddleware, createRoom);

router.post("/join", authMiddleware,joinRoom);

router.post("/leave",authMiddleware, leaveRoom);

router.post("/invite", authMiddleware, inviteToRoom);

router.get("/:roomCode",authMiddleware, getRoom);

router.patch("/ready",authMiddleware,toggleReady);

router.post("/start", authMiddleware, startGame);

export default router;