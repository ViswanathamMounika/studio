
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
    ChevronRight
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO } from 'date-fns';
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

type ReportType = 'user-activity' | 'definition-insights' | 'workflow-analysis' | 'template-stats';

export default function ReportsDashboard({ users, activityLogs, approvalHistory }: ReportsDashboardProps) {
    const [selectedReport, setSelectedReport] = useState<ReportType>('user-activity');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 6),
        to: new Date()
    });
    
    // Filtering and Pagination State
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const { toast } = useToast();

    // -- DATA CALCULATIONS --
    
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

    // Compute stats for all users based on filtered telemetry
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

    // Apply Header Filters and Sorting
    const filteredAndSortedData = useMemo(() => {
        let result = [...processedUserStats];

        // Apply column filters
        Object.entries(columnFilters).forEach(([key, value]) => {
            if (!value) return;
            const lowerValue = value.toLowerCase();
            result = result.filter(item => {
                const itemValue = String(item[key as keyof typeof item] || '').toLowerCase();
                return itemValue.includes(lowerValue);
            });
        });

        // Apply sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = a[sortConfig.key as keyof typeof a];
                const valB = b[sortConfig.key as keyof typeof b];

                if (valA === valB) return 0;
                
                // Numeric sort
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                }
                
                // String sort
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [processedUserStats, columnFilters, sortConfig]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSortedData.slice(start, start + pageSize);
    }, [filteredAndSortedData, currentPage, pageSize]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
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
        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_UserActivityReport_${timestamp}`;

        if (formatType === 'xlsx' || formatType === 'csv') {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(filteredAndSortedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Activity Report");
            XLSX.writeFile(wb, `${filename}.${formatType === 'xlsx' ? 'xlsx' : 'csv'}`);
        } else {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF('l', 'mm', 'a4');
            doc.setFontSize(18);
            doc.text(`MedPoint Wiki: User Activity Report`, 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
            
            let y = 40;
            const headers = ['Name', 'Logins', 'Last Activity', 'Creations', 'Edits', 'Approvals', 'Templates', 'Status'];
            const keys: (keyof typeof processedUserStats[0])[] = ['name', 'logins', 'lastActivity', 'creations', 'edits', 'approvals', 'templates', 'status'];
            
            doc.setFont('helvetica', 'bold');
            headers.forEach((h, i) => doc.text(h, 14 + (i * 35), y));
            y += 5;
            doc.line(14, y, 280, y);
            y += 8;

            doc.setFont('helvetica', 'normal');
            filteredAndSortedData.slice(0, 50).forEach(row => {
                keys.forEach((k, i) => doc.text(String(row[k] || ''), 14 + (i * 35), y));
                y += 7;
                if (y > 190) { doc.addPage(); y = 20; }
            });

            doc.save(`${filename}.pdf`);
        }
        toast({ title: "Export Success", description: `Report exported as ${formatType.toUpperCase()}` });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
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
                                Export
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
                                    <SelectItem value="definition-insights" className="font-medium">Definition Insights</SelectItem>
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
                            Reset All
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
                                            <ReportHeader 
                                                label="User Name" 
                                                id="name" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.name} 
                                                onFilterChange={handleFilterChange}
                                                className="pl-6 w-[220px]"
                                            />
                                            <ReportHeader 
                                                label="Last Login" 
                                                id="lastLogin" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.lastLogin} 
                                                onFilterChange={handleFilterChange}
                                                className="w-[180px]"
                                            />
                                            <ReportHeader 
                                                label="Logins" 
                                                id="logins" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.logins} 
                                                onFilterChange={handleFilterChange}
                                                className="w-[110px]"
                                            />
                                            <ReportHeader 
                                                label="Last Activity" 
                                                id="lastActivity" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.lastActivity} 
                                                onFilterChange={handleFilterChange}
                                                className="w-[150px]"
                                            />
                                            <ReportHeader 
                                                label="Created" 
                                                id="creations" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.creations} 
                                                onFilterChange={handleFilterChange}
                                                className="w-[110px]"
                                            />
                                            <ReportHeader 
                                                label="Edited" 
                                                id="edits" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.edits} 
                                                onFilterChange={handleFilterChange}
                                                className="w-[110px]"
                                            />
                                            <ReportHeader 
                                                label="Approvals" 
                                                id="approvals" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.approvals} 
                                                onFilterChange={handleFilterChange}
                                                className="w-[120px]"
                                            />
                                            <ReportHeader 
                                                label="Templates" 
                                                id="templates" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.templates} 
                                                onFilterChange={handleFilterChange}
                                                className="w-[120px]"
                                            />
                                            <ReportHeader 
                                                label="Status" 
                                                id="status" 
                                                currentSort={sortConfig} 
                                                onSort={handleSort} 
                                                filterValue={columnFilters.status} 
                                                onFilterChange={handleFilterChange}
                                                isSelectFilter
                                                className="pr-6 w-[130px]"
                                            />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.map(u => (
                                            <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-100 h-16 transition-colors">
                                                <TableCell className="pl-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 leading-none">{u.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-1">{u.role}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-mono text-xs">{u.lastLogin}</TableCell>
                                                <TableCell className="font-black text-slate-700 tabular-nums">{u.logins}</TableCell>
                                                <TableCell className="text-slate-500 font-medium text-xs">{u.lastActivity}</TableCell>
                                                <TableCell className="font-bold text-emerald-600 tabular-nums">{u.creations}</TableCell>
                                                <TableCell className="font-bold text-indigo-600 tabular-nums">{u.edits}</TableCell>
                                                <TableCell className="font-bold text-amber-600 tabular-nums">{u.approvals}</TableCell>
                                                <TableCell className="font-bold text-slate-600 tabular-nums">{u.templates}</TableCell>
                                                <TableCell className="pr-6">
                                                    <Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="font-black text-[9px] uppercase px-2.5 h-5 shadow-sm">
                                                        {u.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {paginatedData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={9} className="h-64 text-center">
                                                    <div className="flex flex-col items-center gap-3 py-12">
                                                        <Search className="h-10 w-10 text-slate-100" />
                                                        <p className="text-slate-400 font-bold italic">No records match the current filter criteria.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                        Showing {filteredAndSortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} records
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rows per page:</span>
                                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                            <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold border-slate-200 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white hover:bg-slate-50 transition-all"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1.5" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center justify-center min-w-[3.5rem] h-9 rounded-xl bg-white border border-slate-200 text-sm font-black text-indigo-600">
                                        {currentPage} / {totalPages || 1}
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white hover:bg-slate-50 transition-all"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages || totalPages === 0}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                             <BarChart3 className="h-16 w-16 text-slate-100 mb-4" />
                             <h3 className="text-lg font-bold text-slate-900">Module Under Refinement</h3>
                             <p className="text-sm text-slate-400 max-w-xs text-center mt-2 leading-relaxed">
                                 The specialized analytics for <strong>{selectedReport.replace('-', ' ')}</strong> are being synchronized with the new global audit schema.
                             </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

interface ReportHeaderProps {
    label: string;
    id: string;
    currentSort: SortConfig;
    onSort: (id: string) => void;
    filterValue?: string;
    onFilterChange: (id: string, val: string) => void;
    className?: string;
    isSelectFilter?: boolean;
}

function ReportHeader({ label, id, currentSort, onSort, filterValue, onFilterChange, className, isSelectFilter }: ReportHeaderProps) {
    const isSorted = currentSort?.key === id;
    
    return (
        <TableHead className={cn("py-4", className)}>
            <div className="flex items-center justify-between gap-1 group/header">
                <button 
                    onClick={() => onSort(id)}
                    className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors shrink-0"
                >
                    {label}
                    <ArrowUpDown className={cn("ml-1.5 h-3 w-3 transition-opacity", isSorted ? "text-indigo-600 opacity-100" : "opacity-0 group-hover/header:opacity-40")} />
                </button>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-md transition-all", filterValue ? "text-indigo-600 bg-indigo-50" : "text-slate-300 hover:bg-slate-100")}>
                            <Filter className="h-3 w-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3 rounded-xl shadow-xl border-slate-200" align="end">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filter {label}</Label>
                            {isSelectFilter ? (
                                <Select value={filterValue || 'all'} onValueChange={(v) => onFilterChange(id, v === 'all' ? '' : v)}>
                                    <SelectTrigger className="h-8 rounded-lg text-xs font-bold bg-white">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                                        <SelectItem value="Active" className="text-xs">Active Only</SelectItem>
                                        <SelectItem value="Inactive" className="text-xs">Inactive Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-300" />
                                    <Input 
                                        className="h-9 pl-8 rounded-lg text-xs border-slate-200 focus-visible:ring-indigo-100" 
                                        placeholder={`Filter by ${label.toLowerCase()}...`}
                                        value={filterValue || ''}
                                        onChange={(e) => onFilterChange(id, e.target.value)}
                                    />
                                </div>
                            )}
                            {filterValue && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full h-7 text-[10px] font-bold text-red-500 hover:bg-red-50"
                                    onClick={() => onFilterChange(id, '')}
                                >
                                    Clear Filter
                                </Button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </TableHead>
    );
}
