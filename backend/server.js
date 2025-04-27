import youtubeRouter from './youtube.js';
import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { db, admin } from "./firebase.js"; // ✅ Only import db, admin once
import cors from "cors";
import axios from "axios";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: "http://localhost:5173", // Your frontend Vite server
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const roomUsers = {};  // To track users in video rooms
const matchmakingQueue = []; // To match study buddies

// ✅✅✅ SOCKET.IO Real-Time Handlers ✅✅✅

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // ===== Chat Room Join =====
  socket.on("joinRoom", async (roomId) => {
    console.log("🟢 joinRoom:", socket.id, "Room:", roomId);
    socket.join(roomId);
    try {
      const messagesSnapshot = await db.collection("chats").doc(roomId).collection("messages").orderBy("timestamp", "asc").get();
      const messages = messagesSnapshot.docs.map(doc => doc.data());
      socket.emit("loadMessages", messages);
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    }
  });

  // ===== Chat Message =====
  socket.on("message", async ({ roomId, user, text }) => {
    console.log("✉️ Message from:", socket.id, "Room:", roomId);
    try {
      const message = { user, text, timestamp: admin.firestore.FieldValue.serverTimestamp() };
      await db.collection("chats").doc(roomId).collection("messages").add(message);
      io.to(roomId).emit("message", message);
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  });

  // ===== Video Chat Room Join =====
  socket.on("join-video-room", ({ roomId, userId }) => {
    socket.join(roomId);
    socket.userId = userId;

    if (!roomUsers[roomId]) {
      roomUsers[roomId] = [];
    }

    if (!roomUsers[roomId].includes(userId)) {
      roomUsers[roomId].push(userId);
    }

    io.to(roomId).emit("user-list", roomUsers[roomId]);

    const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    clientsInRoom.forEach((clientId) => {
      const clientSocket = io.sockets.sockets.get(clientId);
      if (clientSocket && clientSocket.userId && clientSocket.id !== socket.id) {
        socket.emit("user-joined", clientSocket.userId);
        clientSocket.emit("user-joined", userId);
      }
    });
  });

  // ===== WebRTC Signaling =====
  socket.on("offer", ({ offer, to }) => {
    const target = [...io.sockets.sockets.values()].find(s => s.userId === to);
    if (target) target.emit("offer", { offer, from: socket.userId });
  });

  socket.on("answer", ({ answer, to }) => {
    const target = [...io.sockets.sockets.values()].find(s => s.userId === to);
    if (target) target.emit("answer", { answer, from: socket.userId });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    const target = [...io.sockets.sockets.values()].find(s => s.userId === to);
    if (target) target.emit("ice-candidate", { candidate, from: socket.userId });
  });

  // ===== Matchmaking Queue =====
  socket.on('join-matchmaking-queue', async ({ userId, language, college, interest, year, location }) => {
    const newUser = { socketId: socket.id, userId, language, college, interest, year, location };

    const match = matchmakingQueue.find(user => haveCommonFields(user, newUser));

    if (match) {
      const groupId = `private-${Date.now()}`;

      await db.collection('studyGroups').doc(groupId).set({
        id: groupId,
        name: `Private Group: ${match.userId} & ${newUser.userId}`,
        members: [match.userId, newUser.userId],
        isPrivate: true,
        createdAt: new Date().toISOString()
      });

      io.to(socket.id).emit('matched', { groupId });
      io.to(match.socketId).emit('matched', { groupId });

      matchmakingQueue.splice(matchmakingQueue.indexOf(match), 1);
    } else {
      matchmakingQueue.push(newUser);
    }
  });

  function haveCommonFields(userA, userB) {
    return (
      userA.language === userB.language ||
      userA.college === userB.college ||
      userA.interest === userB.interest ||
      userA.year === userB.year ||
      userA.location === userB.location
    );
  }

  socket.on('cancel-matchmaking', () => {
    const index = matchmakingQueue.findIndex(user => user.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`🛑 User ${socket.id} cancelled matchmaking.`);
    }
  });
  
  // ===== Disconnect =====
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    for (const roomId in roomUsers) {
      if (roomUsers.hasOwnProperty(roomId)) {
        roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.userId);
        io.to(roomId).emit("user-list", roomUsers[roomId]);
      }
    }
  });
});

// ✅✅✅ EXPRESS REST APIs ✅✅✅

// Create Study Group
app.post("/create-group", async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    const newGroup = await db.collection("studyGroups").add({
      name,
      createdBy,
      members: [createdBy],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ id: newGroup.id, name, createdBy });
  } catch (error) {
    console.error("❌ Error creating study group:", error);
    res.status(500).json({ error: "Failed to create study group" });
  }
});

// Join Study Group
app.post("/join-group", async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    await db.collection("studyGroups").doc(groupId).update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    });
    res.json({ message: "✅ Joined group successfully" });
  } catch (error) {
    console.error("❌ Error joining study group:", error);
    res.status(500).json({ error: "Failed to join study group" });
  }
});

// Get Study Groups
app.get("/study-groups", async (req, res) => {
  try {
    const snapshot = await db.collection("studyGroups").orderBy("createdAt", "desc").get();
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(groups);
  } catch (error) {
    console.error("❌ Error retrieving study groups:", error);
    res.status(500).json({ error: "Failed to retrieve study groups" });
  }
});

// Study Plan APIs
app.post("/study-plan", async (req, res) => {
  try {
    const { userId, task } = req.body;
    await db.collection("studyPlans").doc(userId).collection("tasks").add({
      task,
      completed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: "✅ Task added" });
  } catch (error) {
    console.error("❌ Error adding study plan task:", error);
    res.status(500).json({ error: "Failed to create study plan task" });
  }
});

app.get("/study-plan/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasksSnapshot = await db.collection("studyPlans").doc(userId).collection("tasks").orderBy("createdAt", "desc").get();
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error retrieving study plan tasks:", error);
    res.status(500).json({ error: "Failed to retrieve study plan tasks" });
  }
});

app.put("/study-plan/:userId/:taskId", async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    await db.collection("studyPlans").doc(userId).collection("tasks").doc(taskId).update({
      completed: true,
    });
    res.json({ message: "✅ Task completed" });
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// Youtube Routes
app.use('/api/youtube', youtubeRouter);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
