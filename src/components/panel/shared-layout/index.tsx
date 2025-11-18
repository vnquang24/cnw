"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Layout, Spin, Button, Space, Avatar, Typography, theme } from "antd";
import { PanelsTopLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { isTokenValid, getUserInfo, logout, type JwtPayload } from "@/lib/auth";
import { useStoreState, useStoreActions } from "@/lib/redux/hook";
import MenuItemComponent from "../menu-item";
import Header from "../header";
import { MenuItem } from "../menu-item/type";

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

interface SharedLayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
  title: string;
  logoText?: string;
  requiredRole?: "ADMIN" | "USER";
  redirectPath?: string;
}

export default function SharedLayout({
  children,
  menuItems,
  title,
  logoText = "EduSystem",
  requiredRole,
  redirectPath,
}: SharedLayoutProps) {
  const router = useRouter();
  const { token } = theme.useToken();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userInfo, setUserInfo] = useState<JwtPayload | null>(null);
  const [mounted, setMounted] = useState(false);

  // Redux state for sidebar
  const isShowSidebar = useStoreState((state) => state.appState.isShowSidebar);
  const setIsShowSidebar = useStoreActions(
    (actions) => actions.appState.setIsShowSidebar,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    const verifyAuth = async () => {
      try {
        const valid = await isTokenValid();
        if (!active) return;

        if (!valid) {
          await logout();
          router.replace("/login");
          return;
        }

        const info = getUserInfo();
        if (!info) {
          await logout();
          router.replace("/login");
          return;
        }

        // Kiểm tra role nếu có yêu cầu
        if (requiredRole && info.role !== requiredRole) {
          const fallback =
            redirectPath ||
            (info.role === "ADMIN" ? "/admin/dashboard" : "/user/courses");
          router.replace(fallback);
          return;
        }

        setUserInfo(info);
      } catch (error) {
        if (active) {
          await logout();
          router.replace("/login");
        }
      } finally {
        if (active) {
          setIsCheckingAuth(false);
        }
      }
    };

    verifyAuth();

    return () => {
      active = false;
    };
  }, [router, requiredRole, redirectPath]);

  const handleToggleSidebar = () => {
    setIsShowSidebar(!isShowSidebar);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Spin size="large" />
        <div className="text-gray-600">Đang kiểm tra phiên đăng nhập...</div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-medium">
            Không thể tải thông tin người dùng
          </div>
          <p className="text-gray-600">
            Phiên đăng nhập của bạn có thể đã hết hạn
          </p>
          <Button
            type="primary"
            size="large"
            onClick={async () => {
              try {
                await logout();
                router.push("/login");
              } catch (error) {
                console.error("Logout error:", error);
                // Force redirect even if logout fails
                router.push("/login");
              }
            }}
          >
            Quay lại trang đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  // Render placeholder ban đầu để tránh hydration error
  if (!mounted) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
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
        <Layout>
          <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
          <Content style={{ margin: "24px", minHeight: 360 }}>
            <div className="bg-white p-6 rounded-lg shadow-sm min-h-[70vh]">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-100 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout className="h-screen overflow-hidden">
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
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: token.colorPrimary }}
            >
              <PanelsTopLeft size={24} className="text-white" />
            </div>
            {!isShowSidebar && (
              <Title
                level={4}
                className="!mb-0"
                style={{ color: token.colorText }}
              >
                {logoText}
              </Title>
            )}
          </div>
        </div>

        {/* User Info */}
        {!isShowSidebar && (
          <div className="px-6 mb-4">
            <Space align="center" size={12}>
              <Avatar size={48} style={{ backgroundColor: token.colorPrimary }}>
                {userInfo?.name?.charAt(0) || userInfo?.sub?.charAt(0) || "U"}
              </Avatar>
              <div>
                <Text strong>{userInfo?.name || "Người dùng"}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {userInfo?.sub || "user@example.com"}
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* Menu Items */}
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

        {/* Logout Button */}
        {!isShowSidebar && (
          <div className="p-6 border-t border-gray-200">
            <Button block danger onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        )}

        {/* Toggle Button - Fixed position */}
        <div
          className="fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300"
          style={{
            left: isShowSidebar ? "54px" : "246px",
          }}
        >
          <Button
            type="text"
            icon={
              isShowSidebar ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )
            }
            onClick={handleToggleSidebar}
            className="rounded-full shadow-md hover:shadow-lg w-8 h-8 flex items-center justify-center p-0"
            style={{
              backgroundColor: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              color: token.colorTextSecondary,
            }}
          />
        </div>
      </Sider>
      <Layout className="flex flex-col h-screen">
        <Header
          user={{
            id: userInfo.userId || "",
            name: userInfo.name || userInfo.sub || "Người dùng",
            email: userInfo.sub || "",
            role: userInfo.role,
            avatar: undefined,
          }}
          pathName={title}
        />
        <Content className="flex-1 overflow-y-auto bg-gray-50 p-3">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
