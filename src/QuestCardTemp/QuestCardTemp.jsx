import React from "react";
import "./QuestCardTemp.css";
import TestImage from "../assets/backpack.png";
import CoinsImg from "../assets/CoinsB.png";

export default function QuestCardTemp({
  quest_id, // ← Add this
  QuestText,
  QuestImage,
  QuestXP,
  QuestCoin, // ← Changed from QuestCoins to match Homepage
  checked,
  onCheck,
  onComplete,
}) {
  const handleCheckboxChange = (e) => {
    e.stopPropagation(); // Prevent card click from firing

    if (!checked && onComplete && quest_id) {
      // Call completion handler before checking
      onComplete(quest_id);
    } else {
      // If already checked or no completion handler, just toggle
      onCheck && onCheck();
    }
  };

  return (
    <div className="QuestCardParent">
      <div
        className={`QuestCardContent gamified-card${checked ? " checked" : ""}`}
        tabIndex={0}
        role="button"
        aria-pressed={checked}
      >
        <div className="QuestCardCheckbox">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            disabled={checked} // ← Disable after completion
            aria-label="Complete quest"
            tabIndex={-1}
          />
        </div>
        <div className="QuestCardText">{QuestText || "No quest available"}</div>
        <div className="QuestCardIcon">
          <img src={QuestImage || TestImage} alt="quest" />
        </div>
        <div className="QuestCardXPandCoinsParent">
          <span className="QuestXP">{QuestXP || "+1XP"}</span>
          {QuestCoin !== undefined && QuestCoin !== null && (
            <span className="QuestCoinsRow">
              <img className="CoinsImg" src={CoinsImg} alt="" />
              <span className="QuestCoins">{QuestCoin}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
