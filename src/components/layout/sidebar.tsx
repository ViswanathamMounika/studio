
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
    GanttChart,
    History,
    UserCog,
    Settings2,
    ShieldCheck,
    ClipboardCheck
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
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

type View = 'definitions' | 'activity-logs' | 'template-management' | 'approval-queue';

type AppSidebarProps = {
    activeView: View;
    onNavigate: (view: View) => void;
    isAdmin: boolean;
    onToggleAdmin: (isAdmin: boolean) => void;
};

const topNavItems = [
    { id: 'accountability', label: 'Accountability', icon: Zap },
    { id: 'posts', label: 'Posts', icon: Newspaper },
];

export default function AppSidebar({ activeView, onNavigate, isAdmin, onToggleAdmin }: AppSidebarProps) {
    const [isWikiOpen, setIsWikiOpen] = useState(true);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    const wikiNavItems = [
        { id: 'definitions', label: 'MPM Definitions', icon: KeyRound },
        { id: 'datasets', label: 'MPM Datasets', icon: ShoppingCart },
        { id: 'acronyms', label: 'Healthcare Acronyms', icon: GanttChart },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'health-plans', label: 'Health Plans', icon: HeartPulse },
        { id: 'lob-codes', label: 'LOB Codes', icon: BadgePercent },
    ];

    const adminNavItems = [
        { id: 'approval-queue', label: 'Approval Queue', icon: ClipboardCheck },
        { id: 'template-management', label: 'Template Management', icon: Settings2 },
    ];

    const handleNavigate = (id: string) => {
        if (id === 'definitions' || id === 'activity-logs' || id === 'template-management' || id === 'approval-queue') {
            onNavigate(id as View);
        } else {
            console.log(`Navigating to ${id}`);
        }
    }

    return (
        <Sidebar>
            <SidebarHeader className="border-b">
                 <div className="flex items-center justify-between p-2">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight text-primary leading-none">MedPOINT</h1>
                        <p className='text-[10px] font-black tracking-[0.2em] text-muted-foreground mt-0.5'>MANAGEMENT</p>
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
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}

                    <Collapsible open={isWikiOpen} onOpenChange={setIsWikiOpen}>
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="font-semibold">
                                    <BookOpen className="h-4 w-4" />
                                    <span>Wiki</span>
                                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isWikiOpen && "rotate-180")} />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </SidebarMenuItem>

                        <CollapsibleContent className="py-1">
                            <SidebarMenu className='pl-4'>
                                {/* MPM Definitions always first */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        isActive={activeView === 'definitions'}
                                        onClick={() => handleNavigate('definitions')}
                                        className="h-8"
                                    >
                                        <KeyRound className="h-4 w-4" />
                                        <span>MPM Definitions</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                {/* Admin Section */}
                                {isAdmin && (
                                    <>
                                        <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton className={cn(
                                                        "h-8 font-semibold text-foreground hover:text-primary transition-colors",
                                                        (activeView === 'template-management' || activeView === 'approval-queue') && "text-primary"
                                                    )}>
                                                        <UserCog className="h-4 w-4" />
                                                        <span>Admin</span>
                                                        <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", isAdminOpen && "rotate-180")} />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                            </SidebarMenuItem>
                                            <CollapsibleContent>
                                                <SidebarMenu className="pl-4">
                                                    {adminNavItems.map(item => (
                                                        <SidebarMenuItem key={item.id}>
                                                            <SidebarMenuButton
                                                                isActive={activeView === item.id}
                                                                onClick={() => handleNavigate(item.id)}
                                                                className="h-8 text-[13px]"
                                                            >
                                                                <item.icon className="h-3.5 w-3.5" />
                                                                {item.label}
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    ))}
                                                </SidebarMenu>
                                            </CollapsibleContent>
                                        </Collapsible>

                                        {/* Activity Logs Standalone Item (After Admin Collapsible) */}
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                isActive={activeView === 'activity-logs'}
                                                onClick={() => handleNavigate('activity-logs')}
                                                className="h-8"
                                            >
                                                <History className="h-4 w-4" />
                                                <span>Activity Logs</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </>
                                )}

                                {/* Remaining Wiki Items */}
                                {wikiNavItems.slice(1).map(item => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            isActive={activeView === item.id}
                                            onClick={() => handleNavigate(item.id)}
                                            className="h-8"
                                        >
                                            <item.icon className="h-4 w-4" />
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
            </SidebarFooter>
        </Sidebar>
    );
}
