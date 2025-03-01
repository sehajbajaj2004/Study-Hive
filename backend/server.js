// backend/server.js (Node.js + Express + Socket.io + Firebase Firestore)
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io";
import admin from "firebase-admin";
import cors from "cors";
import { readFile } from "fs/promises";

// Load Firebase service account key (async import)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
const db = admin.firestore();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust to match your frontend
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Socket.io for Real-Time Chat
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", async (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
    
    try {
      const messagesSnapshot = await db
        .collection("chats")
        .doc(roomId)
        .collection("messages")
        .orderBy("timestamp", "asc")
        .get();
      
      const messages = messagesSnapshot.docs.map(doc => doc.data());
      socket.emit("loadMessages", messages); // Send messages to the user
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  });

  socket.on("message", async ({ roomId, user, text }) => {
    try {
      const message = {
        user,
        text,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("chats").doc(roomId).collection("messages").add(message);
      io.to(roomId).emit("message", message); // ✅ Broadcast to all users in the room
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// API: Create a Study Group
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
    res.status(500).json({ error: "Failed to create study group" });
  }
});

// API: Join a Study Group
app.post("/join-group", async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    await db.collection("studyGroups").doc(groupId).update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    });
    res.json({ message: "Joined group successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to join study group" });
  }
});

// API: Retrieve Study Groups
app.get("/study-groups", async (req, res) => {
  try {
    const snapshot = await db.collection("studyGroups").orderBy("createdAt", "desc").get();
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve study groups" });
  }
});

// API: Create Study Plan Task
app.post("/study-plan", async (req, res) => {
  try {
    const { userId, task } = req.body;
    await db.collection("studyPlans").doc(userId).collection("tasks").add({
      task,
      completed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: "Task added" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create study plan task" });
  }
});

// API: Fetch Study Plan Tasks
app.get("/study-plan/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasksSnapshot = await db.collection("studyPlans").doc(userId).collection("tasks").orderBy("createdAt", "desc").get();
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve study plan tasks" });
  }
});

// API: Update Task Status
app.put("/study-plan/:userId/:taskId", async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    await db.collection("studyPlans").doc(userId).collection("tasks").doc(taskId).update({
      completed: true,
    });
    res.json({ message: "Task completed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task status" });
  }
});

server.listen(5000, () => console.log("Server running on port 5000"));
