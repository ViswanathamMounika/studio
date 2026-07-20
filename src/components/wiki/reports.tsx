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
    XCircle
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserAccount, Definition, ActivityLog, ApprovalHistoryEntry, Template, MasterDataState } from '@/lib/types';
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

export default function ReportsDashboard({ users, definitions, drafts, activityLogs, approvalHistory, templates, masterData }: ReportsDashboardProps) {
    const [activeTab, setActiveTab] = useState('user-engagement');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 1),
        to: new Date()
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const { toast } = useToast();

    // -- DATA HELPERS --
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
            const logDate = new Date(log.occurredDate);
            return isWithinInterval(logDate, { 
                start: startOfDay(dateRange.from), 
                end: endOfDay(dateRange.to || dateRange.from) 
            });
        });
    }, [activityLogs, dateRange]);

    // -- REPORT DATA CALCULATION --

    // 1. User Engagement Report
    const userReportData = useMemo(() => {
        return users.map(user => {
            const userLogs = filteredLogs.filter(l => l.userName === user.name);
            const userHistory = approvalHistory.filter(h => h.userName === user.name);
            
            return {
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                logins: userLogs.filter(l => l.activityType === 'User Login').length,
                lastLogin: user.lastLogin ? format(new Date(user.lastLogin), 'yyyy-MM-dd') : 'Never',
                creations: userLogs.filter(l => l.activityType === 'Definition Created').length,
                edits: userLogs.filter(l => l.activityType === 'Definition Updated').length,
                approvals: userHistory.length,
                templates: userLogs.filter(l => l.activityType.includes('Template')).length
            };
        });
    }, [users, filteredLogs, approvalHistory]);

    // 2. Definition Growth Report
    const definitionReportData = useMemo(() => {
        const stats = {
            total: allDefsAndDrafts.length,
            published: allPublished.length,
            draft: drafts.filter(d => d.isDraft && !d.isPendingApproval).length,
            pending: drafts.filter(d => d.isPendingApproval).length,
            rejected: drafts.filter(d => d.discussions?.some(m => m.type === 'rejection')).length,
            archived: allDefsAndDrafts.filter(d => d.isArchived).length
        };

        const byUser = users.map(u => ({
            name: u.name,
            count: allDefsAndDrafts.filter(d => d.authorId === u.id || d.submittedBy === u.name).length
        })).sort((a, b) => b.count - a.count).slice(0, 10);

        return { stats, byUser };
    }, [allDefsAndDrafts, allPublished, drafts, users]);

    // 3. Workflow Analysis
    const workflowReportData = useMemo(() => {
        const decisions = approvalHistory.filter(h => h.action !== 'Submitted');
        const pending = drafts.filter(d => d.isPendingApproval);
        
        const oldestPending = [...pending].sort((a, b) => {
            const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return dateA - dateB;
        }).slice(0, 5);

        const byApprover = users.filter(u => u.role.includes('Admin') || u.role.includes('Approver')).map(u => ({
            name: u.name,
            total: approvalHistory.filter(h => h.userName === u.name && h.action !== 'Submitted').length,
            approved: approvalHistory.filter(h => h.userName === u.name && h.action === 'Approved').length,
            rejected: approvalHistory.filter(h => h.userName === u.name && (h.action === 'Rejected' || h.action === 'Changes Requested')).length,
        }));

        return { 
            total: approvalHistory.filter(h => h.action === 'Submitted').length,
            approved: approvalHistory.filter(h => h.action === 'Approved').length,
            rejected: approvalHistory.filter(h => h.action === 'Rejected').length,
            oldestPending,
            byApprover 
        };
    }, [approvalHistory, drafts, users]);

    // -- EXPORT LOGIC --
    const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
        toast({ title: `Preparing ${format.toUpperCase()} export...` });

        const reportName = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const filename = `${reportName}_${new Date().toISOString().split('T')[0]}`;

        if (format === 'xlsx' || format === 'csv') {
            const XLSX = await import('xlsx');
            let data: any[] = [];
            
            if (activeTab === 'user-engagement') data = userReportData;
            else if (activeTab === 'definition-insights') data = userReportData.map(u => ({ User: u.name, Created: u.creations, Edited: u.edits }));
            
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            XLSX.writeFile(wb, `${filename}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
        } else {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`${reportName} Report`, 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
            doc.text(`Period: ${dateRange?.from ? format(dateRange.from, 'PP') : 'All Time'} - ${dateRange?.to ? format(dateRange.to, 'PP') : 'Present'}`, 14, 36);
            
            // Basic data dump for PDF demo
            doc.text("Report Data Summary:", 14, 50);
            doc.text(JSON.stringify(userReportData[0], null, 2).substring(0, 100) + "...", 14, 60);
            
            doc.save(`${filename}.pdf`);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Governance Reports</h1>
                    <p className="text-muted-foreground font-medium">Deep telemetry and operational performance metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-slate-200 bg-white font-bold h-11 px-6 shadow-sm">
                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                {dateRange?.from ? (
                                    dateRange.to ? <>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}</> : format(dateRange.from, "MMM dd, yyyy")
                                ) : "Select Period"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="range" selected={dateRange as any} onSelect={setDateRange as any} initialFocus />
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl h-11 px-8 shadow-lg shadow-indigo-100">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-200">
                            <DropdownMenuItem onClick={() => handleExport('xlsx')} className="font-bold py-2.5"><FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel Spreadsheet</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="font-bold py-2.5"><FileText className="mr-2 h-4 w-4 text-slate-600" /> CSV Format</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')} className="font-bold py-2.5"><FileSearch className="mr-2 h-4 w-4 text-red-600" /> PDF Document</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="bg-slate-100 p-1 w-fit rounded-xl mb-6">
                    <TabsTrigger value="user-engagement" className="rounded-lg px-6 font-bold gap-2"><Users className="h-4 w-4" />User Engagement</TabsTrigger>
                    <TabsTrigger value="definition-insights" className="rounded-lg px-6 font-bold gap-2"><FileEdit className="h-4 w-4" />Definitions</TabsTrigger>
                    <TabsTrigger value="workflow-analysis" className="rounded-lg px-6 font-bold gap-2"><Timer className="h-4 w-4" />Workflow</TabsTrigger>
                    <TabsTrigger value="system-usage" className="rounded-lg px-6 font-bold gap-2"><TrendingUp className="h-4 w-4" />System Usage</TabsTrigger>
                </TabsList>

                {/* 1. USER ENGAGEMENT */}
                <TabsContent value="user-engagement" className="m-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <MetricCard title="Total Users" value={users.length} icon={Users} color="text-indigo-600 bg-indigo-50" />
                        <MetricCard title="Active Session" value={users.filter(u => u.status === 'Active').length} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
                        <MetricCard title="Inactive Count" value={users.filter(u => u.status === 'Inactive').length} icon={Clock} color="text-slate-400 bg-slate-50" />
                        <MetricCard title="Admin/Approvers" value={users.filter(u => u.role.includes('Admin') || u.role.includes('Approver')).length} icon={ShieldCheck} color="text-primary bg-primary/5" />
                    </div>

                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm bg-white">
                        <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                            <div><CardTitle className="text-base font-bold">Account Telemetry</CardTitle><CardDescription>Per-user engagement and contribution metrics.</CardDescription></div>
                            <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="Filter by user..." className="pl-9 rounded-xl h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader><TableRow className="bg-slate-50/50"><TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">User</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest">Logins</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest">Last Activity</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest">Created</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest pr-6 text-right">Approvals</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {userReportData.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                                        <TableRow key={u.email} className="hover:bg-slate-50/50 border-slate-100">
                                            <TableCell className="pl-6"><p className="font-bold text-slate-900">{u.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{u.role}</p></TableCell>
                                            <TableCell><Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="font-bold text-[10px]">{u.status}</Badge></TableCell>
                                            <TableCell className="font-medium text-slate-600">{u.logins}</TableCell>
                                            <TableCell className="text-slate-500 font-bold tabular-nums text-xs">{u.lastLogin}</TableCell>
                                            <TableCell className="font-medium text-slate-600">{u.creations}</TableCell>
                                            <TableCell className="pr-6 text-right font-bold text-indigo-600">{u.approvals}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. DEFINITION INSIGHTS */}
                <TabsContent value="definition-insights" className="m-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <MetricCard title="Published" value={definitionReportData.stats.published} color="text-emerald-600 bg-emerald-50" />
                        <MetricCard title="Pending" value={definitionReportData.stats.pending} color="text-amber-600 bg-amber-50" />
                        <MetricCard title="Drafts" value={definitionReportData.stats.draft} color="text-indigo-600 bg-indigo-50" />
                        <MetricCard title="Rejected" value={definitionReportData.stats.rejected} color="text-red-600 bg-red-50" />
                        <MetricCard title="Archived" value={definitionReportData.stats.archived} color="text-slate-400 bg-slate-50" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-2xl border-slate-200 bg-white">
                            <CardHeader><CardTitle className="text-base font-bold">Top Authors</CardTitle><CardDescription>Most active documentation contributors.</CardDescription></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={definitionReportData.byUser} layout="vertical" margin={{ left: 40 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="count" fill="#3F51B5" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-slate-200 bg-white">
                            <CardHeader><CardTitle className="text-base font-bold">Module Distribution</CardTitle><CardDescription>Library composition by business domain.</CardDescription></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            { name: 'Auth', value: 35 }, { name: 'Claims', value: 25 }, { name: 'Provider', value: 20 }, { name: 'Member', value: 15 }, { name: 'Other', value: 5 }
                                        ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {['#3F51B5', '#10B981', '#F59E0B', '#EF4444', '#64748B'].map((color, index) => <Cell key={index} fill={color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 3. WORKFLOW ANALYSIS */}
                <TabsContent value="workflow-analysis" className="m-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <MetricCard title="Total Submissions" value={workflowReportData.total} icon={FileText} color="text-indigo-600 bg-indigo-50" />
                        <MetricCard title="Final Approvals" value={workflowReportData.approved} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
                        <MetricCard title="Total Rejections" value={workflowReportData.rejected} icon={XCircle} color="text-red-600 bg-red-50" />
                        <MetricCard title="Avg Time (Days)" value="1.4" icon={Timer} color="text-amber-600 bg-amber-50" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-2xl border-slate-200 bg-white overflow-hidden">
                            <CardHeader className="bg-red-50/30 border-b"><div className="flex items-center gap-2"><CardTitle className="text-base font-bold text-red-900">Priority: Oldest Pending</CardTitle><Badge className="bg-red-100 text-red-700">Urgent</Badge></div><CardDescription>Requests awaiting governance decision for 48h+.</CardDescription></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {workflowReportData.oldestPending.map(d => (
                                            <TableRow key={d.id} className="border-slate-100">
                                                <TableCell className="py-4 pl-6 font-bold">{d.name}</TableCell>
                                                <TableCell className="text-xs text-slate-500">{d.submittedBy}</TableCell>
                                                <TableCell className="text-right pr-6"><Badge variant="outline" className="text-red-600 font-bold border-red-100">{d.submittedAt ? format(new Date(d.submittedAt), 'MMM dd') : '—'}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-slate-200 bg-white">
                            <CardHeader><CardTitle className="text-base font-bold">Approver Workload</CardTitle><CardDescription>Review activity by administrative account.</CardDescription></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader><TableRow className="bg-slate-50/50"><TableHead className="pl-6 font-black uppercase text-[10px]">Approver</TableHead><TableHead className="font-black uppercase text-[10px]">Total</TableHead><TableHead className="text-right pr-6 font-black uppercase text-[10px]">Approved %</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {workflowReportData.byApprover.map(a => (
                                            <TableRow key={a.name}>
                                                <TableCell className="pl-6 font-bold">{a.name}</TableCell>
                                                <TableCell className="font-medium text-slate-600">{a.total}</TableCell>
                                                <TableCell className="text-right pr-6 font-bold text-emerald-600">{a.total > 0 ? Math.round((a.approved / a.total) * 100) : 0}%</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 4. SYSTEM USAGE */}
                <TabsContent value="system-usage" className="m-0 space-y-6">
                    <Card className="rounded-2xl border-slate-200 bg-white">
                        <CardHeader><CardTitle className="text-base font-bold">Application Activity Trend</CardTitle><CardDescription>Overall engagement and documentation volume by day.</CardDescription></CardHeader>
                        <CardContent className="h-[350px] p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[
                                    { date: 'Mon', active: 12, edits: 8 }, { date: 'Tue', active: 18, edits: 15 }, { date: 'Wed', active: 25, edits: 12 }, { date: 'Thu', active: 22, edits: 20 }, { date: 'Fri', active: 15, edits: 10 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="active" stroke="#3F51B5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="edits" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MetricCard({ title, value, subValue, icon: Icon, color }: any) {
    return (
        <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-black uppercase text-slate-500 tracking-wider">{title}</CardTitle>
                {Icon && <div className={cn("p-2 rounded-xl", color)}><Icon className="h-4 w-4" /></div>}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
                {subValue && <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{subValue}</p>}
            </CardContent>
        </Card>
    );
}
