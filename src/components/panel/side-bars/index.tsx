"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PanelsTopLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout, Menu, Button, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import MenuItemComponent from "../menu-item";
import { menuItems } from "@/lib/menu-data";
import { useStoreState, useStoreActions } from "@/lib/redux/hook";

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar: React.FC = () => {
  const { token } = theme.useToken();

  // Sử dụng local state để tránh hydration mismatch
  const [mounted, setMounted] = useState(false);

  const isShowSidebar = useStoreState((state) => state.appState.isShowSidebar);
  const setIsShowSidebar = useStoreActions(
    (actions) => actions.appState.setIsShowSidebar,
  );

  // Chỉ cập nhật UI sau khi component mount ở client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Xử lý toggle sidebar
  const handleToggleSidebar = () => {
    setIsShowSidebar(!isShowSidebar);
  };

  // Render placeholder ban đầu để tránh hydration error
  if (!mounted) {
    return (
      <Sider
        width={256}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          position: "relative",
          overflow: "visible",
        }}
        className="h-screen transition-all duration-300 shadow-sm"
      >
        {/* Placeholder content */}
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-6 bg-gray-100 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </Sider>
    );
  }

  return (
    <Sider
      width={isShowSidebar ? 64 : 256}
      collapsed={isShowSidebar}
      collapsible
      trigger={null}
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        position: "relative",
        overflow: "visible",
      }}
      className="h-screen transition-all duration-300 shadow-sm"
    >
      {/* Header/Logo */}
      <div
        className={`flex items-center ${
          isShowSidebar ? "justify-center" : "gap-3"
        } mb-6 ${isShowSidebar ? "px-3" : "px-6"} py-4 border-b`}
        style={{ borderColor: token.colorBorderSecondary }}
      >
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: token.colorPrimary }}
          >
            <PanelsTopLeft size={22} className="text-white" />
          </div>
          {!isShowSidebar && (
            <Title
              level={4}
              className="!mb-0"
              style={{ color: token.colorText }}
            >
              EduSystem
            </Title>
          )}
        </Link>
      </div>

      {/* Menu Items - Custom Component Integration */}
      <div className="flex-1 overflow-y-auto">
        <div className={isShowSidebar ? "px-1" : "px-2"}>
          {menuItems
            .filter((item) => !item.hidden)
            .map((item) => (
              <MenuItemComponent
                key={item.label}
                item={item}
                depth={0}
                hidden={item.hidden}
              />
            ))}
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        type="text"
        icon={
          isShowSidebar ? <ChevronRight size={20} /> : <ChevronLeft size={20} />
        }
        onClick={handleToggleSidebar}
        className="absolute -right-5 top-1/2 transform -translate-y-1/2 rounded-full shadow-lg hover:shadow-xl z-20 w-10 h-10 flex items-center justify-center"
        style={{
          backgroundColor: token.colorBgContainer,
          border: `2px solid ${token.colorBorderSecondary}`,
          color: token.colorTextSecondary,
        }}
      />
    </Sider>
  );
};

export default Sidebar;
