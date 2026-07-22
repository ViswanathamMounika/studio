
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
    Search
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

type ReportType = 'user-activity' | 'definition-insights' | 'workflow-analysis' | 'template-stats' | 'system-usage';

export default function ReportsDashboard({ users, definitions, drafts, activityLogs, approvalHistory, templates, masterData }: ReportsDashboardProps) {
    const [selectedReport, setSelectedReport] = useState<ReportType>('user-activity');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 3),
        to: new Date()
    });
    
    // Header-based filters for User Activity Report
    const [userFilters, setUserFilters] = useState<Record<string, string>>({});
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
    const { toast } = useToast();

    // -- DATA UTILITIES --
    const getFlattenedDefinitions = (items: Definition[]): Definition[] => {
        let flat: Definition[] = [];
        const safeItems = Array.isArray(items) ? items : [];
        safeItems.forEach(item => {
            flat.push(item);
            if (item.children) flat = flat.concat(getFlattenedDefinitions(item.children));
        });
        return flat;
    };

    const allPublished = useMemo(() => getFlattenedDefinitions(definitions), [definitions]);
    const allDefsAndDrafts = useMemo(() => [...allPublished, ...(Array.isArray(drafts) ? drafts : [])], [allPublished, drafts]);

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
            if (valA === valB) return 0;
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        setUserFilters(prev => ({ ...prev, [key]: value }));
    };

    // -- REPORT CALCULATIONS --

    // 1. User Activity Report (Redesigned as per Story 2.11)
    const userActivityData = useMemo(() => {
        const safeUsers = Array.isArray(users) ? users : [];
        const raw = safeUsers.map(user => {
            const userLogs = filteredLogs.filter(l => l.userName === user.name);
            const userHistory = filteredHistory.filter(h => h.userName === user.name);
            const lastActivityLog = userLogs.sort((a, b) => parseISO(b.occurredDate).getTime() - parseISO(a.occurredDate).getTime())[0];

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

        // Apply header filters
        const filtered = raw.filter(u => {
            return Object.entries(userFilters).every(([key, value]) => {
                if (!value) return true;
                const fieldVal = String(u[key as keyof typeof u]).toLowerCase();
                return fieldVal.includes(value.toLowerCase());
            });
        });

        return sortData(filtered);
    }, [users, filteredLogs, filteredHistory, userFilters, sortConfig]);

    const handleExport = async (formatType: 'xlsx' | 'csv' | 'pdf') => {
        const reportTitle = selectedReport.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_${reportTitle}_${timestamp}`;

        let exportData: any[] = userActivityData;

        if (formatType === 'xlsx' || formatType === 'csv') {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report Data");
            XLSX.writeFile(wb, `${filename}.${formatType === 'xlsx' ? 'xlsx' : 'csv'}`);
        } else {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF('l'); // Landscape for many columns
            doc.setFontSize(18);
            doc.text(`MedPoint Wiki: ${reportTitle}`, 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()} | Filter: ${dateRange?.from ? format(dateRange.from, 'PP') : 'All'} - ${dateRange?.to ? format(dateRange.to, 'PP') : 'Now'}`, 14, 28);
            
            let y = 40;
            const headers = ['Name', 'Logins', 'Last Activity', 'Creations', 'Edits', 'Approvals', 'Templates', 'Status'];
            const keys: (keyof typeof userActivityData[0])[] = ['name', 'logins', 'lastActivity', 'creations', 'edits', 'approvals', 'templates', 'status'];
            
            doc.setFont('helvetica', 'bold');
            headers.forEach((h, i) => doc.text(h, 14 + (i * 35), y));
            y += 5;
            doc.line(14, y, 280, y);
            y += 8;

            doc.setFont('helvetica', 'normal');
            exportData.slice(0, 50).forEach(row => {
                keys.forEach((k, i) => doc.text(String(row[k] || ''), 14 + (i * 35), y));
                y += 7;
                if (y > 190) { doc.addPage(); y = 20; }
            });

            doc.save(`${filename}.pdf`);
        }
        toast({ title: "Export Complete", description: `File saved as ${filename}.${formatType}` });
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
                    <div className="flex-1 flex items-center gap-4">
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
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Date Observation Range</Label>
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
                            onClick={() => {
                                setUserFilters({});
                                setDateRange({ from: subMonths(new Date(), 3), to: new Date() });
                                setSortConfig({ key: 'name', direction: 'asc' });
                            }}
                        >
                            <FilterX className="h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1600px] mx-auto pb-32">
                    {selectedReport === 'user-activity' && (
                        <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <SortableHead 
                                            label="User" 
                                            sortKey="name" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort} 
                                            className="pl-6 w-[200px]"
                                            filterValue={userFilters.name}
                                            onFilterChange={(v) => handleFilterChange('name', v)}
                                        />
                                        <SortableHead 
                                            label="Last Login" 
                                            sortKey="lastLogin" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort}
                                            className="w-[160px]"
                                        />
                                        <SortableHead 
                                            label="Logins" 
                                            sortKey="logins" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort} 
                                            className="w-[100px]"
                                        />
                                        <SortableHead 
                                            label="Last Activity" 
                                            sortKey="lastActivity" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort}
                                            className="w-[160px]"
                                        />
                                        <SortableHead 
                                            label="Created" 
                                            sortKey="creations" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort}
                                            className="w-[100px]"
                                        />
                                        <SortableHead 
                                            label="Edited" 
                                            sortKey="edits" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort}
                                            className="w-[100px]"
                                        />
                                        <SortableHead 
                                            label="Approvals" 
                                            sortKey="approvals" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort}
                                            className="w-[100px]"
                                        />
                                        <SortableHead 
                                            label="Templates" 
                                            sortKey="templates" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort}
                                            className="w-[100px]"
                                        />
                                        <SortableHead 
                                            label="Status" 
                                            sortKey="status" 
                                            currentSort={sortConfig} 
                                            onSort={handleSort}
                                            className="pr-6 w-[120px]"
                                            filterValue={userFilters.status}
                                            onFilterChange={(v) => handleFilterChange('status', v)}
                                            isSelectFilter
                                        />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userActivityData.map(u => (
                                        <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-100 h-16">
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{u.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{u.role}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-medium text-xs tabular-nums">{u.lastLogin}</TableCell>
                                            <TableCell className="font-black text-slate-700">{u.logins}</TableCell>
                                            <TableCell className="text-slate-500 font-medium text-xs tabular-nums">{u.lastActivity}</TableCell>
                                            <TableCell className="font-bold text-emerald-600">{u.creations}</TableCell>
                                            <TableCell className="font-bold text-indigo-600">{u.edits}</TableCell>
                                            <TableCell className="font-bold text-amber-600">{u.approvals}</TableCell>
                                            <TableCell className="font-bold text-slate-600">{u.templates}</TableCell>
                                            <TableCell className="pr-6">
                                                <Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="font-bold text-[9px] uppercase px-2 h-5">
                                                    {u.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {userActivityData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <BarChart3 className="h-10 w-10 text-slate-200" />
                                                    <p className="text-slate-400 font-bold">No activity records found matching these criteria.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {selectedReport !== 'user-activity' && (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                             <BarChart3 className="h-16 w-16 text-slate-100 mb-4" />
                             <h3 className="text-lg font-bold text-slate-900">Module Under Refinement</h3>
                             <p className="text-sm text-slate-400 max-w-xs text-center mt-2">The selected specialized report is being synchronized with the new global audit schema.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

interface SortableHeadProps {
    label: string;
    sortKey: string;
    currentSort: SortConfig;
    onSort: (k: string) => void;
    className?: string;
    filterValue?: string;
    onFilterChange?: (v: string) => void;
    isSelectFilter?: boolean;
}

function SortableHead({ label, sortKey, currentSort, onSort, className, filterValue, onFilterChange, isSelectFilter }: SortableHeadProps) {
    const isActive = currentSort?.key === sortKey;
    
    return (
        <TableHead className={cn("py-4 align-top", className)}>
            <div className="space-y-3">
                <button 
                    className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors group"
                    onClick={() => onSort(sortKey)}
                >
                    {label}
                    <ArrowUpDown className={cn("ml-1.5 h-3 w-3 transition-opacity", isActive ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-40")} />
                </button>
                
                {onFilterChange && (
                    <div className="relative">
                        {isSelectFilter ? (
                            <Select value={filterValue || 'all'} onValueChange={(v) => onFilterChange(v === 'all' ? '' : v)}>
                                <SelectTrigger className="h-7 rounded-lg text-[9px] font-bold border-slate-200 bg-white px-2">
                                    <SelectValue placeholder="Filter..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-[10px]">All</SelectItem>
                                    <SelectItem value="Active" className="text-[10px]">Active</SelectItem>
                                    <SelectItem value="Inactive" className="text-[10px]">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-2 top-2 h-3 w-3 text-slate-300" />
                                <Input 
                                    className="h-7 pl-6 rounded-lg text-[9px] font-bold border-slate-200 bg-white placeholder:text-slate-300" 
                                    placeholder={`Filter...`}
                                    value={filterValue || ''}
                                    onChange={(e) => onFilterChange(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </TableHead>
    );
}
