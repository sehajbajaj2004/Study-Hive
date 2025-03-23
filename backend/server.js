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
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

app.use(express.json());

// ✅ Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] },
});

// ✅✅✅ Real-Time Chat with Socket.io ✅✅✅
io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("joinRoom", async (roomId) => {
    socket.join(roomId);
    console.log(`✅ User joined room: ${roomId}`);

    try {
      const messagesSnapshot = await db.collection("chats").doc(roomId).collection("messages").orderBy("timestamp", "asc").get();
      const messages = messagesSnapshot.docs.map(doc => doc.data());
      socket.emit("loadMessages", messages);
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    }
  });

  socket.on("message", async ({ roomId, user, text }) => {
    try {
      const message = { user, text, timestamp: admin.firestore.FieldValue.serverTimestamp() };
      await db.collection("chats").doc(roomId).collection("messages").add(message);
      io.to(roomId).emit("message", message);
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  });

  socket.on("disconnect", () => console.log("❌ User disconnected"));
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

// ✅✅✅ YouTube API ✅✅✅
app.get("/api/youtube", async (req, res) => {
  const query = req.query.q || "study music";
  try {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        maxResults: 5,
        q: query,
        key: process.env.VITE_YOUTUBE_API_KEY,
        type: "video",
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("❌ YouTube API Error:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
