"use client";

import { useState } from "react";
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
      key: "/instructors",
      icon: <TeamOutlined />,
      label: "Giảng viên",
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
        {/* Sidebar for mobile */}
        <Sider
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          collapsedWidth="0"
          theme="light"
          width={280}
          className={`lg:hidden ${
            collapsed ? "hidden" : "block"
          } fixed left-0 top-16 z-50 h-full shadow-2xl border-r border-gray-200`}
          style={{
            backgroundColor: "#ffffff",
            height: "calc(100vh - 64px)", // Trừ đi height của header
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

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setCollapsed(true)}
        />
      )}
    </Layout>
  );
}
