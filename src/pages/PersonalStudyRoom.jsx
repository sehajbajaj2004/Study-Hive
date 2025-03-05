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
  const tasksRef = useRef(null);

  const [showTimer, setShowTimer] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  
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

  // Task Management
  const addTask = () => {
    if (taskInput.trim() !== "") {
      setTasks([...tasks, { text: taskInput, completed: false }]);
      setTaskInput("");
    }
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const toggleCompleteTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    setTasks(newTasks);
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
          <button onClick={() => setShowTasks(!showTasks)}>
            <FaTasks /> Tasks
          </button>
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

      {/* Draggable Timer Window */}
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

      {/* Draggable Task Window */}
      {showTasks && (
        <Draggable nodeRef={tasksRef} positionOffset={{ x: "0%", y: "0%" }} bounds="parent">
          <div ref={tasksRef} className="task-container">
            <h3>Tasks</h3>
            <div className="task-input">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Enter task..."
              />
              <button onClick={addTask}>Add</button>
            </div>
            <ul className="task-list">
              {tasks.map((task, index) => (
                <li key={index} className={task.completed ? "completed" : ""}>
                  <span onClick={() => toggleCompleteTask(index)}>{task.text}</span>
                  <button className="task-close-btn" onClick={() => removeTask(index)}>❌</button>
                </li>
              ))}
            </ul>
            <button className="close-btn" onClick={() => setShowTasks(false)}>❌</button>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default PersonalStudyRoom;
