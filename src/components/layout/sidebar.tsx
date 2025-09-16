"use client";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  ChevronDown,
  Archive,
  BookCopy,
  FileText,
  Home,
  Users,
  Database,
  BookMarked,
  Layers,
  HeartPulse,
  LogOut,
  Landmark,
} from "lucide-react";
import { Logo } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type AppSidebarProps = {
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
};


export default function AppSidebar({ showArchived, setShowArchived }: AppSidebarProps) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">MPM Definitions</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Accountability" isActive>
              <Home />
              Accountability
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Posts">
              <FileText />
              Posts
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <Collapsible>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Wiki">
                      <BookCopy />
                      Wiki
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
              </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
              <SidebarMenu className="ml-4">
                <SidebarMenuItem>
                    <SidebarMenuButton size="sm">
                        <BookMarked />
                        MPM Definitions
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton size="sm">
                        <Database />
                        MPM Datasets
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton size="sm">
                        <HeartPulse />
                        Healthcare Acronyms
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton size="sm">
                        <Users />
                        Clients
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton size="sm">
                        <Landmark />
                        Health Plans
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton size="sm">
                        <Layers />
                        LOB Codes
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenu>

        <SidebarGroup>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-archived" className="text-sm">Show Archived</Label>
            <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User" />}
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Authorized User</span>
            <span className="text-xs text-muted-foreground">user@example.com</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
