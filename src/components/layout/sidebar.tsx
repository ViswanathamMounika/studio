"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  ChevronDown,
  BookCopy,
  FileText,
  Home,
  Users,
  Database,
  BookMarked,
  Layers,
  HeartPulse,
  Landmark,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AppSidebar() {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">MPM Core</span>
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
      </SidebarContent>
    </>
  );
}
