import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const FindingBuddy = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(true);

  useEffect(() => {
    if (socket) {
      socket.on('matched', ({ groupId }) => {
        setSearching(false);
        navigate(`/study-group/${groupId}`);
      });

      return () => {
        socket.off('matched');
      };
    }
  }, [socket, navigate]);

  const handleCancel = () => {
    if (socket) {
      socket.emit('cancel-matchmaking'); // 👈 we emit cancel event to server (optional but clean)
    }
    setSearching(false);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-8 animate-pulse">
        {searching ? "Finding a Study Buddy..." : "Stopped Searching"}
      </h1>
      {searching ? (
        <>
          <p className="text-lg mb-4">Please wait while we match you with someone! 🚀</p>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>

          <button
            onClick={handleCancel}
            className="mt-8 bg-red-500 px-6 py-3 rounded-md text-white hover:bg-red-600 transition"
          >
            Cancel Search
          </button>
        </>
      ) : (
        <p>Redirecting...</p>
      )}
    </div>
  );
};

export default FindingBuddy;
