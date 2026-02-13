import { Server } from "socket.io";

let io;

export function initSocket(server) {
  const allowedOrigins = [
    "https://bugtracker-alpha.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174"
  ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", socket => {
    console.log("✅ Dashboard connected:", socket.id);
    
    socket.on("disconnect", () => {
      console.log("❌ Dashboard disconnected:", socket.id);
    });
  });
  
  console.log("📡 Socket.IO initialized with CORS:", allowedOrigins);
}

export function emitNewBug(bug) {
  if (!io) return;
  io.emit("new-bug", bug);
  console.log("📡 Emitting new bug via socket:", bug.id, "-", bug.title);
}

export function emitBugUpdated(bug) {
  if (io) {
    io.emit("bug-updated", bug);
    console.log("📡 Emitting bug update:", bug.id);
  }
}

export function emitIssueDeleted(id) {
  if (io) {
    io.emit("issue-deleted", { id });
    console.log("📡 Issue deletion broadcast:", id);
  }
}
