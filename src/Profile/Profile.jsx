import React from 'react';
import './Profile.css';
import sprinterIcon from './assets/Sprinter.png';

export default function Profile() {
  return (
    <div className="profile-container">
      {/* User Profile Section */}
      <div className="user-profile">
        <div className="profile-avatar">
          <div className="avatar-circle">
            <div className="avatar-helmet">🪖</div>
          </div>
        </div>
        <div className="profile-info">
          <h3 className="user-name">Haring Manggi Miguelito Malakas</h3>
          <p className="user-handle">@haringmanggimiguelitomalaks</p>
          <div className="user-rank">
            <span className="rank-text">Rank: Rookie V</span>
            <span className="shield-icon">🛡️</span>
          </div>
          <div className="level-progress">
            <span className="level-text">Lvl - 1 XP</span>
            <div className="level-bar">
              <div className="level-progress-fill" style={{ width: '30%' }}></div>
            </div>
            <span className="level-xp">15/50</span>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="achievements-section">
        <h2 className="achievements-title">Achievements</h2>
        <div className="achievements-grid">
          {Array.from({ length: 24 }, (_, index) => (
            <div key={index} className="achievement-badge">
              <div className="badge-shield">
                <div className="badge-icon">
                  <img src={sprinterIcon} alt="Sprinter" className="sprinter-image" />
                </div>
                <div className="badge-text">SPRINTER</div>
              </div>
              <div className="badge-category">CARDIO</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
