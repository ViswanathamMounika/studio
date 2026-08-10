"use client";

import React, { useMemo } from 'react';
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
    Library
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import type { Definition, UserAccount, Template, View, ApprovalHistoryEntry, ActivityLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { parseISO, subDays, differenceInDays } from 'date-fns';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
  approvalHistory?: ApprovalHistoryEntry[];
  activityLogs?: ActivityLog[];
};

const PIE_COLORS = ['#6366F1', '#F43F5E', '#F59E0B', '#10B981', '#94A3B8'];

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
    const bottlenecks = pending.filter(d => {
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

    // Stale Drafts (> 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const staleDraftsCount = draftOnly.filter(d => {
        const date = d.submittedAt ? parseISO(d.submittedAt) : (d.revisions?.[0]?.date ? parseISO(d.revisions[0].date) : parseISO('2000-01-01'));
        return date < thirtyDaysAgo;
    }).length;

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

    // Unused Templates
    const unusedTemplates = templates.filter(t => t.isActive && !allPublished.some(d => d.templateId === t.id));

    // Charts: Approver Workload
    const approverStats: Record<string, { approved: number, requested: number }> = {};
    approvalHistory.forEach(h => {
        if (h.action === 'Submitted') return;
        if (!approverStats[h.userName]) approverStats[h.userName] = { approved: 0, requested: 0 };
        if (h.action === 'Approved') approverStats[h.userName].approved++;
        if (h.action === 'Changes Requested' || h.action === 'Rejected') approverStats[h.userName].requested++;
    });
    const workloadData = Object.entries(approverStats).map(([name, stats]) => ({
        name,
        Approved: stats.approved,
        Changes: stats.requested
    })).sort((a, b) => (b.Approved + b.Changes) - (a.Approved + a.Changes)).slice(0, 5);

    // Charts: Rejection Reasons
    const rejectionReasons = [
        { name: 'Duplication', value: 12 },
        { name: 'Formatting', value: 8 },
        { name: 'Policy Violation', value: 5 },
        { name: 'Incomplete', value: 15 },
        { name: 'Other', value: 4 }
    ];

    // Needs Attention List
    const needsAttentionItems = safeDrafts.filter(d => d.isPendingApproval || (d.discussions || []).length > 0).slice(0, 4).map(d => ({
        id: d.id,
        name: d.name,
        code: `DEF-${Math.floor(2000 + Math.random() * 500)}`,
        status: d.isPendingApproval ? 'Pending Approval' : 'Changes Requested',
        submittedBy: d.submittedBy || 'Unknown',
        waiting: `${Math.floor(Math.random() * 5) + 1} days`,
        stage: d.isPendingApproval ? 'Sent for Approval' : 'Awaiting resubmission',
        avatar: `https://picsum.photos/seed/${d.id}/40/40`
    }));

    return {
      total: allPublished.length + allArchived.length + safeDrafts.length,
      published: allPublished.length,
      pending: pending.length,
      drafts: draftOnly.length,
      archived: allArchived.length,
      needsAttention: needsAttentionItems,
      bottlenecksCount: bottlenecks.length,
      revisionRate,
      stalePublishedCount: stalePublished.length,
      staleDraftsCount,
      activeContributorsCount: recentUsers.size,
      orphanDraftsCount: orphans.length,
      unusedTemplatesCount: unusedTemplates.length,
      workloadData,
      rejectionReasons,
      mostEdited: allPublished.sort((a, b) => b.revisions.length - a.revisions.length).slice(0, 5)
    };
  }, [definitions, drafts, users, templates, activityLogs, approvalHistory]);

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* HEADER */}
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium">Real-time governance analytics and documentation health.</p>
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
                <AlertTriangle className="h-3 w-3" />
                Needs Attention
            </div>
            <span className="text-[11px] font-bold text-slate-400">{metrics.needsAttention.length} items • oldest waiting 5 days</span>
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
                        {metrics.needsAttention.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="pl-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.code}</span>
                                    </div>
                                </td>
                                <td className="px-6">
                                    <Badge className={cn(
                                        "h-7 rounded-lg text-[10px] font-black uppercase gap-1.5 border shadow-sm",
                                        item.status === 'Pending Approval' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100"
                                    )}>
                                        <div className={cn("h-1 w-1 rounded-full", item.status === 'Pending Approval' ? "bg-blue-600" : "bg-pink-600")} />
                                        {item.status}
                                    </Badge>
                                </td>
                                <td className="px-6">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                            <AvatarImage src={item.avatar} />
                                            <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{item.submittedBy[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-bold text-slate-700">{item.submittedBy}</span>
                                    </div>
                                </td>
                                <td className="px-6">
                                    <span className={cn("text-xs font-black", item.waiting === '5 days' ? "text-red-500" : "text-slate-900")}>
                                        {item.waiting}
                                    </span>
                                </td>
                                <td className="px-6">
                                    <span className="text-xs font-medium text-slate-400">{item.stage}</span>
                                </td>
                                <td className="pr-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 text-[11px]">Approve</Button>
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

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard title="Total Definitions" value={metrics.total} badge="+3 this week" icon={Library} />
          <KPICard title="Return Rate" value={`${metrics.revisionRate}%`} badge="Submission Quality" icon={History} badgeColor="bg-blue-50 text-blue-600" />
          <KPICard title="Bottlenecks" value={metrics.bottlenecksCount} badge="Waiting > 3 days" icon={AlertTriangle} badgeColor="bg-red-50 text-red-600" />
          <Card className="rounded-[24px] bg-[#3F51B5] p-6 shadow-lg shadow-indigo-200 text-white flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-16 w-16" />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Awaiting Action</h4>
                    <p className="text-4xl font-black mt-1">{metrics.pending}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Governance</span>
                    <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px]" onClick={() => onNavigate('approval-workflow')}>View Queue</Button>
                </div>
          </Card>
      </div>

      {/* ANALYTICS: WORKLOAD & REJECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Approver Performance</h3>
                </div>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.workloadData} layout="vertical" margin={{ left: 40, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={80} />
                        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="Approved" fill="#10B981" radius={[0, 4, 4, 0]} barSize={12} />
                        <Bar dataKey="Changes" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={12} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center">
                        <PieIcon className="h-5 w-5 text-pink-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Rejection Breakdown</h3>
                </div>
            </div>
            <div className="h-[300px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={metrics.rejectionReasons}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {metrics.rejectionReasons.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </Card>
      </div>

      {/* GOVERNANCE INSIGHTS GRID */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <ShieldCheck className="h-3 w-3" />
            Governance Insights
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <InsightItem 
                title="Stale Published" 
                value={metrics.stalePublishedCount} 
                sub="Unreviewed > 6mo" 
                icon={FileSearch} 
                color="text-amber-600"
                bgColor="bg-amber-50"
            />
            <InsightItem 
                title="Active Contributors" 
                value={metrics.activeContributorsCount} 
                sub="Last 30 Days" 
                icon={UserPlus} 
                color="text-indigo-600"
                bgColor="bg-indigo-50"
            />
            <InsightItem 
                title="Stale Drafts" 
                value={metrics.staleDraftsCount} 
                sub="Inactive > 30d" 
                icon={Ghost} 
                color="text-slate-400"
                bgColor="bg-slate-50"
            />
            <InsightItem 
                title="Zero-Impact" 
                value={metrics.unusedTemplatesCount} 
                sub="Unused Templates" 
                icon={Trash2} 
                color="text-red-500"
                bgColor="bg-red-50"
            />
            <Card className="rounded-[20px] border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hotspots</span>
                    <History className="h-3.5 w-3.5 text-slate-300" />
                </div>
                <div className="space-y-3">
                    {metrics.mostEdited.map(def => (
                        <div key={def.id} className="flex items-center justify-between group cursor-pointer" onClick={() => onNavigate('definitions')}>
                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px] group-hover:text-primary transition-colors">{def.name}</span>
                            <Badge className="bg-slate-50 text-slate-400 font-black text-[9px] h-4">{def.revisions.length} revs</Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, badge, icon: Icon, badgeColor = "bg-slate-50 text-slate-500" }: { title: string, value: any, badge: string, icon: any, badgeColor?: string }) {
    return (
        <Card className="rounded-[24px] border-slate-100 bg-white p-6 shadow-sm group hover:border-indigo-100 transition-all">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</h4>
                    <Icon className="h-4 w-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                </div>
                <p className="text-4xl font-black text-slate-900">{value}</p>
                <div className={cn("inline-flex h-6 px-3 rounded-full text-[9px] font-black uppercase items-center border border-transparent shadow-sm", badgeColor)}>
                    {badge}
                </div>
            </div>
        </Card>
    );
}

function InsightItem({ title, value, sub, icon: Icon, color, bgColor }: { title: string, value: number, sub: string, icon: any, color: string, bgColor: string }) {
    return (
        <Card className="rounded-[20px] border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", bgColor)}>
                <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
                <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{title}</h4>
                <p className="text-[9px] font-medium text-slate-500 mt-0.5">{sub}</p>
            </div>
        </Card>
    );
}
