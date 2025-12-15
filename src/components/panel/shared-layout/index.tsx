"use client";

import React, { useEffect, useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Layout, Spin, Button, Space, Avatar, Typography, theme } from "antd";
import { PanelsTopLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { isTokenValid, getUserInfo, logout, type JwtPayload } from "@/lib/auth";
import { useStoreState, useStoreActions } from "@/lib/redux/hook";
import MenuItemComponent from "../menu-item";
import Header from "../header";
import { MenuItem } from "../menu-item/type";
import { filterMenuItemsByPermission } from "../menu-item/utils";
import { useFindUniqueUser } from "@/generated/hooks";
import { getUserInitials, getAvatarColorByRole } from "@/lib/profile-utils";
import { AbilityProvider, useAbility } from "@/lib/permissions/AbilityContext";

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

// Component nội bộ với AbilityProvider
function SharedLayoutContent({
  children,
  menuItems,
  title,
  logoText = "LearnHub",
  requiredRole,
  redirectPath,
  userInfo,
}: SharedLayoutProps & { userInfo: JwtPayload }) {
  const router = useRouter();
  const { token } = theme.useToken();
  const [mounted, setMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const ability = useAbility();

  // Fetch user data including avatar
  const userQueryArgs = useMemo(
    () => ({
      where: { id: userInfo?.userId || "" },
    }),
    [userInfo?.userId],
  );

  const { data: userData } = useFindUniqueUser(userQueryArgs, {
    enabled: Boolean(userInfo?.userId),
  });

  const userInitials = getUserInitials(
    userData?.name,
    userData?.email || userInfo?.sub,
  );
  const avatarColor = getAvatarColorByRole(userInfo?.role || "USER");

  // Redux state for sidebar
  const isShowSidebar = useStoreState((state) => state.appState.isShowSidebar);
  const setIsShowSidebar = useStoreActions(
    (actions) => actions.appState.setIsShowSidebar,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Removed auth check - moved to parent component

  const handleToggleSidebar = () => {
    setIsShowSidebar(!isShowSidebar);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Filter menu items dựa trên permissions
  const filteredMenuItems = React.useMemo(
    () => filterMenuItemsByPermission(menuItems, ability),
    [menuItems, ability],
  );

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
        className="hidden lg:block h-screen transition-all duration-300 shadow-sm"
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
              {userData?.avatarUrl ? (
                <Avatar size={48} src={userData.avatarUrl} />
              ) : (
                <Avatar size={48} style={{ backgroundColor: avatarColor }}>
                  {userInitials}
                </Avatar>
              )}
              <div>
                <Text strong>
                  {userData?.name || userInfo?.name || "Người dùng"}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {userData?.email || userInfo?.sub || "user@example.com"}
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <div className={isShowSidebar ? "px-1" : "px-2"}>
            {filteredMenuItems.map((item) => (
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
        {/* {!isShowSidebar && (
          <div className="p-6 border-t border-gray-200">
            <Button block danger onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        )} */}

        {/* Toggle Button - Fixed position - Hidden on mobile */}
        <div
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300"
          style={{
            left: isShowSidebar ? "54px" : "246px",
          }}
        >
          <Button
            type="text"
            icon={
              isShowSidebar ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronLeft size={12} />
              )
            }
            onClick={handleToggleSidebar}
            shape="circle"
            className="shadow-md hover:shadow-lg !w-6 !h-6 !min-w-0 flex items-center justify-center"
            style={{
              backgroundColor: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              color: token.colorTextSecondary,
            }}
          />
        </div>
      </Sider>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed z-40 bg-black/50 backdrop-blur-sm transition-all duration-300"
          style={{ top: 64, left: 0, right: 0, bottom: 0 }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <Sider
        width={280}
        collapsed={!isMobileOpen}
        collapsedWidth={0}
        trigger={null}
        theme="light"
        className={`lg:hidden mobile-sidebar shadow-2xl border-r border-gray-200 ${
          isMobileOpen ? "block" : "hidden"
        }`}
        style={{
          background: token.colorBgContainer,
          top: 0, // Admin layout header is inside content, so sidebar should be full height from top? No, let's stick to full screen overlay style initially.
          height: "100vh", // Let's override the mobile-sidebar class if needed, or use a new logic.
          // Actually, .mobile-sidebar has top: 64px !important.
          // If we want it full screen (covering header) or below header?
          // IF we want it to cover everything (Drawer style), we should override top.
          // Let's use standard Drawer style for Admin which usually covers sidebar area.
          // But wait, user liked the "below header" style.
          // Admin header is NOT fixed at top of screen for the whole viewport if Sider is hidden.
          // Let's force it to standard full height drawer for simplicity first, or try to match public layout.
          // Given .mobile-sidebar enforces top: 64px, let's see if that works.
          // NOTE: Admin Header is inside the right layout.
        }}
      >
        {/* Header/Logo Mobile */}
        <div
          className="flex items-center gap-3 mb-6 px-6 py-4 border-b"
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: token.colorPrimary }}
          >
            <PanelsTopLeft size={24} className="text-white" />
          </div>
          <Title level={4} className="!mb-0" style={{ color: token.colorText }}>
            {logoText}
          </Title>
        </div>

        {/* User Info Mobile */}
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

        {/* Menu Items Mobile */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2">
            {filteredMenuItems.map((item) => (
              <MenuItemComponent
                key={item.label}
                item={item}
                depth={0}
                hidden={item.hidden}
              />
            ))}
          </div>
        </div>

        {/* Logout Button Mobile */}
        <div className="p-6 border-t border-gray-200">
          <Button block danger onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </Sider>

      <Layout className="flex flex-col h-screen">
        <Header
          user={{
            id: userInfo.userId || "",
            name:
              userData?.name || userInfo.name || userInfo.sub || "Người dùng",
            email: userData?.email || userInfo.sub || "",
            role: userInfo.role,
            avatar: userData?.avatarUrl || undefined,
          }}
          pathName={title}
          onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
        />
        <Content className="flex-1 overflow-y-auto bg-gray-50 p-2 sm:p-3 md:p-4 lg:p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

// Main exported component với auth check
export default function SharedLayout({
  children,
  menuItems,
  title,
  logoText = "LearnHub",
  requiredRole,
  redirectPath,
}: SharedLayoutProps) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userInfo, setUserInfo] = useState<JwtPayload | null>(null);

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

  return (
    <AbilityProvider>
      <SharedLayoutContent
        children={children}
        menuItems={menuItems}
        title={title}
        logoText={logoText}
        requiredRole={requiredRole}
        redirectPath={redirectPath}
        userInfo={userInfo}
      />
    </AbilityProvider>
  );
}
