import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/chat.css";


const socket = io("http://localhost:5000");

const StudyGroupChat = () => {
  const { groupId } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // ✅ Persist User ID so it stays the same across refreshes
  const [userId, setUserId] = useState(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) return storedUserId;

    const newUserId = `User_${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem("userId", newUserId);
    return newUserId;
  });

  useEffect(() => {
    console.log(`🛜 Connecting as ${userId}...`);
    socket.emit("joinRoom", groupId);

    socket.on("loadMessages", (msgs) => {
      console.log("📜 Loaded Messages:", msgs);
      setMessages(msgs);
    });

    socket.on("message", (msg) => {
      console.log("🆕 New Message:", msg);
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("loadMessages");
      socket.off("message");
    };
  }, [groupId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      roomId: groupId,
      user: userId,
      text: message,
    };

    console.log("🚀 Sending:", newMessage);
    socket.emit("message", newMessage);
    setMessage(""); // Clear input
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        Study Group Chat (You: {userId})
      </div>

      {/* Chat Messages Section */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const isSameUser = prevMsg && prevMsg.user === msg.user;

            return (
              <div key={index} className={`message-container ${msg.user === userId ? "user" : "other"}`}>
                {!isSameUser && <span className="message-username">{msg.user}</span>}
                <div className="message-bubble">{msg.text}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress} // Press Enter to send
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default StudyGroupChat;
