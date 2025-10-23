import Image from "next/image";
import Link from "next/link";
import ProfileDropdown from "@/components/ui/profile-dropdown";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

const Navbar = async () => {
  return (
    <nav className="h-16 border-b border-border bg-white py-3 dark:bg-card">
      <div className="container flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.svg"
            alt="Brand Logo"
            width={100}
            height={40}
            priority
          />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
