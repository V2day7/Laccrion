import React from "react";
import { Button, Layout, theme } from "antd";
import "./Sidebar.css";
import Logo from "./Logo.jsx";
import Menulist from "./MenuList.jsx";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";

const { Header, Sider } = Layout;
export default function Navbar() {
  const [collapsed, setCollapsed] = React.useState(true);

  return (
    <>
      <Layout className="Sidebar-Parent">
        <Sider
          collapsed={collapsed}
          collapsible
          theme={"dark"}
          trigger={null}
          className="Sidebar-Child"
        >
          {/* <Logo /> */}
          <Menulist />
          <Button
            type="text"
            className="toggle"
            onClick={() => setCollapsed(!collapsed)}
            icon={
              collapsed ? (
                <CaretRightOutlined
                  style={{ color: "white", fontSize: "20px" }}
                />
              ) : (
                <CaretLeftOutlined
                  style={{ color: "white", fontSize: "20px" }}
                />
              )
            }
          />
        </Sider>
        <Layout></Layout>
      </Layout>
    </>
  );
}
