import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  Navigate,
} from "react-router-dom";
import LoginSignup from "./LoginSignup/LoginSignup.jsx";
import AboutUs from "./AboutUs/AboutUs.jsx";
import LandingPage from "./LandingPage/LandingPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/LandingPage" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
