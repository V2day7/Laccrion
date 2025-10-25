import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginSignup from "./LoginSignup/LoginSignup.jsx";
import AboutUs from "./AboutUs/AboutUs.jsx";
import LandingPage from "./LandingPage/LandingPage.jsx";
import History from "./History/HistoryPage.jsx";


function App() {
  return (
    <Router>
      <Routes>
        {/* ❌ Pages WITHOUT sidebar/header */}
        <Route path="/" element={<LoginSignup />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/Shop" element={<Shop />} />
        <Route path="/Inventory" element={<Inventory />} />
         <Route path="/History" element={<History />} />
        <Route path="/Sidebar" element={<Sidebar />} />
      </Routes>
    </Router>
  );
}

export default App;
