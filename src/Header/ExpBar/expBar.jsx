// ExpBar.jsx
import React from "react";
import "./expBar.css";

export default function ExpBar({ currentXP, nextLevelXP }) {
  const progress = Math.min((currentXP / nextLevelXP) * 100, 100);

  return (
    <div className="exp-bar">
      <div className="exp-fill" style={{ width: `${progress}%` }}></div>
      <span className="exp-text">
        {currentXP} / {nextLevelXP} XP
      </span>
    </div>
  );
}
