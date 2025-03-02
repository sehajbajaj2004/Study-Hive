import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-gray-900 text-white h-screen">
      <h1 className="text-3xl font-bold">Welcome to StudyHive</h1>

      <div className="mt-6 flex flex-col gap-4">
        <button
          onClick={() => navigate("/join-group")}
          className="bg-blue-500 px-6 py-3 rounded-md text-white text-lg"
        >
          Join a Study Group
        </button>

        <button
          onClick={() => navigate("/create-group")}
          className="bg-green-500 px-6 py-3 rounded-md text-white text-lg"
        >
          Create a Study Group
        </button>
        <button
          onClick={() => navigate("/personal-study-room")}
          className="bg-green-500 px-6 py-3 rounded-md text-white text-lg"
        >
          Personal Study Room
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
