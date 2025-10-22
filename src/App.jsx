import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginSignup from "./LoginSignup/LoginSignup.jsx";
import AboutUs from "./AboutUs/AboutUs.jsx";
import LandingPage from "./LandingPage/LandingPage.jsx";
import Shop from "./Shop/ShopPage.jsx";
import Inventory from "./Inventory/InventoryPage.jsx";
import InventoryTemp from "./Inventory/InventoryCardsTemp.jsx";
import HomePage from "./Homepage/Homepage.jsx";
import MainLayout from "./MainLayout.jsx"; // ✅ new layout
// import MealModal from "./Shop/MealModal/MealModal.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* ❌ Pages WITHOUT sidebar/header */}
        <Route path="/" element={<LoginSignup />} />
        <Route path="/LandingPage" element={<LandingPage />} />

        {/* ✅ Pages WITH sidebar/header */}
        <Route element={<MainLayout />}>
          <Route path="/HomePage" element={<HomePage />} />
          <Route path="/Shop" element={<Shop />} />
          <Route path="/Inventory" element={<Inventory />} />
          {/* <Route path="/InventoryTemp" element={<InventoryTemp />} /> */}
          <Route path="/AboutUs" element={<AboutUs />} />
          {/* <Route path="/MealModal" element={<MealModal />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
