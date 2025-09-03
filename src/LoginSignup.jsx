import React, { useState } from 'react';
import './LoginSignup.css';
import fitnessBg from './assets/fitness.jpg'; // Import your image

function App() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${fitnessBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="login-container">
        {!showSignup ? (
          <>
            <h2>User Login</h2>
            <p className="subtitle">Please enter your details</p>
            <form>
              <label htmlFor="email">Email/Username</label>
              <input
                type="text"
                id="email"
                placeholder="Enter your Email/Username here"
                autoComplete="username"
              />
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password here"
                autoComplete="current-password"
              />
              <div className="forgot-row">
                <a href="#" className="forgot-link">Forgot Password</a>
              </div>
              <button type="submit" className="sign-in-btn">Sign In</button>
            </form>
            <div className="create-account-row">
              <span>Are you new? </span>
              <button
                type="button"
                className="create-account-link"
                style={{ background: 'none', border: 'none', padding: 0, color: '#4f4fcf', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                onClick={() => setShowSignup(true)}
              >
                Create an Account
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>User Signup</h2>
            <p className="subtitle">Create your account</p>
            <form>
              <label htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                placeholder="Enter your email"
                autoComplete="email"
              />
              <label htmlFor="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                placeholder="Choose a username"
                autoComplete="username"
              />
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                placeholder="Create a password"
                autoComplete="new-password"
              />
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm-password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button type="submit" className="sign-in-btn">Sign Up</button>
            </form>
            <div className="create-account-row">
              <span>Already have an account? </span>
              <button
                type="button"
                className="create-account-link"
                style={{ background: 'none', border: 'none', padding: 0, color: '#4f4fcf', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                onClick={() => setShowSignup(false)}
              >
                Login
              </button>
            </div>
          </>
        )}
      </div>
      <div className="right-section">
        <h1 className="main-title">BECAUSE YOU DESERVE TO FEEL AMAZING</h1>
        <p className="subtitle2">YOUR FITNESS JOURNEY STARTS HERE</p>
      </div>
    </div>
  );
}

export default App;
