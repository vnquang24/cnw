"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layout,
  Menu,
  Button,
  Space,
  Typography,
  Dropdown,
  Avatar,
  Badge,
} from "antd";
import {
  HomeOutlined,
  BookOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  PlusOutlined,
  SearchOutlined,
  BellOutlined,
  GlobalOutlined,
  MenuOutlined,
} from "@ant-design/icons";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Trang chủ",
    },
    {
      key: "/courses",
      icon: <BookOutlined />,
      label: "Khóa học",
    },
    {
      key: "/about",
      icon: <InfoCircleOutlined />,
      label: "Giới thiệu",
    },
  ];

  const handleMenuClick = (key: string) => {
    router.push(`/public${key}`);
  };

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    // Only apply overflow hidden on mobile when menu is open
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    if (!collapsed && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [collapsed]);

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Header với navigation ngang */}
      <Header
        className="shadow-sm border-b border-gray-200 px-4"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
          {/* Logo và brand */}
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="lg:hidden"
            />

            <Link href="/public" className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-200">
                <BookOutlined />
              </div>
              <div className="hidden sm:block">
                <Text className="text-sm">Học tập trực tuyến</Text>
              </div>
            </Link>
          </div>

          {/* Menu navigation chính */}
          <div className="hidden lg:flex flex-1 justify-center">
            <Menu
              mode="horizontal"
              selectedKeys={[]}
              className="border-0  min-w-0 flex-1 justify-center"
              style={{ backgroundColor: "transparent" }}
              items={menuItems.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
                onClick: () => handleMenuClick(item.key),
              }))}
            />
          </div>

          {/* Actions bên phải */}
          <div className="flex items-center">
            <Space size="small" className="sm:space-x-2">
              {/* Auth buttons */}
              <Button
                type="default"
                icon={<LoginOutlined />}
                onClick={() => router.push("/login")}
                className="hidden sm:flex"
              >
                Đăng nhập
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/register")}
                className="h-10"
              >
                <span className="hidden sm:inline">Đăng ký</span>
              </Button>
            </Space>
          </div>
        </div>
      </Header>

      <Layout style={{ backgroundColor: "#ffffff" }}>
        {/* Mobile overlay - must be before Sider to maintain proper z-index */}
        {!collapsed && (
          <div
            className="lg:hidden fixed z-40 bg-black/20 backdrop-blur-sm transition-all duration-300"
            style={{ top: "64px", left: 0, right: 0, bottom: 0 }}
            onClick={() => setCollapsed(true)}
          />
        )}

        {/* Sidebar for mobile */}
        <Sider
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          collapsedWidth="0"
          trigger={null}
          theme="light"
          width={280}
          className={`lg:hidden ${
            collapsed ? "hidden" : "block"
          } mobile-sidebar shadow-2xl border-r border-gray-200`}
          style={{
            backgroundColor: "#ffffff",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[]}
            className="border-0 pt-4 bg-white"
            style={{ backgroundColor: "#ffffff" }}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => {
                handleMenuClick(item.key);
                setCollapsed(true);
              },
              className:
                "hover:bg-blue-50 transition-colors duration-200 mx-2 rounded-lg mb-1",
              style: {
                height: "48px",
                display: "flex",
                alignItems: "center",
                fontSize: "15px",
                fontWeight: "500",
              },
            }))}
          />
        </Sider>

        {/* Main content */}
        <Content
          className="bg-gray-50"
          style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
