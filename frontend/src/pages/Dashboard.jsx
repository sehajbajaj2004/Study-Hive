import React from "react";
import {useEffect} from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  
  const handleFindBuddy = () => {
    const userData = JSON.parse(localStorage.getItem("userData")); // Must exist in localStorage

    if (socket && userData) {
      socket.emit('join-matchmaking-queue', userData);
      navigate("/finding-buddy"); // ✅ After emitting, move to finding-buddy screen
    } else {
      alert("Socket not ready or user data missing!");
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('matched', ({ groupId }) => {
        navigate(`/study-group/${groupId}`);
      });

      return () => {
        socket.off('matched');
      };
    }
  }, [socket, navigate]);

  if (!socket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h2 className="text-2xl">Connecting to server...</h2>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-8">Welcome to StudyHive</h1>

      <div className="grid gap-6 w-full max-w-md mt-10">
        <button
          onClick={() => navigate("/join-group")}
          className="bg-blue-500 px-6 py-3 rounded-md text-white text-lg hover:bg-blue-600 transition"
        >
          Join a Study Group
        </button>

        <button
          onClick={() => navigate("/create-group")}
          className="bg-green-500 px-6 py-3 rounded-md text-white text-lg hover:bg-green-600 transition"
        >
          Create a Study Group
        </button>

        <button 
          onClick={handleFindBuddy} 
          className="bg-yellow-500 text-white px-6 py-3 rounded-md text-lg hover:bg-yellow-600 transition"
        >
          Find Study Buddy
        </button>

        <button
          onClick={() => navigate("/personal-study-room")}
          className="bg-purple-500 px-6 py-3 rounded-md text-white text-lg hover:bg-purple-600 transition"
        >
          Personal Study Room
        </button>

        <button
          onClick={() => navigate("/video")}
          className="bg-purple-500 px-6 py-3 rounded-md text-white text-lg hover:bg-purple-600 transition"
        >
          Video Chat
        </button>

      </div>
    </div>
  );
};

export default Dashboard;
