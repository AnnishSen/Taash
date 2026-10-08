import { Router } from "express";
const router = Router();
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriends, getPendingRequests, removeFriend, } from "../controllers/friendsController.js";
import { authMiddleware } from "../middleware/authMidleware.js";
router.post("/request", authMiddleware, sendFriendRequest);
router.get("/requests", authMiddleware, getPendingRequests);
router.post("/accept", authMiddleware, acceptFriendRequest);
router.post("/reject", authMiddleware, rejectFriendRequest);
router.get("/", authMiddleware, getFriends);
router.delete("/:friendId", authMiddleware, removeFriend);
export default router;
//# sourceMappingURL=friends.js.map