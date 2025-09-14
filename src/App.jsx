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
import Shop from "./Shop/Shop.jsx";
import Inventory from "./Inventory/Inventory.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/Shop" element={<Shop />} />
        <Route path="/Inventory" element={<Inventory />} />
      </Routes>
    </Router>
  );
}

export default App;
