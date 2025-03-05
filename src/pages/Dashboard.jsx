import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

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
          onClick={() => navigate("/personal-study-room")}
          className="bg-purple-500 px-6 py-3 rounded-md text-white text-lg hover:bg-purple-600 transition"
        >
          Personal Study Room
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
