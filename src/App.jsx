import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  Navigate,
} from "react-router-dom";
import LoginSignup from "./LoginSignup";
import AboutUs from "./AboutUs";
import LandingPage from "./LandingPage";
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
