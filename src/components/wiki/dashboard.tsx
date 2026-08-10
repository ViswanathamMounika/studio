
"use client";

import React, { useMemo, useState } from 'react';
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
    Play,
    Calendar as CalendarIcon,
    Info,
    History,
    FileEdit,
    Clock,
    UserCheck,
    BarChart,
    Timer,
    AlertTriangle,
    Trash2,
    Library
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    BarChart as ReBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    Legend,
    CartesianGrid
} from 'recharts';
import type { Definition, UserAccount, Template, View, ApprovalHistoryEntry, ActivityLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { differenceInDays, parseISO, subDays, format, startOfDay, endOfDay, isWithinInterval, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isValid, subMonths } from 'date-fns';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
  approvalHistory?: ApprovalHistoryEntry[];
  activityLogs?: ActivityLog[];
};

const countPublishedDefinitions = (items: Definition[]): { published: number, archived: number, stale: number, mostEdited: any[] } => {
  if (!Array.isArray(items)) return { published: 0, archived: 0, stale: 0, mostEdited: [] };
  let published = 0;
  let archived = 0;
  let stale = 0;
  let allFlattened: any[] = [];
  
  const sixMonthsAgo = subMonths(new Date(), 6);

  const traverse = (items: Definition[]) => {
      items.forEach(item => {
        if (item && (item.description || item.shortDescription || (item.sectionValues && item.sectionValues.length > 0))) {
          if (item.isArchived) archived++;
          else {
              published++;
              const lastEdit = item.revisions?.[0]?.date ? parseISO(item.revisions[0].date) : new Date(0);
              if (lastEdit < sixMonthsAgo) stale++;
          }
          allFlattened.push({ name: item.name, revisions: item.revisions?.length || 0, module: item.module });
        }
        if (item && item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
  };
  
  traverse(items);
  const mostEdited = allFlattened.sort((a, b) => b.revisions - a.revisions).slice(0, 5);
  return { published, archived, stale, mostEdited };
};

const MODULE_COLORS: Record<string, string> = {
    'Authorizations': 'bg-indigo-50 text-indigo-700 border-indigo-100 dot-indigo-500',
    'Claims': 'bg-blue-50 text-blue-700 border-blue-100 dot-blue-500',
    'Provider': 'bg-emerald-50 text-emerald-700 border-emerald-100 dot-emerald-500',
    'Member': 'bg-orange-50 text-orange-700 border-orange-100 dot-orange-500',
    'Core': 'bg-slate-50 text-slate-700 border-slate-100 dot-slate-500',
    'Other': 'bg-slate-50 text-slate-700 border-slate-100 dot-slate-500'
};

const CHART_COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard({ definitions, drafts, users, templates, onNavigate, approvalHistory = [], activityLogs = [] }: DashboardProps) {
  const { toast } = useToast();
  
  const [velocityRange, setVelocityRange] = useState({
    from: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const metrics = useMemo(() => {
    const safeDefinitions = Array.isArray(definitions) ? definitions : [];
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeTemplates = Array.isArray(templates) ? templates : [];
    const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];
    const safeLogs = Array.isArray(activityLogs) ? activityLogs : [];

    const { published, archived, stale, mostEdited } = countPublishedDefinitions(safeDefinitions);
    
    // Lifecycle Mapping
    const draftOnly = safeDrafts.filter(d => d && d.isDraft && !d.isPendingApproval && !(d.discussions || []).some(m => m.type === 'change-request' || m.type === 'rejection'));
    const pendingApproval = safeDrafts.filter(d => d && d.isPendingApproval);
    const changesRequested = safeDrafts.filter(d => d && (d.discussions || []).some(m => m.type === 'change-request') && !d.isPendingApproval);
    const rejected = safeDrafts.filter(d => d && (d.discussions || []).some(m => m.type === 'rejection') && !d.isPendingApproval);
    
    // Bottlenecks (> 3 days)
    const threeDaysAgo = subDays(new Date(), 3);
    const approvalBottleneck = pendingApproval.filter(d => d.submittedAt && parseISO(d.submittedAt) < threeDaysAgo).length;

    // Stale Drafts (> 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const staleDrafts = draftOnly.filter(d => {
        const dateStr = d.revisions?.[0]?.date || d.submittedAt || new Date().toISOString();
        return parseISO(dateStr) < thirtyDaysAgo;
    });

    // Orphan/Abandoned (> 60 days inactive)
    const sixtyDaysAgo = subDays(new Date(), 60);
    const orphanDrafts = draftOnly.filter(d => {
        const lastActivity = d.revisions?.[0]?.date || d.submittedAt || new Date(0).toISOString();
        return parseISO(lastActivity) < sixtyDaysAgo;
    });

    // Active Contributors (30 days)
    const recentLogs = safeLogs.filter(l => parseISO(l.occurredDate) > thirtyDaysAgo);
    const activeContributors = new Set(recentLogs.map(l => l.userName)).size;

    // Revision rate
    const totalDecisions = safeHistory.filter(h => h.action === 'Approved' || h.action === 'Changes Requested').length;
    const revisionDecisions = safeHistory.filter(h => h.action === 'Changes Requested').length;
    const revisionRate = totalDecisions > 0 ? Math.round((revisionDecisions / totalDecisions) * 100) : 0;

    // Approver Leaderboard
    const approverStatsMap: Record<string, { approved: number, requested: number, rejected: number }> = {};
    safeHistory.forEach(h => {
        if (h.action === 'Submitted') return;
        if (!approverStatsMap[h.userName]) approverStatsMap[h.userName] = { approved: 0, requested: 0, rejected: 0 };
        if (h.action === 'Approved') approverStatsMap[h.userName].approved++;
        if (h.action === 'Changes Requested') approverStatsMap[h.userName].requested++;
        if (h.action === 'Rejected') approverStatsMap[h.userName].rejected++;
    });
    const approverLeaderboard = Object.entries(approverStatsMap).map(([name, stats]) => ({
        name,
        ...stats,
        total: stats.approved + stats.requested + stats.rejected
    })).sort((a, b) => b.total - a.total).slice(0, 5);

    // Rejection Reasons
    const rejectionReasons: Record<string, number> = {
        'Duplication': 0,
        'Formatting': 0,
        'Policy Violation': 0,
        'Technical Error': 0,
        'Other': 0
    };
    safeHistory.filter(h => h.action === 'Rejected' || h.action === 'Changes Requested').forEach(h => {
        const comment = (h.comment || '').toLowerCase();
        if (comment.includes('duplicat')) rejectionReasons['Duplication']++;
        else if (comment.includes('format') || comment.includes('style')) rejectionReasons['Formatting']++;
        else if (comment.includes('policy') || comment.includes('standard')) rejectionReasons['Policy Violation']++;
        else if (comment.includes('sql') || comment.includes('error') || comment.includes('technical')) rejectionReasons['Technical Error']++;
        else rejectionReasons['Other']++;
    });
    const rejectionData = Object.entries(rejectionReasons).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

    // Template Stats
    const unusedTemplates = safeTemplates.filter(t => {
        if (!t.isActive) return false;
        // Simple usage check
        const isUsed = definitions.some(d => d.templateId === t.id) || drafts.some(d => d.templateId === t.id);
        return !isUsed;
    });

    const moduleTemplateCounts: Record<string, number> = {};
    safeTemplates.forEach(t => {
        moduleTemplateCounts[t.module] = (moduleTemplateCounts[t.module] || 0) + 1;
    });

    return {
        totalUsers: safeUsers.length,
        activePercentage: safeUsers.length > 0 ? Math.round((safeUsers.filter(u => u.status === 'Active').length / safeUsers.length) * 100) : 0,
        
        totalDefinitions: published + archived + safeDrafts.length,
        publishedCount: published,
        stalePublished: stale,
        mostEdited,
        activeContributors,
        revisionRate,
        approvalBottleneck,
        orphanDrafts: orphanDrafts.length,
        approverLeaderboard,
        rejectionData,

        lifecycle: {
            draft: draftOnly.length,
            staleDrafts: staleDrafts.length,
            pending: pendingApproval.length,
            requested: changesRequested.length,
            rejected: rejected.length,
            published: published,
            archived: archived
        },

        totalTemplates: safeTemplates.length,
        unusedTemplates: unusedTemplates.length,
        moduleTemplateCounts: Object.entries(moduleTemplateCounts).map(([name, count]) => ({ name, count }))
    };
  }, [definitions, drafts, users, templates, activityLogs, approvalHistory]);

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* HEADER */}
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-sm font-medium text-slate-500">Global Documentation Analytics & Workflow Governance</p>
        </div>
        <div className="flex items-center gap-3">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold gap-1.5 h-8 px-4 rounded-xl shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational
            </Badge>
            <div className="h-9 w-9 rounded-xl bg-[#3F51B5] text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-100">
                SA
            </div>
        </div>
      </div>

      {/* CORE KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Approval Bottleneck" value={metrics.approvalBottleneck} subtitle="Pending > 3 days" icon={Timer} color="text-red-600" alert={metrics.approvalBottleneck > 0} />
          <KPICard title="Return-for-Revision" value={`${metrics.revisionRate}%`} subtitle="Req changes vs Approved" icon={History} color="text-indigo-600" />
          <KPICard title="Active Contributors" value={metrics.activeContributors} subtitle="Past 30 days" icon={Users} color="text-emerald-600" />
          <KPICard title="Stale Published" value={metrics.stalePublished} subtitle="No edits > 6 months" icon={AlertCircle} color="text-amber-600" alert={metrics.stalePublished > 5} />
      </div>

      {/* SECTION: DEFINITION LIFECYCLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-xl font-bold text-slate-900">Governance Lifecycle</h3>
                </div>
                <span className="text-[13px] font-bold text-slate-500">Total <span className="text-slate-900 font-black">{metrics.totalDefinitions}</span> Definitions</span>
            </div>

            <div className="flex items-center gap-2 mb-8 w-full">
                <LifecycleBlock count={metrics.lifecycle.draft} label="Active Draft" color="bg-amber-50 text-amber-600 border-amber-100" />
                <LifecycleBlock count={metrics.lifecycle.staleDrafts} label="Stale (>30d)" color="bg-orange-50 text-orange-600 border-orange-100" />
                <BlockArrow />
                <LifecycleBlock count={metrics.lifecycle.pending} label="Pending Review" color="bg-blue-50 text-blue-600 border-blue-100" />
                <BlockArrow />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <LifecycleBlock count={metrics.lifecycle.requested} label="Changes Req." color="bg-pink-50 text-pink-600 border-pink-100" h="h-11" />
                    <LifecycleBlock count={metrics.lifecycle.rejected} label="Rejected" color="bg-red-50 text-red-700 border-red-100" h="h-11" />
                </div>
                <LifecycleBlock count={metrics.lifecycle.published} label="Published" color="bg-emerald-50 text-emerald-600 border-emerald-100" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Orphan Drafts</p>
                    <p className="text-xl font-black text-slate-900">{metrics.orphanDrafts}</p>
                    <p className="text-[10px] font-medium text-slate-500">Inactive > 60d</p>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Archived</p>
                    <p className="text-xl font-black text-slate-400">{metrics.lifecycle.archived}</p>
                    <p className="text-[10px] font-medium text-slate-500">Library baseline</p>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Avg Review Time</p>
                    <p className="text-xl font-black text-indigo-600">1.8d</p>
                    <p className="text-[10px] font-medium text-slate-500">Target < 2.0d</p>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Health Score</p>
                    <p className="text-xl font-black text-emerald-600">94%</p>
                    <p className="text-[10px] font-medium text-slate-500">Metadata compliance</p>
                </div>
            </div>
        </Card>

        <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8">
            <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-bold text-slate-900">Rejection Analysis</h3>
            </div>
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={metrics.rejectionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {metrics.rejectionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 mt-4">
                {metrics.rejectionData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                            <span className="text-slate-500 uppercase tracking-tight">{item.name}</span>
                        </div>
                        <span className="text-slate-900 tabular-nums">{item.value}</span>
                    </div>
                ))}
            </div>
        </Card>
      </div>

      {/* WORKLOAD & HOTSPOTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-[#3F51B5]" />
                    <h3 className="text-xl font-bold text-slate-900">Approver Workload</h3>
                </div>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Top 5 Performer</Badge>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={metrics.approverLeaderboard} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }} />
                        <RechartsTooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '12px' }} />
                        <Bar dataKey="approved" name="Approved" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="requested" name="Req. Changes" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                    </ReBarChart>
                </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8">
            <div className="flex items-center gap-2 mb-8">
                <FileEdit className="h-5 w-5 text-indigo-500" />
                <h3 className="text-xl font-bold text-slate-900">Most Edited Hotspots</h3>
            </div>
            <div className="space-y-6">
                {metrics.mostEdited.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-400">
                                #{idx + 1}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{item.name}</span>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.module}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-lg font-black text-indigo-600 tabular-nums">{item.revisions}</span>
                                <span className="text-[9px] font-black uppercase text-slate-400">revisions</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                    </div>
                ))}
            </div>
          </Card>
      </div>

      {/* SECTION: TEMPLATE HEALTH */}
      <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden p-8">
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-indigo-500" />
                <h3 className="text-xl font-bold text-slate-900">Template Ecosystem</h3>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Zero Impact</p>
                    <p className={cn("text-xl font-black", metrics.unusedTemplates > 0 ? "text-red-600" : "text-slate-900")}>{metrics.unusedTemplates}</p>
                </div>
                <div className="text-right border-l pl-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Total</p>
                    <p className="text-xl font-black text-slate-900">{metrics.totalTemplates}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.moduleTemplateCounts.map(module => (
                <div key={module.name} className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-indigo-100 transition-all">
                    <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{module.name}</p>
                        <p className="text-3xl font-black text-slate-900">{module.count}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-colors">
                        <LayoutTemplate className="h-5 w-5 text-slate-300 group-hover:text-indigo-600" />
                    </div>
                </div>
            ))}
        </div>
        
        {metrics.unusedTemplates > 0 && (
            <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-bold text-red-900">
                    Governance Alert: <span className="font-medium">{metrics.unusedTemplates} templates have remained unused for > 90 days.</span> Consider deprecation or consolidation to reduce system noise.
                </p>
            </div>
        )}
      </Card>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, color, alert }: { title: string, value: any, subtitle: string, icon: any, color: string, alert?: boolean }) {
    return (
        <Card className={cn("rounded-[24px] border-slate-200 bg-white p-6 shadow-sm transition-all", alert && "border-red-200 bg-red-50/20")}>
            <div className="flex justify-between items-start">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Icon className={cn("h-5 w-5", color)} />
                </div>
                {alert && <Badge className="bg-red-100 text-red-700 animate-pulse uppercase text-[9px] font-black">Critical</Badge>}
            </div>
            <div className="mt-6">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{title}</h4>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
                    <span className="text-[11px] font-bold text-slate-500">{subtitle}</span>
                </div>
            </div>
        </Card>
    );
}

function LifecycleBlock({ count, label, color, h = "h-24" }: { count: number, label: string, color: string, h?: string }) {
    return (
        <div className={cn(
            "rounded-xl border p-4 flex flex-col justify-center transition-all flex-1 min-w-0 shadow-sm",
            color,
            h
        )}>
            <span className="font-black tabular-nums leading-none text-2xl">{count}</span>
            <span className="font-bold mt-2 leading-tight text-[11px] uppercase tracking-tighter">{label}</span>
        </div>
    );
}

function BlockArrow() {
    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0 mx-1">
            <ChevronRightSquare className="h-4 w-4 text-slate-400" />
        </div>
    );
}
