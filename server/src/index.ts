import path from "path";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/socketHandlers";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const app = express();
const httpServer = createServer(app);

// Socket.io with CORS for development
const io = new Server(httpServer, {
  cors: IS_PRODUCTION
    ? undefined
    : {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
      },
});

// Express middleware
app.use(express.json());
app.use(
  cors({
    origin: IS_PRODUCTION ? false : CLIENT_ORIGIN,
  })
);

// Serve the built client in production
if (IS_PRODUCTION) {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Register socket handlers for each connection
io.on("connection", (socket) => {
  registerSocketHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`mega-chess server running on port ${PORT}`);
  if (!IS_PRODUCTION) {
    console.log(`Accepting client connections from ${CLIENT_ORIGIN}`);
  }
});
