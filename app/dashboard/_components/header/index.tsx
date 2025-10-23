import ProfileDropdown from "@/components/ui/profile-dropdown";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import SidebarToggle from "./sidebar-toggle";

const Header = () => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6 dark:bg-card">
      <div className="flex items-center gap-4">
        <SidebarToggle />
      </div>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default Header;
