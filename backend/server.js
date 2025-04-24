import youtubeRouter from './youtube.js';
import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import admin from "firebase-admin";
import cors from "cors";
import axios from "axios";
import fs from "fs";

// Load environment variables
dotenv.config();

// ✅ Load Firebase credentials from file instead of environment variable
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountPath) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT path is missing in .env");
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const server = http.createServer(app);

// ✅ Setup CORS (Allow all origins for development)
// const cors = require("cors");

app.use(cors({
  origin: "http://localhost:5173",  // your frontend url
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

app.use(express.json());

// ✅ Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});
const roomUsers = {};  // <-- global object to track users in video rooms



// ✅✅✅ Real-Time Chat with Socket.io ✅✅✅

io.on("connection", (socket) => {
  console.log("🔥🔥 THIS IS THE CORRECT SERVER.JS 🔥🔥");

  console.log("✅ A user connected:", socket.id);

  // Existing Chat Room Join
  socket.on("joinRoom", async (roomId) => {
    console.log("🟢 joinRoom event from:", socket.id, "Room:", roomId);
    socket.join(roomId);
    try {
      const messagesSnapshot = await db.collection("chats").doc(roomId).collection("messages").orderBy("timestamp", "asc").get();
      const messages = messagesSnapshot.docs.map(doc => doc.data());
      socket.emit("loadMessages", messages);
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    }
  });

  // Existing Chat message
  socket.on("message", async ({ roomId, user, text }) => {
    console.log("✉️ Message event from:", socket.id, "Room:", roomId);
    try {
      const message = { user, text, timestamp: admin.firestore.FieldValue.serverTimestamp() };
      await db.collection("chats").doc(roomId).collection("messages").add(message);
      io.to(roomId).emit("message", message);
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  });

  // Video Chat Room Join
// Add these socket event handlers inside your existing io.on("connection",...) block
socket.on("join-video-room", ({ roomId, userId }) => {
  socket.join(roomId);
  socket.userId = userId;

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  if (!roomUsers[roomId].includes(userId)) {
    roomUsers[roomId].push(userId);
  }

  // Inform all users in room
  io.to(roomId).emit("user-list", roomUsers[roomId]);

  // Emit existing users to new user
  const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
  clientsInRoom.forEach((clientId) => {
    const clientSocket = io.sockets.sockets.get(clientId);
    if (clientSocket && clientSocket.userId && clientSocket.id !== socket.id) {
      socket.emit("user-joined", clientSocket.userId);
      clientSocket.emit("user-joined", userId);
    }
  });
});

// VIDEO CHAT SIGNALING
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

// HANDLE DISCONNECT
socket.on("disconnect", () => {
  console.log("❌ Disconnected:", socket.id);

  for (const roomId in roomUsers) {
    if (roomUsers.hasOwnProperty(roomId)) {
      roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.userId);

      // Notify other users in the room
      io.to(roomId).emit("user-list", roomUsers[roomId]);
    }
  }
});

});

// ✅✅✅ Study Groups APIs ✅✅✅
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

// ✅✅✅ Study Plan APIs ✅✅✅
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


app.use('/api/youtube', youtubeRouter);

// ✅ Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
