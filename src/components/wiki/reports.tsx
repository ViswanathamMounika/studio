
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
    Play,
    Library,
    ClipboardCheck,
    LayoutTemplate,
    Check,
    ShieldAlert
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO, differenceInDays } from 'date-fns';
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
};

export default function ReportsDashboard({ users, definitions, drafts, activityLogs, approvalHistory, templates, masterData }: ReportsDashboardProps) {
    const [selectedReport, setSelectedReport] = useState<ReportType>('user-activity');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 12),
        to: new Date()
    });

    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
    
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'timestamp', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const { toast } = useToast();

    const handleRunReport = () => {
        setAppliedFilters({
            reportType: selectedReport,
            dateRange
        });
        setCurrentPage(1);
        setColumnFilters({});
        
        const defaultSort: Record<ReportType, SortConfig> = {
            'user-activity': { key: 'timestamp', direction: 'desc' },
            'definition-report': { key: 'name', direction: 'asc' },
            'approval-report': { key: 'submittedDate', direction: 'desc' },
            'template-report': { key: 'name', direction: 'asc' }
        };

        setSortConfig(defaultSort[selectedReport]);
        
        toast({
            title: "Report Generated",
            description: `Data retrieved for ${selectedReport.replace('-', ' ')}.`,
        });
    };

    const flattenDefinitions = (items: Definition[]): Definition[] => {
        let result: Definition[] = [];
        items.forEach(item => {
            if (item.description || item.shortDescription || (item.sectionValues && item.sectionValues.length > 0)) {
                result.push(item);
            }
            if (item.children) {
                result = result.concat(flattenDefinitions(item.children));
            }
        });
        return result;
    };

    const processedReportData = useMemo(() => {
        if (!appliedFilters) return [];

        if (appliedFilters.reportType === 'user-activity') {
            const filteredLogs = activityLogs.filter(log => {
                if (!log || !log.occurredDate || !appliedFilters.dateRange?.from) return true;
                try {
                    const logDate = parseISO(log.occurredDate);
                    return isWithinInterval(logDate, { 
                        start: startOfDay(appliedFilters.dateRange.from), 
                        end: endOfDay(appliedFilters.dateRange.to || appliedFilters.dateRange.from) 
                    });
                } catch (e) { return false; }
            });

            return filteredLogs.map(log => {
                const user = users.find(u => u.name === log.userName);
                return {
                    id: log.id,
                    userName: log.userName,
                    role: user?.role || 'N/A',
                    permissions: log.activityType,
                    timestamp: log.occurredDate,
                };
            });
        }

        if (appliedFilters.reportType === 'definition-report') {
            const allItems = [...flattenDefinitions(definitions), ...drafts];
            const reportRows: any[] = [];

            allItems.forEach(def => {
                const template = templates.find(t => t.id === def.templateId);
                const owner = users.find(u => u.id === def.authorId)?.name || 'System';
                const totalRevisions = def.revisions?.length || 0;

                def.revisions.forEach((rev, revIdx) => {
                    const versionNo = totalRevisions - revIdx;
                    reportRows.push({
                        id: `${def.id}_v${versionNo}`,
                        name: def.name,
                        versionNo: versionNo,
                        module: def.module,
                        templateUsed: template?.name || 'Standard',
                        description: (rev.snapshot.shortDescription || rev.snapshot.description || '').replace(/<[^>]+>/g, '').substring(0, 100) + '...',
                        createdBy: def.revisions[totalRevisions - 1]?.developer || 'System',
                        lastModifiedBy: rev.developer,
                        currentOwner: owner,
                        currentStatus: def.isArchived ? 'Archived' : (versionNo === totalRevisions ? 'Published' : 'Published (Historical)'),
                        createdDate: def.revisions[totalRevisions - 1]?.date || '—',
                        lastModifiedDate: rev.date,
                        submittedDate: '—',
                        decisionDate: rev.date,
                        publishedDate: rev.date,
                        archivedDate: def.isArchived ? 'Archive Active' : '—',
                        approverName: rev.developer === 'System Admin' ? 'System' : rev.developer,
                        approvalComments: rev.description,
                        currentVersion: rev.ticketId,
                        totalRevisions: totalRevisions,
                        isDuplicate: def.name.includes('(Copy)') ? 'Yes' : 'No',
                        attachmentCount: def.attachments?.length || 0
                    });
                });

                if (def.isDraft || def.isPendingApproval) {
                    reportRows.push({
                        id: `${def.id}_working`,
                        name: def.name,
                        versionNo: totalRevisions + 1,
                        module: def.module,
                        templateUsed: template?.name || 'Standard',
                        description: (def.shortDescription || def.description || '').replace(/<[^>]+>/g, '').substring(0, 100) + '...',
                        createdBy: def.revisions[totalRevisions - 1]?.developer || 'System',
                        lastModifiedBy: def.submittedBy || 'Author',
                        currentOwner: owner,
                        currentStatus: def.isPendingApproval ? 'Pending Approval' : 'Draft',
                        createdDate: def.revisions[totalRevisions - 1]?.date || '—',
                        lastModifiedDate: def.submittedAt || '—',
                        submittedDate: def.submittedAt || '—',
                        decisionDate: '—',
                        publishedDate: '—',
                        archivedDate: '—',
                        approverName: '—',
                        approvalComments: 'Awaiting Action',
                        currentVersion: 'v.Next (Draft)',
                        totalRevisions: totalRevisions,
                        isDuplicate: def.name.includes('(Copy)') ? 'Yes' : 'No',
                        attachmentCount: def.attachments?.length || 0
                    });
                }
            });

            return reportRows;
        }

        if (appliedFilters.reportType === 'approval-report') {
            const allItems = [...flattenDefinitions(definitions), ...drafts];
            const history = Array.isArray(approvalHistory) ? approvalHistory : [];
            
            const decisions = history.filter(h => h.action !== 'Submitted').map(h => {
                const def = allItems.find(d => d.id === h.definitionId || d.originalId === h.definitionId);
                const submission = history.filter(s => s.action === 'Submitted' && s.definitionId === h.definitionId && parseISO(s.date) < parseISO(h.date))
                                          .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
                
                const prevActions = history.filter(p => p.definitionId === h.definitionId && parseISO(p.date) < parseISO(h.date));
                const resubmissionCount = prevActions.filter(p => p.action === 'Submitted').length;
                const lastSubmission = prevActions.filter(p => p.action === 'Submitted').sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
                const prevDecision = lastSubmission ? prevActions.filter(p => p.action !== 'Submitted' && parseISO(p.date) < parseISO(lastSubmission.date)).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0] : null;

                return {
                    id: h.id,
                    approverName: h.userName,
                    definitionName: h.definitionName,
                    module: def?.module || '—',
                    version: def?.revisions?.[0]?.ticketId || 'v1.0',
                    action: h.action,
                    submittedBy: submission?.userName || 'Author',
                    submittedDate: submission?.date || '—',
                    decisionDate: h.date,
                    comments: h.comment || '—',
                    resubmissionCount: resubmissionCount > 1 ? resubmissionCount - 1 : 0,
                    previousDecision: prevDecision?.action || 'Initial'
                };
            });

            const pendingRows = drafts.filter(d => d.isPendingApproval).map(d => {
                const submission = history.filter(s => s.action === 'Submitted' && s.definitionId === d.id)
                                          .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
                
                const prevActions = history.filter(p => p.definitionId === d.id);
                const resubCount = prevActions.filter(p => p.action === 'Submitted').length;
                const prevDec = prevActions.filter(p => p.action !== 'Submitted').sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];

                return {
                    id: `pending_${d.id}`,
                    approverName: 'Unassigned',
                    definitionName: d.name,
                    module: d.module,
                    version: d.revisions?.[0]?.ticketId || 'v1.0 (Draft)',
                    action: 'Pending',
                    submittedBy: d.submittedBy || 'Author',
                    submittedDate: d.submittedAt || submission?.date || '—',
                    decisionDate: '—',
                    comments: 'Awaiting Review',
                    resubmissionCount: resubCount > 1 ? resubCount - 1 : 0,
                    previousDecision: prevDec?.action || 'Initial'
                };
            });

            return [...decisions, ...pendingRows];
        }

        if (appliedFilters.reportType === 'template-report') {
            const allItems = [...flattenDefinitions(definitions), ...drafts];
            
            return templates.map(template => {
                const creationLog = activityLogs.find(l => l.activityType === 'Template Created' && (l.details?.includes(template.name) || l.definitionName === template.name));
                const modLogs = activityLogs.filter(l => l.activityType === 'Template Updated' && (l.details?.includes(template.name) || l.definitionName === template.name))
                                            .sort((a,b) => parseISO(b.occurredDate).getTime() - parseISO(a.occurredDate).getTime());
                
                const usage = allItems.filter(d => d.templateId === template.id);
                const lastUsageLog = activityLogs.filter(l => (l.activityType === 'Definition Created' || l.activityType === 'Definition Updated') && 
                                                            usage.some(u => u.name === l.definitionName))
                                                 .sort((a,b) => parseISO(b.occurredDate).getTime() - parseISO(a.occurredDate).getTime())[0];

                const statusLogs = activityLogs.filter(l => l.activityType === 'Template Updated' && (l.details?.includes(template.name) || l.definitionName === template.name) && l.details?.includes('Status'))
                                              .map(l => `${format(parseISO(l.occurredDate), 'MM/dd')}: ${l.details}`)
                                              .join('; ');

                return {
                    id: template.id,
                    name: template.name,
                    module: template.module,
                    status: template.isActive ? 'Active' : 'Inactive',
                    createdBy: creationLog?.userName || 'System',
                    createdDate: creationLog?.occurredDate || '—',
                    lastModifiedBy: modLogs[0]?.userName || creationLog?.userName || '—',
                    lastModifiedDate: modLogs[0]?.occurredDate || creationLog?.occurredDate || '—',
                    usageCount: usage.length,
                    lastUsedDate: lastUsageLog?.occurredDate || '—',
                    definitionsList: usage.map(u => u.name).slice(0, 3).join(', ') + (usage.length > 3 ? '...' : ''),
                    statusHistory: statusLogs || 'No changes recorded',
                    description: template.description || '—'
                };
            });
        }

        return [];
    }, [appliedFilters, activityLogs, approvalHistory, definitions, drafts, users, templates]);

    const filteredAndSortedData = useMemo(() => {
        let result = [...processedReportData];
        Object.entries(columnFilters).forEach(([key, value]) => {
            if (!value || value === 'ALL_RECORDS') return;
            const lowerValue = value.toLowerCase();
            result = result.filter(item => {
                const itemVal = String((item as any)[key] || '').toLowerCase();
                return itemVal === lowerValue || itemVal.includes(lowerValue);
            });
        });
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = (a as any)[sortConfig.key];
                const bVal = (b as any)[sortConfig.key];
                if (valA === bVal) return 0;
                if (typeof valA === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? valA - bVal : bVal - valA;
                return sortConfig.direction === 'asc' ? String(valA).localeCompare(String(bVal)) : String(bVal).localeCompare(String(valA));
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
        setSortConfig(null);
        setCurrentPage(1);
        setAppliedFilters(null);
    };

    const handleExport = async (formatType: 'xlsx' | 'csv') => {
        if (!appliedFilters) return;
        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_${appliedFilters.reportType}_${timestamp}`;
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const exportData = filteredAndSortedData.map(d => ({ ...d }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Report Data");
        XLSX.writeFile(wb, `${filename}.${formatType === 'xlsx' ? 'xlsx' : 'csv'}`);
    };

    const getUniqueValues = (key: string) => {
        const values = Array.from(new Set(processedReportData.map((d: any) => d[key]))).filter(v => v !== null && v !== undefined && v !== '—' && v !== '');
        return values.sort((a: any, b: any) => String(a).localeCompare(String(b))) as string[];
    };

    return (
        <div className="space-y-4 h-full flex flex-col bg-slate-50/30">
            <div className="bg-white p-6 border-b sticky top-0 z-30 shadow-sm space-y-4 shrink-0">
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

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[240px] max-w-sm space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Report Selection</Label>
                        <Select value={selectedReport} onValueChange={(v) => setSelectedReport(v as ReportType)}>
                            <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white font-bold">
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

                    <div className="flex-1 min-w-[220px] max-w-xs space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Observation Period</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full h-9 px-4 font-bold text-xs gap-2 rounded-xl border-slate-200 justify-start bg-white">
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

                    <div className="pt-4 flex gap-2">
                        <Button 
                            className="h-9 rounded-xl font-bold gap-2 px-8 bg-primary hover:bg-primary/90 text-white shadow-md shadow-indigo-100 transition-all active:scale-95" 
                            onClick={handleRunReport}
                        >
                            <Play className="h-4 w-4 fill-current" />
                            Run Report
                        </Button>
                        <Button variant="ghost" className="h-9 rounded-xl font-bold gap-2 text-slate-400 hover:bg-slate-50" onClick={clearAllFilters}>
                            <FilterX className="h-4 w-4" /> 
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="px-8 py-2 h-full max-w-[1600px] mx-auto flex flex-col">
                    {!appliedFilters ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                                <Settings2 className="h-10 w-10 text-slate-300" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">Report Configuration Required</h3>
                                <p className="text-sm text-slate-500 max-sm font-medium">Select a report and period above to load analytical data.</p>
                            </div>
                        </div>
                    ) : (
                      <div className="flex-1 flex flex-col space-y-2 overflow-hidden animate-in fade-in duration-500">
                        <div className="flex items-center gap-2 px-2 shrink-0 h-8">
                            {appliedFilters.reportType === 'user-activity' ? <Users className="h-4 w-4 text-primary" /> : 
                             appliedFilters.reportType === 'definition-report' ? <Library className="h-4 w-4 text-primary" /> :
                             appliedFilters.reportType === 'approval-report' ? <ClipboardCheck className="h-4 w-4 text-primary" /> :
                             <LayoutTemplate className="h-4 w-4 text-primary" />}
                            <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">
                                {appliedFilters.reportType === 'user-activity' ? 'User Activity Audit Ledger' :
                                 appliedFilters.reportType === 'definition-report' ? 'Definition Report' :
                                 appliedFilters.reportType === 'approval-report' ? 'Approval Report' :
                                 'Template Report'}
                            </h3>
                            <Badge variant="outline" className="h-6 rounded-full px-3 text-[10px] font-black uppercase bg-slate-50 text-slate-400 border-slate-200 ml-auto">
                                {filteredAndSortedData.length} Records Found
                            </Badge>
                        </div>

                        <Card className="flex-1 rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white flex flex-col min-h-0">
                            <ScrollArea className="flex-1 w-full h-full">
                                {appliedFilters.reportType === 'user-activity' ? (
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b sticky top-0 z-20">
                                            <TableRow>
                                                <ReportHeader label="User Name" id="userName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.userName} onFilterChange={handleFilterChange} className="pl-6" options={getUniqueValues('userName')} />
                                                <ReportHeader label="Role" id="role" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.role} onFilterChange={handleFilterChange} options={getUniqueValues('role')} />
                                                <ReportHeader label="Permissions" id="permissions" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.permissions} onFilterChange={handleFilterChange} options={getUniqueValues('permissions')} />
                                                <ReportHeader label="Timestamp" id="timestamp" currentSort={sortConfig} onSort={handleSort} className="pr-6" filterType="none" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.map((d: any) => (
                                                <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 h-16">
                                                    <TableCell className="pl-6 font-bold text-slate-900">{d.userName}</TableCell>
                                                    <TableCell><Badge variant="outline" className="font-bold text-[10px] uppercase border-slate-200">{d.role}</Badge></TableCell>
                                                    <TableCell><Badge className="bg-indigo-50 text-indigo-700 font-bold border-indigo-100">{d.permissions}</Badge></TableCell>
                                                    <TableCell className="pr-6 font-mono text-xs text-slate-500">{format(parseISO(d.timestamp), 'yyyy-MM-dd HH:mm')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : appliedFilters.reportType === 'definition-report' ? (
                                    <Table className="min-w-[3500px]">
                                        <TableHeader className="bg-slate-50 border-b sticky top-0 z-20">
                                            <TableRow>
                                                <ReportHeader label="Name" id="name" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.name} onFilterChange={handleFilterChange} className="pl-6 w-[220px]" options={getUniqueValues('name')} />
                                                <ReportHeader label="Version No" id="versionNo" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.versionNo} onFilterChange={handleFilterChange} className="w-[120px]" options={getUniqueValues('versionNo')} />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('module')} />
                                                <ReportHeader label="Template Used" id="templateUsed" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.templateUsed} onFilterChange={handleFilterChange} className="w-[200px]" options={getUniqueValues('templateUsed')} />
                                                <ReportHeader label="Description" id="description" currentSort={sortConfig} onSort={handleSort} className="w-[250px]" filterType="none" />
                                                <ReportHeader label="Created By" id="createdBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.createdBy} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('createdBy')} />
                                                <ReportHeader label="Last Modified By" id="lastModifiedBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastModifiedBy} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('lastModifiedBy')} />
                                                <ReportHeader label="Current Owner" id="currentOwner" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.currentOwner} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('currentOwner')} />
                                                <ReportHeader label="Current Status" id="currentStatus" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.currentStatus} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('currentStatus')} />
                                                <ReportHeader label="Created Date" id="createdDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Last Modified Date" id="lastModifiedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Submitted Date" id="submittedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Approved/Rejected Date" id="decisionDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Published Date" id="publishedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Archived Date" id="archivedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Approver Name" id="approverName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approverName} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('approverName')} />
                                                <ReportHeader label="Approval Comments" id="approvalComments" currentSort={sortConfig} onSort={handleSort} className="w-[250px]" filterType="none" />
                                                <ReportHeader label="Version ID" id="currentVersion" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.currentVersion} onFilterChange={handleFilterChange} className="w-[160px]" options={getUniqueValues('currentVersion')} />
                                                <ReportHeader label="Total Revisions" id="totalRevisions" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.totalRevisions} onFilterChange={handleFilterChange} className="w-[150px]" options={getUniqueValues('totalRevisions')} />
                                                <ReportHeader label="Is Duplicate" id="isDuplicate" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.isDuplicate} onFilterChange={handleFilterChange} className="w-[140px]" options={getUniqueValues('isDuplicate')} />
                                                <ReportHeader label="Attachments" id="attachmentCount" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.attachmentCount} onFilterChange={handleFilterChange} className="pr-6 w-[150px]" options={getUniqueValues('attachmentCount')} />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.map((d: any) => (
                                                <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 h-16">
                                                    <TableCell className="pl-6 font-bold text-primary">{d.name}</TableCell>
                                                    <TableCell className="text-center font-black text-indigo-600 bg-indigo-50/30">{d.versionNo}</TableCell>
                                                    <TableCell className="font-bold text-slate-700">{d.module}</TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-500">{d.templateUsed}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs italic truncate max-w-[220px]">{d.description}</TableCell>
                                                    <TableCell className="font-bold text-slate-800">{d.createdBy}</TableCell>
                                                    <TableCell className="font-bold text-slate-800">{d.lastModifiedBy}</TableCell>
                                                    <TableCell className="font-bold text-slate-800">{d.currentOwner}</TableCell>
                                                    <TableCell>
                                                        <Badge className={cn("text-[10px] font-bold uppercase", 
                                                            d.currentStatus === 'Published' ? "bg-emerald-50 text-emerald-700" :
                                                            d.currentStatus.includes('Historical') ? "bg-slate-50 text-slate-400 border-slate-100" :
                                                            d.currentStatus === 'Archived' ? "bg-slate-50 text-slate-400" :
                                                            "bg-amber-50 text-amber-700"
                                                        )}>
                                                            {d.currentStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.createdDate !== '—' ? format(parseISO(d.createdDate), 'yyyy-MM-dd') : '—'}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.lastModifiedDate !== '—' ? (d.lastModifiedDate.includes('—') ? '—' : format(parseISO(d.lastModifiedDate), 'yyyy-MM-dd')) : '—'}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.submittedDate !== '—' ? (d.submittedDate.includes('—') ? '—' : format(parseISO(d.submittedDate), 'yyyy-MM-dd')) : '—'}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.decisionDate !== '—' ? (d.decisionDate.includes('—') ? '—' : format(parseISO(d.decisionDate), 'yyyy-MM-dd')) : '—'}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.publishedDate !== '—' ? (d.publishedDate.includes('—') ? '—' : format(parseISO(d.publishedDate), 'yyyy-MM-dd')) : '—'}</TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-300">{d.archivedDate}</TableCell>
                                                    <TableCell className="font-bold text-slate-800">{d.approverName}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs italic truncate max-w-[200px]">{d.approvalComments}</TableCell>
                                                    <TableCell><Badge variant="outline" className="font-bold text-[10px] border-slate-200">{d.currentVersion}</Badge></TableCell>
                                                    <TableCell className="font-bold text-center">{d.totalRevisions}</TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-400">{d.isDuplicate}</TableCell>
                                                    <TableCell className="pr-6 font-bold text-center">{d.attachmentCount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : appliedFilters.reportType === 'approval-report' ? (
                                    <Table className="min-w-[2400px]">
                                        <TableHeader className="bg-slate-50 border-b sticky top-0 z-20">
                                            <TableRow>
                                                <ReportHeader label="Approver Name" id="approverName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approverName} onFilterChange={handleFilterChange} className="pl-6 w-[200px]" options={getUniqueValues('approverName')} />
                                                <ReportHeader label="Definition Name" id="definitionName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.definitionName} onFilterChange={handleFilterChange} className="w-[220px]" options={getUniqueValues('definitionName')} />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('module')} />
                                                <ReportHeader label="Version" id="version" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.version} onFilterChange={handleFilterChange} className="w-[160px]" options={getUniqueValues('version')} />
                                                <ReportHeader label="Action" id="action" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.action} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('action')} />
                                                <ReportHeader label="Submitted By" id="submittedBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.submittedBy} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('submittedBy')} />
                                                <ReportHeader label="Submitted Date" id="submittedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Decision Date" id="decisionDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Comments" id="comments" currentSort={sortConfig} onSort={handleSort} className="w-[300px]" filterType="none" />
                                                <ReportHeader label="Resubs" id="resubmissionCount" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.resubmissionCount} onFilterChange={handleFilterChange} className="w-[120px]" options={getUniqueValues('resubmissionCount')} />
                                                <ReportHeader label="Prev Decision" id="previousDecision" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.previousDecision} onFilterChange={handleFilterChange} className="pr-6 w-[180px]" options={getUniqueValues('previousDecision')} />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.map((d: any) => (
                                                <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 h-16">
                                                    <TableCell className="pl-6 font-bold text-slate-800">{d.approverName}</TableCell>
                                                    <TableCell className="font-bold text-primary">{d.definitionName}</TableCell>
                                                    <TableCell className="font-medium text-slate-600">{d.module}</TableCell>
                                                    <TableCell><Badge variant="outline" className="text-[10px] font-bold border-slate-200">{d.version}</Badge></TableCell>
                                                    <TableCell>
                                                        <Badge className={cn("text-[10px] font-bold uppercase", 
                                                            d.action === 'Approved' ? "bg-emerald-50 text-emerald-700" :
                                                            d.action === 'Rejected' ? "bg-red-50 text-red-700" :
                                                            d.action === 'Changes Requested' ? "bg-amber-50 text-amber-700" :
                                                            "bg-blue-50 text-blue-700"
                                                        )}>
                                                            {d.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-700">{d.submittedBy}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.submittedDate !== '—' ? format(parseISO(d.submittedDate), 'yyyy-MM-dd') : '—'}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.decisionDate !== '—' ? format(parseISO(d.decisionDate), 'yyyy-MM-dd') : '—'}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs italic truncate max-w-[280px]">{d.comments}</TableCell>
                                                    <TableCell className="font-bold text-center">{d.resubmissionCount}</TableCell>
                                                    <TableCell className="pr-6 italic text-slate-400 text-xs">{d.previousDecision}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <Table className="min-w-[2600px]">
                                        <TableHeader className="bg-slate-50 border-b sticky top-0 z-20">
                                            <TableRow>
                                                <ReportHeader label="Template Name" id="name" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.name} onFilterChange={handleFilterChange} className="pl-6 w-[240px]" options={getUniqueValues('name')} />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('module')} />
                                                <ReportHeader label="Status" id="status" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.status} onFilterChange={handleFilterChange} className="w-[160px]" options={getUniqueValues('status')} />
                                                <ReportHeader label="Created By" id="createdBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.createdBy} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('createdBy')} />
                                                <ReportHeader label="Created Date" id="createdDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Last Modified By" id="lastModifiedBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastModifiedBy} onFilterChange={handleFilterChange} className="w-[180px]" options={getUniqueValues('lastModifiedBy')} />
                                                <ReportHeader label="Last Modified Date" id="lastModifiedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Usage Count" id="usageCount" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.usageCount} onFilterChange={handleFilterChange} className="w-[150px]" options={getUniqueValues('usageCount')} />
                                                <ReportHeader label="Last Used Date" id="lastUsedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Definitions Using Template" id="definitionsList" currentSort={sortConfig} onSort={handleSort} className="w-[280px]" filterType="none" />
                                                <ReportHeader label="Status Change History" id="statusHistory" currentSort={sortConfig} onSort={handleSort} className="w-[250px]" filterType="none" />
                                                <ReportHeader label="Description" id="description" currentSort={sortConfig} onSort={handleSort} className="pr-6 w-[300px]" filterType="none" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.map((d: any) => (
                                                <TableRow key={d.id} className="hover:bg-slate-50/50 border-slate-100 h-20">
                                                    <TableCell className="pl-6 font-bold text-primary">{d.name}</TableCell>
                                                    <TableCell className="font-bold text-slate-700">{d.module}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={d.status === 'Active' ? 'success' : 'secondary'} className="font-black text-[9px] uppercase tracking-wider">
                                                            {d.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-800">{d.createdBy}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.createdDate !== '—' ? format(parseISO(d.createdDate), 'yyyy-MM-dd HH:mm') : '—'}</TableCell>
                                                    <TableCell className="font-bold text-slate-800">{d.lastModifiedBy}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.lastModifiedDate !== '—' ? format(parseISO(d.lastModifiedDate), 'yyyy-MM-dd HH:mm') : '—'}</TableCell>
                                                    <TableCell className="font-black text-center text-indigo-600">{d.usageCount}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.lastUsedDate !== '—' ? format(parseISO(d.lastUsedDate), 'yyyy-MM-dd') : '—'}</TableCell>
                                                    <TableCell className="text-xs font-medium text-slate-600 truncate max-w-[260px]">{d.definitionsList || 'None'}</TableCell>
                                                    <TableCell className="text-xs text-slate-400 italic truncate max-w-[230px]">{d.statusHistory}</TableCell>
                                                    <TableCell className="pr-6 text-slate-500 text-xs leading-relaxed max-w-[280px]">{d.description}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                <ScrollBar orientation="horizontal" />
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </Card>
                        
                        <div className="shrink-0 pt-2 pb-12">
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReportHeader({ 
    label, 
    id, 
    currentSort, 
    onSort, 
    filterValue, 
    onFilterChange, 
    className,
    filterType = 'all',
    options = []
}: any) {
    const isSorted = currentSort?.key === id;
    const hasActiveFilter = filterValue && filterValue !== 'ALL_RECORDS';
    const [localSearch, setLocalSearch] = useState('');

    const filteredOptions = useMemo(() => {
        if (!localSearch.trim()) return options;
        return options.filter((opt: string) => opt.toLowerCase().includes(localSearch.toLowerCase()));
    }, [options, localSearch]);

    return (
        <TableHead className={cn("py-4 bg-slate-50", className)}>
            <div className="flex items-center justify-between gap-1 group/header">
                <button onClick={() => onSort(id)} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors shrink-0">
                    {label}
                    <ArrowUpDown className={cn("ml-1.5 h-3 w-3 transition-opacity", isSorted ? "text-indigo-600 opacity-100" : "opacity-0 group-hover/header:opacity-40")} />
                </button>
                
                {filterType !== 'none' && (
                    <Popover onOpenChange={(open) => !open && setLocalSearch('')}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg transition-all", hasActiveFilter ? "text-indigo-600 bg-indigo-50 shadow-inner" : "text-slate-300 hover:bg-slate-100")}>
                                <Filter className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0 rounded-2xl shadow-2xl border-none overflow-hidden" align="end">
                            <div className="p-4 bg-slate-50 border-b">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Filter {label}</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                                    <Input 
                                        className="h-10 pl-9 rounded-xl border-slate-200 bg-white text-sm font-bold focus-visible:ring-primary/20 shadow-sm" 
                                        placeholder={`Search values...`} 
                                        value={filterValue || ''} 
                                        onChange={(e) => {
                                            onFilterChange(id, e.target.value);
                                            setLocalSearch(e.target.value);
                                        }} 
                                    />
                                </div>
                            </div>
                            
                            {options.length > 0 && (
                                <div className="p-2 bg-white">
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] px-3 mb-2 mt-1">Unique Records</p>
                                    <ScrollArea className="h-[200px]">
                                        <div className="space-y-0.5">
                                            <button 
                                                onClick={() => onFilterChange(id, '')}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                                                    !filterValue ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                                                )}
                                            >
                                                <span>(All Records)</span>
                                                {!filterValue && <Check className="h-3 w-3" />}
                                            </button>
                                            {filteredOptions.map((opt: string) => (
                                                <button 
                                                    key={opt}
                                                    onClick={() => onFilterChange(id, opt)}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between",
                                                        filterValue === opt ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <span className="truncate pr-2">{opt}</span>
                                                    {filterValue === opt && <Check className="h-3 w-3" />}
                                                </button>
                                            ))}
                                            {filteredOptions.length === 0 && (
                                                <p className="p-4 text-center text-[11px] text-slate-400 italic">No matching unique values.</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            {hasActiveFilter && (
                                <div className="p-2 border-t bg-slate-50/50">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="w-full h-8 text-[10px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        onClick={() => {
                                            onFilterChange(id, '');
                                            setLocalSearch('');
                                        }}
                                    >
                                        Clear Applied Filter
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </TableHead>
    );
}

function ReportPagination({ currentPage, totalPages, pageSize, setPageSize, onPageChange, totalItems }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
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
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || totalItems === 0}>Next<ChevronRight className="h-4 w-4 ml-1.5" /></Button>
            </div>
        </div>
    );
}

