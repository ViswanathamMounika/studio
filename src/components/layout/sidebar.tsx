"use client";

import { useState } from 'react';
import {
    ChevronDown,
    Zap,
    Newspaper,
    BookOpen,
    KeyRound,
    Users,
    HeartPulse,
    BadgePercent,
    ShoppingCart,
    SquareGanttChart,
    History
} from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from "../ui/sidebar";
import { cn } from '@/lib/utils';

type View = 'definitions' | 'activity-logs';

type AppSidebarProps = {
    activeView: View;
    onNavigate: (view: View) => void;
    isAdmin: boolean;
};

const topNavItems = [
    { id: 'accountability', label: 'Accountability', icon: Zap },
    { id: 'posts', label: 'Posts', icon: Newspaper },
];

export default function AppSidebar({ activeView, onNavigate, isAdmin }: AppSidebarProps) {
    const [isWikiOpen, setIsWikiOpen] = useState(true);

    const wikiNavItems = [
        { id: 'definitions', label: 'MPM Definitions', icon: KeyRound },
        { id: 'activity-logs', label: 'Activity Logs', icon: History, adminOnly: true },
        { id: 'datasets', label: 'MPM Datasets', icon: ShoppingCart },
        { id: 'acronyms', label: 'Healthcare Acronyms', icon: SquareGanttChart },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'health-plans', label: 'Health Plans', icon: HeartPulse },
        { id: 'lob-codes', label: 'LOB Codes', icon: BadgePercent },
    ];

    const handleNavigate = (id: string) => {
        if (id === 'definitions' || id === 'activity-logs') {
            onNavigate(id as View);
        } else {
            console.log(`Navigating to ${id}`);
        }
    }

    return (
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight">MedPOINT</h1>
                        <p className='text-xs text-muted-foreground -mt-1'>MANAGEMENT</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                     {topNavItems.map(item => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                isActive={false}
                                onClick={() => handleNavigate(item.id)}
                            >
                                <item.icon />
                                {item.label}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}

                    <Collapsible open={isWikiOpen} onOpenChange={setIsWikiOpen}>
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <BookOpen />
                                    <span>Wiki</span>
                                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isWikiOpen && "rotate-180")} />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </SidebarMenuItem>

                        <CollapsibleContent className="py-1">
                            <SidebarMenu className='pl-4'>
                                {wikiNavItems.map(item => {
                                    if (item.adminOnly && !isAdmin) return null;
                                    return (
                                        <SidebarMenuItem key={item.id}>
                                            <SidebarMenuButton
                                                isActive={activeView === item.id}
                                                onClick={() => handleNavigate(item.id)}
                                                className="h-8"
                                            >
                                                <item.icon />
                                                {item.label}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </CollapsibleContent>
                    </Collapsible>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
            </SidebarFooter>
        </Sidebar>
    );
}
