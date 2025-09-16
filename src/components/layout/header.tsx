"use client";

import {
  Book,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import AppearanceSettings from "@/components/wiki/appearance-settings";
import { SidebarTrigger } from "../ui/sidebar";

export default function AppHeader({ children }: { children?: React.ReactNode }) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="h-7 w-7">
        <Menu />
      </SidebarTrigger>
      <div className="flex items-center gap-2">
        <Logo className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">MedPoint Wiki</h1>
      </div>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search definitions..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Book className="h-4 w-4 mr-2" />
          Templates
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User" />}
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AppearanceSettings />
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
