import React, { useEffect, useState } from "react";

const DEFAULT_SECONDS = 1500;

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_SECONDS);
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="pomodoro">
      <div className="pomodoro-header">
        <h3>Pomodoro</h3>
        <span className="pomodoro-mode">Individual</span>
      </div>
      <div className="pomodoro-time">
        {minutes}:{seconds}
      </div>
      <div className="pomodoro-actions">
        <button type="button" className="secondary-btn" onClick={handleStart} disabled={isRunning || timeLeft <= 0}>
          Start
        </button>
        <button type="button" className="secondary-btn" onClick={handlePause} disabled={!isRunning}>
          Pause
        </button>
        <button type="button" className="ghost-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
