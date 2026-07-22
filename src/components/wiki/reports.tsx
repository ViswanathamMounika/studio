
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
    TrendingUp
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO, startOfMonth } from 'date-fns';
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

type ReportType = 'user-activity' | 'definition-report' | 'workflow-analysis' | 'template-stats';

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
        if (!dateRange?.from) return safeHistory;
        return safeHistory.filter(h => {
            const hDate = parseISO(h.date);
            return isWithinInterval(hDate, { 
                start: startOfDay(dateRange.from), 
                end: endOfDay(dateRange.to || dateRange.from) 
            });
        });
    }, [approvalHistory, dateRange]);

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
        
        // Recursive count for published items
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

        // Group creations by user from logs
        const creationLogs = filteredLogs.filter(l => l.activityType === 'Definition Created');
        const byUserMap: Record<string, number> = {};
        creationLogs.forEach(l => {
            byUserMap[l.userName] = (byUserMap[l.userName] || 0) + 1;
        });
        const creationsByUser = Object.entries(byUserMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Group creations by month from logs
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

    // Apply Header Filters and Sorting for the main table (User Activity)
    const filteredAndSortedData = useMemo(() => {
        let result = [...processedUserStats];
        Object.entries(columnFilters).forEach(([key, value]) => {
            if (!value) return;
            const lowerValue = value.toLowerCase();
            result = result.filter(item => String(item[key as keyof typeof item] || '').toLowerCase().includes(lowerValue));
        });
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = a[sortConfig.key as keyof typeof a];
                const valB = b[sortConfig.key as keyof typeof b];
                if (valA === valB) return 0;
                if (typeof valA === 'number' && typeof valB === 'number') return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                return sortConfig.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
        }
        return result;
    }, [processedUserStats, columnFilters, sortConfig]);

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
    };

    const handleExport = async (formatType: 'xlsx' | 'csv' | 'pdf') => {
        const reportName = selectedReport === 'user-activity' ? 'UserActivity' : 'DefinitionReport';
        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_${reportName}_${timestamp}`;

        const dataToExport = selectedReport === 'user-activity' ? filteredAndSortedData : [
            { Category: 'Total Definitions', Count: definitionReportStats.counts.total },
            { Category: 'Published', Count: definitionReportStats.counts.published },
            { Category: 'Draft', Count: definitionReportStats.counts.draft },
            { Category: 'Pending Approval', Count: definitionReportStats.counts.pending },
            { Category: 'Rejected', Count: definitionReportStats.counts.rejected },
            { Category: 'Archived', Count: definitionReportStats.counts.archived }
        ];

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
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
            doc.save(`${filename}.pdf`);
        }
        toast({ title: "Export Success" });
    };

    return (
        <div className="space-y-6 h-full flex flex-col bg-slate-50/30">
            <div className="flex flex-col gap-6 bg-white p-6 border-b sticky top-0 z-30 shadow-sm">
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
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200">
                            <DropdownMenuItem onClick={() => handleExport('xlsx')} className="font-bold py-3"><FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel Spreadsheet</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="font-bold py-3"><FileText className="mr-2 h-4 w-4 text-slate-600" /> CSV Flat File</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')} className="font-bold py-3"><FileSearch className="mr-2 h-4 w-4 text-red-600" /> PDF Summary</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="flex-1 max-w-sm space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Report Selection</Label>
                            <Select value={selectedReport} onValueChange={(v) => setSelectedReport(v as ReportType)}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                        <SelectValue placeholder="Select Report Type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user-activity" className="font-medium">User Activity Report</SelectItem>
                                    <SelectItem value="definition-report" className="font-medium">Definition Report</SelectItem>
                                    <SelectItem value="workflow-analysis" className="font-medium">Workflow Analysis</SelectItem>
                                    <SelectItem value="template-stats" className="font-medium">Template Utilization</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

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
                                    <Calendar 
                                        mode="range" 
                                        selected={dateRange as any} 
                                        onSelect={setDateRange as any} 
                                        initialFocus 
                                        numberOfMonths={2} 
                                        disabled={{ after: new Date() }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="mt-6 h-10 rounded-xl font-bold gap-2 text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={clearAllFilters}
                        >
                            <FilterX className="h-4 w-4" />
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1600px] mx-auto pb-32">
                    {selectedReport === 'user-activity' ? (
                        <div className="space-y-4">
                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b">
                                        <TableRow className="hover:bg-transparent">
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
                                            <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-100 h-16 transition-colors">
                                                <TableCell className="pl-6"><div className="flex flex-col"><span className="font-bold text-slate-900 leading-none">{u.name}</span><span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-1">{u.role}</span></div></TableCell>
                                                <TableCell className="text-slate-500 font-mono text-xs">{u.lastLogin}</TableCell>
                                                <TableCell className="font-black text-slate-700 tabular-nums">{u.logins}</TableCell>
                                                <TableCell className="text-slate-500 font-medium text-xs">{u.lastActivity}</TableCell>
                                                <TableCell className="font-bold text-emerald-600 tabular-nums">{u.creations}</TableCell>
                                                <TableCell className="font-bold text-indigo-600 tabular-nums">{u.edits}</TableCell>
                                                <TableCell className="font-bold text-amber-600 tabular-nums">{u.approvals}</TableCell>
                                                <TableCell className="font-bold text-slate-600 tabular-nums">{u.templates}</TableCell>
                                                <TableCell className="pr-6"><Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="font-black text-[9px] uppercase px-2.5 h-5">{u.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                    ) : selectedReport === 'definition-report' ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Counts Summary */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2"><FilePieChart className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Library Summary Ledger</h3></div>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow>
                                                <TableHead className="font-bold text-slate-900 px-6 h-12">Definition Lifecycle State</TableHead>
                                                <TableHead className="text-right font-bold text-slate-900 px-6 h-12">Current Count</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { label: 'Total Definitions Managed', count: definitionReportStats.counts.total, color: 'text-slate-900' },
                                                { label: 'Published (Active)', count: definitionReportStats.counts.published, color: 'text-emerald-600' },
                                                { label: 'Private Drafts', count: definitionReportStats.counts.draft, color: 'text-amber-600' },
                                                { label: 'Pending Governance Review', count: definitionReportStats.counts.pending, color: 'text-indigo-600' },
                                                { label: 'Rejected (Requires Revision)', count: definitionReportStats.counts.rejected, color: 'text-red-600' },
                                                { label: 'Archived (Historical)', count: definitionReportStats.counts.archived, color: 'text-slate-400' }
                                            ].map((row, i) => (
                                                <TableRow key={i} className="border-slate-100 h-14">
                                                    <TableCell className="px-6 font-medium text-slate-700">{row.label}</TableCell>
                                                    <TableCell className={cn("px-6 text-right font-black text-lg tabular-nums", row.color)}>{row.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Creations By User */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><Users className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Creations by Author</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow><TableHead className="px-6">User Name</TableHead><TableHead className="text-right px-6">Definitions Created</TableHead></TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {definitionReportStats.creationsByUser.map((u, i) => (
                                                    <TableRow key={i} className="border-slate-100 h-14"><TableCell className="px-6 font-bold">{u.name}</TableCell><TableCell className="px-6 text-right font-black text-indigo-600 tabular-nums">{u.count}</TableCell></TableRow>
                                                ))}
                                                {definitionReportStats.creationsByUser.length === 0 && (
                                                    <TableRow><TableCell colSpan={2} className="h-32 text-center text-slate-400 italic">No creation activity recorded for this period.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>

                                {/* Growth By Month */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><TrendingUp className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Content Growth by Month</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow><TableHead className="px-6">Month Period</TableHead><TableHead className="text-right px-6">New Definitions</TableHead></TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {definitionReportStats.creationsByMonth.map((m, i) => (
                                                    <TableRow key={i} className="border-slate-100 h-14"><TableCell className="px-6 font-mono font-bold text-slate-600">{m.month}</TableCell><TableCell className="px-6 text-right font-black text-emerald-600 tabular-nums">{m.count}</TableCell></TableRow>
                                                ))}
                                                {definitionReportStats.creationsByMonth.length === 0 && (
                                                    <TableRow><TableCell colSpan={2} className="h-32 text-center text-slate-400 italic">No growth activity recorded for this period.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                             <BarChart3 className="h-16 w-16 text-slate-100 mb-4" />
                             <h3 className="text-lg font-bold text-slate-900">Module Under Refinement</h3>
                             <p className="text-sm text-slate-400 max-w-xs text-center mt-2 leading-relaxed">The specialized analytics for <strong>{selectedReport.replace('-', ' ')}</strong> are being synchronized with the new global audit schema.</p>
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
