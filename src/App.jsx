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
import Sidebar from "./sidebar/Sidebar.jsx";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/Sidebar" element={<Sidebar />} />
      </Routes>
    </Router>
  );
}

export default App;
