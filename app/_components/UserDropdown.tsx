"use client";

import { LogOutIcon } from "lucide-react";
import { useSignOut } from "@/hooks/use-signout";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface UserDropdownProps {
  email: string;
  image: string;
  name: string;
  role: string;
}

export function UserDropdown({ email, image, name }: UserDropdownProps) {
  // const router = useRouter();
  const handleSignOut = useSignOut();

  // const DASHBOARD_ROUTES: Record<string, string> = {
  //   admin: "/dashboard/admin",
  //   educator: "/dashboard/educator",
  //   student: "/dashboard/student",
  // };

  // const handleDashboardClick = () => {
  //   router.push(DASHBOARD_ROUTES[role] ?? "/dashboard/student");
  // };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary/20"
        >
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-primary/10 text-xs">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center cursor-pointer"
          >
            <LogOutIcon size={16} className="opacity-60" />
            <span className="ml-2">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
