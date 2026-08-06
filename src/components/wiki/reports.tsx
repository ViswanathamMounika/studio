
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
    BarChart3,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Users,
    Activity,
    Settings2,
    Play
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserAccount, Definition, ActivityLog, ApprovalHistoryEntry, Template, MasterDataState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
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

type ReportType = 'user-activity' | 'definition-report' | 'approval-report' | 'template-report';

type AppliedFilters = {
    reportType: ReportType;
    dateRange: { from: Date; to: Date } | undefined;
    approverFilter: string;
};

export default function ReportsDashboard({ users, definitions, drafts, activityLogs, approvalHistory, templates, masterData }: ReportsDashboardProps) {
    const [selectedReport, setSelectedReport] = useState<ReportType>('user-activity');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 12),
        to: new Date()
    });
    const [approverFilter, setApproverFilter] = useState<string>('all');

    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
    
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'timestamp', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const { toast } = useToast();

    const handleRunReport = () => {
        setAppliedFilters({
            reportType: selectedReport,
            dateRange,
            approverFilter
        });
        setCurrentPage(1);
        setColumnFilters({});
        toast({
            title: "Report Generated",
            description: `Data retrieved for ${selectedReport.replace('-', ' ')}.`,
        });
    };

    const filteredLogs = useMemo(() => {
        const safeLogs = Array.isArray(activityLogs) ? activityLogs : [];
        if (!appliedFilters?.dateRange?.from) return safeLogs;
        return safeLogs.filter(log => {
            if (!log || !log.occurredDate) return false;
            try {
              const logDate = parseISO(log.occurredDate);
              return isWithinInterval(logDate, { 
                  start: startOfDay(appliedFilters.dateRange!.from), 
                  end: endOfDay(appliedFilters.dateRange!.to || appliedFilters.dateRange!.from) 
              });
            } catch (e) { return false; }
        });
    }, [activityLogs, appliedFilters]);

    const processedReportData = useMemo(() => {
        if (!appliedFilters || appliedFilters.reportType !== 'user-activity') return [];
        
        const allItems = [...definitions, ...drafts];
        const findInTree = (items: Definition[], idOrName: string): Definition | undefined => {
            for (const item of items) {
                if (item.id === idOrName || item.name === idOrName) return item;
                if (item.children) {
                    const found = findInTree(item.children, idOrName);
                    if (found) return found;
                }
            }
        };

        return filteredLogs.map(log => {
            const user = users.find(u => u.name === log.userName);
            const def = findInTree(allItems, log.definitionName);
            const template = templates.find(t => t.id === def?.templateId);
            const history = approvalHistory.find(h => h.definitionId === def?.id && Math.abs(parseISO(h.date).getTime() - parseISO(log.occurredDate).getTime()) < 60000);

            const isTemplateAction = log.activityType.includes('Template');

            return {
                id: log.id,
                userName: log.userName,
                role: user?.role || 'N/A',
                actionType: log.activityType,
                timestamp: log.occurredDate,
                module: def?.module || 'Core',
                entityType: isTemplateAction ? 'Template' : 'Definition',
                entityName: log.definitionName,
                entityId: def?.id || (isTemplateAction ? 'TMP-ID' : 'SYS-ID'),
                prevStatus: log.activityType === 'Definition Created' ? 'None' : (def?.isDraft ? 'Draft' : 'Published'),
                newStatus: log.activityType.includes('Published') || log.activityType === 'Approval Decision' ? 'Published' : (log.activityType.includes('Archived') ? 'Archived' : 'Draft'),
                version: def?.revisions?.[0]?.ticketId || 'v1.0',
                comments: log.details || '—',
                approverName: history?.action !== 'Submitted' ? history?.userName || '—' : '—',
                templateUsed: template?.name || 'Standard Definition',
                templateStatusChange: isTemplateAction ? 'Status Updated' : '—',
                relatedId: (def?.relatedDefinitions && def.relatedDefinitions.length > 0) ? def.relatedDefinitions[0] : '—',
                attachment: (def?.attachments && def.attachments.length > 0) ? def.attachments[0].name : '—'
            };
        });
    }, [filteredLogs, users, definitions, drafts, approvalHistory, templates, appliedFilters]);

    const filteredAndSortedData = useMemo(() => {
        let result = [...processedReportData];
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
    }, [processedReportData, columnFilters, sortConfig]);

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
        setSortConfig({ key: 'timestamp', direction: 'desc' });
        setCurrentPage(1);
        setApproverFilter('all');
        setAppliedFilters(null);
    };

    const handleExport = async (formatType: 'xlsx' | 'csv') => {
        if (!appliedFilters) return;
        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_Report_${timestamp}`;
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const exportData = filteredAndSortedData.map(d => ({ ...d }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Activity Report");
        XLSX.writeFile(wb, `${filename}.${formatType === 'xlsx' ? 'xlsx' : 'csv'}`);
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
                            <Button disabled={!appliedFilters} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-6 gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                                <Download className="h-4 w-4" />
                                Export Results
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                            <DropdownMenuItem onClick={() => handleExport('xlsx')} className="font-bold py-3"><FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel Spreadsheet</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="font-bold py-3"><FileText className="mr-2 h-4 w-4 text-slate-600" /> CSV Flat File</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex-1 min-w-[240px] max-w-sm space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Report Selection</Label>
                        <Select value={selectedReport} onValueChange={(v) => setSelectedReport(v as ReportType)}>
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
                                <SelectItem value="template-report" className="font-medium">Template Report</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[220px] max-w-xs space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Observation Period</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full h-10 px-4 font-bold text-xs gap-2 rounded-xl border-slate-200 justify-start bg-white">
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

                    <div className="pt-6 flex gap-2">
                        <Button 
                            className="h-10 rounded-xl font-bold gap-2 px-8 bg-primary hover:bg-primary/90 text-white shadow-md shadow-indigo-100 transition-all active:scale-95" 
                            onClick={handleRunReport}
                        >
                            <Play className="h-4 w-4 fill-current" />
                            Run Report
                        </Button>
                        <Button variant="ghost" className="h-10 rounded-xl font-bold gap-2 text-slate-400 hover:bg-slate-50" onClick={clearAllFilters}>
                            <FilterX className="h-4 w-4" /> 
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1600px] mx-auto pb-32">
                    {!appliedFilters ? (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                                <Settings2 className="h-10 w-10 text-slate-300" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">Report Configuration Required</h3>
                                <p className="text-sm text-slate-500 max-sm font-medium">Select a report and period above to load analytical data.</p>
                            </div>
                        </div>
                    ) : appliedFilters.reportType === 'user-activity' ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 px-2">
                                <Users className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">User Activity Audit Ledger</h3>
                            </div>
                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                <ScrollArea className="w-full">
                                    <Table className="min-w-[2400px]">
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow>
                                                <ReportHeader label="User Name" id="userName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.userName} onFilterChange={handleFilterChange} className="pl-6 w-[200px]" />
                                                <ReportHeader label="Role" id="role" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.role} onFilterChange={handleFilterChange} className="w-[150px]" />
                                                <ReportHeader label="Action Type" id="actionType" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.actionType} onFilterChange={handleFilterChange} className="w-[180px]" />
                                                <ReportHeader label="Timestamp" id="timestamp" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.timestamp} onFilterChange={handleFilterChange} className="w-[180px]" />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[150px]" />
                                                <ReportHeader label="Entity Type" id="entityType" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.entityType} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="Entity Name" id="entityName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.entityName} onFilterChange={handleFilterChange} className="w-[200px]" />
                                                <ReportHeader label="Entity ID" id="entityId" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.entityId} onFilterChange={handleFilterChange} className="w-[120px]" />
                                                <ReportHeader label="Prev Status" id="prevStatus" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.prevStatus} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="New Status" id="newStatus" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.newStatus} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="Version" id="version" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.version} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="Comments" id="comments" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.comments} onFilterChange={handleFilterChange} className="w-[250px]" />
                                                <ReportHeader label="Approver" id="approverName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approverName} onFilterChange={handleFilterChange} className="w-[160px]" />
                                                <ReportHeader label="Template Used" id="templateUsed" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.templateUsed} onFilterChange={handleFilterChange} className="w-[180px]" />
                                                <ReportHeader label="Template Status" id="templateStatusChange" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.templateStatusChange} onFilterChange={handleFilterChange} className="w-[160px]" />
                                                <ReportHeader label="Related ID" id="relatedId" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.relatedId} onFilterChange={handleFilterChange} className="w-[120px]" />
                                                <ReportHeader label="Attachment" id="attachment" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.attachment} onFilterChange={handleFilterChange} className="pr-6 w-[180px]" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.map((d: any) => (
                                                <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 h-16">
                                                    <TableCell className="pl-6 font-bold text-slate-900">{d.userName}</TableCell>
                                                    <TableCell><Badge variant="outline" className="font-bold text-[10px] uppercase border-slate-200">{d.role}</Badge></TableCell>
                                                    <TableCell><Badge className="bg-indigo-50 text-indigo-700 font-bold border-indigo-100">{d.actionType}</Badge></TableCell>
                                                    <TableCell className="font-mono text-xs text-slate-500">{format(parseISO(d.timestamp), 'yyyy-MM-dd HH:mm')}</TableCell>
                                                    <TableCell className="font-bold text-slate-700">{d.module}</TableCell>
                                                    <TableCell><Badge variant="secondary" className="font-black text-[9px] uppercase">{d.entityType}</Badge></TableCell>
                                                    <TableCell className="font-bold text-primary truncate max-w-[180px]">{d.entityName}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.entityId}</TableCell>
                                                    <TableCell className="text-slate-400 italic text-xs">{d.prevStatus}</TableCell>
                                                    <TableCell><Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[10px]">{d.newStatus}</Badge></TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-500">{d.version}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs italic truncate max-w-[220px]">{d.comments}</TableCell>
                                                    <TableCell className="font-bold text-slate-700">{d.approverName}</TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-500">{d.templateUsed}</TableCell>
                                                    <TableCell className="text-xs text-slate-400">{d.templateStatusChange}</TableCell>
                                                    <TableCell className="text-[11px] font-mono text-slate-400">{d.relatedId}</TableCell>
                                                    <TableCell className="pr-6 text-xs text-primary font-bold">{d.attachment}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </Card>
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40">
                            <Activity className="h-12 w-12 text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium italic">No detailed visualization configured for this report type. Please use the export function for full data analysis.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function ReportHeader({ label, id, currentSort, onSort, filterValue, onFilterChange, className }: any) {
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
                            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-300" /><Input className="h-9 pl-8 text-xs font-bold" placeholder={`Search...`} value={filterValue || ''} onChange={(e) => onFilterChange(id, e.target.value)} /></div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </TableHead>
    );
}

function ReportPagination({ currentPage, totalPages, pageSize, setPageSize, onPageChange, totalItems }: any) {
    return (
        <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-200 shadow-sm mt-2">
            <div className="flex items-center gap-6">
                <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} records</div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Rows:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); onPageChange(1); }}>
                        <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1.5" />Prev</Button>
                <div className="flex items-center justify-center min-w-[3.5rem] h-9 rounded-xl bg-white border border-slate-200 text-sm font-black text-indigo-600">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || totalPages === 0}>Next<ChevronRight className="h-4 w-4 ml-1.5" /></Button>
            </div>
        </div>
    );
}
