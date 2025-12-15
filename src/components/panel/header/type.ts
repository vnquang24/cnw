// components/header/types.ts

export type User = {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
};

export type HeaderProps = {
  user: User;
  pathName: string;
  onMenuClick?: () => void;
};
