import "./Header.css";
import ExpBar from "./ExpBar/expBar";
import React, { useEffect } from "react";
import StreakIcon from "../assets/StreakIcon.png";
import CoinsW from "../assets/CoinsW.png";
import axios from "axios";

export default function Header({
  userId,
  username,
  level,
  rank,
  coin,
  xp,
  nextLevelXp,
  pathName,
}) {
  // ✅ ADD: Log when props change
  useEffect(() => {
    console.log("🎨 [Header] Props updated:", {
      level,
      xp,
      nextLevelXp,
      coin,
    });
  }, [level, xp, nextLevelXp, coin]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ✅ UPDATED: Test function with real-time event dispatch
  const handleAddXP = async () => {
    if (!userId) {
      alert("User not logged in!");
      return;
    }

    console.log("🧪 [Header] Test XP button clicked");

    try {
      const response = await axios.post(
        "http://localhost/Laccrion/PHP/api/create/testXpButton.php",
        {
          user_id: userId,
          xp_amount: 400,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      console.log("✅ [Header] XP Added response:", response.data);

      if (response.data.status === 200) {
        // ✅ Prepare event payload
        const xpPayload = {
          xp: response.data.new_xp,
          level: response.data.level,
          nextLevelXp: response.data.next_level_xp,
        };

        console.log("📤 [Header] Dispatching xpUpdated event with:", xpPayload);

        // ✅ Dispatch event (MainLayout will listen and update state)
        window.dispatchEvent(
          new CustomEvent("xpUpdated", {
            detail: xpPayload,
          })
        );

        console.log("📤 [Header] xpUpdated event dispatched!");

        // Check for level up
        if (response.data.level_up && response.data.level_up.leveled_up) {
          alert(
            `🎉 LEVEL UP!\n\nYou are now Level ${response.data.level_up.new_level}!\n\n` +
              `New XP Required: ${response.data.level_up.next_level_xp}`
          );

          console.log("🎊 [Header] Level up! Dispatching statsRefresh...");

          // ✅ Trigger full stats refresh
          window.dispatchEvent(new CustomEvent("statsRefresh"));
        } else {
          alert("✅ +400 XP gained!");
        }
      } else {
        alert(response.data.message || "Failed to add XP");
      }
    } catch (error) {
      console.error("❌ [Header] Error adding XP:", error);
      alert("Failed to add XP");
    }
  };

  return (
    <nav className="custom-navbar">
      <div className="navbar-container">
        {/* LEFT */}
        <div className="navbar-left">
          <p className="greeting">Welcome back, {username || "Guest"}!</p>
          <p className="greeting">Ready to conquer today's habits?</p>
        </div>

        {/* MIDDLE */}
        <div className="navbar-middle">
          <div className="level-info">
            <p>
              <strong>Level:</strong> {level ?? "--"}
            </p>
            <p>
              <strong>Rank:</strong> {rank || "--"}
            </p>
          </div>

          <div className="navBarExpBar">
            <p className="greeting">XP:</p>
            <ExpBar currentXP={xp ?? 0} nextLevelXP={nextLevelXp ?? 100} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="navbar-right">
          <span className="date">{formattedDate}</span>

          {/* Display selected path */}
          {pathName && (
            <p
              className="greeting"
              style={{ color: "#4CAF50", fontWeight: "bold" }}
            >
              Path: {pathName}
            </p>
          )}

          {/* ✅ TEST BUTTON - Updated text to match xp_amount */}
          <button
            onClick={handleAddXP}
            style={{
              padding: "5px 10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            +400 XP (Test)
          </button>

          <div className="coins">
            <img src={CoinsW} alt="coins" className="icon" />
            <span>{coin ?? "--"}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
