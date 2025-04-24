import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinGroup = () => {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/study-groups")
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch((err) => console.error("Error fetching groups:", err));
  }, []);

  const joinGroup = async (groupId) => {
    await fetch("http://localhost:5000/join-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, userId: "user123" }),
    });

    navigate(`/study-group/${groupId}`); // Redirect to chat after joining
  };

  return (
    <div className="p-6 bg-gray-900 text-white h-screen">
      <h1 className="text-2xl font-bold">Join a Study Group</h1>
      <ul className="mt-4">
        {groups.map((group) => (
          <li key={group.id} className="p-4 bg-gray-800 rounded-md mb-2">
            <span className="text-lg font-semibold">{group.name}</span>
            <button
              onClick={() => joinGroup(group.id)}
              className="ml-4 bg-blue-500 px-4 py-2 rounded-md"
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JoinGroup;
