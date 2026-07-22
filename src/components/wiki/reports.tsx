
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Download, 
    FileSpreadsheet, 
    FileText, 
    ArrowUpDown, 
    CalendarIcon,
    FilterX,
    ShieldCheck,
    FileSearch,
    BarChart3,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    FilePieChart,
    Users,
    TrendingUp,
    ClipboardCheck,
    Clock,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserAccount, Definition, ActivityLog, ApprovalHistoryEntry, Template, MasterDataState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

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

type ReportType = 'user-activity' | 'definition-report' | 'approval-report' | 'workflow-analysis' | 'template-stats';

export default function ReportsDashboard({ users, definitions, drafts, activityLogs, approvalHistory }: ReportsDashboardProps) {
    const [selectedReport, setSelectedReport] = useState<ReportType>('user-activity');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 12),
        to: new Date()
    });
    
    // Filtering and Pagination State
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [approverFilter, setApproverFilter] = useState<string>('all');
    
    const { toast } = useToast();

    // -- SHARED DATA CALCULATIONS --
    
    const filteredLogs = useMemo(() => {
        const safeLogs = Array.isArray(activityLogs) ? activityLogs : [];
        if (!dateRange?.from) return safeLogs;
        return safeLogs.filter(log => {
            const logDate = parseISO(log.occurredDate);
            return isWithinInterval(logDate, { 
                start: startOfDay(dateRange.from), 
                end: endOfDay(dateRange.to || dateRange.from) 
            });
        });
    }, [activityLogs, dateRange]);

    const filteredHistory = useMemo(() => {
        const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];
        let result = safeHistory;
        
        if (dateRange?.from) {
            result = result.filter(h => {
                const hDate = parseISO(h.date);
                return isWithinInterval(hDate, { 
                    start: startOfDay(dateRange.from), 
                    end: endOfDay(dateRange.to || dateRange.from) 
                });
            });
        }
        
        if (approverFilter !== 'all') {
            result = result.filter(h => h.userName === approverFilter);
        }
        
        return result;
    }, [approvalHistory, dateRange, approverFilter]);

    // -- USER ACTIVITY REPORT LOGIC --
    const processedUserStats = useMemo(() => {
        const safeUsers = Array.isArray(users) ? users : [];
        return safeUsers.map(user => {
            const userLogs = filteredLogs.filter(l => l.userName === user.name);
            const userHistory = filteredHistory.filter(h => h.userName === user.name);
            const lastActivityLog = [...userLogs].sort((a, b) => parseISO(b.occurredDate).getTime() - parseISO(a.occurredDate).getTime())[0];

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                logins: userLogs.filter(l => l.activityType === 'User Login').length,
                lastLogin: user.lastLogin ? format(parseISO(user.lastLogin), 'yyyy-MM-dd HH:mm') : 'Never',
                lastActivity: lastActivityLog ? format(parseISO(lastActivityLog.occurredDate), 'yyyy-MM-dd') : 'None',
                creations: userLogs.filter(l => l.activityType === 'Definition Created').length,
                edits: userLogs.filter(l => l.activityType === 'Definition Updated').length,
                approvals: userHistory.filter(h => h.action === 'Approved' || h.action === 'Rejected' || h.action === 'Changes Requested').length,
                templates: userLogs.filter(l => l.activityType.includes('Template')).length
            };
        });
    }, [users, filteredLogs, filteredHistory]);

    // -- DEFINITION REPORT LOGIC --
    const definitionReportStats = useMemo(() => {
        const safeDefs = Array.isArray(definitions) ? definitions : [];
        const safeDrafts = Array.isArray(drafts) ? drafts : [];
        
        const countPublished = (items: Definition[]): { total: number, archived: number } => {
            let total = 0;
            let archived = 0;
            items.forEach(item => {
                if (item.description || item.shortDescription) {
                    total++;
                    if (item.isArchived) archived++;
                }
                if (item.children) {
                    const childStats = countPublished(item.children);
                    total += childStats.total;
                    archived += childStats.archived;
                }
            });
            return { total, archived };
        };

        const pubStats = countPublished(safeDefs);
        const draftOnly = safeDrafts.filter(d => d.isDraft && !d.isPendingApproval);
        const pendingOnly = safeDrafts.filter(d => d.isPendingApproval);
        const rejectedOnly = safeDrafts.filter(d => (d.discussions || []).some(m => m.type === 'rejection'));

        const creationLogs = filteredLogs.filter(l => l.activityType === 'Definition Created');
        const byUserMap: Record<string, number> = {};
        creationLogs.forEach(l => {
            byUserMap[l.userName] = (byUserMap[l.userName] || 0) + 1;
        });
        const creationsByUser = Object.entries(byUserMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const byMonthMap: Record<string, number> = {};
        creationLogs.forEach(l => {
            const monthKey = format(parseISO(l.occurredDate), 'yyyy-MM');
            byMonthMap[monthKey] = (byMonthMap[monthKey] || 0) + 1;
        });
        const creationsByMonth = Object.entries(byMonthMap)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => b.month.localeCompare(a.month));

        return {
            counts: {
                total: pubStats.total + safeDrafts.length,
                published: pubStats.total - pubStats.archived,
                draft: draftOnly.length,
                pending: pendingOnly.length,
                rejected: rejectedOnly.length,
                archived: pubStats.archived
            },
            creationsByUser,
            creationsByMonth
        };
    }, [definitions, drafts, filteredLogs]);

    // -- APPROVAL REPORT LOGIC --
    const approvalReportStats = useMemo(() => {
        const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];
        const safeDrafts = Array.isArray(drafts) ? drafts : [];
        
        const approved = filteredHistory.filter(h => h.action === 'Approved');
        const rejected = filteredHistory.filter(h => h.action === 'Rejected' || h.action === 'Changes Requested');
        const pending = safeDrafts.filter(d => d.isPendingApproval);

        // Calculate Average Decision Time (Only for Approved/Rejected items in current filter)
        let totalMinutes = 0;
        let countWithTime = 0;
        
        filteredHistory.forEach(h => {
            if (h.action === 'Approved' || h.action === 'Rejected' || h.action === 'Changes Requested') {
                // Look for most recent 'Submitted' for this definition before this action
                const submission = safeHistory.find(s => 
                    s.definitionId === h.definitionId && 
                    s.action === 'Submitted' && 
                    parseISO(s.date).getTime() < parseISO(h.date).getTime()
                );
                
                if (submission) {
                    totalMinutes += differenceInMinutes(parseISO(h.date), parseISO(submission.date));
                    countWithTime++;
                }
            }
        });

        const avgHours = countWithTime > 0 ? (totalMinutes / countWithTime / 60).toFixed(1) : '—';

        // Breakdown by Approver
        const approverMap: Record<string, { approved: number, rejected: number }> = {};
        filteredHistory.forEach(h => {
            if (h.action === 'Submitted') return;
            if (!approverMap[h.userName]) approverMap[h.userName] = { approved: 0, rejected: 0 };
            if (h.action === 'Approved') approverMap[h.userName].approved++;
            else approverMap[h.userName].rejected++;
        });

        const byApprover = Object.entries(approverMap).map(([name, stats]) => ({
            name,
            ...stats,
            total: stats.approved + stats.rejected
        })).sort((a, b) => b.total - a.total);

        // Oldest Pending
        const oldestPending = [...pending]
            .filter(d => d.submittedAt)
            .sort((a, b) => parseISO(a.submittedAt!).getTime() - parseISO(b.submittedAt!).getTime())
            .slice(0, 5);

        return {
            metrics: {
                totalRequests: approved.length + rejected.length + pending.length,
                pendingCount: pending.length,
                approvedCount: approved.length,
                rejectedCount: rejected.length,
                avgDecisionTime: avgHours
            },
            byApprover,
            oldestPending
        };
    }, [approvalHistory, filteredHistory, drafts]);

    const uniqueApprovers = useMemo(() => {
        const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];
        const names = Array.from(new Set(safeHistory.filter(h => h.action !== 'Submitted').map(h => h.userName)));
        return names.sort();
    }, [approvalHistory]);

    // Unified Pagination Logic
    const currentDataSource = useMemo(() => {
        if (selectedReport === 'user-activity') return processedUserStats;
        return []; // Definition and Approval reports use custom layouts
    }, [selectedReport, processedUserStats]);

    const filteredAndSortedData = useMemo(() => {
        let result = [...currentDataSource];
        Object.entries(columnFilters).forEach(([key, value]) => {
            if (!value) return;
            const lowerValue = value.toLowerCase();
            result = result.filter(item => String((item as any)[key] || '').toLowerCase().includes(lowerValue));
        });
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = (a as any)[sortConfig.key];
                const valB = (b as any)[sortConfig.key];
                if (valA === valB) return 0;
                if (typeof valA === 'number' && typeof valB === 'number') return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                return sortConfig.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
        }
        return result;
    }, [currentDataSource, columnFilters, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSortedData.slice(start, start + pageSize);
    }, [filteredAndSortedData, currentPage, pageSize]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
        setCurrentPage(1);
    };

    const handleFilterChange = (key: string, value: string) => {
        setColumnFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setColumnFilters({});
        setSortConfig({ key: 'name', direction: 'asc' });
        setCurrentPage(1);
        setApproverFilter('all');
    };

    const handleExport = async (formatType: 'xlsx' | 'csv' | 'pdf') => {
        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_Report_${selectedReport.replace('-', '_')}_${timestamp}`;
        let dataToExport: any[] = [];

        if (selectedReport === 'user-activity') dataToExport = filteredAndSortedData;
        else if (selectedReport === 'approval-report') dataToExport = approvalReportStats.byApprover;
        else {
            dataToExport = [
                { Category: 'Total Definitions', Count: definitionReportStats.counts.total },
                { Category: 'Published', Count: definitionReportStats.counts.published },
                { Category: 'Draft', Count: definitionReportStats.counts.draft },
                { Category: 'Pending Approval', Count: definitionReportStats.counts.pending },
                { Category: 'Rejected', Count: definitionReportStats.counts.rejected },
                { Category: 'Archived', Count: definitionReportStats.counts.archived }
            ];
        }

        if (formatType === 'xlsx' || formatType === 'csv') {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            XLSX.writeFile(wb, `${filename}.${formatType === 'xlsx' ? 'xlsx' : 'csv'}`);
        } else {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF('l', 'mm', 'a4');
            doc.setFontSize(18);
            doc.text(`MedPoint Wiki: ${selectedReport.replace('-', ' ').toUpperCase()}`, 14, 20);
            doc.save(`${filename}.pdf`);
        }
        toast({ title: "Export Success" });
    };

    return (
        <div className="space-y-6 h-full flex flex-col bg-slate-50/30">
            <div className="bg-white p-6 border-b sticky top-0 z-30 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <ShieldCheck className="h-3 w-3" />
                            Administrative Governance
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-6 gap-2 shadow-lg shadow-indigo-100">
                                <Download className="h-4 w-4" />
                                Export Results
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                            <DropdownMenuItem onClick={() => handleExport('xlsx')} className="font-bold py-3"><FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel Spreadsheet</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="font-bold py-3"><FileText className="mr-2 h-4 w-4 text-slate-600" /> CSV Flat File</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')} className="font-bold py-3"><FileSearch className="mr-2 h-4 w-4 text-red-600" /> PDF Summary</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex-1 max-w-sm space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Report Selection</Label>
                        <Select value={selectedReport} onValueChange={(v) => { setSelectedReport(v as ReportType); clearAllFilters(); }}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user-activity" className="font-medium">User Activity Report</SelectItem>
                                <SelectItem value="definition-report" className="font-medium">Definition Report</SelectItem>
                                <SelectItem value="approval-report" className="font-medium">Approval Report</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedReport === 'approval-report' && (
                        <div className="flex-1 max-w-xs space-y-1.5 animate-in fade-in slide-in-from-left-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Reviewing Approver</Label>
                            <Select value={approverFilter} onValueChange={setApproverFilter}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Approvers</SelectItem>
                                    {uniqueApprovers.map(name => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex-1 max-w-xs space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Observation Period</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full h-10 px-4 font-bold text-xs gap-2 rounded-xl border-slate-200 justify-start">
                                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                    {dateRange?.from ? (
                                        dateRange.to ? <>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}</> : format(dateRange.from, "MMM dd, yyyy")
                                    ) : "Select Range"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="range" selected={dateRange as any} onSelect={setDateRange as any} initialFocus numberOfMonths={2} disabled={{ after: new Date() }} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button variant="ghost" className="mt-6 h-10 rounded-xl font-bold gap-2 text-slate-400" onClick={clearAllFilters}><FilterX className="h-4 w-4" /> Reset</Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1600px] mx-auto pb-32">
                    {selectedReport === 'user-activity' ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b">
                                        <TableRow>
                                            <ReportHeader label="User Name" id="name" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.name} onFilterChange={handleFilterChange} className="pl-6 w-[220px]" />
                                            <ReportHeader label="Last Login" id="lastLogin" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastLogin} onFilterChange={handleFilterChange} className="w-[180px]" />
                                            <ReportHeader label="Logins" id="logins" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.logins} onFilterChange={handleFilterChange} className="w-[110px]" />
                                            <ReportHeader label="Last Activity" id="lastActivity" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastActivity} onFilterChange={handleFilterChange} className="w-[150px]" />
                                            <ReportHeader label="Created" id="creations" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.creations} onFilterChange={handleFilterChange} className="w-[110px]" />
                                            <ReportHeader label="Edited" id="edits" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.edits} onFilterChange={handleFilterChange} className="w-[110px]" />
                                            <ReportHeader label="Approvals" id="approvals" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approvals} onFilterChange={handleFilterChange} className="w-[120px]" />
                                            <ReportHeader label="Templates" id="templates" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.templates} onFilterChange={handleFilterChange} className="w-[120px]" />
                                            <ReportHeader label="Status" id="status" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.status} onFilterChange={handleFilterChange} isSelectFilter className="pr-6 w-[130px]" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.map(u => (
                                            <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-100 h-16">
                                                <TableCell className="pl-6 font-bold text-slate-900">{u.name}</TableCell>
                                                <TableCell className="text-slate-500 font-mono text-xs">{u.lastLogin}</TableCell>
                                                <TableCell className="font-black text-slate-700 tabular-nums">{u.logins}</TableCell>
                                                <TableCell className="text-slate-500 text-xs">{u.lastActivity}</TableCell>
                                                <TableCell className="font-bold text-emerald-600">{u.creations}</TableCell>
                                                <TableCell className="font-bold text-indigo-600">{u.edits}</TableCell>
                                                <TableCell className="font-bold text-amber-600">{u.approvals}</TableCell>
                                                <TableCell className="font-bold text-slate-600">{u.templates}</TableCell>
                                                <TableCell className="pr-6"><Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="font-black text-[9px] uppercase px-2">{u.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                    ) : selectedReport === 'definition-report' ? (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2"><FilePieChart className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Library Summary Ledger</h3></div>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow><TableHead className="px-6 h-12">Definition State</TableHead><TableHead className="text-right px-6 h-12">Count</TableHead></TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { label: 'Total Definitions', count: definitionReportStats.counts.total, color: 'text-slate-900' },
                                                { label: 'Published (Active)', count: definitionReportStats.counts.published, color: 'text-emerald-600' },
                                                { label: 'Pending Review', count: definitionReportStats.counts.pending, color: 'text-indigo-600' },
                                                { label: 'Private Drafts', count: definitionReportStats.counts.draft, color: 'text-amber-600' },
                                                { label: 'Rejected', count: definitionReportStats.counts.rejected, color: 'text-red-600' },
                                                { label: 'Archived', count: definitionReportStats.counts.archived, color: 'text-slate-400' }
                                            ].map((row, i) => (
                                                <TableRow key={i} className="border-slate-100 h-14"><TableCell className="px-6 font-medium text-slate-700">{row.label}</TableCell><TableCell className={cn("px-6 text-right font-black text-lg tabular-nums", row.color)}>{row.count}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                            <div className="grid grid-cols-2 gap-10">
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white"><div className="p-6 border-b bg-slate-50"><h4 className="font-bold">By Author</h4></div><Table><TableBody>{definitionReportStats.creationsByUser.map((u, i) => (<TableRow key={i} className="h-12 border-slate-100"><TableCell className="px-6 font-bold">{u.name}</TableCell><TableCell className="px-6 text-right font-black text-indigo-600">{u.count}</TableCell></TableRow>))}</TableBody></Table></Card>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white"><div className="p-6 border-b bg-slate-50"><h4 className="font-bold">By Month</h4></div><Table><TableBody>{definitionReportStats.creationsByMonth.map((m, i) => (<TableRow key={i} className="h-12 border-slate-100"><TableCell className="px-6 font-mono font-bold">{m.month}</TableCell><TableCell className="px-6 text-right font-black text-emerald-600">{m.count}</TableCell></TableRow>))}</TableBody></Table></Card>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            {/* Performance Ledger */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2"><ClipboardCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Approval Workflow Performance</h3></div>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow><TableHead className="px-6 h-12">Performance Metric</TableHead><TableHead className="text-right px-6 h-12">Value</TableHead></TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow className="border-slate-100 h-14"><TableCell className="px-6 font-medium">Total Approval Requests</TableCell><TableCell className="px-6 text-right font-black text-slate-900">{approvalReportStats.metrics.totalRequests}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14"><TableCell className="px-6 font-medium">Pending Approvals</TableCell><TableCell className="px-6 text-right font-black text-indigo-600">{approvalReportStats.metrics.pendingCount}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14"><TableCell className="px-6 font-medium">Approved Count</TableCell><TableCell className="px-6 text-right font-black text-emerald-600">{approvalReportStats.metrics.approvedCount}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14"><TableCell className="px-6 font-medium">Rejected Count</TableCell><TableCell className="px-6 text-right font-black text-red-600">{approvalReportStats.metrics.rejectedCount}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 bg-indigo-50/20"><TableCell className="px-6 font-bold text-primary flex items-center gap-2"><Clock className="h-4 w-4" /> Average Approval Time</TableCell><TableCell className="px-6 text-right font-black text-primary text-xl tabular-nums">{approvalReportStats.metrics.avgDecisionTime} hrs</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Approver Workload */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><Users className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Workload by Approver</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6">Approver Name</TableHead>
                                                    <TableHead className="text-center">Total</TableHead>
                                                    <TableHead className="text-center text-emerald-600">Appr.</TableHead>
                                                    <TableHead className="text-center text-red-600">Rej.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {approvalReportStats.byApprover.map((app, i) => (
                                                    <TableRow key={i} className="h-14 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-bold text-slate-700">{app.name}</TableCell>
                                                        <TableCell className="text-center font-black text-slate-900">{app.total}</TableCell>
                                                        <TableCell className="text-center font-bold text-emerald-600">{app.approved}</TableCell>
                                                        <TableCell className="text-center font-bold text-red-600">{app.rejected}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {approvalReportStats.byApprover.length === 0 && (
                                                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400 italic">No historical decision data for this filter.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>

                                {/* Oldest Pending */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><AlertCircle className="h-4 w-4 text-red-500" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Queue Aging: Oldest Pending</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6">Definition</TableHead>
                                                    <TableHead>Author</TableHead>
                                                    <TableHead className="text-right px-6">Submission Age</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {approvalReportStats.oldestPending.map((p, i) => {
                                                    const hours = differenceInHours(new Date(), parseISO(p.submittedAt!));
                                                    return (
                                                        <TableRow key={i} className="h-14 border-slate-100 hover:bg-slate-50/50">
                                                            <TableCell className="px-6 font-bold text-slate-700 truncate max-w-[200px]">{p.name}</TableCell>
                                                            <TableCell className="text-sm text-slate-500">{p.submittedBy}</TableCell>
                                                            <TableCell className="text-right px-6">
                                                                <Badge className={cn("rounded-lg font-black uppercase text-[10px]", hours > 48 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
                                                                    {hours} hours ago
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                {approvalReportStats.oldestPending.length === 0 && (
                                                    <TableRow><TableCell colSpan={3} className="h-32 text-center text-slate-400 italic">Review queue is currently empty.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function ReportHeader({ label, id, currentSort, onSort, filterValue, onFilterChange, className, isSelectFilter }: any) {
    const isSorted = currentSort?.key === id;
    return (
        <TableHead className={cn("py-4", className)}>
            <div className="flex items-center justify-between gap-1 group/header">
                <button onClick={() => onSort(id)} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors shrink-0">
                    {label}
                    <ArrowUpDown className={cn("ml-1.5 h-3 w-3 transition-opacity", isSorted ? "text-indigo-600 opacity-100" : "opacity-0 group-hover/header:opacity-40")} />
                </button>
                <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-md", filterValue ? "text-indigo-600 bg-indigo-50" : "text-slate-300")}><Filter className="h-3 w-3" /></Button></PopoverTrigger>
                    <PopoverContent className="w-56 p-3 rounded-xl shadow-xl" align="end">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Filter {label}</Label>
                            {isSelectFilter ? (
                                <Select value={filterValue || 'all'} onValueChange={(v) => onFilterChange(id, v === 'all' ? '' : v)}>
                                    <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                    <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                                </Select>
                            ) : (
                                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-300" /><Input className="h-9 pl-8 text-xs" placeholder={`Filter...`} value={filterValue || ''} onChange={(e) => onFilterChange(id, e.target.value)} /></div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </TableHead>
    );
}

function ReportPagination({ currentPage, totalPages, pageSize, setPageSize, onPageChange, totalItems }: any) {
    return (
        <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-6">
                <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}</div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Rows:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); onPageChange(1); }}>
                        <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1.5" />Previous</Button>
                <div className="flex items-center justify-center min-w-[3.5rem] h-9 rounded-xl bg-white border border-slate-200 text-sm font-black text-indigo-600">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || totalPages === 0}>Next<ChevronRight className="h-4 w-4 ml-1.5" /></Button>
            </div>
        </div>
    );
}
