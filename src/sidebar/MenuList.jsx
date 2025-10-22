import React from "react";
import { useState } from "react";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";
import Home from "../assets/home.png";
import Shop from "../assets/shop.png";
import Backpack from "../assets/backpack.png";
import History from "../assets/history.png";
import Profile from "../assets/Profile.png";
import Logout from "../assets/logout.png";

export default function MenuList() {
  const [selectedKeys, setSelectedKeys] = React.useState([]);
  const handleMenuClick = ({ key }) => {
    setSelectedKeys([key]);
  };

  const navigate = useNavigate();

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
      style: { color: "white" },
    },
  ];

  return (
    <>
      <Menu
        mode="inline"
        className="menu-bar"
        selectedKeys={selectedKeys}
        items={menuItems}
      />
    </>
  );
}
