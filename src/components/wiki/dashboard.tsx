
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Users, 
    FileText, 
    LayoutTemplate, 
    Activity,
    Users2,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    User2,
    LayoutGrid,
    PieChart as PieChartIcon,
    ChevronRightSquare,
    Play
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import type { Definition, UserAccount, Template, View, ApprovalHistoryEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { differenceInDays, parseISO, subDays } from 'date-fns';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
  approvalHistory?: ApprovalHistoryEntry[];
};

const countPublishedDefinitions = (items: Definition[]): { published: number, archived: number } => {
  if (!Array.isArray(items)) return { published: 0, archived: 0 };
  let published = 0;
  let archived = 0;
  items.forEach(item => {
    if (item && (item.description || item.shortDescription)) {
      if (item.isArchived) archived++;
      else published++;
    }
    if (item && item.children && item.children.length > 0) {
      const childCounts = countPublishedDefinitions(item.children);
      published += childCounts.published;
      archived += childCounts.archived;
    }
  });
  return { published, archived };
};

const MODULE_COLORS: Record<string, string> = {
    'Authorizations': 'bg-indigo-50 text-indigo-700 border-indigo-100 dot-indigo-500',
    'Claims': 'bg-blue-50 text-blue-700 border-blue-100 dot-blue-500',
    'Provider': 'bg-emerald-50 text-emerald-700 border-emerald-100 dot-emerald-500',
    'Member': 'bg-orange-50 text-orange-700 border-orange-100 dot-orange-500',
    'Core': 'bg-slate-50 text-slate-700 border-slate-100 dot-slate-500',
    'Other': 'bg-slate-50 text-slate-700 border-slate-100 dot-slate-500'
};

export default function Dashboard({ definitions, drafts, users, templates, onNavigate, approvalHistory = [] }: DashboardProps) {
  
  const metrics = useMemo(() => {
    const safeDefinitions = Array.isArray(definitions) ? definitions : [];
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeTemplates = Array.isArray(templates) ? templates : [];
    const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];

    const { published, archived } = countPublishedDefinitions(safeDefinitions);
    
    // Lifecycle Mapping
    const draftOnly = safeDrafts.filter(d => d && d.isDraft && !d.isPendingApproval && !(d.discussions || []).some(m => m.type === 'change-request' || m.type === 'rejection'));
    const sentForApproval = safeDrafts.filter(d => d && d.isPendingApproval && d.submittedAt && parseISO(d.submittedAt) > subDays(new Date(), 1)); // Approximate "Recently Sent"
    const pendingApproval = safeDrafts.filter(d => d && d.isPendingApproval);
    const changesRequested = safeDrafts.filter(d => d && (d.discussions || []).some(m => m.type === 'change-request') && !d.isPendingApproval);
    const rejected = safeDrafts.filter(d => d && (d.discussions || []).some(m => m.type === 'rejection') && !d.isPendingApproval);
    
    // Needs Attention
    const needsAttention = safeDrafts.filter(d => 
        d?.isPendingApproval || 
        (d?.discussions && d.discussions.some(m => m.type === 'change-request'))
    ).sort((a, b) => {
        const dateA = a.submittedAt ? parseISO(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? parseISO(b.submittedAt).getTime() : 0;
        return dateA - dateB;
    });

    // Template usage data
    const templateUsageData = safeTemplates.map(t => {
        let usage = 0;
        const countUsage = (items: Definition[]) => {
            items.forEach(item => {
                if (item && item.templateId === t.id) usage++;
                if (item && item.children) countUsage(item.children);
            });
        };
        countUsage(safeDefinitions);
        countUsage(safeDrafts);
        return { id: t.id, name: t.name, module: t.module, usage, isActive: t.isActive };
    }).sort((a, b) => b.usage - a.usage);

    const moduleStatsMap: Record<string, number> = {};
    safeTemplates.forEach(t => {
        moduleStatsMap[t.module] = (moduleStatsMap[t.module] || 0) + 1;
    });
    const templateModuleStats = Object.entries(moduleStatsMap).map(([name, count]) => ({ name, count }));

    const roleStats = [
        { id: 'SA', name: 'Super Admin', desc: 'Full system access', count: safeUsers.filter(u => u.role === 'Super Admin').length },
        { id: 'AD', name: 'Admin', desc: 'Manage templates & library', count: safeUsers.filter(u => u.role === 'Admin').length },
        { id: 'AP', name: 'Approver', desc: 'Reviews & publishes', count: safeUsers.filter(u => u.role === 'Approver').length },
        { id: 'SU', name: 'Standard User', desc: 'Creates definitions', count: safeUsers.filter(u => u.role === 'Standard User').length },
    ];

    // Historical calculation simulation
    const duplicatedCount = safeDrafts.filter(d => d && d.name.includes('(Copy)')).length;
    
    return {
        totalUsers: safeUsers.length,
        activeUsers: safeUsers.filter(u => u.status === 'Active').length,
        inactiveUsers: safeUsers.filter(u => u.status === 'Inactive').length,
        activePercentage: safeUsers.length > 0 ? Math.round((safeUsers.filter(u => u.status === 'Active').length / safeUsers.length) * 100) : 0,
        
        totalDefinitions: published + archived + safeDrafts.length,
        lifecycle: {
            draft: draftOnly.length,
            sent: sentForApproval.length,
            pending: pendingApproval.length,
            requested: changesRequested.length,
            rejected: rejected.length,
            published: published,
            archived: archived
        },
        stats: {
            duplicated: duplicatedCount,
            conversion: 33, // Simulation
            avgApprovalTime: 1.8 // Simulation
        },
        needsAttention,

        totalTemplates: safeTemplates.length,
        activeTemplates: safeTemplates.filter(t => t.isActive).length,
        inactiveTemplates: safeTemplates.filter(t => !t.isActive).length,
        templateUsageData,
        templateModuleStats,
        maxUsage: Math.max(...templateUsageData.map(t => t.usage), 1),
        roleStats
    };
  }, [definitions, drafts, users, templates, approvalHistory]);

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* HEADER */}
      <div className="flex justify-between items-center px-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold gap-1.5 h-8 px-4 rounded-xl shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Live
            </Badge>
            <div className="h-9 w-9 rounded-xl bg-[#3F51B5] text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-100">
                SA
            </div>
        </div>
      </div>

      {/* SECTION: NEEDS ATTENTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
            <AlertCircle className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Needs Attention</h3>
        </div>
        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50 border-b">
                    <TableRow className="hover:bg-transparent border-none h-12">
                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Definition</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted By</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waiting</TableHead>
                        <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {metrics.needsAttention.length > 0 ? (
                        metrics.needsAttention.slice(0, 5).map(item => {
                            const isPending = item.isPendingApproval;
                            const waitDays = item.submittedAt ? differenceInDays(new Date(), parseISO(item.submittedAt)) : 0;
                            return (
                                <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-100 h-20 transition-colors">
                                    <TableCell className="px-8">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-[15px]">{item.name}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{item.module}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "rounded-lg font-bold text-[10px] px-2 h-7 gap-1.5 border uppercase",
                                            isPending ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                        )}>
                                            <div className={cn("h-1.5 w-1.5 rounded-full", isPending ? "bg-indigo-500" : "bg-pink-500")} />
                                            {isPending ? 'Pending Approval' : 'Changes Requested'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                                <AvatarFallback className="text-[10px] font-bold">{(item.submittedBy || 'U')[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-bold text-slate-700">{item.submittedBy || 'Unknown User'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn("text-sm font-black tabular-nums", waitDays > 3 ? "text-red-600" : "text-slate-600")}>
                                            {waitDays === 0 ? 'Today' : `${waitDays}d`}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-8 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg font-bold text-[11px] text-slate-500" onClick={() => onNavigate('approval-workflow')}>View</Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center py-8">
                                <CheckCircle2 className="h-8 w-8 text-emerald-100 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-400">All caught up!</p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
      </div>

      {/* SECTION: DEFINITION LIFECYCLE (MATCHING REFERENCE) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Lifecycle Governance</h3>
        </div>
        <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">Definition Lifecycle</h3>
                <span className="text-[13px] font-bold text-slate-500">Total <span className="text-slate-900 font-black">{metrics.totalDefinitions}</span> definitions</span>
            </div>

            {/* Lifecycle Blocks */}
            <div className="flex items-center gap-2 mb-8">
                <LifecycleBlock count={metrics.lifecycle.draft} label="Draft" color="bg-amber-50 text-amber-600 border-amber-100" />
                <BlockArrow />
                <LifecycleBlock count={metrics.lifecycle.sent} label="Sent for Approval" color="bg-purple-50 text-purple-600 border-purple-100" />
                <BlockArrow />
                <LifecycleBlock count={metrics.lifecycle.pending} label="Pending Approval" color="bg-blue-50 text-blue-600 border-blue-100" />
                <BlockArrow />
                <LifecycleBlock count={metrics.lifecycle.requested} label="Changes Requested" color="bg-pink-50 text-pink-600 border-pink-100" />
                <LifecycleBlock count={metrics.lifecycle.rejected} label="Rejected" color="bg-red-50 text-red-600 border-red-100" />
                <div className="flex-1">
                    <LifecycleBlock count={metrics.lifecycle.published} label="Published" color="bg-emerald-50 text-emerald-600 border-emerald-100" isMain />
                </div>
                <LifecycleBlock count={metrics.lifecycle.archived} label="Archived" color="bg-slate-50 text-slate-400 border-slate-100" />
            </div>

            {/* Footer Stats Row */}
            <div className="flex items-center gap-8 px-2 mb-10">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">{metrics.stats.duplicated}</span>
                    <span className="text-[13px] font-medium text-slate-500">duplicated from published</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">{metrics.stats.conversion}%</span>
                    <span className="text-[13px] font-medium text-slate-500">draft → published conversion (30d)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">{metrics.stats.avgApprovalTime} days</span>
                    <span className="text-[13px] font-medium text-slate-500">avg approval time</span>
                </div>
            </div>

            {/* Dot Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
                <LegendItem label="Draft" dot="bg-amber-500" />
                <LegendItem label="Sent for Approval" dot="bg-purple-500" />
                <LegendItem label="Pending Approval" dot="bg-blue-500" />
                <LegendItem label="Changes Requested" dot="bg-pink-500" />
                <LegendItem label="Rejected" dot="bg-red-500" />
                <LegendItem label="Published" dot="bg-emerald-500" />
                <LegendItem label="Archived" dot="bg-slate-400" />
            </div>
        </Card>
      </div>

      {/* SECTION: TEMPLATE ARCHITECTURE */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
            <LayoutTemplate className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Template Architecture</h3>
        </div>
        <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">Template Architecture</h3>
                <span className="text-[13px] font-bold text-slate-500">Total <span className='text-slate-900 font-black'>{metrics.totalTemplates}</span> templates</span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-[20px] bg-slate-50/50 border border-slate-100">
                    <span className="text-4xl font-black text-indigo-600">{metrics.activeTemplates}</span>
                    <p className="text-[13px] font-bold text-slate-500 mt-1">Active</p>
                </div>
                <div className="p-6 rounded-[20px] bg-slate-50/50 border border-slate-100">
                    <span className="text-4xl font-black text-slate-400">{metrics.inactiveTemplates}</span>
                    <p className="text-[13px] font-bold text-slate-500 mt-1">Inactive</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mb-10 pb-6 border-b border-slate-100">
                {metrics.templateModuleStats.map(stat => (
                    <Badge 
                        key={stat.name} 
                        variant="outline" 
                        className={cn(
                            "h-9 px-4 rounded-full font-bold gap-2 text-[12px] border-slate-200 transition-all",
                            MODULE_COLORS[stat.name] || MODULE_COLORS.Other
                        )}
                    >
                        <div className={cn("h-1.5 w-1.5 rounded-full bg-current")} />
                        {stat.name} <span className="opacity-40">•</span> {stat.count}
                    </Badge>
                ))}
            </div>

            <div className="space-y-6">
                {metrics.templateUsageData.map(template => (
                    <div key={template.id} className="flex items-center gap-4 group">
                        <div className="w-[220px] shrink-0">
                            <span className={cn("text-[14px] font-bold", template.isActive ? "text-slate-900" : "text-slate-400")}>
                                {template.name}
                            </span>
                        </div>
                        <div className="w-[100px] shrink-0">
                             <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-[10px] font-black uppercase h-5 px-1.5 border-transparent opacity-80", 
                                    MODULE_COLORS[template.module] || MODULE_COLORS.Other
                                )}
                            >
                                {template.module}
                            </Badge>
                        </div>
                        <div className="flex-1 max-w-xs">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={cn("h-full transition-all duration-1000", template.isActive ? "bg-indigo-500" : "bg-slate-300")} 
                                    style={{ width: `${(template.usage / metrics.maxUsage) * 100}%` }} 
                                />
                            </div>
                        </div>
                        <div className="text-[12px] font-bold text-slate-400 whitespace-nowrap ml-auto">
                            <span className={cn(template.isActive ? "text-slate-500" : "text-slate-300")}>
                                {template.usage} definitions
                            </span>
                            {!template.isActive && (
                                <span className="ml-2 font-medium opacity-60">· Inactive</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
      </div>

      {/* SECTION: USERS & ROLES */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
            <Users2 className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Users & Roles</h3>
        </div>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[24px] border-slate-200 bg-white p-8 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Total Users</span>
                        <Badge variant="outline" className="bg-slate-100/50 text-slate-400 border-slate-200 font-bold text-[9px] h-5 px-2">+0</Badge>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 mt-6">{metrics.totalUsers}</h2>
                </Card>
                <Card className="rounded-[24px] border-slate-200 bg-white p-8 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Active Users</span>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[9px] h-5 px-2">{metrics.activePercentage}%</Badge>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 mt-6">{metrics.activeUsers}</h2>
                </Card>
                <Card className="rounded-[24px] border-slate-200 bg-white p-8 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Inactive Users</span>
                        <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold text-[9px] h-5 px-2 uppercase tracking-widest">Review</Badge>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 mt-6">{metrics.inactiveUsers}</h2>
                </Card>
            </div>

            <Card className="rounded-[24px] border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="py-6 px-8 border-b bg-white">
                    <CardTitle className="text-base font-bold text-slate-800">Users by Role</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {metrics.roleStats.map((role) => (
                            <div key={role.id} className="flex items-center justify-between py-5 px-8 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 uppercase border border-slate-200">
                                        {role.id}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-bold text-slate-900">{role.name}</span>
                                        <span className="text-[11px] font-medium text-slate-400 mt-0.5">{role.desc}</span>
                                    </div>
                                </div>
                                <div className="text-lg font-black text-slate-900 tabular-nums">
                                    {role.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t flex justify-end">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[11px] font-black uppercase tracking-widest text-[#3F51B5] hover:bg-indigo-50 rounded-xl"
                        onClick={() => onNavigate('user-management')}
                    >
                        Management Console
                        <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}

function LifecycleBlock({ count, label, color, isMain = false }: { count: number, label: string, color: string, isMain?: boolean }) {
    return (
        <div className={cn(
            "rounded-xl border p-4 flex flex-col justify-center transition-all h-24",
            color,
            isMain ? "min-w-[140px]" : "min-w-[120px]"
        )}>
            <span className={cn("font-black tabular-nums leading-none", isMain ? "text-4xl" : "text-2xl")}>{count}</span>
            <span className={cn("font-bold mt-2 leading-tight", isMain ? "text-[14px]" : "text-[11px]")}>{label}</span>
        </div>
    );
}

function BlockArrow() {
    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0">
            <ChevronRightSquare className="h-4 w-4 text-slate-400" />
        </div>
    );
}

function LegendItem({ label, dot }: { label: string, dot: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", dot)} />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
    );
}

function StatsCard({ label, value, badge, badgeColor }: { label: string, value: number, badge: string, badgeColor: string }) {
    return (
        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white p-6 flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
                <Badge className={cn("font-bold text-[9px] h-5 px-1.5 rounded-md uppercase", badgeColor)}>{badge}</Badge>
            </div>
            <div className="mt-4">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 group-hover:text-[#3F51B5] transition-colors">{value}</h2>
            </div>
        </Card>
    );
}
