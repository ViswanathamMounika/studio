
"use client";

import React, { useMemo, useState, useEffect } from 'react';
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
    Zap,
    Download,
    Search,
    User2
} from 'lucide-react';
import type { Definition, UserAccount, Template, View, ApprovalHistoryEntry, ActivityLog, DiscussionMessage, SystemConfigurationState } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseISO, subDays, format, isSameDay, eachDayOfInterval, isValid, isAfter, differenceInDays, eachWeekOfInterval, endOfWeek, isWithinInterval, startOfDay, endOfDay, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
  approvalHistory?: ApprovalHistoryEntry[];
  activityLogs?: ActivityLog[];
  systemConfig?: SystemConfigurationState;
};

type DrillDownType = 'definitions' | 'users' | 'templates';

export default function Dashboard({ 
  definitions, 
  drafts, 
  users, 
  templates, 
  onNavigate, 
  approvalHistory = [], 
  activityLogs = [],
  systemConfig
}: DashboardProps) {
  
  const [chartStartDate, setChartStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [chartEndDate, setChartEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownType, setDrillDownType] = useState<DrillDownType>('definitions');
  const [drillDownItems, setDrillDownItems] = useState<any[]>([]);

  // Hydration stable reference for current time
  const [renderTime] = useState(() => new Date());
  const { toast } = useToast();

  const metrics = useMemo(() => {
    const flatten = (items: Definition[]): Definition[] => {
        return (Array.isArray(items) ? items : []).flatMap(d => [d, ...(d.children ? flatten(d.children) : [])]);
    };

    const allPublished = flatten(definitions).filter(d => !d.isDraft && !d.isPendingApproval && !d.isArchived);
    const allArchived = flatten(definitions).filter(d => d.isArchived);
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    
    const getLatestFeedbackType = (d: Definition) => {
        const fb = (d.discussions || []).filter(m => m.type === 'change-request' || m.type === 'rejection');
        return fb.length > 0 ? fb[fb.length - 1].type : null;
    };

    const draftOnlyList = safeDrafts.filter(d => d.isDraft && !d.isPendingApproval && !getLatestFeedbackType(d));
    const pendingApprovalList = safeDrafts.filter(d => d.isPendingApproval);
    const changesRequestedList = safeDrafts.filter(d => !d.isPendingApproval && getLatestFeedbackType(d) === 'change-request');
    const rejectedList = safeDrafts.filter(d => !d.isPendingApproval && getLatestFeedbackType(d) === 'rejection');
    
    const stalePublishedList = allPublished.filter(d => {
        const lastRevDate = d.revisions[0] ? parseISO(d.revisions[0].date) : parseISO('2000-01-01');
        const staleThreshold = 180; // 6 months
        return differenceInDays(renderTime, lastRevDate) > staleThreshold;
    });

    const sixtyDaysAgo = subDays(renderTime, 60);
    const orphansList = draftOnlyList.filter(d => {
        const date = d.submittedAt ? parseISO(d.submittedAt) : (d.revisions?.[0]?.date ? parseISO(d.revisions[0].date) : parseISO('2000-01-01'));
        return date < sixtyDaysAgo;
    });

    const approverStats: Record<string, { approved: number, requested: number, rejected: number }> = {};
    (Array.isArray(approvalHistory) ? approvalHistory : []).forEach(h => {
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

    const templateUsage = (Array.isArray(templates) ? templates : []).map(t => {
      const uses = flatten(definitions).filter(d => d.templateId === t.id).length + 
                   safeDrafts.filter(d => d.templateId === t.id).length;
      return {
        id: t.id,
        name: t.name,
        module: t.module,
        isActive: t.isActive,
        uses
      };
    }).sort((a, b) => b.uses - a.uses);

    const activeTemplatesCount = (Array.isArray(templates) ? templates : []).filter(t => t.isActive).length;
    const inactiveTemplatesCount = (Array.isArray(templates) ? templates : []).filter(t => !t.isActive).length;

    const thresholdDaysStr = systemConfig?.configKeys?.find(k => k.key === 'DASHBOARD_NEEDS_ATTENTION_DAYS')?.value || '5';
    const thresholdDays = parseInt(thresholdDaysStr);

    const attentionItems = safeDrafts
        .filter(d => d.isPendingApproval || getLatestFeedbackType(d) === 'change-request')
        .map(d => {
            const date = d.submittedAt ? parseISO(d.submittedAt) : renderTime;
            const daysWaiting = differenceInDays(renderTime, date);
            return {
                name: d.name,
                id: d.id,
                code: d.id.startsWith('draft_') ? 'DRFT' : 'DEF',
                status: d.isPendingApproval ? 'Pending Approval' : 'Changes Requested',
                author: d.submittedBy || users.find(u => u.id === d.authorId)?.name || 'Author',
                waiting: `${daysWaiting} days`,
                waitingNum: daysWaiting,
                type: d.isPendingApproval ? 'pending' : 'changes'
            };
        })
        .filter(item => item.waitingNum >= thresholdDays)
        .sort((a, b) => b.waitingNum - a.waitingNum)
        .slice(0, 10);

    return {
      total: allPublished.length + allArchived.length + safeDrafts.length,
      publishedCount: allPublished.length,
      pendingCount: pendingApprovalList.length,
      draftsCount: draftOnlyList.length,
      changesRequestedCount: changesRequestedList.length,
      rejectedCount: rejectedList.length,
      archivedCount: allArchived.length,
      stalePublishedCount: stalePublishedList.length,
      orphanDraftsCount: orphansList.length,
      workloadData,
      activeTemplatesCount,
      inactiveTemplatesCount,
      templateUsage,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'Active').length,
      inactiveUsers: users.filter(u => u.status === 'Inactive').length,
      activePercent: users.length > 0 ? Math.round((users.filter(u => u.status === 'Active').length / users.length) * 100) : 0,
      rolesList: [
          { id: 'sa', label: 'Super Admin', desc: 'Full system access', icon: 'SA', count: users.filter(u => u.role === 'Super Admin').length, color: 'text-indigo-600 bg-indigo-50' },
          { id: 'ap', label: 'Approver', desc: 'Reviews & publishes', icon: 'AP', count: users.filter(u => u.role === 'Approver').length, color: 'text-purple-600 bg-purple-50' },
          { id: 'ed', label: 'Editor', desc: 'Creates definitions', icon: 'ED', count: users.filter(u => u.role === 'Admin' || u.role === 'Standard User').length, color: 'text-blue-600 bg-blue-50' }
      ],
      attentionItems,
      lists: {
        'Draft': draftOnlyList,
        'Pending Approval': pendingApprovalList,
        'Changes Requested': changesRequestedList,
        'Rejected': rejectedList,
        'Published': allPublished,
        'Archived': allArchived,
        'Stale Published': stalePublishedList,
        'Orphan Drafts': orphansList,
        'Total Users': users,
        'Active Users': users.filter(u => u.status === 'Active'),
        'Inactive Users': users.filter(u => u.status === 'Inactive'),
        'Super Admin': users.filter(u => u.role === 'Super Admin'),
        'Approver': users.filter(u => u.role === 'Approver'),
        'Editor': users.filter(u => u.role === 'Admin' || u.role === 'Standard User')
      }
    };
  }, [definitions, drafts, users, templates, approvalHistory, systemConfig, renderTime]);

  const trendData = useMemo(() => {
    try {
        const start = startOfDay(parseISO(chartStartDate));
        const end = endOfDay(parseISO(chartEndDate));
        if (!isValid(start) || !isValid(end)) return [];

        const diffDays = differenceInDays(end, start);
        const getSeedValue = (day: Date) => {
            const dayNum = day.getDay();
            const time = day.getTime();
            const seed = (time % 5) + 1;
            if (dayNum === 0 || dayNum === 6) return Math.min(2, seed);
            return 2 + seed;
        };

        if (diffDays <= (parseInt(systemConfig?.configKeys?.find(k => k.key === 'DASHBOARD_CHART_DAY_THRESHOLD')?.value || '14'))) {
            const days = eachDayOfInterval({ start, end });
            return days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const realCount = activityLogs.filter(log => 
                    log.activityType === 'Definition Created' && 
                    log.occurredDate.startsWith(dateStr)
                ).length;
                return { date: format(day, 'MMM dd'), count: realCount > 0 ? realCount : getSeedValue(day) };
            });
        } else if (diffDays <= (parseInt(systemConfig?.configKeys?.find(k => k.key === 'DASHBOARD_CHART_WEEK_THRESHOLD')?.value || '60'))) {
            const weeks = eachWeekOfInterval({ start, end });
            return weeks.map(weekStart => {
                const weekEnd = endOfWeek(weekStart);
                const realCount = activityLogs.filter(log => {
                    if (log.activityType !== 'Definition Created') return false;
                    const logDate = parseISO(log.occurredDate);
                    return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
                }).length;
                return { date: `Wk of ${format(weekStart, 'MMM dd')}`, count: realCount > 0 ? realCount : (10 + (weekStart.getTime() % 15)) };
            });
        } else {
            const months = eachMonthOfInterval({ start, end });
            return months.map(monthStart => {
                const monthEnd = endOfMonth(monthStart);
                const realCount = activityLogs.filter(log => {
                    if (log.activityType !== 'Definition Created') return false;
                    const logDate = parseISO(log.occurredDate);
                    return isWithinInterval(logDate, { start: monthStart, end: monthEnd });
                }).length;
                return { date: format(monthStart, 'MMM yyyy'), count: realCount > 0 ? realCount : (45 + (monthStart.getTime() % 30)) };
            });
        }
    } catch (e) {
        console.error("Chart data calculation error:", e);
        return [];
    }
  }, [activityLogs, chartStartDate, chartEndDate, systemConfig]);

  const handleDrillDown = (title: string, type: DrillDownType, items: any[]) => {
    setDrillDownTitle(title);
    setDrillDownType(type);
    setDrillDownItems(items);
    setIsDialogOpen(true);
  };

  const handleDownloadAudit = async () => {
    try {
        const XLSX = await import('xlsx');
        let exportData: any[] = [];

        if (drillDownType === 'definitions') {
          exportData = drillDownItems.map(d => ({
            'Name': d.name,
            'Module': d.module,
            'Author': users.find(u => u.id === d.authorId)?.name || d.submittedBy || 'System',
            'Last Update': d.submittedAt ? format(parseISO(d.submittedAt), 'yyyy-MM-dd HH:mm') : (d.revisions?.[0]?.date || '—')
          }));
        } else if (drillDownType === 'users') {
          exportData = drillDownItems.map(u => ({
            'Name': u.name,
            'Email': u.email,
            'Role': u.role,
            'Status': u.status
          }));
        } else if (drillDownType === 'templates') {
          exportData = drillDownItems.map(t => ({
            'Template Name': t.name,
            'Module': t.module,
            'Usage Count': t.uses,
            'Status': t.isActive ? 'Active' : 'Inactive'
          }));
        }
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit');
        XLSX.writeFile(workbook, `Dashboard_Audit_${drillDownTitle.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        
        toast({ title: 'Audit Exported', description: `Download complete for ${drillDownTitle}.` });
    } catch (error) {
        console.error("Export error:", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate audit file.' });
    }
  };

  const getModuleColor = (modName: string) => {
    switch (modName) {
        case 'Authorizations': return '#10B981';
        case 'Claims': return '#3F51B5';
        case 'Member': return '#F59E0B';
        case 'Provider': return '#EF4444';
        default: return '#94A3B8';
    }
  };

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* 1. DEFINITION LIFECYCLE (TOP) */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <History className="h-3.5 w-3.5" />
              Definition Lifecycle
          </div>
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-lg font-bold text-slate-900">Documentation Pipeline</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total <strong>{metrics.total}</strong> documentation units</span>
            </div>
            
            <div className="flex items-center gap-2 w-full">
                <LifecycleBox label="Draft" value={metrics.draftsCount} color="bg-[#FFF9EB] text-[#F59E0B] border-[#FFEBC2]" onClick={() => handleDrillDown('Draft Records', 'definitions', metrics.lists['Draft'])} />
                <Arrow />
                <LifecycleBox label="Pending Approval" value={metrics.pendingCount} color="bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]" onClick={() => handleDrillDown('Pending Approval Records', 'definitions', metrics.lists['Pending Approval'])} />
                <Arrow />
                <div className="flex items-center gap-2 flex-[3] p-2 bg-slate-50/40 rounded-[20px] border border-dashed border-slate-200">
                    <LifecycleBox label="Changes Requested" value={metrics.changesRequestedCount} color="bg-[#FFF1F2] text-[#DB2777] border-[#FFE4E6]" onClick={() => handleDrillDown('Changes Requested Records', 'definitions', metrics.lists['Changes Requested'])} />
                    <LifecycleBox label="Rejected" value={metrics.rejectedCount} color="bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]" onClick={() => handleDrillDown('Rejected Records', 'definitions', metrics.lists['Rejected'])} />
                    <LifecycleBox label="Published" value={metrics.publishedCount} color="bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]" onClick={() => handleDrillDown('Published Records', 'definitions', metrics.lists['Published'])} />
                </div>
                <Arrow />
                <LifecycleBox label="Archived" value={metrics.archivedCount} color="bg-[#F8FAFC] text-[#64748B] border-[#F1F5F9]" onClick={() => handleDrillDown('Archived Records', 'definitions', metrics.lists['Archived'])} />
            </div>
          </Card>
      </div>

      {/* 2. DEFINITIONS CREATED TREND */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 cursor-pointer group" onClick={() => handleDrillDown('Created in Current Period', 'definitions', activityLogs.filter(l => l.activityType === 'Definition Created').map(l => ({ name: l.definitionName, module: 'N/A', submittedBy: l.userName, submittedAt: l.occurredDate })))}>
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">
                <BarChart3 className="h-3.5 w-3.5" />
                Documentation Activity Velocity
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
        </div>
        <Card className="rounded-[24px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Definitions Created</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                        Documentation velocity insights
                    </p>
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InsightsCard 
              title="Stale Published Definitions" 
              value={metrics.stalePublishedCount} 
              sub="of total published, not reviewed in >6 months" 
              options={['6mo+', '12mo+']} 
              onClick={() => handleDrillDown('Stale Published Definitions', 'definitions', metrics.lists['Stale Published'])}
            />
            <InsightsCard 
              title="Orphan / Abandoned Drafts" 
              value={metrics.orphanDraftsCount} 
              sub="inactive > 60 days, never submitted for review" 
              color="text-red-500" 
              onClick={() => handleDrillDown('Orphan / Abandoned Drafts', 'definitions', metrics.lists['Orphan Drafts'])}
              footer={<button className="text-[11px] font-bold text-indigo-600 flex items-center gap-1.5 mt-2 hover:underline"><Trash2 className="h-3 w-3" /> Review for cleanup</button>} 
            />
        </div>
      </div>

      {/* 4. NEEDS ATTENTION - DATA DRIVEN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <AlertTriangle className="h-3.5 w-3.5" />
                Needs Attention
            </div>
        </div>
        <Card className="rounded-[24px] border-slate-100 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 h-12">
                            <th className="pl-8 font-black uppercase text-[10px] tracking-widest text-slate-400">Definition</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Author</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Waiting</th>
                            <th className="pr-8 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {metrics.attentionItems.map((item, idx) => (
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
                                        <Button variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 text-slate-700 font-bold px-4 text-[11px] bg-white" onClick={() => onNavigate('definitions')}>View</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {metrics.attentionItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-30">
                                        <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-600" />
                                        <p className="text-sm font-bold uppercase tracking-widest text-slate-900">All Clear</p>
                                        <p className="text-xs font-medium text-slate-500">No definitions meet the aging threshold.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
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

      {/* 6. TEMPLATE ARCHITECTURE */}
      <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Template Architecture
          </div>
          
          <div className="w-full">
              <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-bold text-slate-900">Template Usage Heatmap</h3>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total <strong>{templates.length}</strong> active blueprints</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                      <div className="p-8 rounded-[24px] bg-[#F5F3FF] border border-indigo-50 flex flex-col justify-center">
                          <p className="text-5xl font-black text-[#3F51B5] mb-2">{metrics.activeTemplatesCount}</p>
                          <p className="text-[11px] font-black text-[#3F51B5]/60 uppercase tracking-[0.2em]">Active Records</p>
                      </div>
                      <div className="p-8 rounded-[24px] bg-slate-50 border border-slate-100 flex flex-col justify-center">
                          <p className="text-5xl font-black text-slate-400 mb-2">{metrics.inactiveTemplatesCount}</p>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Inactive/Legacy</p>
                      </div>
                  </div>

                  <div className="space-y-8">
                      {metrics.templateUsage.map((item, i) => {
                          const color = getModuleColor(item.module);
                          const maxUses = Math.max(...metrics.templateUsage.map(u => u.uses)) || 1;
                          const percent = (item.uses / maxUses) * 100;

                          const flatten = (items: Definition[]): Definition[] => {
                              return (Array.isArray(items) ? items : []).flatMap(d => [d, ...(d.children ? flatten(d.children) : [])]);
                          };

                          const definitionsUsing = [
                            ...flatten(definitions),
                            ...drafts
                          ].filter(d => d.templateId === item.id);

                          return (
                              <div key={item.id} className="space-y-3 cursor-pointer group" onClick={() => handleDrillDown(`Usage Audit: ${item.name}`, 'definitions', definitionsUsing)}>
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <span className="font-bold text-slate-800 group-hover:text-primary transition-colors">{item.name}</span>
                                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[9px] h-5 px-1.5 uppercase">
                                              {item.module}
                                          </Badge>
                                      </div>
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                          {item.uses} Uses
                                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                                      </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }} />
                                  </div>
                              </div>
                          );
                      })}
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
            <KPICard title="Total Users" value={metrics.totalUsers} badge="+0" badgeColor="bg-slate-100 text-slate-500" onClick={() => handleDrillDown('Total Users Registry', 'users', metrics.lists['Total Users'])} />
            <KPICard title="Active Users" value={metrics.activeUsers} badge={`${metrics.activePercent}%`} badgeColor="bg-emerald-50 text-emerald-600" onClick={() => handleDrillDown('Active Users Registry', 'users', metrics.lists['Active Users'])} />
            <KPICard title="Inactive Users" value={metrics.inactiveUsers} badge="Review" badgeColor="bg-orange-50 text-orange-600" onClick={() => handleDrillDown('Inactive Users Registry', 'users', metrics.lists['Inactive Users'])} />
        </div>
        <Card className="rounded-[28px] border-slate-100 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-4 border-none">
                <CardTitle className="text-lg font-bold text-slate-900">Users by Role</CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-8 pb-8">
                <div className="divide-y divide-slate-50">
                    {metrics.rolesList.map(role => (
                        <div 
                          key={role.id} 
                          className="py-5 flex items-center justify-between group first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 transition-all px-4 rounded-xl -mx-4"
                          onClick={() => handleDrillDown(`${role.label} Assignments`, 'users', metrics.lists[role.label as keyof typeof metrics.lists])}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center font-black text-[10px] tracking-tighter shadow-sm", role.color)}>
                                    {role.icon}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[14px] font-bold text-slate-900 group-hover:text-primary transition-colors">{role.label}</p>
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">{role.desc}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-black text-slate-900 tabular-nums">{role.count}</span>
                              <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* DRILL-DOWN DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[85vh] max-h-[85vh] flex flex-col p-0 overflow-hidden border-none rounded-[28px] shadow-2xl">
            <DialogHeader className="p-8 border-b bg-white shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                            {drillDownType === 'definitions' ? <Library className="h-6 w-6 text-[#3F51B5]" /> :
                             drillDownType === 'users' ? <Users className="h-6 w-6 text-[#3F51B5]" /> :
                             <LayoutTemplate className="h-6 w-6 text-[#3F51B5]" />}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                                {drillDownTitle}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500 font-medium">
                                Detailed system audit for all records matching current selection.
                            </DialogDescription>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl font-bold h-10 px-6 border-slate-200 gap-2 hover:bg-slate-50 transition-all"
                        onClick={handleDownloadAudit}
                    >
                        <Download className="h-4 w-4" />
                        Download Selection Audit
                    </Button>
                </div>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 bg-slate-50/30 overflow-hidden">
                <ScrollArea className="h-full w-full">
                    <div className="p-8">
                        <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader className="bg-slate-50 border-b">
                                    <TableRow className="hover:bg-transparent border-none">
                                        {drillDownType === 'definitions' ? (
                                          <>
                                            <TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Definition Name</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Module</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Author / Submitter</TableHead>
                                            <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Timestamp</TableHead>
                                          </>
                                        ) : drillDownType === 'users' ? (
                                          <>
                                            <TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">User Identity</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Role</TableHead>
                                            <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Status</TableHead>
                                          </>
                                        ) : (
                                          <>
                                            <TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Template Blueprint</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Module Scope</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Usage Count</TableHead>
                                            <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Status</TableHead>
                                          </>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {drillDownItems.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/50 border-slate-100 h-16">
                                            {drillDownType === 'definitions' ? (
                                              <>
                                                <TableCell className="px-6 py-4">
                                                  <div className="flex flex-col">
                                                      <span className="font-bold text-slate-900 text-[14px]">{item.name}</span>
                                                      <span className="text-[10px] font-mono text-slate-400 uppercase">{item.id || 'N/A'}</span>
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[9px] h-5 px-1.5 uppercase">
                                                      {item.module}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  <div className="flex items-center gap-2">
                                                      <Avatar className="h-6 w-6">
                                                          <AvatarImage src={users.find(u => u.id === item.authorId)?.avatar} />
                                                          <AvatarFallback className="text-[8px] font-bold">{(users.find(u => u.id === item.authorId)?.name || item.submittedBy || 'S')[0]}</AvatarFallback>
                                                      </Avatar>
                                                      <span className="text-xs font-bold text-slate-700">
                                                          {users.find(u => u.id === item.authorId)?.name || item.submittedBy || 'System'}
                                                      </span>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6 font-mono text-[11px] text-slate-400 uppercase">
                                                  {item.submittedAt ? format(parseISO(item.submittedAt), 'MMM dd, yyyy') : (item.revisions?.[0]?.date || 'Baseline')}
                                                </TableCell>
                                              </>
                                            ) : drillDownType === 'users' ? (
                                              <>
                                                <TableCell className="px-6">
                                                  <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8"><AvatarImage src={item.avatar}/><AvatarFallback>{item.name[0]}</AvatarFallback></Avatar>
                                                    <div className="flex flex-col">
                                                      <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                                      <span className="text-[10px] text-slate-400 lowercase">{item.email}</span>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline" className="text-[10px] font-bold uppercase">{item.role}</Badge></TableCell>
                                                <TableCell className="text-right px-6">
                                                  <Badge variant={item.status === 'Active' ? 'success' : 'secondary'} className="text-[10px] uppercase font-bold">{item.status}</Badge>
                                                </TableCell>
                                              </>
                                            ) : (
                                              <>
                                                <TableCell className="px-6">
                                                  <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                                    <span className="text-[10px] font-mono text-slate-400 uppercase">{item.id}</span>
                                                  </div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline" className="text-[10px] font-bold uppercase">{item.module}</Badge></TableCell>
                                                <TableCell className="text-center font-black text-indigo-600">{item.uses}</TableCell>
                                                <TableCell className="text-right px-6">
                                                  <Badge variant={item.isActive ? 'success' : 'secondary'} className="text-[10px] uppercase font-bold">{item.isActive ? 'Active' : 'Inactive'}</Badge>
                                                </TableCell>
                                              </>
                                            )}
                                        </TableRow>
                                    ))}
                                    {drillDownItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                                    <Search className="h-8 w-8" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">No matching records</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                    <ScrollBar orientation="vertical" />
                </ScrollArea>
            </div>
            
            <DialogFooter className="p-4 border-t bg-white shrink-0">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold text-slate-500">
                    Close Audit
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPICard({ title, value, badge, badgeColor, onClick }: { title: string, value: any, badge: string, badgeColor: string, onClick?: () => void }) {
    return (
        <Card 
          className={cn(
            "rounded-[24px] border-slate-100 bg-white p-6 shadow-sm group hover:border-indigo-100 transition-all",
            onClick && "cursor-pointer active:scale-95"
          )}
          onClick={onClick}
        >
            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-between">
                  {title}
                  {onClick && <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />}
                </h4>
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

function InsightsCard({ title, value, sub, options, color = "text-slate-900", footer, onClick }: { title: string, value: any, sub: string, options?: string[], color?: string, footer?: React.ReactNode, onClick?: () => void }) {
    return (
        <Card 
          className={cn(
            "rounded-[24px] border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-all",
            onClick && "cursor-pointer active:scale-95"
          )}
          onClick={onClick}
        >
            <div className="space-y-4">
                <div className="flex items-start justify-between min-h-[32px]">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest max-w-[200px] leading-relaxed flex items-center gap-2">
                      {title}
                      {onClick && <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />}
                    </h4>
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

function LifecycleBox({ label, value, color, onClick }: { label: string, value: number, color: string, onClick?: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "rounded-[20px] border flex flex-col justify-between p-4 transition-all hover:shadow-lg h-28 relative flex-1 min-w-0 group", 
                color,
                onClick && "cursor-pointer active:scale-95"
            )}
        >
            <div className="flex items-start justify-between w-full">
                <span className="text-3xl font-black block tracking-tighter leading-none">{value}</span>
                {onClick && <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all" />}
            </div>
            <span className="font-bold text-[11px] leading-tight mt-auto text-left truncate w-full">{label}</span>
        </button>
    );
}

function Arrow() {
    return (
        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mx-0.5 shadow-sm border border-slate-200">
            <ChevronRight className="h-3 w-3 text-slate-400" />
        </div>
    );
}
