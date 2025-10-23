import { LuLayoutGrid, LuSettings, LuUserRound } from "react-icons/lu";

export const menuList = [
  {
    id: 1,
    title: "Dashboard",
    icon: <LuLayoutGrid className="icon" />,
    url: "/dashboard",
  },
  {
    id: 2,
    title: "Users & Access",
    icon: <LuUserRound className="icon" />,
    baseUrl: "/dashboard/users",
    submenu: [
      {
        id: 1,
        title: "Users",
        url: "/dashboard/users",
      },
      {
        id: 2,
        title: "Roles & Permissions",
        url: "/dashboard/users/roles",
      },
    ],
  },
  {
    id: 3,
    title: "Settings",
    icon: <LuSettings className="icon" />,
    url: "/dashboard/settings",
  },
];
