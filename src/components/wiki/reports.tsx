
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
    Download, 
    FileSpreadsheet, 
    FileText, 
    Users, 
    FileEdit, 
    CheckCircle2, 
    Clock, 
    LayoutTemplate, 
    ArrowUpDown, 
    Search,
    CalendarIcon,
    FilterX,
    TrendingUp,
    Timer,
    Database,
    FileSearch,
    ShieldCheck,
    XCircle,
    Activity,
    UserCheck,
    ChevronRight,
    AlertCircle,
    Plus
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserAccount, Definition, ActivityLog, ApprovalHistoryEntry, Template, MasterDataState, ActivityType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type ReportsDashboardProps = {
  users: UserAccount[];
  definitions: Definition[];
  drafts: Definition[];
  activityLogs: ActivityLog[];
  approvalHistory: ApprovalHistoryEntry[];
  templates: Template[];
  masterData: MasterDataState;
};

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
} | null;

export default function ReportsDashboard({ users, definitions, drafts, activityLogs, approvalHistory, templates, masterData }: ReportsDashboardProps) {
    const [activeTab, setActiveTab] = useState('user-engagement');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 3),
        to: new Date()
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const { toast } = useToast();

    // -- DATA UTILITIES --
    const getFlattenedDefinitions = (items: Definition[]): Definition[] => {
        let flat: Definition[] = [];
        items.forEach(item => {
            flat.push(item);
            if (item.children) flat = flat.concat(getFlattenedDefinitions(item.children));
        });
        return flat;
    };

    const allPublished = useMemo(() => getFlattenedDefinitions(definitions), [definitions]);
    const allDefsAndDrafts = useMemo(() => [...allPublished, ...drafts], [allPublished, drafts]);

    const filteredLogs = useMemo(() => {
        if (!dateRange?.from) return activityLogs;
        return activityLogs.filter(log => {
            const logDate = parseISO(log.occurredDate);
            return isWithinInterval(logDate, { 
                start: startOfDay(dateRange.from), 
                end: endOfDay(dateRange.to || dateRange.from) 
            });
        });
    }, [activityLogs, dateRange]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortData = (data: any[]) => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // -- REPORT CALCULATIONS --

    // 1. User Activity Report (2.11)
    const userActivityData = useMemo(() => {
        const raw = users.map(user => {
            const userLogs = filteredLogs.filter(l => l.userName === user.name);
            const userHistory = approvalHistory.filter(h => h.userName === user.name);
            const userActions = filteredLogs.filter(l => l.userName === user.name);
            
            const lastActivityLog = userActions[0];

            return {
                id: user.id,
                name: user.name,
                role: user.role,
                status: user.status,
                logins: userLogs.filter(l => l.activityType === 'User Login').length,
                lastLogin: user.lastLogin ? format(parseISO(user.lastLogin), 'yyyy-MM-dd HH:mm') : 'Never',
                lastActivity: lastActivityLog ? format(parseISO(lastActivityLog.occurredDate), 'yyyy-MM-dd') : 'None',
                creations: userLogs.filter(l => l.activityType === 'Definition Created').length,
                edits: userLogs.filter(l => l.activityType === 'Definition Updated').length,
                approvals: userHistory.filter(h => h.action === 'Approved').length,
                templates: userLogs.filter(l => l.activityType.includes('Template')).length
            };
        });

        const filtered = raw.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return sortData(filtered);
    }, [users, filteredLogs, approvalHistory, searchQuery, sortConfig]);

    // 2. Definition Report (2.12)
    const definitionReportData = useMemo(() => {
        const publishedCount = allPublished.filter(d => !d.isArchived).length;
        const archivedCount = allPublished.filter(d => d.isArchived).length;
        const draftCount = drafts.filter(d => d.isDraft && !d.isPendingApproval).length;
        const pendingCount = drafts.filter(d => d.isPendingApproval).length;
        const rejectedCount = drafts.filter(d => d.discussions?.some(m => m.type === 'rejection')).length;

        // Group by user
        const authorStats = users.map(u => ({
            name: u.name,
            total: allDefsAndDrafts.filter(d => d.authorId === u.id || d.submittedBy === u.name).length,
            published: allPublished.filter(d => (d.authorId === u.id || d.submittedBy === u.name) && !d.isArchived).length,
            pending: drafts.filter(d => (d.authorId === u.id || d.submittedBy === u.name) && d.isPendingApproval).length
        })).filter(a => a.total > 0);

        return {
            summary: { total: allDefsAndDrafts.length, published: publishedCount, draft: draftCount, pending: pendingCount, rejected: rejectedCount, archived: archivedCount },
            authors: sortData(authorStats)
        };
    }, [allPublished, drafts, users, sortConfig]);

    // 3. Approval Workflow Report (2.13)
    const workflowReportData = useMemo(() => {
        const decisions = approvalHistory.filter(h => h.action !== 'Submitted');
        const approved = decisions.filter(h => h.action === 'Approved');
        const rejected = decisions.filter(h => h.action === 'Rejected' || h.action === 'Changes Requested');
        
        const pending = drafts.filter(d => d.isPendingApproval);
        const oldestPending = [...pending].sort((a, b) => {
            const dateA = a.submittedAt ? parseISO(a.submittedAt).getTime() : 0;
            const dateB = b.submittedAt ? parseISO(b.submittedAt).getTime() : 0;
            return dateA - dateB;
        }).slice(0, 10);

        // Calc Avg Time (Dummy logic for mock data)
        const avgTime = decisions.length > 0 ? 1.4 : 0;

        const approverPerformance = users.filter(u => u.role.includes('Admin') || u.role.includes('Approver')).map(u => {
            const uHistory = approvalHistory.filter(h => h.userName === u.name);
            return {
                name: u.name,
                total: uHistory.length,
                approved: uHistory.filter(h => h.action === 'Approved').length,
                rejected: uHistory.filter(h => h.action === 'Rejected').length,
                requests: uHistory.filter(h => h.action === 'Changes Requested').length
            };
        });

        return { 
            stats: { total: approvalHistory.filter(h => h.action === 'Submitted').length, pending: pending.length, approved: approved.length, rejected: rejected.length, avgTime },
            oldestPending,
            approverPerformance: sortData(approverPerformance)
        };
    }, [approvalHistory, drafts, users, sortConfig]);

    // 4. Template Usage Report (2.14)
    const templateReportData = useMemo(() => {
        const data = templates.map(t => {
            const usedIn = allPublished.filter(d => d.templateId === t.id).length + drafts.filter(d => d.templateId === t.id).length;
            return {
                id: t.id,
                name: t.name,
                module: t.module,
                status: t.isActive ? 'Active' : 'Inactive',
                usedIn,
                isDefault: t.isDefault
            };
        });

        return sortData(data);
    }, [templates, allPublished, drafts, sortConfig]);

    // 5. System Usage Report (2.15)
    const systemUsageData = useMemo(() => {
        // Aggregate daily metrics
        const days: Record<string, { date: string, creations: number, approvals: number, users: Set<string> }> = {};
        
        filteredLogs.forEach(log => {
            const dayKey = format(parseISO(log.occurredDate), 'yyyy-MM-dd');
            if (!days[dayKey]) days[dayKey] = { date: dayKey, creations: 0, approvals: 0, users: new Set() };
            
            if (log.activityType === 'Definition Created') days[dayKey].creations++;
            if (log.activityType === 'Approval Decision') days[dayKey].approvals++;
            days[dayKey].users.add(log.userName);
        });

        const dailyStats = Object.values(days).sort((a,b) => a.date.localeCompare(b.date));
        
        const moduleEngagement = masterData.modules.map(m => ({
            name: m.name,
            definitions: allDefsAndDrafts.filter(d => d.module === m.name).length,
            activity: filteredLogs.filter(l => l.definitionName.includes(m.name) || l.details?.includes(m.name)).length
        })).sort((a,b) => b.activity - a.activity);

        return { dailyStats, moduleEngagement };
    }, [filteredLogs, allDefsAndDrafts, masterData]);

    // -- EXPORT ENGINE (2.16) --
    const handleExport = async (formatType: 'xlsx' | 'csv' | 'pdf') => {
        const reportTitle = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_${reportTitle}_${timestamp}`;

        let exportData: any[] = [];
        if (activeTab === 'user-engagement') exportData = userActivityData;
        else if (activeTab === 'definition-insights') exportData = definitionReportData.authors;
        else if (activeTab === 'workflow-analysis') exportData = workflowReportData.approverPerformance;
        else if (activeTab === 'template-stats') exportData = templateReportData;

        if (formatType === 'xlsx' || formatType === 'csv') {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report Data");
            XLSX.writeFile(wb, `${filename}.${formatType === 'xlsx' ? 'xlsx' : 'csv'}`);
        } else {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`MedPoint Wiki: ${reportTitle}`, 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
            doc.text(`Filters: ${dateRange?.from ? format(dateRange.from, 'PP') : 'All Time'} - ${dateRange?.to ? format(dateRange.to, 'PP') : 'Now'}`, 14, 34);
            
            // Simplified PDF Table Content
            let y = 50;
            doc.setFontSize(9);
            doc.setTextColor(0);
            const headers = Object.keys(exportData[0] || {}).slice(0, 5);
            headers.forEach((h, i) => doc.text(h.toUpperCase(), 14 + (i * 35), y));
            y += 5;
            doc.line(14, y, 200, y);
            y += 10;
            
            exportData.slice(0, 20).forEach((row) => {
                headers.forEach((h, i) => doc.text(String(row[h] || ''), 14 + (i * 35), y));
                y += 8;
            });

            doc.save(`${filename}.pdf`);
        }
        toast({ title: "Export Complete", description: `File saved as ${filename}.${formatType}` });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end px-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <ShieldCheck className="h-3 w-3" />
                        Administrative Governance
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Reports</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="h-9 px-4 font-bold text-xs gap-2">
                                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                    {dateRange?.from ? (
                                        dateRange.to ? <>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}</> : format(dateRange.from, "MMM dd, yyyy")
                                    ) : "Date Range"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="range" selected={dateRange as any} onSelect={setDateRange as any} initialFocus numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 px-8 gap-2 shadow-lg shadow-indigo-100">
                                <Download className="h-4 w-4" />
                                Export Report
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200">
                            <DropdownMenuItem onClick={() => handleExport('xlsx')} className="font-bold py-3"><FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel Spreadsheet</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="font-bold py-3"><FileText className="mr-2 h-4 w-4 text-slate-600" /> CSV Flat File</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')} className="font-bold py-3"><FileSearch className="mr-2 h-4 w-4 text-red-600" /> PDF Summary</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="bg-slate-100 p-1 w-fit rounded-2xl mb-6">
                    <TabsTrigger value="user-engagement" className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Users className="h-4 w-4" />User Engagement</TabsTrigger>
                    <TabsTrigger value="definition-insights" className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><FileEdit className="h-4 w-4" />Library Assets</TabsTrigger>
                    <TabsTrigger value="workflow-analysis" className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Timer className="h-4 w-4" />Workflow Performance</TabsTrigger>
                    <TabsTrigger value="template-stats" className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><LayoutTemplate className="h-4 w-4" />Templates</TabsTrigger>
                    <TabsTrigger value="system-usage" className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><TrendingUp className="h-4 w-4" />System Usage</TabsTrigger>
                </TabsList>

                {/* --- 1. USER ENGAGEMENT REPORT --- */}
                <TabsContent value="user-engagement" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-4 gap-6">
                        <MetricSummary label="Total Users" value={users.length} icon={Users} color="indigo" />
                        <MetricSummary label="Active sessions" value={users.filter(u => u.status === 'Active').length} icon={UserCheck} color="emerald" />
                        <MetricSummary label="Total Logins" value={userActivityData.reduce((acc, u) => acc + u.logins, 0)} icon={Activity} color="amber" />
                        <MetricSummary label="Authored Content" value={userActivityData.reduce((acc, u) => acc + u.creations, 0)} icon={FileEdit} color="slate" />
                    </div>

                    <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                        <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">User Access & Contribution Audit</CardTitle>
                                <CardDescription>Detailed telemetry for all provisioned accounts.</CardDescription>
                            </div>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input placeholder="Filter by name or role..." className="pl-9 rounded-xl h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <SortableHead label="User Account" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="pl-6" />
                                        <SortableHead label="Role" sortKey="role" currentSort={sortConfig} onSort={handleSort} />
                                        <SortableHead label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                        <SortableHead label="Logins" sortKey="logins" currentSort={sortConfig} onSort={handleSort} />
                                        <SortableHead label="Last Activity" sortKey="lastActivity" currentSort={sortConfig} onSort={handleSort} />
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Contribution Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userActivityData.map(u => (
                                        <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-100">
                                            <TableCell className="pl-6 font-bold text-slate-900">{u.name}</TableCell>
                                            <TableCell><Badge variant="outline" className="font-bold text-[10px] uppercase">{u.role}</Badge></TableCell>
                                            <TableCell><Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="font-bold text-[10px] uppercase">{u.status}</Badge></TableCell>
                                            <TableCell className="font-medium text-slate-600">{u.logins}</TableCell>
                                            <TableCell className="text-slate-500 font-bold tabular-nums text-xs">{u.lastActivity}</TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <div className="flex justify-end gap-3 text-[11px] font-bold">
                                                    <span title="Created" className="text-emerald-600 flex items-center gap-1"><Plus className="h-3 w-3" />{u.creations}</span>
                                                    <span title="Edited" className="text-indigo-600 flex items-center gap-1"><FileEdit className="h-3 w-3" />{u.edits}</span>
                                                    <span title="Approved" className="text-amber-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{u.approvals}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- 2. DEFINITION INSIGHTS REPORT --- */}
                <TabsContent value="definition-insights" className="m-0 space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-5 gap-4">
                        <MetricSummary label="Total Library" value={definitionReportData.summary.total} color="slate" />
                        <MetricSummary label="Published" value={definitionReportData.summary.published} color="emerald" />
                        <MetricSummary label="Under Review" value={definitionReportData.summary.pending} color="indigo" />
                        <MetricSummary label="Archived" value={definitionReportData.summary.archived} color="slate" />
                        <MetricSummary label="Rejected" value={definitionReportData.summary.rejected} color="red" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <Card className="xl:col-span-2 rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                            <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-base font-bold">Author Performance Audit</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <SortableHead label="Author" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="pl-6" />
                                            <SortableHead label="Total Items" sortKey="total" currentSort={sortConfig} onSort={handleSort} />
                                            <SortableHead label="Published" sortKey="published" currentSort={sortConfig} onSort={handleSort} />
                                            <SortableHead label="Pending" sortKey="pending" currentSort={sortConfig} onSort={handleSort} />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {definitionReportData.authors.map(a => (
                                            <TableRow key={a.name} className="border-slate-100">
                                                <TableCell className="pl-6 font-bold">{a.name}</TableCell>
                                                <TableCell className="font-medium">{a.total}</TableCell>
                                                <TableCell className="text-emerald-600 font-bold">{a.published}</TableCell>
                                                <TableCell className="text-indigo-600 font-bold">{a.pending}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col">
                            <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-base font-bold">Volume Trends</CardTitle></CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col justify-center min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { month: 'Jan', count: 12 }, { month: 'Feb', count: 18 }, { month: 'Mar', count: 25 }, { month: 'Apr', count: 22 }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} />
                                        <YAxis axisLine={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#3F51B5" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <p className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Definitions Created by Month</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- 3. WORKFLOW ANALYSIS REPORT --- */}
                <TabsContent value="workflow-analysis" className="m-0 space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-4 gap-6">
                        <MetricSummary label="Global Decisions" value={workflowReportData.stats.approved + workflowReportData.stats.rejected} icon={CheckCircle2} color="indigo" />
                        <MetricSummary label="Queue Pressure" value={workflowReportData.stats.pending} icon={Clock} color="amber" />
                        <MetricSummary label="Approval Yield" value={`${Math.round((workflowReportData.stats.approved / (workflowReportData.stats.approved + workflowReportData.stats.rejected || 1)) * 100)}%`} icon={TrendingUp} color="emerald" />
                        <MetricSummary label="Avg Adjudication (Days)" value={workflowReportData.stats.avgTime} icon={Timer} color="slate" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm border-l-4 border-l-red-500">
                            <CardHeader className="bg-red-50/30 border-b flex flex-row items-center justify-between">
                                <div><CardTitle className="text-base font-bold text-red-900">Priority: Oldest Pending Requests</CardTitle><CardDescription>Awaiting governance review for 48h+.</CardDescription></div>
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {workflowReportData.oldestPending.map(d => (
                                            <TableRow key={d.id} className="border-slate-100 hover:bg-red-50/10">
                                                <TableCell className="py-4 pl-6 font-bold">{d.name}</TableCell>
                                                <TableCell className="text-xs text-slate-500">{d.submittedBy}</TableCell>
                                                <TableCell className="text-right pr-6"><Badge variant="outline" className="text-red-600 font-bold border-red-100 h-6">Awaiting {differenceInDays(new Date(), parseISO(d.submittedAt || ''))}d</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                        {workflowReportData.oldestPending.length === 0 && (
                                            <TableRow><TableCell className="py-12 text-center text-slate-400 italic">Queue is clear.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                            <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-base font-bold">Approver Performance Ledger</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <SortableHead label="Approver" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="pl-6" />
                                            <SortableHead label="Total" sortKey="total" currentSort={sortConfig} onSort={handleSort} />
                                            <SortableHead label="Approved" sortKey="approved" currentSort={sortConfig} onSort={handleSort} />
                                            <SortableHead label="Rejected" sortKey="rejected" currentSort={sortConfig} onSort={handleSort} />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workflowReportData.approverPerformance.map(a => (
                                            <TableRow key={a.name} className="border-slate-100">
                                                <TableCell className="pl-6 font-bold">{a.name}</TableCell>
                                                <TableCell className="font-medium">{a.total}</TableCell>
                                                <TableCell className="text-emerald-600 font-bold">{a.approved}</TableCell>
                                                <TableCell className="text-red-600 font-bold">{a.rejected}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- 4. TEMPLATE STATS REPORT --- */}
                <TabsContent value="template-stats" className="m-0 space-y-6 animate-in fade-in">
                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Documentation Blueprint Audit</CardTitle>
                                <CardDescription>Lifecycle and utilization tracking for system templates.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b">
                                    <TableRow>
                                        <SortableHead label="Blueprint Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="pl-6" />
                                        <SortableHead label="Module Scope" sortKey="module" currentSort={sortConfig} onSort={handleSort} />
                                        <SortableHead label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                        <SortableHead label="Utilization Count" sortKey="usedIn" currentSort={sortConfig} onSort={handleSort} />
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Configuration</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templateReportData.map(t => (
                                        <TableRow key={t.id} className="border-slate-100">
                                            <TableCell className="pl-6 font-bold">{t.name}</TableCell>
                                            <TableCell><Badge variant="outline" className="font-bold border-slate-200">{t.module}</Badge></TableCell>
                                            <TableCell><Badge variant={t.status === 'Active' ? 'success' : 'secondary'} className="font-bold">{t.status}</Badge></TableCell>
                                            <TableCell className="font-black text-indigo-600 tabular-nums">{t.usedIn} items</TableCell>
                                            <TableCell className="text-right pr-6">{t.isDefault && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">System Default</Badge>}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- 5. SYSTEM USAGE REPORT --- */}
                <TabsContent value="system-usage" className="m-0 space-y-6 animate-in fade-in">
                    <Card className="rounded-[24px] border-slate-200 bg-white overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-base font-bold">Global Application Activity Trend</CardTitle></CardHeader>
                        <CardContent className="h-[400px] p-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={systemUsageData.dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend verticalAlign="top" align="right" height={36}/>
                                    <Line name="Creations" type="monotone" dataKey="creations" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line name="Approvals" type="monotone" dataKey="approvals" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line name="Active Users" type="monotone" dataKey={(v) => v.users.size} stroke="#3F51B5" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-6">
                        <Card className="rounded-[24px] border-slate-200 bg-white shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-base font-bold">Module Engagement Heatmap</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader><TableRow className="bg-slate-50/50"><TableHead className="pl-6 font-black uppercase text-[10px]">Business Domain</TableHead><TableHead className="font-black uppercase text-[10px]">Definition Size</TableHead><TableHead className="text-right pr-6 font-black uppercase text-[10px]">Interaction Score</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {systemUsageData.moduleEngagement.map(m => (
                                            <TableRow key={m.name}>
                                                <TableCell className="pl-6 font-bold">{m.name}</TableCell>
                                                <TableCell className="font-medium text-slate-500">{m.definitions} items</TableCell>
                                                <TableCell className="text-right pr-6 font-bold text-indigo-600">{m.activity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        
                        <Card className="rounded-[24px] border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                             <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-base font-bold">Peak Utilization Hours</CardTitle></CardHeader>
                             <CardContent className="p-8 flex-1 flex flex-col justify-center min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { hour: '08:00', users: 5 }, { hour: '10:00', users: 15 }, { hour: '12:00', users: 12 }, { hour: '14:00', users: 20 }, { hour: '16:00', users: 8 }
                                    ]}>
                                        <XAxis dataKey="hour" tick={{fontSize: 10}} axisLine={false} />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Bar dataKey="users" fill="#3F51B5" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <p className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Active Sessions by Hour</p>
                             </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MetricSummary({ label, value, icon: Icon, color = 'indigo' }: { label: string, value: string | number, icon?: any, color?: string }) {
    const colorClasses: Record<string, string> = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        red: 'text-red-600 bg-red-50 border-red-100',
        slate: 'text-slate-600 bg-slate-50 border-slate-100'
    };

    return (
        <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">{label}</p>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
                </div>
                {Icon && (
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colorClasses[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SortableHead({ label, sortKey, currentSort, onSort, className }: { label: string, sortKey: string, currentSort: SortConfig, onSort: (k: string) => void, className?: string }) {
    const isActive = currentSort?.key === sortKey;
    return (
        <TableHead className={cn("cursor-pointer hover:bg-slate-100 transition-colors py-4", className)} onClick={() => onSort(sortKey)}>
            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                {label}
                <ArrowUpDown className={cn("ml-2 h-3 w-3", isActive ? "text-primary opacity-100" : "opacity-30")} />
            </div>
        </TableHead>
    );
}
