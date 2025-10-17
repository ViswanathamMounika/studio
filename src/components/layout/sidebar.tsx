
"use client";

import { useState } from 'react';
import {
    BookCopy,
    Database,
    ChevronDown,
    Zap,
    Newspaper,
    BookOpen,
    KeyRound,
    ShoppingCart,
    SquareChartGantt,
    Users,
    HeartPulse,
    BadgePercent
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
import { Logo } from "../icons";
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

type AppSidebarProps = {
    activeView: 'definitions' | 'data-tables';
    onNavigate: (view: 'definitions' | 'data-tables') => void;
};

const wikiNavItems = [
    { id: 'definitions', label: 'MPM Definitions', icon: KeyRound },
    { id: 'data-tables', label: 'Data Tables', icon: Database },
    { id: 'datasets', label: 'MPM Datasets', icon: ShoppingCart },
    { id: 'acronyms', label: 'Healthcare Acronyms', icon: SquareChartGantt },
];

const otherNavItems = [
    { id: 'accountability', label: 'Accountability', icon: Zap },
    { id: 'posts', label: 'Posts', icon: Newspaper },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'health-plans', label: 'Health Plans', icon: HeartPulse },
    { id: 'lob-codes', label: 'LOB Codes', icon: BadgePercent },
]

export default function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
    const [isWikiOpen, setIsWikiOpen] = useState(true);

    const handleNavigate = (id: 'definitions' | 'data-tables') => {
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
                    <Logo className="size-8" />
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight">MedPOINT</h1>
                        <p className='text-xs text-muted-foreground -mt-1'>MANAGEMENT</p>
                    </div>
                </div>
                <SidebarTrigger className='md:hidden'/>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                     {otherNavItems.map(item => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                isActive={false}
                                onClick={() => {}}
                            >
                                <item.icon />
                                {item.label}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}

                    <Collapsible open={isWikiOpen} onOpenChange={setIsWikiOpen}>
                        <CollapsibleTrigger asChild>
                            <div className="group/menu-item relative flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 cursor-pointer">
                                <BookOpen />
                                <span>Wiki</span>
                                <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isWikiOpen && "rotate-180")} />
                            </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="py-1">
                            <SidebarMenu>
                                {wikiNavItems.map(item => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            isActive={activeView === item.id}
                                            onClick={() => handleNavigate(item.id as any)}
                                            className="h-8 pl-8"
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
