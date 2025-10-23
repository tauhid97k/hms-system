"use client";

import Link from "next/link";
import {
  LuChevronDown,
  LuLayoutGrid,
  LuLogOut,
  LuUserRound,
} from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

const ProfileDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-auto p-0 hover:bg-transparent",
        )}
      >
        <Avatar>
          <AvatarImage src="" alt="Profile image" />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate text-base">Admin</span>
        <LuChevronDown className="opacity-70" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LuLayoutGrid className="opacity-70" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="#">
            <LuUserRound className="opacity-70" aria-hidden="true" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          <LuLogOut className="opacity-70" aria-hidden="true" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
