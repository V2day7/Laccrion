import React from "react";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import Home from "../assets/home.png";
import Shop from "../assets/shop.png";
import Backpack from "../assets/backpack.png";
import History from "../assets/history.png";
import Profile from "../assets/Profile.png";
import Logout from "../assets/logout.png";

export default function MenuList() {
  const [selectedKeys, setSelectedKeys] = React.useState([]);
  const [cookies, setCookie, removeCookie] = useCookies(["logged_user"]);
  const navigate = useNavigate();

  const handleMenuClick = ({ key }) => {
    setSelectedKeys([key]);
  };

  // ✅ Logout Function
  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?\n\nYou'll need to login again to access your account."
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("🚪 [LOGOUT] Starting logout process...");

      // ✅ Step 1: Call backend to clear cookie
      const response = await axios.post(
        "http://localhost/Laccrion/PHP/api/create/logout.php",
        {},
        {
          withCredentials: true,
        }
      );

      console.log("✅ [LOGOUT] Backend response:", response.data);

      // ✅ Step 2: Clear cookie from frontend
      removeCookie("logged_user", { path: "/" });
      console.log("✅ [LOGOUT] Cookie cleared");

      // ✅ Step 3: Clear storage
      localStorage.clear();
      sessionStorage.clear();
      console.log("✅ [LOGOUT] Storage cleared");

      // ✅ Step 4: Redirect to login
      console.log("🔄 [LOGOUT] Redirecting to login...");
      navigate("/");
      window.location.reload(); // Force reload to clear state
    } catch (error) {
      console.error("❌ [LOGOUT] Error:", error);

      // ✅ Still clear frontend even if backend fails
      removeCookie("logged_user", { path: "/" });
      localStorage.clear();
      sessionStorage.clear();

      // ✅ Still redirect to login
      navigate("/");
      window.location.reload();
    }
  };

  const menuItems = [
    {
      key: "Home",
      icon: <img src={Home} alt="Home" className="menu-icon" />,
      label: "Home",
      style: { color: "white" },
      onClick: () => {
        navigate("/HomePage");
      },
    },
    {
      key: "Shop",
      icon: <img src={Shop} alt="Shop" className="menu-icon" />,
      label: "Shop",
      style: { color: "white" },
      onClick: () => {
        navigate("/Shop");
      },
    },
    {
      key: "History",
      icon: <img src={History} alt="History" className="menu-icon" />,
      label: "History",
      style: { color: "white" },
    },
    {
      key: "Inventory",
      icon: <img src={Backpack} alt="Inventory" className="menu-icon" />,
      label: "Inventory",
      style: { color: "white" },
      onClick: () => {
        navigate("/Inventory");
      },
    },
    {
      key: "Profile",
      icon: <img src={Profile} alt="Profile" className="menu-icon" />,
      label: "Profile",
      style: { color: "white" },
    },
    {
      key: "Logout",
      icon: <img src={Logout} alt="Logout" className="menu-icon" />,
      label: "Logout",
      style: { color: "#ff6b6b" }, // ✅ Red color for logout
      onClick: handleLogout, // ✅ Call logout function
    },
  ];

  return (
    <>
      <Menu
        mode="inline"
        className="menu-bar"
        selectedKeys={selectedKeys}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </>
  );
}
