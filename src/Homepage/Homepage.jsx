import React, { useEffect, useState } from "react";
import DropdownTemp from "./HomepageDropdownTemp";
import "./Homepage.css";
import QuestCardTemp from "../QuestCardTemp/QuestCardTemp";
import axios from "axios";
import { useCookies } from "react-cookie";
import WorkoutProgramModal from "./Modal/WorkoutProgramModal";

export default function Homepage() {
  const [cookies] = useCookies(["logged_user"]);
  const [userId, setUserId] = useState(null);

  const [dailyQuests, setDailyQuests] = useState([]);
  const [userWorkouts, setUserWorkouts] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(true); // ✅ NEW
  const [error, setError] = useState(null);
  const [checkedStates, setCheckedStates] = useState([]);
  const [workoutCheckedStates, setWorkoutCheckedStates] = useState([]); // ✅ NEW

  const [bonusRewards, setBonusRewards] = useState([]);
  const [bonusLoading, setBonusLoading] = useState(true);
  const [bonusCheckedStates, setBonusCheckedStates] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Decode JWT to get user_id
  useEffect(() => {
    const token = cookies.logged_user;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.user_id);
      } catch (error) {
        console.error("Invalid JWT:", error);
      }
    }
  }, [cookies]);

  // ✅ Fetch daily quests
  useEffect(() => {
    if (userId) {
      axios
        .get(
          `http://localhost/Laccrion/PHP/api/read/ReadDailyQuest.php?user_id=${userId}`
        )
        .then((response) => {
          console.log("Daily Quests:", response.data);

          if (response.data.status) {
            if (response.data.status === 403) {
              setError(response.data.message);
              setDailyQuests([]);
              setLoading(false);
              return;
            }
          } else if (Array.isArray(response.data)) {
            setDailyQuests(response.data);
            setCheckedStates(Array(response.data.length).fill(false));
            setError(null);
          }

          setLoading(false);
        })
        .catch((error) => {
          console.error("Error Fetching daily quest:", error);
          setError("Failed to load daily quests");
          setDailyQuests([]);
          setLoading(false);
        });
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchBonusRewards();
    }
  }, [userId]);

  const fetchBonusRewards = () => {
    setBonusLoading(true);
    axios
      .get(
        `http://localhost/Laccrion/PHP/api/read/ReadBonusRewards.php?user_id=${userId}`
      )
      .then((response) => {
        console.log("🎁 Bonus Rewards:", response.data);

        if (response.data.status === 403) {
          setBonusRewards([]);
        } else if (Array.isArray(response.data)) {
          setBonusRewards(response.data);
          setBonusCheckedStates(Array(response.data.length).fill(false));
        } else {
          setBonusRewards([]);
        }

        setBonusLoading(false);
      })
      .catch((error) => {
        console.error("❌ Error fetching bonus rewards:", error);
        setBonusRewards([]);
        setBonusLoading(false);
      });
  };

  // ✅ NEW: Fetch user's active workouts
  useEffect(() => {
    if (userId) {
      fetchUserWorkouts();
    }
  }, [userId]);

  const fetchUserWorkouts = () => {
    setWorkoutsLoading(true);
    axios
      .get(
        `http://localhost/Laccrion/PHP/api/read/ReadUserWorkouts.php?user_id=${userId}`
      )
      .then((response) => {
        console.log("📋 User Workouts:", response.data);

        if (response.data.status === 200) {
          setUserWorkouts(response.data.workouts || []);
          setWorkoutCheckedStates(
            Array(response.data.workouts?.length || 0).fill(false)
          );
        } else {
          setUserWorkouts([]);
        }

        setWorkoutsLoading(false);
      })
      .catch((error) => {
        console.error("❌ Error fetching workouts:", error);
        setUserWorkouts([]);
        setWorkoutsLoading(false);
      });
  };

  // ✅ Handle quest completion
  const handleQuestComplete = (quest_id, index) => {
    if (!userId) {
      alert("Please log in to complete quests!");
      return;
    }

    axios
      .post(
        "http://localhost/Laccrion/PHP/api/update/completeQuest.php",
        {
          user_id: userId,
          quest_id: quest_id,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      .then((response) => {
        if (response.data.status === 200) {
          const rewards = response.data.rewards;

          if (response.data.stats?.data) {
            window.dispatchEvent(
              new CustomEvent("xpUpdated", {
                detail: {
                  xp: response.data.stats.data.xp,
                  level: response.data.stats.data.level,
                  nextLevelXp: response.data.stats.data.next_level_xp,
                },
              })
            );

            window.dispatchEvent(
              new CustomEvent("coinsUpdated", {
                detail: { coins: response.data.stats.data.coin },
              })
            );
          }

          let message = `✅ Quest Completed!\n\n💪 +${rewards.xp} XP\n💰 +${rewards.coins} Coins`;

          if (response.data.level_up && response.data.level_up.leveled_up) {
            message += `\n\n🎉 LEVEL UP!\nYou are now Level ${response.data.level_up.new_level}!`;
          }

          alert(message);

          const updatedQuests = dailyQuests.filter((_, i) => i !== index);
          setDailyQuests(updatedQuests);
          setCheckedStates(updatedQuests.map(() => false));

          if (updatedQuests.length === 0) {
            setError(
              "🎉 All daily quests completed! Come back tomorrow for more rewards!"
            );
          }
          fetchBonusRewards();
        }
      })
      .catch((error) => {
        console.error("❌ Error completing quest:", error);
        alert(error.response?.data?.message || "Failed to complete quest");
      });
  };

  // ✅ NEW: Handle workout completion
  const handleWorkoutComplete = (program_id, index) => {
    if (!userId) {
      alert("Please log in to complete workouts!");
      return;
    }

    console.log("🏋️ Completing workout program:", program_id);

    axios
      .post(
        "http://localhost/Laccrion/PHP/api/update/completeWorkoutProgram.php",
        {
          user_id: userId,
          program_id: program_id,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      .then((response) => {
        console.log("✅ Workout completed:", response.data);

        if (response.data.status === 200) {
          const rewards = response.data.rewards;

          // Update XP/Coins
          if (response.data.stats?.data) {
            window.dispatchEvent(
              new CustomEvent("xpUpdated", {
                detail: {
                  xp: response.data.stats.data.xp,
                  level: response.data.stats.data.level,
                  nextLevelXp: response.data.stats.data.next_level_xp,
                },
              })
            );

            window.dispatchEvent(
              new CustomEvent("coinsUpdated", {
                detail: { coins: response.data.stats.data.coin },
              })
            );
          }

          let message = `🏋️ Workout Completed!\n\n💪 +${rewards.xp} XP\n💰 +${rewards.coins} Coins`;

          if (response.data.level_up && response.data.level_up.leveled_up) {
            message += `\n\n🎉 LEVEL UP!\nYou are now Level ${response.data.level_up.new_level}!`;
          }

          alert(message);

          // Remove completed workout
          const updatedWorkouts = userWorkouts.filter((_, i) => i !== index);
          setUserWorkouts(updatedWorkouts);
          setWorkoutCheckedStates(updatedWorkouts.map(() => false));

          fetchBonusRewards();
        }
      })
      .catch((error) => {
        console.error("❌ Error completing workout:", error);
        alert(error.response?.data?.message || "Failed to complete workout");
      });
  };

  // Render Daily Quest Content
  const renderDailyQuestContent = () => {
    if (loading) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
          Loading quests...
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: error.includes("Come back tomorrow") ? "#4CAF50" : "red",
          }}
        >
          {error}
        </div>
      );
    }

    if (dailyQuests.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#4CAF50" }}>
          🎉 All daily quests completed! Come back tomorrow!
        </div>
      );
    }

    return dailyQuests.map((quest, i) => (
      <QuestCardTemp
        key={quest.quest_id}
        quest_id={quest.quest_id}
        QuestText={quest.QuestText}
        QuestXP={quest.QuestXP}
        QuestCoin={quest.QuestCoin}
        checked={checkedStates[i]}
        onCheck={() =>
          setCheckedStates((prev) =>
            prev.map((val, idx) => (idx === i ? !val : val))
          )
        }
        onComplete={(quest_id) => handleQuestComplete(quest_id, i)}
      />
    ));
  };

  const handleBonusComplete = (bonus_id, index) => {
    if (!userId) {
      alert("Please log in to complete bonus rewards!");
      return;
    }

    axios
      .post(
        "http://localhost/Laccrion/PHP/api/create/completeBonusReward.php",
        { user_id: userId, bonus_id: bonus_id },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      .then((response) => {
        if (response.data.status === 200) {
          const rewards = response.data.rewards;

          if (response.data.stats?.data) {
            window.dispatchEvent(
              new CustomEvent("xpUpdated", {
                detail: {
                  xp: response.data.stats.data.xp,
                  level: response.data.stats.data.level,
                  nextLevelXp: response.data.stats.data.next_level_xp,
                },
              })
            );

            window.dispatchEvent(
              new CustomEvent("coinsUpdated", {
                detail: { coins: response.data.stats.data.coin },
              })
            );
          }

          const rarityEmojis = {
            legendary: "👑",
            epic: "💎",
            rare: "⭐",
            common: "🎁",
          };

          let message = `${rarityEmojis[response.data.rarity]} ${
            response.data.reward_name
          } Completed!\n\n💪 +${rewards.xp} XP\n💰 +${rewards.coins} Coins`;

          if (response.data.level_up && response.data.level_up.leveled_up) {
            message += `\n\n🎉 LEVEL UP!\nYou are now Level ${response.data.level_up.new_level}!`;
          }

          alert(message);

          const updatedBonuses = bonusRewards.filter((_, i) => i !== index);
          setBonusRewards(updatedBonuses);
          setBonusCheckedStates(updatedBonuses.map(() => false));

          if (updatedBonuses.length === 0) {
            alert("🎉 All bonus rewards completed! Come back tomorrow!");
          }
        }
      })
      .catch((error) => {
        console.error("❌ Error completing bonus reward:", error);
        alert(
          error.response?.data?.message || "Failed to complete bonus reward"
        );
      });
  };

  const renderBonusRewards = () => {
    if (bonusLoading) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
          Loading bonus rewards...
        </div>
      );
    }

    if (bonusRewards.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#4CAF50" }}>
          🎉 All bonus rewards completed! Come back tomorrow!
        </div>
      );
    }

    return bonusRewards.map((reward, i) => {
      const rarityColors = {
        common: "#95A5A6",
        rare: "#3498DB",
        epic: "#9B59B6",
        legendary: "#F39C12",
      };

      const rarityEmojis = {
        common: "",
        rare: "⭐",
        epic: "💎",
        legendary: "👑",
      };

      const progressText =
        reward.tracking_type === "auto" && reward.required_progress > 1
          ? ` (${reward.current_progress}/${reward.required_progress})`
          : "";

      return (
        <div
          key={reward.bonus_id}
          style={{
            borderLeft: `4px solid ${rarityColors[reward.rarity]}`,
            marginBottom: "10px",
          }}
        >
          <QuestCardTemp
            quest_id={reward.bonus_id}
            QuestText={`${rarityEmojis[reward.rarity]} ${
              reward.reward_name
            }${progressText}`}
            QuestXP={`+${reward.xp_reward} XP`}
            QuestCoin={reward.coin_reward}
            checked={bonusCheckedStates[i]}
            onCheck={() =>
              setBonusCheckedStates((prev) =>
                prev.map((val, idx) => (idx === i ? !val : val))
              )
            }
            onComplete={(bonus_id) => handleBonusComplete(bonus_id, i)}
            trackingType={reward.tracking_type}
            isAutoTracked={reward.tracking_type === "auto"}
            currentProgress={parseInt(reward.current_progress) || 0}
            requiredProgress={parseInt(reward.required_progress) || 1}
            description={reward.description || ""}
          />
        </div>
      );
    });
  };

  // ✅ NEW: Render User Workouts
  const renderUserWorkouts = () => {
    if (workoutsLoading) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
          Loading workouts...
        </div>
      );
    }

    if (userWorkouts.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
          No active workout programs. Click + to add one!
        </div>
      );
    }

    return userWorkouts.map((workout, i) => (
      <QuestCardTemp
        key={workout.program_id}
        quest_id={workout.program_id}
        QuestText={workout.workout_name}
        QuestXP={`+${workout.xp_reward} XP`}
        QuestCoin={workout.coin_reward}
        checked={workoutCheckedStates[i]}
        onCheck={() =>
          setWorkoutCheckedStates((prev) =>
            prev.map((val, idx) => (idx === i ? !val : val))
          )
        }
        onComplete={(program_id) => handleWorkoutComplete(program_id, i)}
      />
    ));
  };

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  // ✅ UPDATED: Handle multiple workout submissions
  const handleModalSubmit = async (selectedPrograms) => {
    console.log("Selected programs:", selectedPrograms);

    if (!Array.isArray(selectedPrograms) || selectedPrograms.length === 0) {
      alert("No workouts selected!");
      return;
    }

    try {
      // Add all workouts sequentially
      const results = [];

      for (const program of selectedPrograms) {
        const response = await axios.post(
          "http://localhost/Laccrion/PHP/api/create/addWorkoutProgram.php",
          {
            user_id: userId,
            workout_id: program.workout_id,
          },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        if (response.data.status === 200) {
          results.push(response.data);
        } else {
          console.warn(
            `Failed to add ${program.workout_name}:`,
            response.data.message
          );
        }
      }

      if (results.length > 0) {
        // Show success message with actual rewards
        const totalXP = results.reduce((sum, r) => sum + r.xp_reward, 0);
        const totalCoins = results.reduce((sum, r) => sum + r.coin_reward, 0);

        alert(
          `✅ ${results.length} Workout(s) Added Successfully!\n\n` +
            `Total Potential Rewards:\n` +
            `💪 ${totalXP} XP\n` +
            `🪙 ${totalCoins} Coins\n\n` +
            `Workouts:\n` +
            results
              .map(
                (r) =>
                  `• ${r.workout_name} (+${r.xp_reward} XP, ${r.coin_reward} Coins)`
              )
              .join("\n")
        );

        // Refresh workouts
        fetchUserWorkouts();
      } else {
        alert("Failed to add workouts. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error adding workouts:", error);
      alert(error.response?.data?.message || "Failed to add workouts");
    }
  };

  // const BonusRewards = ["test"];

  return (
    <div className="HomePageParent">
      <div className="HomepageContent">
        <DropdownTemp
          textTitle={"Daily Quest"}
          WorkoutQuest={renderDailyQuestContent()}
          showButton={false}
        />

        <DropdownTemp
          textTitle={"Your Workout Programs"}
          WorkoutQuest={renderUserWorkouts()}
          showButton={userWorkouts.length === 0}
          onButtonClick={
            userWorkouts.length === 0
              ? handleButtonClick
              : () =>
                  alert("⚠️ Complete your current workouts before adding more!")
          }
        />

        {/* ✅ REPLACE WITH THIS */}
        <DropdownTemp
          textTitle={"🎁 Bonus Rewards"}
          WorkoutQuest={renderBonusRewards()}
          showButton={false}
        />
      </div>

      <WorkoutProgramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
