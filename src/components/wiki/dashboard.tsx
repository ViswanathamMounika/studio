
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
import { parseISO, subDays, differenceInDays, format, startOfDay, eachDayOfInterval, isSameDay, isValid } from 'date-fns';
import { Input } from '../ui/input';
import { Label } from '@/components/ui/label';

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
  
  // Chart state for date filters
  const [chartStartDate, setChartStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [chartEndDate, setChartEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const metrics = useMemo(() => {
    const allPublished = definitions.flatMap(d => [d, ...(d.children || [])]).filter(d => !d.isDraft && !d.isPendingApproval && !d.isArchived);
    const allArchived = definitions.flatMap(d => [d, ...(d.children || [])]).filter(d => d.isArchived);
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    
    const pending = safeDrafts.filter(d => d.isPendingApproval);
    const draftOnly = safeDrafts.filter(d => d.isDraft && !d.isPendingApproval);
    
    // Stale Published (> 6 months)
    const sixMonthsAgo = subDays(new Date(), 180);
    const stalePublished = allPublished.filter(d => {
        const lastRevDate = d.revisions[0] ? parseISO(d.revisions[0].date) : parseISO('2000-01-01');
        return lastRevDate < sixMonthsAgo;
    });

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

    // Creation Trend based on filters
    const start = parseISO(chartStartDate);
    const end = parseISO(chartEndDate);
    let creationTrendData: any[] = [];
    
    if (isValid(start) && isValid(end) && start <= end) {
        creationTrendData = eachDayOfInterval({ start, end }).map(day => {
            const count = activityLogs.filter(l => 
                l.activityType === 'Definition Created' && 
                isSameDay(parseISO(l.occurredDate), day)
            ).length;
            return {
                name: format(day, 'MMM dd'),
                fullDate: format(day, 'MM/dd/yyyy'),
                count: count
            };
        });
    }

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
      publishedCount: allPublished.length,
      pendingCount: pending.length,
      draftsCount: draftOnly.length,
      archivedCount: allArchived.length,
      stalePublishedCount: stalePublished.length,
      orphanDraftsCount: orphans.length,
      workloadData,
      creationTrendData,
      moduleCounts,
      unusedTemplates,
      mostEdited: allPublished.sort((a, b) => b.revisions.length - a.revisions.length).slice(0, 5),
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
  }, [definitions, drafts, users, templates, activityLogs, approvalHistory, chartStartDate, chartEndDate]);

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

      {/* DEFINITION LIFECYCLE - FULL WIDTH TOP */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <History className="h-3.5 w-3.5" />
              Definition Lifecycle
          </div>
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-bold text-slate-900">Pipeline Distribution</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total <strong>{metrics.total}</strong> active records</span>
            </div>
            
            <div className="flex items-center gap-1.5 mb-10 overflow-x-auto pb-4 justify-between">
                <LifecycleBox label="Draft" value={metrics.draftsCount} color="bg-amber-50 text-amber-600 border-amber-100" />
                <Arrow />
                <LifecycleBox label="Pending Review" value={metrics.pendingCount} color="bg-blue-50 text-blue-600 border-blue-100" />
                <Arrow />
                <LifecycleBox label="Published" value={metrics.publishedCount} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
                <Arrow />
                <LifecycleBox label="Archived" value={metrics.archivedCount} color="bg-slate-50 text-slate-400 border-slate-100" />
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
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight"><strong>4</strong> records require maintenance</span>
                </div>
            </div>
          </Card>
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

      {/* TREND CHART */}
      <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Definitions Created</h3>
              <div className="flex items-center gap-4">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                      <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg font-bold text-[10px] text-slate-50" onClick={() => {
                          setChartStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                          setChartEndDate(format(new Date(), 'yyyy-MM-dd'));
                      }}>7D</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg font-bold text-[10px] text-slate-50" onClick={() => {
                          setChartStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                          setChartEndDate(format(new Date(), 'yyyy-MM-dd'));
                      }}>30D</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg font-bold text-[10px] text-slate-50" onClick={() => {
                          setChartStartDate(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
                          setChartEndDate(format(new Date(), 'yyyy-MM-dd'));
                      }}>90D</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                            type="date" 
                            className="h-8 pl-8 w-40 text-[10px] font-bold rounded-lg border-slate-200" 
                            value={chartStartDate}
                            onChange={(e) => setChartStartDate(e.target.value)}
                        />
                    </div>
                    <span className="text-slate-300 text-xs font-bold">to</span>
                    <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                            type="date" 
                            className="h-8 pl-8 w-40 text-[10px] font-bold rounded-lg border-slate-200" 
                            value={chartEndDate}
                            onChange={(e) => setChartEndDate(e.target.value)}
                        />
                    </div>
                  </div>
              </div>
          </div>
          <div className="h-[300px] w-full">
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
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={80}>
                            {metrics.creationTrendData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === metrics.creationTrendData.length - 1 ? '#6348F4' : '#EAEBFF'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
          </div>
      </Card>

      {/* GOVERNANCE & INSIGHTS - STREAMLINED */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Governance & Insights
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active cleanup targets</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InsightsCard title="Stale Published Definitions" value={metrics.stalePublishedCount} sub="of total published, not reviewed in >6 months" options={['6mo+', '12mo+']} />
            <InsightsCard 
                title="Orphan / Abandoned Drafts" 
                value={metrics.orphanDraftsCount} 
                sub="inactive > 60 days, never submitted for review" 
                color="text-red-500" 
                footer={<button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1.5 mt-2 hover:underline"><Trash2 className="h-3 w-3" /> Review for cleanup</button>} 
            />
        </div>
      </div>

      {/* WORKLOAD - FULL WIDTH */}
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
      </div>

      {/* TEMPLATES & HOTSPOTS - FULL WIDTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-slate-900">Most Edited Definitions</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Library Hotspots</span>
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
                
                <div className="space-y-4 pt-4">
                    {metrics.moduleCounts.map((mod, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-600 w-24 truncate">{mod.name}</span>
                            <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div 
                                    className={cn("h-full rounded-full transition-all duration-1000", 
                                        idx === 0 ? "bg-indigo-500" : idx === 1 ? "bg-blue-400" : idx === 2 ? "bg-emerald-500" : "bg-orange-400"
                                    )} 
                                    style={{ width: `${(mod.count / Math.max(...metrics.moduleCounts.map(m => m.count))) * 100}%` }} 
                                />
                            </div>
                            <span className="text-xs font-black text-slate-900 w-4 text-right">{mod.count}</span>
                        </div>
                    ))}
                </div>
                {metrics.unusedTemplates.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 mt-8">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                            <strong>{metrics.unusedTemplates.length} unused templates flagged:</strong> Candidate blueprints for deprecation audit.
                        </p>
                    </div>
                )}
            </Card>
      </div>

      {/* USERS & ROLES */}
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

function LifecycleBox({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className={cn("min-w-[180px] p-6 rounded-2xl border text-center flex flex-col items-center gap-2", color)}>
            <span className="text-2xl font-black">{value}</span>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
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
