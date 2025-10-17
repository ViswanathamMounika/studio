
"use client";

import { useState } from 'react';
import {
    Database,
    ChevronDown,
    Zap,
    Newspaper,
    BookOpen,
    KeyRound,
    Users,
    HeartPulse,
    BadgePercent,
    ShoppingCart,
    SquareGanttChart
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
    SidebarTrigger
} from "../ui/sidebar";
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

type AppSidebarProps = {
    activeView: 'definitions' | 'data-tables';
    onNavigate: (view: 'definitions' | 'data-tables' | string) => void;
};

const topNavItems = [
    { id: 'accountability', label: 'Accountability', icon: Zap },
    { id: 'posts', label: 'Posts', icon: Newspaper },
];

const wikiNavItems = [
    { id: 'definitions', label: 'MPM Definitions', icon: KeyRound },
    { id: 'data-tables', label: 'Data Tables', icon: Database },
    { id: 'datasets', label: 'MPM Datasets', icon: ShoppingCart },
    { id: 'acronyms', label: 'Healthcare Acronyms', icon: SquareGanttChart },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'health-plans', label: 'Health Plans', icon: HeartPulse },
    { id: 'lob-codes', label: 'LOB Codes', icon: BadgePercent },
];

export default function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
    const [isWikiOpen, setIsWikiOpen] = useState(true);

    const handleNavigate = (id: string) => {
        if (id === 'data-tables' || id === 'definitions') {
            onNavigate(id);
        } else {
            // Placeholder for other navigation items
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
                <SidebarTrigger className='hidden md:flex'/>
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
                                {wikiNavItems.map(item => (
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
                                ))}
                            </SidebarMenu>
                        </CollapsibleContent>
                    </Collapsible>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                {/* Optional Footer Content */}
            </SidebarFooter>
        </Sidebar>
    );
}
