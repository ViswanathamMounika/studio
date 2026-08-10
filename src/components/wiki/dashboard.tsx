
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
    Library,
    ArrowRight
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

    // Approver Workload
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

    // Rejection Reasons
    const rejectionReasons = [
        { name: 'Duplication', value: 12 },
        { name: 'Formatting', value: 8 },
        { name: 'Policy Violation', value: 5 },
        { name: 'Incomplete', value: 15 },
        { name: 'Other', value: 4 }
    ];

    // Module template counts
    const moduleCounts = Array.from(new Set(templates.map(t => t.module))).map(mod => ({
      name: mod,
      count: templates.filter(t => t.module === mod).length
    }));

    return {
      total: allPublished.length + allArchived.length + safeDrafts.length,
      published: allPublished.length,
      pending: pending.length,
      drafts: draftOnly.length,
      archived: allArchived.length,
      sentForApproval: pending.length, // Placeholder logic for visual flow
      changesRequested: revisionsRequested,
      rejected: revisionsRequested / 2, // Mocking some rejected for lifecycle flow
      bottlenecksCount: bottlenecks.length,
      revisionRate,
      stalePublishedCount: stalePublished.length,
      staleDraftsCount,
      activeContributorsCount: recentUsers.size,
      orphanDraftsCount: orphans.length,
      unusedTemplatesCount: templates.length, // Mock
      workloadData,
      rejectionReasons,
      moduleCounts,
      mostEdited: allPublished.sort((a, b) => b.revisions.length - a.revisions.length).slice(0, 5)
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

      {/* LIFECYCLE & TEMPLATE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-900">Definition Lifecycle</h3>
                <span className="text-[10px] font-bold text-slate-400">Total <strong>30</strong> definitions</span>
            </div>
            
            <div className="flex items-center gap-1.5 mb-10 overflow-x-auto pb-4">
                <LifecycleBox label="Draft" value={6} color="bg-amber-50 text-amber-600 border-amber-100" />
                <Arrow />
                <LifecycleBox label="Sent for Approval" value={3} color="bg-indigo-50 text-indigo-600 border-indigo-100" />
                <Arrow />
                <LifecycleBox label="Pending Approval" value={4} color="bg-blue-50 text-blue-600 border-blue-100" />
                <Arrow />
                <LifecycleBox label="Changes Requested" value={2} color="bg-pink-50 text-pink-600 border-pink-100" />
                <Arrow />
                <LifecycleBox label="Rejected" value={1} color="bg-red-50 text-red-600 border-red-100" />
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

            <div className="flex items-center gap-4 mt-8 flex-wrap">
                <LegendItem label="Draft" color="bg-amber-400" />
                <LegendItem label="Sent for Approval" color="bg-indigo-400" />
                <LegendItem label="Pending Approval" color="bg-blue-400" />
                <LegendItem label="Changes Requested" color="bg-pink-400" />
                <LegendItem label="Rejected" color="bg-red-400" />
                <LegendItem label="Published" color="bg-emerald-400" />
                <LegendItem label="Archived" color="bg-slate-300" />
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
            <ShieldCheck className="h-3.5 w-3.5" />
            Governance Insights
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <InsightItem title="Stale Published" value={metrics.stalePublishedCount} sub="Unreviewed > 6mo" icon={FileSearch} color="text-amber-600" bgColor="bg-amber-50" />
            <InsightItem title="Active Contributors" value={metrics.activeContributorsCount} sub="Last 30 Days" icon={UserPlus} color="text-indigo-600" bgColor="bg-indigo-50" />
            <InsightItem title="Stale Drafts" value={metrics.staleDraftsCount} sub="Inactive > 30d" icon={Ghost} color="text-slate-400" bgColor="bg-slate-50" />
            <InsightItem title="Zero-Impact" value={metrics.unusedTemplatesCount} sub="Unused Templates" icon={Trash2} color="text-red-500" bgColor="bg-red-50" />
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

function LifecycleBox({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className={cn("min-w-[110px] p-3 rounded-2xl border text-center flex flex-col items-center gap-1", color)}>
            <span className="text-lg font-black">{value}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter leading-none max-w-[80px]">{label}</span>
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

function LegendItem({ label, color }: { label: string, color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", color)} />
            <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
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
