
"use client";

import {
    BookCopy,
    Database,
    Bell,
} from "lucide-react";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    useSidebar,
} from "../ui/sidebar";
import { Logo } from "../icons";
import { Button } from "../ui/button";

type AppSidebarProps = {
    activeView: 'definitions' | 'notifications' | 'data-tables';
    onNavigate: (view: 'definitions' | 'notifications' | 'data-tables') => void;
};

export default function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
    const navItems = [
        { id: 'definitions', label: 'MPM Definitions', icon: BookCopy },
        { id: 'data-tables', label: 'Data Tables', icon: Database },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];
    const { state } = useSidebar();


    return (
        <Sidebar collapsible="offcanvas">
            <SidebarHeader>
                 <div className="flex items-center gap-2">
                    <Logo className="size-6 text-primary" />
                    <h1 className="text-lg font-bold tracking-tight">MPM Core</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map(item => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                isActive={activeView === item.id}
                                onClick={() => onNavigate(item.id as any)}
                            >
                                <item.icon />
                                {item.label}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                {/* Optional Footer Content */}
            </SidebarFooter>
        </Sidebar>
    );
}

    