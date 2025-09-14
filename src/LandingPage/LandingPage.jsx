import React from "react";
import "./LandingPage.css";
import strengthIcon from "../assets/Strength.png";
import calisthenicsIcon from "../assets/Calisthenic.png";
import cardioIcon from "../assets/Cardio.png";
import hybridIcon from "../assets/Hybrid.png";

export default function LandingPage() {
  return (
    <div className="landing-container">
      <h2 className="title">Pick Your Discipline. Push Your Limits.</h2>

      <div className="sections">
        <div className="section strength">
          <div className="content">
            <img className="icon" src={strengthIcon} alt="Strength" />
            <p>STRENGTH</p>
          </div>
        </div>

        <div className="section calisthenics">
          <div className="content">
            <img className="icon" src={calisthenicsIcon} alt="Calisthenics" />
            <p>CALISTHENICS</p>
          </div>
        </div>

        <div className="section cardio">
          <div className="content">
            <img className="icon" src={cardioIcon} alt="Cardio" />
            <p>CARDIO</p>
          </div>
        </div>

        <div className="section hybrid">
          <div className="content">
            <img className="icon" src={hybridIcon} alt="Hybrid" />
            <p>HYBRID</p>
          </div>
        </div>
      </div>
    </div>
  );
}
