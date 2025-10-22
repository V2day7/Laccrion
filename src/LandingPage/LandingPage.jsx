import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import "./LandingPage.css";
import strengthIcon from "../assets/Strength.png";
import calisthenicsIcon from "../assets/Calisthenic.png";
import cardioIcon from "../assets/Cardio.png";
import hybridIcon from "../assets/Hybrid.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [cookies] = useCookies(["logged_user"]);
  const [userId, setUserId] = useState(null);

  // Decode JWT to get user_id
  useEffect(() => {
    const token = cookies.logged_user;
    if (!token) {
      alert("Please login first!");
      navigate("/");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.user_id);
    } catch (error) {
      console.error("Invalid JWT:", error);
      navigate("/");
    }
  }, [cookies, navigate]);

  const handlePathSelect = async (path_id, path_name) => {
    if (!userId) {
      alert("User not logged in!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost/Laccrion/PHP/api/update/pathSelected.php",
        JSON.stringify({ user_id: userId, path_id }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.data.status === 200) {
        alert(`✅ ${path_name} path selected! Your journey begins now.`);
        navigate("/Homepage");
      } else {
        alert(response.data.message || "Failed to select path");
      }
    } catch (error) {
      console.error("Error selecting path:", error);
      alert("Failed to select path. Please try again.");
    }
  };

  return (
    <div className="landing-container">
      <h2 className="title">Pick Your Discipline. Push Your Limits.</h2>

      <div className="sections">
        <div
          className="section strength"
          onClick={() => handlePathSelect(1, "Strength")}
          style={{ cursor: "pointer" }}
        >
          <div className="content">
            <img className="icon" src={strengthIcon} alt="Strength" />
            <p>STRENGTH</p>
          </div>
        </div>

        <div
          className="section calisthenics"
          onClick={() => handlePathSelect(2, "Calisthenics")}
          style={{ cursor: "pointer" }}
        >
          <div className="content">
            <img className="icon" src={calisthenicsIcon} alt="Calisthenics" />
            <p>CALISTHENICS</p>
          </div>
        </div>

        <div
          className="section cardio"
          onClick={() => handlePathSelect(3, "Cardio")}
          style={{ cursor: "pointer" }}
        >
          <div className="content">
            <img className="icon" src={cardioIcon} alt="Cardio" />
            <p>CARDIO</p>
          </div>
        </div>

        <div
          className="section hybrid"
          onClick={() => handlePathSelect(4, "Hybrid")}
          style={{ cursor: "pointer" }}
        >
          <div className="content">
            <img className="icon" src={hybridIcon} alt="Hybrid" />
            <p>HYBRID</p>
          </div>
        </div>
      </div>
    </div>
  );
}
