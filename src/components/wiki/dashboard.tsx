
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
    User2
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
    ResponsiveContainer
} from 'recharts';
import type { Definition, UserAccount, Template, View } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { differenceInDays, parseISO } from 'date-fns';
import { Button } from '../ui/button';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
};

const countPublishedDefinitions = (items: Definition[]): number => {
  if (!Array.isArray(items)) return 0;
  let count = 0;
  items.forEach(item => {
    if (item && (item.description || item.shortDescription)) {
      if (!item.isArchived) count++;
    }
    if (item && item.children && item.children.length > 0) {
      count += countPublishedDefinitions(item.children);
    }
  });
  return count;
};

export default function Dashboard({ definitions, drafts, users, templates, onNavigate }: DashboardProps) {
  
  const metrics = useMemo(() => {
    const safeDefinitions = Array.isArray(definitions) ? definitions : [];
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeTemplates = Array.isArray(templates) ? templates : [];

    const published = countPublishedDefinitions(safeDefinitions);
    const pending = safeDrafts.filter(d => d?.isPendingApproval).length;
    
    // Items that need attention
    const needsAttention = safeDrafts.filter(d => 
        d?.isPendingApproval || 
        (d?.discussions && d.discussions.some(m => m.type === 'change-request'))
    ).sort((a, b) => {
        const dateA = a.submittedAt ? parseISO(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? parseISO(b.submittedAt).getTime() : 0;
        return dateA - dateB;
    });

    // Template usage data
    const templateUsage = safeTemplates.map(t => {
        let usage = 0;
        const countUsage = (items: Definition[]) => {
            items.forEach(item => {
                if (item && item.templateId === t.id) usage++;
                if (item && item.children) countUsage(item.children);
            });
        };
        countUsage(safeDefinitions);
        countUsage(safeDrafts);
        return { name: t.name, usage };
    }).sort((a, b) => b.usage - a.usage);

    // Role distribution for the new list
    const roleStats = [
        { id: 'SA', name: 'Super Admin', desc: 'Full system access', count: safeUsers.filter(u => u.role === 'Super Admin').length },
        { id: 'AD', name: 'Admin', desc: 'Manage templates & library', count: safeUsers.filter(u => u.role === 'Admin').length },
        { id: 'AP', name: 'Approver', desc: 'Reviews & publishes', count: safeUsers.filter(u => u.role === 'Approver').length },
        { id: 'SU', name: 'Standard User', desc: 'Creates definitions', count: safeUsers.filter(u => u.role === 'Standard User').length },
    ];
    
    return {
        totalUsers: safeUsers.length,
        activeUsers: safeUsers.filter(u => u.status === 'Active').length,
        inactiveUsers: safeUsers.filter(u => u.status === 'Inactive').length,
        activePercentage: safeUsers.length > 0 ? Math.round((safeUsers.filter(u => u.status === 'Active').length / safeUsers.length) * 100) : 0,
        
        totalDefinitions: published + safeDrafts.length,
        publishedDefinitions: published,
        pendingApprovals: pending,
        draftDefinitions: safeDrafts.filter(d => d?.isDraft && !d?.isPendingApproval).length,
        rejectedDefinitions: safeDrafts.filter(d => d?.discussions?.some(msg => msg.type === 'rejection')).length,
        needsAttention,

        totalTemplates: safeTemplates.length,
        activeTemplates: safeTemplates.filter(t => t.isActive).length,
        templateUsage,
        roleStats
    };
  }, [definitions, drafts, users, templates]);

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* --- DASHBOARD HEADER --- */}
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

      {/* --- SECTION: NEEDS ATTENTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Needs Attention</h3>
            </div>
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

      {/* --- SECTION: DEFINITIONS OVERVIEW --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Definitions Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatsCard label="Total Definitions" value={metrics.totalDefinitions} badge="+0" badgeColor="bg-slate-100 text-slate-400" />
            <StatsCard label="Published" value={metrics.publishedDefinitions} badge="Live" badgeColor="bg-emerald-50 text-emerald-600" />
            <StatsCard label="Pending" value={metrics.pendingApprovals} badge="Review" badgeColor="bg-amber-50 text-amber-600" />
            <StatsCard label="Draft" value={metrics.draftDefinitions} badge="Editing" badgeColor="bg-indigo-50 text-indigo-600" />
            <StatsCard label="Rejected" value={metrics.rejectedDefinitions} badge="Action" badgeColor="bg-red-50 text-red-600" />
        </div>
      </div>

      {/* --- SECTION: USERS & ROLES --- */}
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

      {/* --- SECTION: TEMPLATES DETAILS --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
            <LayoutTemplate className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Templates Details</h3>
        </div>
        <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900">{metrics.totalTemplates}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Templates</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-3xl font-black text-emerald-600">{metrics.activeTemplates}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Status</span>
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.templateUsage.slice(0, 5)} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                            width={120}
                        />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="usage" radius={[0, 4, 4, 0]} barSize={24} fill="#3F51B5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>
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

