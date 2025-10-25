import React, { useState } from "react";
import "./LoginSignup.css";
import fitnessBg from "../assets/fitness.jpg"; // Import your image
import axios from "axios";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

export default function LoginSignup() {
  const [showSignup, setShowSignup] = useState(false);

  const navigate = useNavigate();
  const [cookies, setCookie] = useCookies(["logged_user"]);

  const [userLog, setUserLog] = useState({ email: "", password: "" });

  const [userSignUpLog, setuserSignUpLog] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });

  const handleChangeLog = (event) => {
    const { name, value } = event.target;
    setUserLog((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeSignUp = (event) => {
    const { name, value } = event.target;
    setuserSignUpLog((prev) => ({ ...prev, [name]: value }));
  };

  const getJwtExpiry = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      console.error("Invalid JWT:", error);
      return null;
    }
  };

  const handleLoginSubmitLog = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost/Laccrion/PHP/api/read/login.php",
        JSON.stringify(userLog),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.data.status === 200) {
        const token = response.data.token;

        if (token) {
          const expiryDate = getJwtExpiry(token);
          setCookie("logged_user", token, {
            path: "/",
            expires: expiryDate,
            secure: false,
            sameSite: "strict",
          });
        }

        alert("✅ Login successful!");
        console.log("User:", response.data.username);

        // 🔥 Check if user has selected a path
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.user_id;

          const pathCheckResponse = await axios.get(
            `http://localhost/Laccrion/PHP/api/read/checkUserPath.php?user_id=${userId}`,
            { withCredentials: true }
          );

          if (pathCheckResponse.data.has_path) {
            navigate("/LandingPage");
          } else {
            navigate("/LandingPage");
          }
        } catch (pathError) {
          console.error("Error checking path:", pathError);
          // Default to homepage if check fails
          navigate("/Homepage");
        }
      } else {
        alert(response.data.message || "Login failed.");
      }
    } catch (error) {
      // 🔥 Handle all backend or network errors
      if (error.response) {
        const { message, status } = error.response.data;

        if (message === "Invalid password" || message === "User not found") {
          alert("❌ Wrong email or password.");
        } else if (message === "Invalid or empty JSON input") {
          alert("⚠️ Something’s wrong with the data sent from frontend.");
        } else {
          alert(
            `⚠️ Error ${status || "unknown"}: ${message || "Login failed"}`
          );
        }

        console.error("Server error:", error.response.data);
      } else {
        alert("⚠️ Network or server unreachable.");
        console.error(error);
      }
    }
  };

  const handleSignupSubmitLog = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    const { email, password, username, confirmPassword } = userSignUpLog;
    if (!email || !username || !password) {
      alert("Please fill email, username and password.");
      return;
    }
    if (password.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // 1) Call register endpoint
      const registerResp = await axios.post(
        "http://localhost/Laccrion/PHP/api/create/register.php",
        JSON.stringify({ email, password, username }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // not required for register but harmless
        }
      );

      if (registerResp.data?.status === 200) {
        // Registration succeeded on server
        alert("✅ Sign up successful!");

        // Option A: auto-login (call login endpoint so server sets cookie)

        // try {
        //   const loginResp = await axios.post(
        //     "http://localhost/Laccrion/PHP/api/read/login.php",
        //     JSON.stringify({ email, password }),
        //     {
        //       headers: { "Content-Type": "application/json" },
        //       withCredentials: true, // ensures server-set cookie is accepted by browser
        //     }
        //   );

        //   if (loginResp.data?.status === 200) {
        //     // If backend returns token in response.data.token, we can set cookie client-side OR rely on server-set cookie.
        //     const token = loginResp.data.token;
        //     if (token) {
        //       const expiryDate = getJwtExpiry(token);
        //       setCookie("logged_user", token, {
        //         path: "/",
        //         expires: expiryDate,
        //         secure: true, // set false for localhost if needed
        //         sameSite: "strict",
        //       });
        //       console.log("Client-side cookie set from returned token.");
        //     } else {
        //       // Server likely set the cookie via setcookie(); just inform developer
        //       console.log("Auto-login success — server should have set the cookie via setcookie().");
        //     }

        //     // reset state / go back to login view / redirect
        //     setuserSignUpLog({ email: "", password: "", username: "", confirmPassword: "" });
        //     setShowSignup(false);
        //     alert("You are now logged in.");
        //     // window.location.href = "/dashboard"; // optional redirect
        //   } else {
        //     // loginResp returned non-200: show its message
        //     alert(loginResp.data?.message || "Auto-login failed after signup.");
        //   }
        // } catch (loginErr) {
        //   // auto-login network/server error
        //   if (loginErr.response) {
        //     alert(loginErr.response.data?.message || "Auto-login failed.");
        //     console.error("Auto-login server error:", loginErr.response.data);
        //   } else {
        //     alert("Network error during auto-login.");
        //     console.error(loginErr);
        //   }
        // }
      } else {
        alert(registerResp.data?.message || "Signup failed.");
      }
    } catch (error) {
      if (error.response) {
        alert(error.response.data?.message || "Signup error.");
        console.error("Register server error:", error.response.data);
      } else {
        alert("Network or server unreachable during signup.");
        console.error(error);
      }
    }
  };

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${fitnessBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="login-container">
        {!showSignup ? (
          <>
            <h2>User Login</h2>
            <p className="subtitle">Please enter your details</p>
            <form onSubmit={handleLoginSubmitLog}>
              <label htmlFor="email">Email/Username</label>
              <input
                type="text"
                id="email"
                name="email"
                value={userLog.email}
                onChange={handleChangeLog}
                placeholder="Enter your Email/Username here"
                autoComplete="username"
              />
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={userLog.password}
                onChange={handleChangeLog}
                placeholder="Enter your password here"
                autoComplete="current-password"
              />
              <div className="forgot-row">
                <a href="#" className="forgot-link">
                  Forgot Password
                </a>
              </div>
              <button type="submit" className="sign-in-btn">
                Sign In
              </button>
            </form>
            <div className="create-account-row">
              <span>Are you new? </span>
              <button
                type="button"
                className="create-account-link"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#4f4fcf",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 500,
                }}
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
            <form onSubmit={handleSignupSubmitLog}>
              <label htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                name="email"
                value={userSignUpLog.email}
                onChange={handleChangeSignUp}
                placeholder="Enter your email"
                autoComplete="email"
              />
              <label htmlFor="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                name="username"
                value={userSignUpLog.username}
                onChange={handleChangeSignUp}
                placeholder="Choose a username"
                autoComplete="username"
              />
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                value={userSignUpLog.password}
                onChange={handleChangeSignUp}
                placeholder="Create a password"
                autoComplete="new-password"
              />
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm-password"
                name="confirmPassword"
                value={userSignUpLog.confirmPassword}
                onChange={handleChangeSignUp}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button type="submit" className="sign-in-btn">
                Sign Up
              </button>
            </form>
            <div className="create-account-row">
              <span>Already have an account? </span>
              <button
                type="button"
                className="create-account-link"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#4f4fcf",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 500,
                }}
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
