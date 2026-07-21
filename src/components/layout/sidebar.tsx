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
    Settings2,
    ClipboardCheck,
    Fingerprint,
    Library,
    ShieldAlert,
    UserCircle,
    Database,
    Settings,
    LayoutDashboard,
    PieChart,
    ShieldCheck
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
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "../ui/sidebar";
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import type { View, SystemConfigurationState } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type AppSidebarProps = {
    activeView: View;
    onNavigate: (view: View) => void;
    isAdmin: boolean;
    onToggleAdmin: (isAdmin: boolean) => void;
    isImpersonating?: boolean;
    systemConfig?: SystemConfigurationState;
};

const topNavItems = [
    { id: 'accountability', label: 'Accountability', icon: Zap },
    { id: 'posts', label: 'Posts', icon: Newspaper },
];

export default function AppSidebar({ activeView, onNavigate, isAdmin, onToggleAdmin, isImpersonating, systemConfig }: AppSidebarProps) {
    const [isWikiOpen, setIsWikiOpen] = useState(true);
    const [isDefinitionsOpen, setIsDefinitionsOpen] = useState(true);
    const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);

    const appName = systemConfig?.settings.appName || 'MedPOINT';

    const wikiNavItems = [
        { id: 'datasets', label: 'MPM Datasets', icon: ShoppingCart },
        { id: 'acronyms', label: 'Healthcare Acronyms', icon: GanttChart },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'health-plans', label: 'Health Plans', icon: HeartPulse },
        { id: 'lob-codes', label: 'LOB Codes', icon: BadgePercent },
    ];

    const handleNavigate = (id: string) => {
        const adminViews = ['admin-portal', 'dashboard', 'definitions', 'activity-logs', 'template-management', 'approval-workflow', 'user-management', 'master-data-management', 'system-configuration', 'reports'];
        if (adminViews.includes(id)) {
            onNavigate(id as View);
        } else {
            console.log(`Navigating to ${id}`);
        }
    }

    const isAdminViewActive = (view: View) => {
        return ['dashboard', 'reports', 'master-data-management', 'user-management', 'system-configuration'].includes(view);
    };

    return (
        <Sidebar>
            <SidebarHeader className="border-b">
                 <div className="flex items-center justify-between p-2">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight text-primary leading-none">{appName}</h1>
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

                    {/* WIKI SECTION */}
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
                                {/* MPM DATA DEFINITIONS - COLLAPSIBLE FOR ADMINS */}
                                {isAdmin ? (
                                    <Collapsible open={isDefinitionsOpen} onOpenChange={setIsDefinitionsOpen}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton 
                                                    isActive={activeView === 'definitions' || activeView === 'admin-portal' || activeView === 'approval-workflow' || activeView === 'activity-logs' || activeView === 'template-management' || isAdminViewActive(activeView)}
                                                    className={cn("font-semibold", (activeView === 'definitions' || activeView === 'admin-portal' || activeView === 'approval-workflow' || activeView === 'activity-logs' || activeView === 'template-management' || isAdminViewActive(activeView)) && "text-primary")}
                                                >
                                                    <Library className="h-4 w-4" />
                                                    <span>MPM Data Definitions</span>
                                                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isDefinitionsOpen && "rotate-180")} />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub className="pl-4 border-l ml-2 space-y-0.5 mt-1">
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton 
                                                        isActive={activeView === 'definitions'}
                                                        onClick={() => handleNavigate('definitions')}
                                                        className="h-7 text-[12px]"
                                                    >
                                                        <Library className="h-3.5 w-3.5 mr-1" />
                                                        MPM Definitions
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton 
                                                        isActive={activeView === 'approval-workflow'}
                                                        onClick={() => handleNavigate('approval-workflow')}
                                                        className="h-7 text-[12px]"
                                                    >
                                                        <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                                        Approvals
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton 
                                                        isActive={activeView === 'activity-logs'}
                                                        onClick={() => handleNavigate('activity-logs')}
                                                        className="h-7 text-[12px]"
                                                    >
                                                        <History className="h-3.5 w-3.5 mr-1" />
                                                        Activity Logs
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton 
                                                        isActive={activeView === 'template-management'}
                                                        onClick={() => handleNavigate('template-management')}
                                                        className="h-7 text-[12px]"
                                                    >
                                                        <Settings2 className="h-3.5 w-3.5 mr-1" />
                                                        Templates
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>

                                                {/* NESTED ADMIN CONSOLE */}
                                                <Collapsible open={isGovernanceOpen} onOpenChange={setIsGovernanceOpen} className="mt-1">
                                                    <SidebarMenuItem>
                                                        <CollapsibleTrigger asChild>
                                                            <SidebarMenuSubButton 
                                                                className={cn(
                                                                    "h-7 text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-primary",
                                                                    isAdminViewActive(activeView) && "text-primary"
                                                                )}
                                                            >
                                                                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                                                                Admin Console
                                                                <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", isGovernanceOpen && "rotate-180")} />
                                                            </SidebarMenuSubButton>
                                                        </CollapsibleTrigger>
                                                    </SidebarMenuItem>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub className="pl-4 border-l ml-3.5 space-y-0.5 mt-1 border-slate-100">
                                                            <SidebarMenuSubItem>
                                                                <SidebarMenuSubButton 
                                                                    isActive={activeView === 'dashboard'}
                                                                    onClick={() => handleNavigate('dashboard')}
                                                                    className="h-7 text-[11px]"
                                                                >
                                                                    <LayoutDashboard className="h-3 w-3 mr-1.5" />
                                                                    Dashboard
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                            <SidebarMenuSubItem>
                                                                <SidebarMenuSubButton 
                                                                    isActive={activeView === 'reports'}
                                                                    onClick={() => handleNavigate('reports')}
                                                                    className="h-7 text-[11px]"
                                                                >
                                                                    <PieChart className="h-3 w-3 mr-1.5" />
                                                                    Reports
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                            <SidebarMenuSubItem>
                                                                <SidebarMenuSubButton 
                                                                    isActive={activeView === 'master-data-management'}
                                                                    onClick={() => handleNavigate('master-data-management')}
                                                                    className="h-7 text-[11px]"
                                                                >
                                                                    <Database className="h-3 w-3 mr-1.5" />
                                                                    Master Data
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                            <SidebarMenuSubItem>
                                                                <SidebarMenuSubButton 
                                                                    isActive={activeView === 'user-management'}
                                                                    onClick={() => handleNavigate('user-management')}
                                                                    className="h-7 text-[11px]"
                                                                >
                                                                    <ShieldAlert className="h-3 w-3 mr-1.5" />
                                                                    Security & Access
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                            <SidebarMenuSubItem>
                                                                <SidebarMenuSubButton 
                                                                    isActive={activeView === 'system-configuration'}
                                                                    onClick={() => handleNavigate('system-configuration')}
                                                                    className="h-7 text-[11px]"
                                                                >
                                                                    <Settings className="h-3 w-3 mr-1.5" />
                                                                    System Settings
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ) : (
                                    <SidebarMenuItem>
                                        <SidebarMenuButton 
                                            isActive={activeView === 'definitions'}
                                            onClick={() => handleNavigate('definitions')}
                                            className={cn(activeView === 'definitions' && "text-primary font-bold")}
                                        >
                                            <Library className="h-4 w-4" />
                                            <span>MPM Data Definitions</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )}

                                {/* Remaining Wiki Items */}
                                {wikiNavItems.map(item => (
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
            <SidebarFooter className="p-4 bg-slate-50/50 border-t">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role Settings</span>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm transition-all",
                                    isImpersonating && "opacity-60 bg-slate-100"
                                )}>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[11px] font-bold text-slate-900">Admin Mode</p>
                                            {isImpersonating && <UserCircle className="h-3 w-3 text-indigo-500" />}
                                        </div>
                                        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter">
                                            {isImpersonating ? 'Override Active' : 'Toggle Permissions'}
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={isAdmin} 
                                        onCheckedChange={onToggleAdmin}
                                        disabled={isImpersonating}
                                        className="scale-75"
                                    />
                                </div>
                            </TooltipTrigger>
                            {isImpersonating && (
                                <TooltipContent side="top" className="max-w-[200px] text-xs font-medium">
                                    Role toggle is disabled during an active impersonation session.
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
