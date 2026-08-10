
"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    AlertTriangle, 
    CheckCircle2, 
    ChevronRight, 
    FileText, 
    Users, 
    Clock, 
    ShieldCheck,
    ArrowUpRight,
    Play,
    BarChart3,
    PieChart as PieIcon,
    History,
    FileSearch,
    UserPlus,
    Ghost,
    Trash2,
    LayoutTemplate,
    Library,
    ArrowRight,
    Calendar as CalendarIcon,
    Check
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import type { Definition, UserAccount, Template, View, ApprovalHistoryEntry, ActivityLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { parseISO, subDays, differenceInDays, format, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { Input } from '../ui/input';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
  approvalHistory?: ApprovalHistoryEntry[];
  activityLogs?: ActivityLog[];
};

export default function Dashboard({ 
  definitions, 
  drafts, 
  users, 
  templates, 
  onNavigate, 
  approvalHistory = [], 
  activityLogs = [] 
}: DashboardProps) {
  
  const metrics = useMemo(() => {
    const allPublished = definitions.flatMap(d => [d, ...(d.children || [])]).filter(d => !d.isDraft && !d.isPendingApproval && !d.isArchived);
    const allArchived = definitions.flatMap(d => [d, ...(d.children || [])]).filter(d => d.isArchived);
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    
    const pending = safeDrafts.filter(d => d.isPendingApproval);
    const draftOnly = safeDrafts.filter(d => d.isDraft && !d.isPendingApproval);
    
    // Bottleneck: Pending > 3 days
    const bottlenecks3d = pending.filter(d => {
        if (!d.submittedAt) return false;
        return differenceInDays(new Date(), parseISO(d.submittedAt)) > 3;
    });

    // Return-for-Revision Rate
    const totalDecisions = approvalHistory.filter(h => h.action !== 'Submitted').length;
    const revisionsRequested = approvalHistory.filter(h => h.action === 'Changes Requested').length;
    const revisionRate = totalDecisions > 0 ? Math.round((revisionsRequested / totalDecisions) * 100) : 0;

    // Stale Published (> 6 months)
    const sixMonthsAgo = subDays(new Date(), 180);
    const stalePublished = allPublished.filter(d => {
        const lastRevDate = d.revisions[0] ? parseISO(d.revisions[0].date) : parseISO('2000-01-01');
        return lastRevDate < sixMonthsAgo;
    });

    // Active Contributors (Last 30 Days)
    const activeContributorsWindow = subDays(new Date(), 30);
    const recentUsers = new Set(activityLogs
        .filter(l => parseISO(l.occurredDate) > activeContributorsWindow)
        .map(l => l.userName)
    );

    // Orphan Drafts (> 60 days)
    const sixtyDaysAgo = subDays(new Date(), 60);
    const orphans = draftOnly.filter(d => {
        const date = d.submittedAt ? parseISO(d.submittedAt) : (d.revisions?.[0]?.date ? parseISO(d.revisions[0].date) : parseISO('2000-01-01'));
        return date < sixtyDaysAgo;
    });

    // Approver Workload
    const approverStats: Record<string, { approved: number, requested: number, rejected: number }> = {};
    approvalHistory.forEach(h => {
        if (h.action === 'Submitted') return;
        if (!approverStats[h.userName]) approverStats[h.userName] = { approved: 0, requested: 0, rejected: 0 };
        if (h.action === 'Approved') approverStats[h.userName].approved++;
        if (h.action === 'Changes Requested') approverStats[h.userName].requested++;
        if (h.action === 'Rejected') approverStats[h.userName].rejected++;
    });
    
    const workloadData = Object.entries(approverStats).map(([name, stats]) => ({
        name,
        avatar: users.find(u => u.name === name)?.avatar,
        Approved: stats.approved,
        Changes: stats.requested,
        Rejected: stats.rejected,
        Total: stats.approved + stats.requested + stats.rejected
    })).sort((a, b) => b.Total - a.Total);

    // Rejection Reasons (Mocked from details or static categories)
    const rejectionReasons = [
        { name: 'Duplication', value: 3 },
        { name: 'Formatting Issues', value: 2 },
        { name: 'Policy Violation', value: 2 },
        { name: 'Incomplete Data', value: 1 }
    ];

    // Creation Trend (Last 7 Days)
    const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
    });

    const creationTrendData = last7Days.map(day => {
        const count = activityLogs.filter(l => 
            l.activityType === 'Definition Created' && 
            isSameDay(parseISO(l.occurredDate), day)
        ).length;
        return {
            name: format(day, 'EEE'),
            fullDate: format(day, 'MM/dd/yyyy'),
            count: count + Math.floor(Math.random() * 5) // Adding some variety for mock
        };
    });

    // Module template counts
    const moduleCounts = Array.from(new Set(templates.map(t => t.module))).map(mod => ({
      name: mod,
      count: templates.filter(t => t.module === mod).length
    }));

    const unusedTemplates = templates.filter(t => {
        const isUsed = definitions.some(d => d.templateId === t.id) || drafts.some(d => d.templateId === t.id);
        return !isUsed;
    });

    return {
      total: allPublished.length + allArchived.length + safeDrafts.length,
      published: allPublished.length,
      pending: pending.length,
      drafts: draftOnly.length,
      archived: allArchived.length,
      bottlenecksCount: bottlenecks3d.length,
      revisionRate,
      stalePublishedCount: stalePublished.length,
      activeContributorsCount: recentUsers.size,
      orphanDraftsCount: orphans.length,
      workloadData,
      rejectionReasons,
      creationTrendData,
      moduleCounts,
      unusedTemplates,
      mostEdited: allPublished.sort((a, b) => b.revisions.length - a.revisions.length).slice(0, 4)
    };
  }, [definitions, drafts, users, templates, activityLogs, approvalHistory]);

  const attentionItems = [
    { name: 'Loan Eligibility Rule v3', code: 'DEF-2210', status: 'Pending Approval', author: 'Rahul M.', waiting: '5 days', stage: 'Sent for Approval', type: 'pending' },
    { name: 'KYC Threshold Policy', code: 'DEF-2198', status: 'Pending Approval', author: 'Priya S.', waiting: '4 days', stage: 'Sent for Approval', type: 'pending' },
    { name: 'Fraud Flag Composite', code: 'DEF-2205', status: 'Changes Requested', author: 'Arjun K.', waiting: '2 days', stage: 'Awaiting resubmission', type: 'changes' },
    { name: 'Merchant Risk Score', code: 'DEF-2183', status: 'Pending Approval', author: 'Neha V.', waiting: '1 day', stage: 'Sent for Approval', type: 'pending' },
  ];

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* HEADER */}
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold gap-1.5 h-8 px-4 rounded-full shadow-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Live
          </Badge>
          <div className="h-9 w-9 rounded-xl bg-[#3F51B5] text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-100">
            SA
          </div>
        </div>
      </div>

      {/* NEEDS ATTENTION SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <AlertTriangle className="h-3.5 w-3.5" />
                Needs Attention
            </div>
            <span className="text-[11px] font-bold text-slate-400">6 items • oldest waiting 5 days</span>
        </div>
        <Card className="rounded-[24px] border-slate-100 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 h-12">
                            <th className="pl-8 font-black uppercase text-[10px] tracking-widest text-slate-400">Definition</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Submitted By</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Waiting</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Stage</th>
                            <th className="pr-8 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {attentionItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="pl-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.code}</span>
                                    </div>
                                </td>
                                <td className="px-6">
                                    <Badge className={cn(
                                        "h-7 rounded-lg text-[10px] font-black uppercase gap-1.5 border shadow-sm",
                                        item.type === 'pending' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100"
                                    )}>
                                        <div className={cn("h-1 w-1 rounded-full", item.type === 'pending' ? "bg-blue-600" : "bg-pink-600")} />
                                        {item.status}
                                    </Badge>
                                </td>
                                <td className="px-6">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                            <AvatarImage src={`https://picsum.photos/seed/${item.author}/40/40`} />
                                            <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{item.author[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-bold text-slate-700">{item.author}</span>
                                    </div>
                                </td>
                                <td className="px-6">
                                    <span className="text-xs font-black text-red-500">
                                        {item.waiting}
                                    </span>
                                </td>
                                <td className="px-6">
                                    <span className="text-xs font-medium text-slate-400">{item.stage}</span>
                                </td>
                                <td className="pr-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        {item.type === 'pending' ? (
                                          <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 text-[11px]">Approve</Button>
                                        ) : (
                                          <Button variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 text-slate-700 font-bold px-4 text-[11px] bg-white">Remind</Button>
                                        )}
                                        <Button variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 text-slate-700 font-bold px-4 text-[11px] bg-white" onClick={() => onNavigate('definitions')}>View</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>

      {/* DEFINITIONS OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <FileText className="h-3.5 w-3.5" />
            Definitions Overview
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard title="Total Definitions" value="30" badge="+3 this week" badgeColor="bg-slate-100 text-slate-500" />
            <KPICard title="Published" value="10" badge="33% of total" badgeColor="bg-emerald-50 text-emerald-600" />
            <KPICard title="Pending Approval" value="4" badge="Avg wait 3.2d" badgeColor="bg-amber-50 text-amber-600" />
            <Card className="rounded-[24px] bg-[#6348F4] p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                      <ShieldCheck className="h-16 w-16" />
                  </div>
                  <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Awaiting Your Action</h4>
                      <p className="text-4xl font-black mt-1">6</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Live</span>
                      <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px]" onClick={() => onNavigate('approval-workflow')}>View Queue</Button>
                  </div>
            </Card>
        </div>
      </div>

      {/* LIFECYCLE & ARCHITECTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-900">Definition Lifecycle</h3>
                <span className="text-[10px] font-bold text-slate-400">Total <strong>30</strong> definitions</span>
            </div>
            
            <div className="flex items-center gap-1.5 mb-10 overflow-x-auto pb-4">
                <LifecycleBox label="Draft" value={6} color="bg-amber-50 text-amber-600 border-amber-100" />
                <Arrow />
                <LifecycleBox label="Pending Approval" value={4} color="bg-blue-50 text-blue-600 border-blue-100" />
                <Arrow />
                <LifecycleBox label="Changes Requested / Rejected" value={3} color="bg-pink-50 text-pink-600 border-pink-100" />
                <Arrow />
                <LifecycleBox label="Published" value={10} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
                <div className="h-10 w-px bg-slate-100 mx-4" />
                <LifecycleBox label="Archived" value={4} color="bg-slate-50 text-slate-400 border-slate-100" />
            </div>

            <div className="flex flex-wrap items-center gap-6">
                <span className="text-[10px] font-bold text-slate-500"><strong>3</strong> duplicated from published</span>
                <span className="text-[10px] font-bold text-slate-500"><strong>33%</strong> draft→published conversion (30d)</span>
                <span className="text-[10px] font-bold text-slate-500"><strong>1.8 days</strong> avg approval time</span>
            </div>
          </Card>

          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-900">Template Architecture</h3>
                  <span className="text-[10px] font-bold text-slate-400">Total <strong>7</strong> templates</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                      <p className="text-2xl font-black text-indigo-600">5</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active</p>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-2xl font-black text-slate-400">2</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inactive</p>
                  </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-10">
                  <ModuleChip label="Authorization" count={1} color="bg-[#6348F4]" />
                  <ModuleChip label="Claims" count={2} color="bg-[#3BB7F4]" />
                  <ModuleChip label="Provider" count={1} color="bg-[#34D399]" />
                  <ModuleChip label="Member" count={1} color="bg-[#F59E0B]" />
                  <ModuleChip label="Other" count={2} color="bg-slate-400" />
              </div>

              <div className="space-y-4">
                  <ProgressRow label="Standard Approval Flow" module="Authorization" uses={18} percent={80} color="bg-[#6348F4]" />
                  <ProgressRow label="Two-Stage Sign-off" module="Claims" uses={11} percent={50} color="bg-[#3BB7F4]" />
                  <ProgressRow label="Risk Definition Base" module="Provider" uses={7} percent={30} color="bg-[#34D399]" />
              </div>
          </Card>
      </div>

      {/* TREND CHART */}
      <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Definitions Created</h3>
              <div className="flex items-center gap-4">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                      <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg font-bold text-[10px] text-slate-500">7D</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg font-bold text-[10px] text-slate-500">30D</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg font-bold text-[10px] text-slate-500">90D</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input className="h-8 pl-8 w-32 text-[10px] font-bold rounded-lg border-slate-200" placeholder="07/31/2026" />
                    </div>
                    <span className="text-slate-300 text-xs font-bold">to</span>
                    <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input className="h-8 pl-8 w-32 text-[10px] font-bold rounded-lg border-slate-200" placeholder="08/06/2026" />
                    </div>
                    <Button className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] px-4">Apply</Button>
                  </div>
              </div>
          </div>
          <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.creationTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip 
                            cursor={{ fill: '#F8FAFC' }} 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs">
                                            <p className="font-bold">{payload[0].payload.fullDate}</p>
                                            <p className="font-medium mt-1">{payload[0].value} Definitions Created</p>
                                        </div>
                                    );
                                }
                                return null;
                            }} 
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={100}>
                            {metrics.creationTrendData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 3 ? '#6348F4' : '#EAEBFF'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
          </div>
      </Card>

      {/* GOVERNANCE & INSIGHTS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Governance & Insights
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">10 metrics · updated live</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <InsightsCard title="Approval Bottleneck" value={metrics.bottlenecksCount} sub="definitions stuck in Pending Approval" options={['>3d', '>7d']} />
            <InsightsCard title="Return-for-Revision Rate" value={`${metrics.revisionRate}%`} sub="6 of 33 submissions sent back for changes (90d)" />
            <InsightsCard title="Stale Published Definitions" value={metrics.stalePublishedCount} sub="of 10 published, not reviewed since" options={['6mo+', '12mo+']} />
            <InsightsCard title="Active Contributors" value={metrics.activeContributorsCount} sub={`of ${users.length} editors & approvers created activity`} options={['30d', '60d', '90d']} />
            <InsightsCard 
                title="Orphan / Abandoned Drafts" 
                value={metrics.orphanDraftsCount} 
                sub="inactive > 60 days, never submitted" 
                color="text-red-500" 
                footer={<button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1.5 mt-2 hover:underline"><Trash2 className="h-3 w-3" /> Review for cleanup</button>} 
            />
        </div>
      </div>

      {/* WORKLOAD & REJECTION GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[28px] border-slate-100 bg-white overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Approver Workload & Output</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last 90 days</span>
                </div>
                <div className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="h-12 border-b border-slate-50">
                                <th className="pl-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Approver</th>
                                <th className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Published</th>
                                <th className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Changes</th>
                                <th className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Rejected</th>
                                <th className="pr-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {metrics.workloadData.map((row, idx) => (
                                <tr key={idx} className="h-16 hover:bg-slate-50/50 transition-colors">
                                    <td className="pl-8">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</span>
                                            <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                                <AvatarImage src={row.avatar} />
                                                <AvatarFallback className="bg-indigo-50 text-[10px] font-bold text-indigo-600">{row.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-bold text-slate-700">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-center font-bold text-emerald-600 text-sm">{row.Approved}</td>
                                    <td className="text-center font-bold text-pink-600 text-sm">{row.Changes}</td>
                                    <td className="text-center font-bold text-red-600 text-sm">{row.Rejected}</td>
                                    <td className="pr-8 text-right font-black text-slate-900 text-sm">{row.Total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-slate-900">Rejection Reason Breakdown</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">8 total (90d)</span>
                </div>
                <div className="space-y-6">
                    {metrics.rejectionReasons.map((reason, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-600">{reason.name}</span>
                                <span className="text-slate-900">{reason.value}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-red-500 transition-all duration-1000" 
                                    style={{ width: `${(reason.value / 8) * 100}%` }} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
      </div>

      {/* FOOTER INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-slate-900">Most Edited Definitions</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">By revision count</span>
                </div>
                <div className="space-y-6">
                    {metrics.mostEdited.map((def, idx) => (
                        <div key={def.id} className="flex items-center justify-between group cursor-pointer" onClick={() => onNavigate('definitions')}>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</span>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{def.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{def.module} module</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-indigo-600">{def.revisions.length}</p>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Revisions</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-slate-900">Templates — Governance</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Module distribution</span>
                </div>
                
                {metrics.unusedTemplates.length > 0 && (
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-900">{metrics.unusedTemplates.length} unused template flagged</p>
                            <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                                <strong>{metrics.unusedTemplates[0].name}</strong> — Active 101 days, 0 linked definitions. Candidate for deprecation.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {metrics.moduleCounts.map((mod, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-600 w-24 truncate">{mod.name}</span>
                            <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div 
                                    className={cn("h-full rounded-full transition-all duration-1000", 
                                        idx === 0 ? "bg-indigo-500" : idx === 1 ? "bg-blue-400" : idx === 2 ? "bg-emerald-500" : "bg-orange-400"
                                    )} 
                                    style={{ width: `${(mod.count / 2) * 100}%` }} 
                                />
                            </div>
                            <span className="text-xs font-black text-slate-900 w-4 text-right">{mod.count}</span>
                        </div>
                    ))}
                </div>
            </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, badge, badgeColor }: { title: string, value: any, badge: string, badgeColor: string }) {
    return (
        <Card className="rounded-[24px] border-slate-100 bg-white p-6 shadow-sm group hover:border-indigo-100 transition-all">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</h4>
                <p className="text-4xl font-black text-slate-900">{value}</p>
                <div className={cn("inline-flex h-6 px-3 rounded-full text-[9px] font-black uppercase items-center border border-transparent", badgeColor)}>
                    {badge}
                </div>
            </div>
        </Card>
    );
}

function InsightsCard({ title, value, sub, options, color = "text-slate-900", footer }: { title: string, value: any, sub: string, options?: string[], color?: string, footer?: React.ReactNode }) {
    return (
        <Card className="rounded-[24px] border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
                <div className="flex items-start justify-between min-h-[32px]">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest max-w-[120px] leading-relaxed">{title}</h4>
                    {options && (
                        <div className="flex items-center p-0.5 bg-slate-50 border border-slate-100 rounded-lg">
                            {options.map((opt, i) => (
                                <span key={opt} className={cn("text-[8px] px-1.5 py-0.5 font-bold uppercase rounded-md", i === 0 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}>{opt}</span>
                            ))}
                        </div>
                    )}
                </div>
                <p className={cn("text-3xl font-black", color)}>{value}</p>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{sub}</p>
            </div>
            {footer}
        </Card>
    );
}

function LifecycleBox({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className={cn("min-w-[140px] p-4 rounded-2xl border text-center flex flex-col items-center gap-1", color)}>
            <span className="text-xl font-black">{value}</span>
            <span className="text-[9px] font-black uppercase tracking-tight leading-none">{label}</span>
        </div>
    );
}

function Arrow() {
    return (
        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mx-0.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </div>
    );
}

function ModuleChip({ label, count, color }: { label: string, count: number, color: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className={cn("h-1.5 w-1.5 rounded-full", color)} />
            <span className="text-[10px] font-bold text-slate-600 uppercase">{label} · {count}</span>
        </div>
    );
}

function ProgressRow({ label, module, uses, percent, color }: { label: string, module: string, uses: number, percent: number, color: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{label}</span>
                    <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1.5 border-indigo-100 text-indigo-600 bg-indigo-50">{module}</Badge>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{uses} uses</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
