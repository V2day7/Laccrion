import React, { useState } from "react";
import "./QuestCardTemp.css";
import TestImage from "../assets/backpack.png";
import CoinsImg from "../assets/CoinsB.png";

export default function QuestCardTemp({
  quest_id,
  QuestText,
  QuestImage,
  QuestXP,
  QuestCoin,
  checked,
  onCheck,
  onComplete,
  isAutoTracked = false,
  currentProgress = 0,
  requiredProgress = 1,
  trackingType = "manual",
  description = "",
}) {
  const [showDescription, setShowDescription] = useState(false);

  const handleCheckboxChange = (e) => {
    e.stopPropagation();

    if (trackingType === "auto") {
      return;
    }

    if (!checked && onComplete && quest_id) {
      onComplete(quest_id);
    } else {
      onCheck && onCheck();
    }
  };

  const toggleDescription = (e) => {
    e.stopPropagation();
    setShowDescription(!showDescription);
  };

  const progressPercentage =
    trackingType === "auto"
      ? Math.min((currentProgress / requiredProgress) * 100, 100)
      : 0;

  return (
    <div className="QuestCardParent">
      <div
        className={`QuestCardContent gamified-card${checked ? " checked" : ""}${
          trackingType === "auto" ? " auto-tracked" : ""
        }${showDescription ? " expanded" : ""}`}
        tabIndex={0}
        role="button"
        aria-pressed={checked}
      >
        <div className="QuestCardCheckbox">
          {trackingType === "auto" ? (
            <span className="auto-lock-icon">🔒</span>
          ) : (
            <input
              type="checkbox"
              checked={checked}
              onChange={handleCheckboxChange}
              disabled={checked}
              aria-label="Complete quest"
              tabIndex={-1}
            />
          )}
        </div>

        <div className="QuestCardTextContainer">
          <div className="QuestCardTitleRow">
            <div className="QuestCardText">
              {QuestText || "No quest available"}
            </div>

            {description && (
              <button
                className={`info-icon-btn ${showDescription ? "active" : ""}`}
                onClick={toggleDescription}
                aria-label="Toggle description"
                title={showDescription ? "Hide details" : "Show details"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            )}
          </div>

          {description && showDescription && (
            <div className="description-box">
              <div className="description-content">
                <span className="description-icon">💡</span>
                <p className="description-text">{description}</p>
              </div>
            </div>
          )}

          {trackingType === "auto" && (
            <div className="progress-section">
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 10 && (
                    <span className="progress-inner-text">
                      {Math.round(progressPercentage)}%
                    </span>
                  )}
                </div>
              </div>
              <span className="progress-text">
                {currentProgress}/{requiredProgress}
              </span>
            </div>
          )}
        </div>

        <div className="QuestCardIcon">
          <img src={QuestImage || TestImage} alt="quest" />
        </div>

        <div className="QuestCardXPandCoinsParent">
          {trackingType === "auto" && <span className="auto-badge">AUTO</span>}

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
