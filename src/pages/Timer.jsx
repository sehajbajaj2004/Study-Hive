import React from "react";

const PomodoroTimer = ({ time, setTime, isRunning, setIsRunning, mode, switchMode }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="timer">
      <h2>{mode} Session:</h2>
      <h1>{formatTime(time)}</h1>
      <div className="timer-controls">
        <button onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={() => { setTime(25 * 60); setIsRunning(false); }}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
