import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import JoinGroup from "./pages/JoinGroup";
import CreateGroup from "./pages/CreateGroup";
import StudyGroupChat from "./pages/StudyGroupChat";
import LandingPage from "./pages/LandingPage"; 
import PersonalStudyRoom from "./pages/PersonalStudyRoom";


function App() {
  return (
    <Routes>
      {/* ✅ Fix: Make sure the home route ("/") is defined */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/join-group" element={<JoinGroup />} />
      <Route path="/create-group" element={<CreateGroup />} />
      <Route path="/study-group/:groupId" element={<StudyGroupChat />} />
      <Route path="/personal-study-room" element={<PersonalStudyRoom />} />
    </Routes>
  );
}

export default App;
