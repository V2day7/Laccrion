import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";
import Header from "./Header/Header";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import "./MainLayout.css";
import axios from "axios";

export default function MainLayout() {
  const [cookies] = useCookies(["logged_user"]);
  const [userId, setUserId] = useState(null);

  const [username, setUsername] = useState(null);
  const [level, setLevel] = useState(null);
  const [rank, setRank] = useState(null);
  const [coin, setCoin] = useState(null);
  const [streak, setStreak] = useState(null);
  const [xp, setXp] = useState(null);
  const [nextLevelXp, setNextLevelXp] = useState(null);
  const [pathName, setPathName] = useState(null);

  // ✅ ADD THIS: Log when state updates
  useEffect(() => {
    console.log("🔄 MainLayout State Updated:", {
      xp,
      level,
      nextLevelXp,
      coin,
    });
  }, [xp, level, nextLevelXp, coin]);

  // ✅ Listen for XP updates from quests, workouts, etc.
  useEffect(() => {
    const handleXpUpdate = (event) => {
      console.log("📈 [MainLayout] XP Update Event Received:", event.detail);

      const {
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextLevelXp,
      } = event.detail;

      console.log("📈 [MainLayout] Updating state to:", {
        newXp,
        newLevel,
        newNextLevelXp,
      });

      // Update state immediately
      setXp(newXp);
      setLevel(newLevel);
      setNextLevelXp(newNextLevelXp);
    };

    console.log("👂 [MainLayout] Event listener attached for 'xpUpdated'");
    window.addEventListener("xpUpdated", handleXpUpdate);

    return () => {
      console.log("🔇 [MainLayout] Event listener removed");
      window.removeEventListener("xpUpdated", handleXpUpdate);
    };
  }, []);

  // ✅ Listen for coin updates from purchases
  useEffect(() => {
    const handleCoinsUpdate = (event) => {
      console.log("💰 [MainLayout] Coin Update Event Received:", event.detail);
      setCoin(event.detail.coins);
    };

    console.log("👂 [MainLayout] Event listener attached for 'coinsUpdated'");
    window.addEventListener("coinsUpdated", handleCoinsUpdate);

    return () => {
      console.log("🔇 [MainLayout] Coin listener removed");
      window.removeEventListener("coinsUpdated", handleCoinsUpdate);
    };
  }, []);

  useEffect(() => {
    if (userId) {
      axios
        .get(
          `http://localhost/Laccrion/PHP/api/read/fetchPlayerStats.php?user_id=${userId}`,
          {
            withCredentials: true,
          }
        )
        .then((response) => {
          const data = response.data.data;
          console.log("Player Stats:", data);

          setLevel(data.level);
          setRank(data.rank);
          setCoin(data.coin);
          setStreak(data.streak);
          setXp(data.xp);
          setNextLevelXp(data.next_level_xp);
          setPathName(data.path_name); // ✅ Now comes from fetchPlayerStats
        })
        .catch((error) => {
          console.error("Error fetching stats:", error);
        });
    }
  }, [userId]);

  useEffect(() => {
    const token = cookies.logged_user;
    console.log("Token:", cookies.logged_user);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.user_id);
        setUsername(payload.username);
      } catch (error) {
        console.error("Invalid JWT:", error);
      }
    }
  }, [cookies]);

  // ✅ Listen for coin updates from purchases
  useEffect(() => {
    const handleCoinsUpdate = (event) => {
      setCoin(event.detail.coins);
    };

    window.addEventListener("coinsUpdated", handleCoinsUpdate);
    return () => window.removeEventListener("coinsUpdated", handleCoinsUpdate);
  }, []);

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <Sidebar />
      </aside>

      <div className="main-content">
        <header className="header">
          <Header
            userId={userId}
            username={username}
            level={level}
            rank={rank}
            coin={coin}
            streak={streak}
            xp={xp}
            nextLevelXp={nextLevelXp}
            pathName={pathName} // ✅ Pass path name to Header
          />
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
