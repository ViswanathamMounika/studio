
"use client";

import {
  BarChart,
  Book,
  Download,
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import SharePopover from "@/components/wiki/share-popover";

type AppHeaderProps = {
    children?: React.ReactNode;
    isExportMode?: boolean;
    setIsExportMode?: (value: boolean) => void;
    handleExport?: () => void;
    selectedCount?: number;
    onAnalyticsClick?: () => void;
}

export default function AppHeader({ 
    children, 
    isExportMode, 
    setIsExportMode, 
    handleExport, 
    selectedCount = 0,
    onAnalyticsClick
}: AppHeaderProps) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {children}
      <div className="ml-auto flex items-center gap-2">
        <SharePopover />
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Definition
        </Button>
        <Button variant="outline" size="sm">
          <Book className="h-4 w-4 mr-2" />
          Templates
        </Button>
        {isExportMode ? (
            <Button size="sm" onClick={handleExport} disabled={selectedCount === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export ({selectedCount})
            </Button>
        ) : (
             <Button variant="outline" size="sm" onClick={() => setIsExportMode && setIsExportMode(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        )}
        <Button variant="outline" size="sm" onClick={onAnalyticsClick}>
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
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
