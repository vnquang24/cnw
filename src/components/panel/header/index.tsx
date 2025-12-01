import React from "react";
import { User, Settings, LogOut, Info } from "lucide-react";
import { HeaderProps } from "./type";
import { Dropdown, Avatar, Typography, Space, theme } from "antd";
import type { MenuProps } from "antd";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

const { Text } = Typography;

const Header: React.FC<HeaderProps> = ({ pathName, user }) => {
  const router = useRouter();
  const { token } = theme.useToken();

  const handleLogout = async () => {
    try {
      await logout();
      showToast.success("Đăng xuất thành công!");
      router.push("/public");
    } catch (error) {
      showToast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const handleDevicesClick = () => {
    router.push("/admin/devices");
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <Space>
          <Info size={16} />
          <span>Thông tin tài khoản</span>
        </Space>
      ),
      onClick: handleProfileClick,
    },
    {
      key: "devices",
      label: (
        <Space>
          <Settings size={16} />
          <span>Quản lý thiết bị</span>
        </Space>
      ),
      onClick: handleDevicesClick,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: (
        <Space>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </Space>
      ),
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header
      className="flex justify-between items-center px-4 py-2 shadow-sm"
      style={{
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div>
        <Text
          className="text-xl font-semibold"
          style={{ color: token.colorPrimary }}
        >
          {pathName}
        </Text>
      </div>
      <div className="flex items-center">
        <Space size="middle">
          <Text type="secondary" className="hidden sm:block">
            Xin chào, <Text strong>{user.name}</Text>
          </Text>
          <Dropdown
            menu={{ items: menuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Avatar
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              src={user.avatar}
              icon={!user.avatar && <User size={18} />}
              size="default"
              style={{ backgroundColor: token.colorPrimary }}
            >
              {!user.avatar && user.name
                ? user.name.charAt(0).toUpperCase()
                : "U"}
            </Avatar>
          </Dropdown>
        </Space>
      </div>
    </header>
  );
};

export default Header;
