import React from "react";
import "./HomepageDropdownTemp.css";

export default function HomepageDropdownTemp({
  WorkoutQuest,
  showButton = true,
  onButtonClick,
  textTitle,
}) {
  return (
    <div className="DropdownTempParent">
      <div className="DropdownTempHeader">
        <h1>{textTitle || "No Title Available"}</h1>
      </div>
      <div className="BottomContents">
        <span className="xp-text">{WorkoutQuest}</span>
        {showButton && <button onClick={onButtonClick}>+</button>}
      </div>
    </div>
  );
}
