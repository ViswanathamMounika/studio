
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Users, 
    FileText, 
    LayoutTemplate, 
    Activity,
    Users2,
    BarChart3,
    Trophy,
    Target,
    AlertCircle,
    CheckCircle2,
    Clock,
    ChevronRight,
    Play,
    User2,
    ShieldCheck
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import type { Definition, UserAccount, Template, View } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { differenceInDays, parseISO, formatDistanceToNow } from 'date-fns';
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
    const draft = safeDrafts.filter(d => d?.isDraft && !d?.isPendingApproval).length;
    
    // Items that need attention (Pending or Changes Requested)
    const needsAttention = safeDrafts.filter(d => 
        d?.isPendingApproval || 
        (d?.discussions && d.discussions.some(m => m.type === 'change-request'))
    ).sort((a, b) => {
        const dateA = a.submittedAt ? parseISO(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? parseISO(b.submittedAt).getTime() : 0;
        return dateA - dateB; // Oldest first
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
    
    return {
        totalUsers: safeUsers.length,
        activeUsers: safeUsers.filter(u => u.status === 'Active').length,
        inactiveUsers: safeUsers.filter(u => u.status === 'Inactive').length,
        
        totalDefinitions: published + safeDrafts.length,
        publishedDefinitions: published,
        pendingApprovals: pending,
        needsAttention,

        totalTemplates: safeTemplates.length,
        activeTemplates: safeTemplates.filter(t => t.isActive).length,
        templateUsage
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
            {metrics.needsAttention.length > 0 && (
                <span className="text-[11px] font-bold text-slate-400">
                    {metrics.needsAttention.length} items • oldest waiting {differenceInDays(new Date(), parseISO(metrics.needsAttention[0].submittedAt || new Date().toISOString()))} days
                </span>
            )}
        </div>
        <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50 border-b">
                    <TableRow className="hover:bg-transparent border-none h-12">
                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Definition</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted By</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waiting</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stage</TableHead>
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
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">DEF-{(item.id.match(/\d+/) || [Math.floor(Math.random() * 9999)])[0]}</span>
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
                                                <AvatarImage src={`https://picsum.photos/seed/${item.authorId}/40/40`} />
                                                <AvatarFallback className="text-[10px] font-bold">{(item.submittedBy || 'U')[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-bold text-slate-700">{item.submittedBy || 'Unknown User'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn("text-sm font-black tabular-nums", waitDays > 3 ? "text-red-600" : "text-slate-600")}>
                                            {waitDays === 0 ? 'Today' : `${waitDays} day${waitDays > 1 ? 's' : ''}`}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-medium text-slate-400">
                                            {isPending ? 'Sent for Approval' : 'Awaiting resubmission'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-8 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className={cn(
                                                    "h-8 px-4 rounded-lg font-bold text-[11px] border-none shadow-sm",
                                                    isPending ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white text-slate-600 border-slate-200"
                                                )}
                                            >
                                                {isPending ? 'Approve' : 'Remind'}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 px-3 rounded-lg font-bold text-[11px] text-slate-500"
                                                onClick={() => onNavigate('approval-workflow')}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex flex-col items-center justify-center py-8">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-100 mb-2" />
                                    <p className="text-sm font-bold text-slate-400">All caught up! No items need attention.</p>
                                </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Definitions */}
            <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8 flex flex-col justify-between group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                <div className="flex justify-between items-start">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Total Definitions</span>
                    <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 font-bold text-[9px] h-6">+3 this week</Badge>
                </div>
                <div className="mt-6">
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 group-hover:text-[#3F51B5] transition-colors">{metrics.totalDefinitions}</h2>
                </div>
            </Card>

            {/* Published */}
            <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8 flex flex-col justify-between group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                <div className="flex justify-between items-start">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Published</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[9px] h-6">
                        {metrics.totalDefinitions > 0 ? Math.round((metrics.publishedDefinitions / metrics.totalDefinitions) * 100) : 0}% of total
                    </Badge>
                </div>
                <div className="mt-6">
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors">{metrics.publishedDefinitions}</h2>
                </div>
            </Card>

            {/* Pending Approval */}
            <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8 flex flex-col justify-between group hover:shadow-xl hover:shadow-amber-500/5 transition-all">
                <div className="flex justify-between items-start">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Pending Approval</span>
                    <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold text-[9px] h-6">Avg wait 3.2d</Badge>
                </div>
                <div className="mt-6">
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 group-hover:text-amber-600 transition-colors">{metrics.pendingApprovals}</h2>
                </div>
            </Card>

            {/* Action Needed (Highlighted) */}
            <Card className="rounded-[28px] border-none shadow-2xl bg-[#3F51B5] overflow-hidden p-8 flex flex-col justify-between relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck className="h-32 w-32 text-white" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                    <span className="text-[11px] font-black uppercase text-white/60 tracking-widest">Awaiting Your Action</span>
                    <Badge className="bg-white/10 text-white border-white/20 font-bold text-[9px] h-6 uppercase">Live</Badge>
                </div>
                <div className="mt-6 relative z-10">
                    <h2 className="text-5xl font-black tracking-tighter text-white">{metrics.needsAttention.length}</h2>
                </div>
            </Card>
        </div>
      </div>

      {/* --- SECTION: TEMPLATES & ADOPTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <LayoutTemplate className="h-4 w-4 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Templates Details</h3>
            </div>
            <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8 h-[400px] flex flex-col">
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
                    <ResponsiveContainer width="100%" height="100%">
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

        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <Users2 className="h-4 w-4 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">User & Role Details</h3>
            </div>
            <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8 h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                        <span className="text-3xl font-black text-slate-900">{metrics.totalUsers}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Managed Users</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-[18px] font-black text-emerald-600 leading-none">{metrics.activeUsers}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Active</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[18px] font-black text-slate-300 leading-none">{metrics.inactiveUsers}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Disabled</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Active', value: metrics.activeUsers },
                                    { name: 'Inactive', value: metrics.inactiveUsers }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#e2e8f0" />
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[11px] font-black uppercase tracking-widest text-[#3F51B5] hover:bg-indigo-50 rounded-xl"
                        onClick={() => onNavigate('user-management')}
                    >
                        Directory Management
                        <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                    <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{metrics.activeUsers} Sessions Authorized</span>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
