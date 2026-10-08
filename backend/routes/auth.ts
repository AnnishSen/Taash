import { Router } from "express";

const router = Router();

import {signin,signup} from "../controllers/authController.js"; 
import { authMiddleware } from "../middleware/authMidleware.js";
import { getMe } from "../controllers/authController.js";
import {logout} from "../controllers/authController.js"


router.post("/signup", signup);

router.post("/signin", signin);

router.get("/me", authMiddleware, getMe);

router.post("/logout", authMiddleware, logout);

export default router;

