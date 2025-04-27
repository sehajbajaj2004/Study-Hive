import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/chat.css";
import VideoChat from "../components/VideoChat";

// Create a single socket instance
const socket = io("http://localhost:5000");

const StudyGroupChat = () => {
  const { groupId } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showVideo, setShowVideo] = useState(true);
  const [videoWidth, setVideoWidth] = useState(40); // Start with 40% video, 60% chat
  const [dragging, setDragging] = useState(false);
  const messagesEndRef = useRef(null);

  // Persist User ID
  const [userId, setUserId] = useState(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) return storedUserId;

    const newUserId = `User_${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem("userId", newUserId);
    return newUserId;
  });

  useEffect(() => {
    socket.emit("joinRoom", groupId);

    socket.on("loadMessages", (msgs) => {
      setMessages(msgs);
    });

    socket.on("message", (msg) => {
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
    socket.emit("message", newMessage);
    setMessage(""); // Clear input
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVideoChat = () => {
    setShowVideo(!showVideo);
  };

  // Handle dragging to resize
  const startDrag = () => setDragging(true);
  const stopDrag = () => setDragging(false);
  const onDrag = (e) => {
    if (!dragging) return;
    const newVideoWidth = (e.clientX / window.innerWidth) * 100;
    if (newVideoWidth > 10 && newVideoWidth < 90) {
      setVideoWidth(newVideoWidth);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [dragging]);

  return (
    <div className="study-group-page">
      {/* Chat Header */}
      <div className="chat-header">
        <div>Study Group Chat (You: {userId})</div>
        <button
          onClick={toggleVideoChat}
          className={`video-toggle-btn ${showVideo ? 'active' : ''}`}
        >
          {showVideo ? '📺 Hide Video' : '📺 Show Video'}
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* Video Section */}
        {showVideo && (
          <div
            style={{ width: `${videoWidth}%` }}
            className="bg-gray-800 flex flex-col justify-center items-center"
          >
            <VideoChat
              socket={socket}
              roomId={groupId}
              userId={userId}
              isOpen={showVideo}
            />
          </div>
        )}

        {/* Drag Divider */}
        {showVideo && (
          <div
            onMouseDown={startDrag}
            className="w-2 bg-gray-600 cursor-col-resize"
          ></div>
        )}

        {/* Chat Section */}
        <div className="flex-1 bg-gray-700 flex flex-col h-full">
          {/* Messages */}
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
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupChat;
