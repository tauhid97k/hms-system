import { LuLayoutGrid, LuList, LuSettings, LuBuilding2 } from "react-icons/lu";

export interface SubMenuItem {
  id: number;
  title: string;
  url: string;
}

export interface MenuItem {
  id: number;
  title: string;
  icon: React.ReactElement;
  url?: string;
  baseUrl?: string;
  submenu?: SubMenuItem[];
}

export const menuList: MenuItem[] = [
  {
    id: 1,
    title: "Dashboard",
    icon: <LuLayoutGrid className="icon" />,
    url: "/dashboard",
  },
  {
    id: 2,
    title: "Departments",
    icon: <LuBuilding2 className="icon" />,
    url: "/dashboard/departments",
  },
  {
    id: 3,
    title: "Categories",
    icon: <LuList className="icon" />,
    url: "/dashboard/categories",
  },
  {
    id: 4,
    title: "Settings",
    icon: <LuSettings className="icon" />,
    url: "/dashboard/settings",
  },
];
