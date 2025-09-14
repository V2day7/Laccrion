import React from "react";
import { FireFilled } from "@ant-design/icons";

import "./Sidebar.css";

const Logo = () => {
  return (
    <div className="logo">
      <div className="logo-icon">
        <img src={FireFilled} style={{ width: "70px", borderRadius: "50px" }} />
      </div>
    </div>
  );
};

export default Logo;
