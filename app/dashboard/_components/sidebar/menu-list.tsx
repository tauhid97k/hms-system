import {
  LuLayoutGrid,
  LuList,
  LuSettings,
  LuBuilding2,
  LuUsers,
  LuStethoscope,
  LuGraduationCap,
  LuClipboardList,
  LuClock,
  LuReceipt,
} from "react-icons/lu";

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
    title: "Patients",
    icon: <LuUsers className="icon" />,
    url: "/dashboard/patients",
  },
  {
    id: 3,
    title: "Doctors",
    icon: <LuStethoscope className="icon" />,
    url: "/dashboard/doctors",
  },
  {
    id: 4,
    title: "Visits",
    icon: <LuClipboardList className="icon" />,
    url: "/dashboard/visits",
  },
  {
    id: 5,
    title: "Queue",
    icon: <LuClock className="icon" />,
    url: "/dashboard/queue",
  },
  {
    id: 6,
    title: "Bills",
    icon: <LuReceipt className="icon" />,
    url: "/dashboard/bills",
  },
  {
    id: 7,
    title: "Departments",
    icon: <LuBuilding2 className="icon" />,
    url: "/dashboard/departments",
  },
  {
    id: 8,
    title: "Specializations",
    icon: <LuGraduationCap className="icon" />,
    url: "/dashboard/specializations",
  },
  {
    id: 9,
    title: "Categories",
    icon: <LuList className="icon" />,
    url: "/dashboard/categories",
  },
  {
    id: 10,
    title: "Settings",
    icon: <LuSettings className="icon" />,
    url: "/dashboard/settings",
  },
];
