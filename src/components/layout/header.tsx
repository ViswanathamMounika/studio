"use client";

import {
  Clock,
  Palette,
  Bell,
  PlusCircle,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppearanceSettings from "@/components/wiki/appearance-settings";
import type { Notification } from "@/lib/types";
import Notifications from "../wiki/notifications";
import { Badge } from "../ui/badge";
import { SidebarTrigger } from "../ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AppHeaderProps = {
    children?: React.ReactNode;
    onRecentClick?: () => void;
    onNewDefinitionClick: (type: 'template' | 'blank') => void;
    isAdmin: boolean;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onDefinitionClick: (id: string) => void;
    activeView: 'definitions' | 'activity-logs' | 'template-management';
}

export default function AppHeader({ 
    children, 
    onRecentClick,
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
      case 'activity-logs':
        return 'Activity Logs';
      case 'template-management':
        return 'Template Management';
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNewDefinitionClick('template')}
                className="font-semibold"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Definition
              </Button>

              <Button variant="outline" size="sm" onClick={onRecentClick}>
                  <Clock className="h-4 w-4 mr-2" />
                  Recent
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
            
            <div className="flex items-center gap-2 border-l pl-2 ml-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-xl border-slate-200">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-96 p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
                        <Notifications 
                            notifications={notifications} 
                            setNotifications={setNotifications}
                            onDefinitionClick={onDefinitionClick}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 transition-colors">
                                <UserCircle className="h-5 w-5 text-slate-600" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="end" className="p-3 w-48 rounded-xl shadow-xl">
                            <div className="space-y-1">
                                <p className="font-bold text-sm text-slate-900">Dhilip Sagadevan</p>
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {isAdmin ? 'Administrator' : 'Standard User'}
                                    </p>
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
