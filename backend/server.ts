import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { setupWebSocket } from "./socket/index.js";

import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import roomRoutes from "./routes/room.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = http.createServer(app);
setupWebSocket(server);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Taash Backend is Running 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/friends", friendRoutes);
app.use("/rooms", roomRoutes);

// Static frontend serving for production unified deployment
const possibleDistPaths = [
  path.join(__dirname, "../../frontend/dist"),
  path.join(__dirname, "../frontend/dist"),
  path.join(__dirname, "./public"),
  path.join(process.cwd(), "frontend/dist"),
  path.join(process.cwd(), "public"),
];

let frontendDist: string | null = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"))) {
    frontendDist = p;
    break;
  }
}

if (frontendDist) {
  console.log(`[Static] Serving frontend from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  // SPA fallback for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist!, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "Taash Backend is Running 🚀",
    });
  });
}

server.listen(PORT, () => {
  console.log(`    HTTP Server running on ${PORT}`);
});