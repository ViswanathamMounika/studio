
"use client";

import {
  BarChart,
  Book,
  Palette,
  Bell,
  PlusCircle,
  File,
  Plus,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppearanceSettings from "@/components/wiki/appearance-settings";
import type { Notification } from "@/lib/types";
import Notifications from "../wiki/notifications";
import { Badge } from "../ui/badge";
import { SidebarTrigger } from "../ui/sidebar";

type AppHeaderProps = {
    children?: React.ReactNode;
    onAnalyticsClick?: () => void;
    onNewDefinitionClick: (type: 'template' | 'blank') => void;
    isAdmin: boolean;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onDefinitionClick: (id: string) => void;
    activeView: 'definitions' | 'supporting-tables';
}

export default function AppHeader({ 
    children, 
    onAnalyticsClick,
    onNewDefinitionClick,
    isAdmin,
    notifications,
    setNotifications,
    onDefinitionClick,
    activeView
}: AppHeaderProps) {

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getTitle = () => {
    switch (activeView) {
      case 'definitions':
        return 'MPM Data Definitions';
      case 'supporting-tables':
        return '';
      default:
        return 'MedPoint Wiki';
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center w-full gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-bold tracking-tight">
          {getTitle()}
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {activeView === 'definitions' && (
          <>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Definition
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onNewDefinitionClick('template')}>
                    <File className="mr-2 h-4 w-4" />
                    From Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewDefinitionClick('blank')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Blank Definition
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={onAnalyticsClick}>
                  <BarChart className="h-4 w-4 mr-2" />
                  Analytics
              </Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                          <Palette className="h-4 w-4 mr-2" />
                          Appearance
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <AppearanceSettings />
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96">
                    <Notifications 
                        notifications={notifications} 
                        setNotifications={setNotifications}
                        onDefinitionClick={onDefinitionClick}
                    />
                </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
