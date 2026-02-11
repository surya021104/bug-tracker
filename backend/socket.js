import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", socket => {
    console.log("Dashboard connected:", socket.id);
  });
}

export function emitNewBug(bug) {
  if (!io) return;

  io.emit("new-bug", bug);
  console.log("📡 Emitting new bug via socket:", bug.id, "-", bug.title);
}

export function emitBugUpdated(bug) {
  if (io) {
    io.emit("bug-updated", bug);
  }
}

export function emitIssueDeleted(id) {
  if (io) {
    io.emit("issue-deleted", { id });
    console.log("📡 Issue deletion broadcast:", id);
  }
}
