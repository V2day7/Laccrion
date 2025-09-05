import React from "react";
import "./AboutUs.css";

export default function AboutUs() {
  return (
    <div className="lacrrion-about">
      <div className="about-card">
        <div className="gym-background"></div>
        <div className="dark-overlay"></div>
        <div className="light-streak light-streak-1"></div>
        <div className="light-streak light-streak-2"></div>
        <div className="light-streak light-streak-3"></div>
        <div className="content-container">
          <div className="logo-section">
            <div className="logo-icon" aria-hidden="true">
              <span>🏋️</span>
            </div>
            <div className="logo-text">Lacrrion</div>
          </div>
          <h1 className="main-heading">About Us</h1>
          <div className="content-text">
            <p>
              Hi! We are Lacrrion — the gymrist gamification system to help
              users find their passion to get physique and schedule calorie
              routines.
            </p>
            <p>
              At Lacrrion, we believe fitness should feel rewarding, not
              overwhelming. That’s why we combine progress tracking,
              personalized routines, and fun challenges to turn workouts and
              meal planning into an engaging experience.
            </p>
            <p>
              Our goal is to keep you motivated, consistent, and confident as
              you build lasting healthy habits and enjoy every step of your
              fitness journey.
            </p>
          </div>
          <div className="cta-section">
            <div className="cta-text">YOUR FITNESS JOURNEY STARTS HERE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
