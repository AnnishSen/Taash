import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { setupWebSocket } from "./socket/index.js";
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import roomRoutes from "./routes/room.js";
dotenv.config();
const app = express();
const server = http.createServer(app);
setupWebSocket(server);
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 8080;
app.get("/", (req, res) => {
    res.json({
        message: "Taash Backend is Running 🚀",
    });
});
app.use("/auth", authRoutes);
app.use("/friends", friendRoutes);
app.use("/rooms", roomRoutes);
server.listen(PORT, () => {
    console.log(`    HTTP Server running on ${PORT}`);
});
//# sourceMappingURL=server.js.map