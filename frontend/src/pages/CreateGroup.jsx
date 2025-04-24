import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateGroup = () => {
  const [groupName, setGroupName] = useState("");
  const navigate = useNavigate();

  const createGroup = async () => {
    const res = await fetch("http://localhost:5000/create-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName, createdBy: "user123" }),
    });

    if (res.ok) {
      navigate("/join-group"); // Redirect to join page
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white h-screen">
      <h1 className="text-2xl font-bold">Create Study Group</h1>
      <input
        type="text"
        placeholder="Enter group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="p-2 border rounded-md bg-gray-800 text-white mt-4 w-full"
      />
      <button onClick={createGroup} className="mt-4 bg-green-500 px-4 py-2 rounded-md w-full">
        Create Group
      </button>
    </div>
  );
};

export default CreateGroup;
