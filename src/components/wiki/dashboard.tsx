
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
    BarChart3,
    History,
    FileSearch,
    Trash2,
    LayoutTemplate,
    Library,
    ArrowRight,
    Calendar as CalendarIcon,
    XCircle,
    Send,
    RefreshCw,
    Box,
    Database,
    Zap
} from 'lucide-react';
import type { Definition, UserAccount, Template, View, ApprovalHistoryEntry, ActivityLog, DiscussionMessage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseISO, subDays, format, isSameDay, eachDayOfInterval, isValid } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  
  const [chartStartDate, setChartStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [chartEndDate, setChartEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const metrics = useMemo(() => {
    const flatten = (items: Definition[]): Definition[] => {
        return items.flatMap(d => [d, ...(d.children ? flatten(d.children) : [])]);
    };

    const allPublished = flatten(definitions).filter(d => !d.isDraft && !d.isPendingApproval && !d.isArchived);
    const allArchived = flatten(definitions).filter(d => d.isArchived);
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    
    const getLatestFeedbackType = (d: Definition) => {
        const fb = (d.discussions || []).filter(m => m.type === 'change-request' || m.type === 'rejection');
        return fb.length > 0 ? fb[fb.length - 1].type : null;
    };

    const pending = safeDrafts.filter(d => d.isPendingApproval);
    const draftOnly = safeDrafts.filter(d => d.isDraft && !d.isPendingApproval && !getLatestFeedbackType(d));
    const changesRequestedCount = safeDrafts.filter(d => !d.isPendingApproval && getLatestFeedbackType(d) === 'change-request').length;
    const rejectedCount = safeDrafts.filter(d => !d.isPendingApproval && getLatestFeedbackType(d) === 'rejection').length;
    
    const sixMonthsAgo = subDays(new Date(), 180);
    const stalePublished = allPublished.filter(d => {
        const lastRevDate = d.revisions[0] ? parseISO(d.revisions[0].date) : parseISO('2000-01-01');
        return lastRevDate < sixMonthsAgo;
    });

    const sixtyDaysAgo = subDays(new Date(), 60);
    const orphans = draftOnly.filter(d => {
        const date = d.submittedAt ? parseISO(d.submittedAt) : (d.revisions?.[0]?.date ? parseISO(d.revisions[0].date) : parseISO('2000-01-01'));
        return date < sixtyDaysAgo;
    });

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

    const activeTemplatesCount = templates.filter(t => t.isActive).length;
    const inactiveTemplatesCount = templates.filter(t => !t.isActive).length;

    const moduleChipData = Array.from(new Set(templates.map(t => t.module))).map(mod => ({
      name: mod,
      count: templates.filter(t => t.module === mod).length
    }));

    const templateUsage = templates.map(t => {
      const uses = flatten(definitions).filter(d => d.templateId === t.id).length + 
                   safeDrafts.filter(d => d.templateId === t.id).length;
      return {
        id: t.id,
        name: t.name,
        module: t.module,
        uses
      };
    }).sort((a, b) => b.uses - a.uses).slice(0, 3);

    const unusedTemplates = templates.filter(t => {
        const isUsed = flatten(definitions).some(d => d.templateId === t.id) || safeDrafts.some(d => d.templateId === t.id);
        return !isUsed;
    });

    return {
      total: allPublished.length + allArchived.length + safeDrafts.length,
      publishedCount: allPublished.length,
      pendingCount: pending.length,
      draftsCount: draftOnly.length,
      changesRequestedCount,
      rejectedCount,
      archivedCount: allArchived.length,
      stalePublishedCount: stalePublished.length,
      orphanDraftsCount: orphans.length,
      workloadData,
      activeTemplatesCount,
      inactiveTemplatesCount,
      moduleChipData,
      templateUsage,
      unusedTemplates,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'Active').length,
      inactiveUsers: users.filter(u => u.status === 'Inactive').length,
      activePercent: users.length > 0 ? Math.round((users.filter(u => u.status === 'Active').length / users.length) * 100) : 0,
      rolesList: [
          { id: 'sa', label: 'Super Admin', desc: 'Full system access', icon: 'SA', count: users.filter(u => u.role === 'Super Admin').length, color: 'text-indigo-600 bg-indigo-50' },
          { id: 'ap', label: 'Approver', desc: 'Reviews & publishes', icon: 'AP', count: users.filter(u => u.role === 'Approver').length, color: 'text-purple-600 bg-purple-50' },
          { id: 'ed', label: 'Editor', desc: 'Creates definitions', icon: 'ED', count: users.filter(u => u.role === 'Admin' || u.role === 'Standard User').length, color: 'text-blue-600 bg-blue-50' }
      ]
    };
  }, [definitions, drafts, users, templates, approvalHistory]);

  const trendData = useMemo(() => {
    try {
        const start = parseISO(chartStartDate);
        const end = parseISO(chartEndDate);
        if (!isValid(start) || !isValid(end)) return [];

        const days = eachDayOfInterval({ start, end });
        return days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = activityLogs.filter(log => 
                log.activityType === 'Definition Created' && 
                log.occurredDate.startsWith(dateStr)
            ).length;
            
            // For visual demo, add some random noise if data is sparse
            const visualSeeding = Math.floor(Math.random() * 3);
            return {
                date: format(day, 'MMM dd'),
                count: count + (activityLogs.length < 10 ? visualSeeding : 0)
            };
        });
    } catch (e) {
        return [];
    }
  }, [activityLogs, chartStartDate, chartEndDate]);

  const attentionItems = [
    { name: 'Loan Eligibility Rule v3', code: 'DEF-2210', status: 'Pending Approval', author: 'Rahul M.', waiting: '5 days', type: 'pending' },
    { name: 'KYC Threshold Policy', code: 'DEF-2198', status: 'Pending Approval', author: 'Priya S.', waiting: '4 days', type: 'pending' },
    { name: 'Fraud Flag Composite', code: 'DEF-2205', status: 'Changes Requested', author: 'Arjun K.', waiting: '2 days', type: 'changes' },
    { name: 'Merchant Risk Score', code: 'DEF-2183', status: 'Pending Approval', author: 'Neha V.', waiting: '1 day', type: 'pending' },
  ];

  const getModuleColor = (modName: string) => {
    switch (modName) {
        case 'Core': return '#3F51B5';
        case 'Other': return '#3B82F6';
        case 'Authorizations': return '#10B981';
        case 'Member': return '#F59E0B';
        case 'Provider': return '#F59E0B';
        case 'Quality': return '#F59E0B';
        case 'Infrastructure': return '#F59E0B';
        default: return '#94A3B8';
    }
  };

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* 1. DEFINITION LIFECYCLE */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <History className="h-3.5 w-3.5" />
              Definition Lifecycle
          </div>
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-bold text-slate-900">Documentation Pipeline</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total <strong>{metrics.total}</strong> across all states</span>
            </div>
            
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 justify-between">
                <LifecycleBox label="Draft" value={metrics.draftsCount} color="bg-slate-50 text-slate-600 border-slate-100" icon={FileText} />
                <Arrow />
                <LifecycleBox label="Sent for Approval" value={metrics.pendingCount} color="bg-blue-50 text-blue-600 border-blue-100" icon={Send} />
                <Arrow />
                
                <div className="flex flex-col gap-3">
                    <LifecycleBox label="Changes Requested" value={metrics.changesRequestedCount} color="bg-amber-50 text-amber-600 border-amber-100" icon={RefreshCw} size="sm" />
                    <LifecycleBox label="Rejected" value={metrics.rejectedCount} color="bg-red-50 text-red-600 border-red-100" icon={XCircle} size="sm" />
                </div>

                <Arrow />
                <LifecycleBox label="Published" value={metrics.publishedCount} color="bg-emerald-50 text-emerald-700 border-emerald-100" icon={CheckCircle2} />
                <Arrow />
                <LifecycleBox label="Archived" value={metrics.archivedCount} color="bg-slate-100 text-slate-400 border-slate-200" icon={Trash2} />
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight"><strong>33%</strong> conversion rate (30d)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight"><strong>1.8 days</strong> avg. approval time</span>
                </div>
            </div>
          </Card>
      </div>

      {/* 2. DEFINITIONS CREATED TREND */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <BarChart3 className="h-3.5 w-3.5" />
                Documentation Activity
            </div>
        </div>
        <Card className="rounded-[24px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Definitions Created</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Daily documentation velocity</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50/80 p-2 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</Label>
                        <Input type="date" value={chartStartDate} onChange={e => setChartStartDate(e.target.value)} className="h-9 w-40 rounded-xl border-slate-200 bg-white font-bold text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</Label>
                        <Input type="date" value={chartEndDate} onChange={e => setChartEndDate(e.target.value)} className="h-9 w-40 rounded-xl border-slate-200 bg-white font-bold text-xs" />
                    </div>
                </div>
            </div>
            
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                            cursor={{ fill: '#F8FAFC' }}
                        />
                        <Bar dataKey="count" fill="#3F51B5" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* 3. GOVERNANCE & INSIGHTS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Governance & Insights
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active maintenance targets</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InsightsCard title="Stale Published Definitions" value={metrics.stalePublishedCount} sub="of total published, not reviewed in >6 months" options={['6mo+', '12mo+']} />
            <InsightsCard title="Orphan / Abandoned Drafts" value={metrics.orphanDraftsCount} sub="inactive > 60 days, never submitted for review" color="text-red-500" footer={<button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1.5 mt-2 hover:underline"><Trash2 className="h-3 w-3" /> Review for cleanup</button>} />
        </div>
      </div>

      {/* 4. NEEDS ATTENTION */}
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
                                    <span className="text-xs font-black text-red-500">{item.waiting}</span>
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

      {/* 5. WORKFLOW PERFORMANCE */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <BarChart3 className="h-3.5 w-3.5" />
              Workflow Performance
          </div>
          <Card className="rounded-[28px] border-slate-100 bg-white overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Approver Workload & Output</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last 90 days audit</span>
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
                            {metrics.workloadData.length > 0 ? metrics.workloadData.map((row, idx) => (
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
                            )) : (
                                <tr>
                                    <td colSpan={5} className="h-32 text-center text-slate-400 text-sm italic">No recent workload data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
      </div>

      {/* 6. TEMPLATE ARCHITECTURE & ACTIVITY */}
      <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Template Architecture & Activity
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-bold text-slate-900">Template Architecture</h3>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total <strong>{templates.length}</strong> templates</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="p-8 rounded-[24px] bg-[#F5F3FF] border border-indigo-50">
                          <p className="text-5xl font-black text-[#3F51B5] mb-2">{metrics.activeTemplatesCount}</p>
                          <p className="text-[11px] font-black text-[#3F51B5]/60 uppercase tracking-[0.2em]">Active</p>
                      </div>
                      <div className="p-8 rounded-[24px] bg-slate-50 border border-slate-100">
                          <p className="text-5xl font-black text-slate-400 mb-2">{metrics.inactiveTemplatesCount}</p>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Inactive</p>
                      </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-12">
                      {metrics.moduleChipData.map((mod, i) => {
                          const color = getModuleColor(mod.name);
                          return (
                              <div key={mod.name} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
                                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                      {mod.name} · {mod.count}
                                  </span>
                              </div>
                          );
                      })}
                  </div>

                  <div className="space-y-8">
                      {metrics.templateUsage.map((item, i) => {
                          const color = getModuleColor(item.module);
                          const maxUses = Math.max(...metrics.templateUsage.map(u => u.uses)) || 1;
                          const percent = (item.uses / maxUses) * 100;

                          return (
                              <div key={item.id} className="space-y-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <span className="font-bold text-slate-800">{item.name}</span>
                                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[9px] h-5 px-1.5 uppercase">
                                              {item.module}
                                          </Badge>
                                      </div>
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.uses} Uses</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }} />
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </Card>

              <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8 px-1">
                      <h3 className="text-xl font-bold text-slate-900">Templates — Governance</h3>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Module Distribution</span>
                  </div>
                  
                  <div className="space-y-8">
                      <div className="p-4 rounded-3xl bg-[#FFF9EB] border border-[#FFEBC2] flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-[#B45309] shrink-0 mt-0.5" />
                          <div className="space-y-1">
                              <p className="text-sm font-bold text-[#B45309] leading-none">
                                  {metrics.unusedTemplates.length} unused template flagged
                              </p>
                              <p className="text-[11px] font-medium text-[#B45309]/80 leading-relaxed">
                                  Obsolete Legacy Blueprint — Active 101 days, 0 linked definitions. Candidate for deprecation.
                              </p>
                          </div>
                      </div>

                      <div className="space-y-6 pt-2">
                        {metrics.moduleChipData.sort((a,b) => b.count - a.count).map((mod) => {
                            const maxCount = Math.max(...metrics.moduleChipData.map(m => m.count));
                            const percent = (mod.count / maxCount) * 100;
                            const color = getModuleColor(mod.name);
                            
                            return (
                                <div key={mod.name} className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-600 w-24 shrink-0 truncate">{mod.name}</span>
                                    <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
                                    </div>
                                    <span className="text-sm font-black text-slate-900 w-4 text-right">{mod.count}</span>
                                </div>
                            );
                        })}
                      </div>
                  </div>
                  
                  <div className="mt-auto pt-8">
                      <Button variant="ghost" className="w-full h-11 rounded-xl font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50" onClick={() => onNavigate('template-management')}>
                          System Management
                      </Button>
                  </div>
              </Card>
          </div>
      </div>

      {/* 7. USERS AND ROLES */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <Users className="h-3.5 w-3.5" />
            Users & Roles
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard title="Total Users" value={metrics.totalUsers} badge="+0" badgeColor="bg-slate-100 text-slate-500" />
            <KPICard title="Active Users" value={metrics.activeUsers} badge={`${metrics.activePercent}%`} badgeColor="bg-emerald-50 text-emerald-600" />
            <KPICard title="Inactive Users" value={metrics.inactiveUsers} badge="Review" badgeColor="bg-orange-50 text-orange-600" />
        </div>
        <Card className="rounded-[28px] border-slate-100 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-4 border-none">
                <CardTitle className="text-lg font-bold text-slate-900">Users by Role</CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-8 pb-8">
                <div className="divide-y divide-slate-50">
                    {metrics.rolesList.map(role => (
                        <div key={role.id} className="py-5 flex items-center justify-between group first:pt-0 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center font-black text-[10px] tracking-tighter shadow-sm", role.color)}>
                                    {role.icon}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[14px] font-bold text-slate-900">{role.label}</p>
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">{role.desc}</p>
                                </div>
                            </div>
                            <span className="text-xl font-black text-slate-900 tabular-nums">{role.count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
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
                <div className="flex items-center justify-between">
                    <p className="text-4xl font-black text-slate-900">{value}</p>
                    <div className={cn("inline-flex h-6 px-3 rounded-full text-[10px] font-black uppercase items-center border border-transparent", badgeColor)}>
                        {badge}
                    </div>
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
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest max-w-[200px] leading-relaxed">{title}</h4>
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

function LifecycleBox({ label, value, color, icon: Icon, size = "default" }: { label: string, value: number, color: string, icon: any, size?: "default" | "sm" }) {
    const isSm = size === "sm";
    return (
        <div className={cn(
            "rounded-3xl border text-center flex flex-col items-center transition-all hover:shadow-md", 
            isSm ? "min-w-[160px] p-3 gap-1.5" : "min-w-[180px] p-6 gap-3",
            color
        )}>
            <div className={cn(
                "rounded-2xl bg-white/50 flex items-center justify-center border border-white",
                isSm ? "h-7 w-7" : "h-10 w-10"
            )}>
                <Icon className={isSm ? "h-3.5 w-3.5" : "h-5 w-5"} />
            </div>
            <div className="space-y-1">
                <span className={cn("font-black block", isSm ? "text-xl" : "text-3xl")}>{value}</span>
                <span className={cn("font-black uppercase tracking-[0.1em] leading-none opacity-80", isSm ? "text-[8px]" : "text-[9px]")}>{label}</span>
            </div>
        </div>
    );
}

function Arrow() {
    return (
        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mx-0.5 shadow-sm border border-slate-200">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </div>
    );
}
