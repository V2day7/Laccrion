import React, { useState } from "react";
import "./QuestCardTemp.css";
import TestImage from "../assets/backpack.png";
import CoinsImg from "../assets/CoinsB.png";

export default function QuestCardTemp({
  quest_id,
  QuestText,
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
  trackingCondition = "",
}) {
  const [showDescription, setShowDescription] = useState(false);

  // 🔍 DEBUG: Log props
  console.log("QuestCardTemp Props:", {
    quest_id,
    QuestText,
    QuestXP,
    QuestCoin,
    trackingType,
    trackingCondition,
  });

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

  const getPathInfo = () => {
    if (trackingType === "manual") {
      return {
        name: "MANUAL",
        icon: "✋",
        color: "#95A5A6",
        gradient: "linear-gradient(135deg, #95A5A6, #7F8C8D)",
      };
    }

    const condition = trackingCondition.toLowerCase();

    if (condition.includes("workout")) {
      return {
        name: "STR",
        icon: "💪",
        color: "#E74C3C",
        gradient: "linear-gradient(135deg, #E74C3C, #C0392B)",
        progressGradient: "linear-gradient(90deg, #E74C3C, #FF6B6B)",
      };
    }

    if (condition.includes("quest")) {
      return {
        name: "HYB",
        icon: "🎯",
        color: "#27AE60",
        gradient: "linear-gradient(135deg, #27AE60, #229954)",
        progressGradient: "linear-gradient(90deg, #27AE60, #2ECC71)",
      };
    }

    if (condition.includes("consecutive") || condition.includes("week")) {
      return {
        name: "END",
        icon: "⛰️",
        color: "#9B59B6",
        gradient: "linear-gradient(135deg, #9B59B6, #8E44AD)",
        progressGradient: "linear-gradient(90deg, #9B59B6, #B565D8)",
      };
    }

    return {
      name: "AUTO",
      icon: "🤖",
      color: "#3498DB",
      gradient: "linear-gradient(135deg, #3498DB, #2980B9)",
      progressGradient: "linear-gradient(90deg, #3498DB, #5DADE2)",
    };
  };

  const pathInfo = getPathInfo();

  // 🔍 DEBUG: Log pathInfo
  console.log("PathInfo:", pathInfo);

  return (
    <div className="QuestCardParent">
      <div
        className={`QuestCardContent gamified-card${checked ? " checked" : ""}${
          trackingType === "auto" ? " auto-tracked" : ""
        }${showDescription ? " expanded" : ""}`}
        style={{
          borderLeft: `4px solid ${pathInfo.color}`,
        }}
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
                  width="14"
                  height="14"
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
                  style={{
                    width: `${progressPercentage}%`,
                    background: pathInfo.progressGradient || pathInfo.gradient,
                  }}
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
          <img src={TestImage} alt="quest" />
        </div>

        <div className="QuestCardXPandCoinsParent">
          <span
            className="path-badge"
            style={{
              background: pathInfo.gradient,
              borderColor: pathInfo.color,
            }}
          >
            <span className="path-icon">{pathInfo.icon}</span>
            <span className="path-name">{pathInfo.name}</span>
          </span>

          <span className="QuestXP">{QuestXP || "+0 XP"}</span>

          {QuestCoin !== undefined && QuestCoin !== null && (
            <span className="QuestCoinsRow">
              <img className="CoinsImg" src={CoinsImg} alt="coins" />
              <span className="QuestCoins">{QuestCoin}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
