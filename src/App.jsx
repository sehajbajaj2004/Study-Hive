import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import JoinGroup from "./pages/JoinGroup";
import CreateGroup from "./pages/CreateGroup";
import StudyGroupChat from "./pages/StudyGroupChat";
import LandingPage from "./pages/LandingPage"; // Ensure this is correctly imported

function App() {
  return (
    <Routes>
      {/* ✅ Fix: Make sure the home route ("/") is defined */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/join-group" element={<JoinGroup />} />
      <Route path="/create-group" element={<CreateGroup />} />
      <Route path="/study-group/:groupId" element={<StudyGroupChat />} />
    </Routes>
  );
}

export default App;
