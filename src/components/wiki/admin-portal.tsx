"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    LayoutDashboard, 
    PieChart, 
    ClipboardCheck, 
    Settings2, 
    Database, 
    ShieldAlert, 
    Settings, 
    History,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import type { View } from '@/lib/types';
import { cn } from '@/lib/utils';

type AdminPortalProps = {
    onNavigate: (view: View) => void;
};

export default function AdminPortal({ onNavigate }: AdminPortalProps) {
    const tools = [
        {
            id: 'dashboard',
            label: 'Admin Dashboard',
            description: 'Real-time operational overview of users, templates, and definition library health.',
            icon: LayoutDashboard,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
        },
        {
            id: 'approval-workflow',
            label: 'Approvals',
            description: 'Govern the documentation lifecycle by reviewing, approving, or requesting changes for submissions.',
            icon: ClipboardCheck,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
        },
        {
            id: 'template-management',
            label: 'Templates',
            description: 'Define and maintain structured blueprints to ensure consistent documentation across the library.',
            icon: Settings2,
            color: 'text-amber-600 bg-amber-50 border-amber-100'
        },
        {
            id: 'master-data-management',
            label: 'Master Data',
            description: 'Govern global application constants, modules, and reference categories used throughout the system.',
            icon: Database,
            color: 'text-slate-600 bg-slate-50 border-slate-200'
        },
        {
            id: 'user-management',
            label: 'Security & Access',
            description: 'Manage user accounts, assign security roles, and configure functional system permissions.',
            icon: ShieldAlert,
            color: 'text-red-600 bg-red-50 border-red-100'
        },
        {
            id: 'system-configuration',
            label: 'System Settings',
            description: 'Configure global parameters including branding, upload policies, and workflow notifications.',
            icon: Settings,
            color: 'text-slate-900 bg-slate-100 border-slate-300'
        },
        {
            id: 'activity-logs',
            label: 'Activity Logs',
            description: 'Review the complete system-wide audit trail, including security events and user interactions.',
            icon: History,
            color: 'text-indigo-900 bg-slate-200 border-slate-300'
        }
    ];

    return (
        <div className="p-8 space-y-10 max-w-7xl mx-auto pb-32">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                    <ShieldCheck className="h-4 w-4" />
                    Governance Hub
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Admin Portal</h1>
                <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                    Centralized workspace for system governance, documentation standards, and security administration.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Card 
                        key={tool.id}
                        className="group relative flex flex-col border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer rounded-[24px] overflow-hidden"
                        onClick={() => onNavigate(tool.id as View)}
                    >
                        <CardHeader className="p-6">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300",
                                tool.color
                            )}>
                                <tool.icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-slate-900 flex items-center justify-between">
                                {tool.label}
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed text-slate-500 mt-2">
                                {tool.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto p-6 pt-0">
                            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full w-0 group-hover:w-full bg-indigo-500 transition-all duration-500" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
