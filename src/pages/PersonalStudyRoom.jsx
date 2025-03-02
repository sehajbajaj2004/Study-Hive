import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import PomodoroTimer from "./Timer";
import "../styles/personalstudyroom.css";
import { FaHeadphones, FaClock, FaTasks, FaStickyNote, FaPlay } from "react-icons/fa";

const videoFile = "/assets/videos/studyBg.mp4";

const PersonalStudyRoom = () => {
  const sidebarRef = useRef(null);
  const mediaRef = useRef(null);
  const contentRef = useRef(null);
  const timerRef = useRef(null);

  const [showTimer, setShowTimer] = useState(false);
  const [time, setTime] = useState(25 * 60); // 25-minute Pomodoro session
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("Work");

  // Timer Logic
  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => setTime((prev) => prev - 1), 1000);
    } else if (time === 0) {
      switchMode();
    }
    return () => clearInterval(timer);
  }, [isRunning, time]);

  const switchMode = () => {
    if (mode === "Work") {
      setMode("Break");
      setTime(5 * 60); 
    } else {
      setMode("Work");
      setTime(25 * 60);
    }
    setIsRunning(false);
  };

  return (
    <div className="personal-study-room">
      {/* Background Video */}
      <video className="background-video" src={videoFile} autoPlay loop muted></video>

      {/* Draggable Sidebar */}
      <Draggable nodeRef={sidebarRef} positionOffset={{ x: "0%", y: "0%" }} bounds="parent">
        <div ref={sidebarRef} className="sidebar">
          <button><FaHeadphones /> Focus</button>
          <button onClick={() => setShowTimer(!showTimer)}>
            <FaClock /> Timer
          </button>
          <button><FaTasks /> Tasks</button>
          <button><FaStickyNote /> Notes</button>
        </div>
      </Draggable>

      {/* Draggable Media Player */}
      <Draggable nodeRef={mediaRef} positionOffset={{ x: "0%", y: "0%" }} bounds="parent">
        <div ref={mediaRef} className="media-player">
          <h3>Media Player</h3>
          <div className="media-controls">
            <button><FaPlay /> Play</button>
            <button>⏭ Next</button>
            <button>⏸ Pause</button>
          </div>
        </div>
      </Draggable>

      {/* Draggable Timer Window (Persists Even When Closed) */}
      {showTimer && (
        <Draggable nodeRef={timerRef} positionOffset={{ x: "0%", y: "0%" }} bounds="parent">
          <div ref={timerRef} className="timer-container">
            <PomodoroTimer 
              time={time} 
              setTime={setTime} 
              isRunning={isRunning} 
              setIsRunning={setIsRunning}
              mode={mode}
              switchMode={switchMode}
            />
            <button className="close-btn" onClick={() => setShowTimer(false)}>❌</button>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default PersonalStudyRoom;
