
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
    LayoutTemplate
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

    // Helper to flatten definitions
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

                return {
                    id: log.id,
                    userName: log.userName,
                    role: user?.role || 'N/A',
                    actionType: log.activityType,
                    timestamp: log.occurredDate,
                    module: def?.module || 'Core',
                    entityType: log.activityType.includes('Template') ? 'Template' : 'Definition',
                    entityName: log.definitionName,
                    entityId: def?.id || 'SYS-ID',
                    prevStatus: log.activityType === 'Definition Created' ? 'None' : (def?.isDraft ? 'Draft' : 'Published'),
                    newStatus: log.activityType.includes('Published') || log.activityType === 'Approval Decision' ? 'Published' : (log.activityType.includes('Archived') ? 'Archived' : 'Draft'),
                    version: def?.revisions?.[0]?.ticketId || 'v1.0',
                    comments: log.details || '—',
                    approverName: history?.action !== 'Submitted' ? history?.userName || '—' : '—',
                    templateUsed: template?.name || 'Standard Definition',
                    templateStatusChange: log.activityType.includes('Template') ? 'Status Updated' : '—',
                    relatedId: (def?.relatedDefinitions && def.relatedDefinitions.length > 0) ? def.relatedDefinitions[0] : '—',
                    attachment: (def?.attachments && def.attachments.length > 0) ? def.attachments[0].name : '—'
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
                        turnaroundTime: '—',
                        currentVersion: rev.ticketId,
                        totalRevisions: totalRevisions,
                        isDuplicate: def.name.includes('(Copy)') ? 'Yes' : 'No',
                        duplicatedFrom: def.originalId || '—',
                        linkedRecordsCount: def.relatedDefinitions?.length || 0,
                        attachmentCount: def.attachments?.length || 0,
                        isActiveFlag: (versionNo === totalRevisions && !def.isArchived && !def.isDraft && !def.isPendingApproval) ? 'Active' : 'Inactive'
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
                        turnaroundTime: '—',
                        currentVersion: 'v.Next (Draft)',
                        totalRevisions: totalRevisions,
                        isDuplicate: def.name.includes('(Copy)') ? 'Yes' : 'No',
                        duplicatedFrom: def.originalId || '—',
                        linkedRecordsCount: def.relatedDefinitions?.length || 0,
                        attachmentCount: def.attachments?.length || 0,
                        isActiveFlag: 'Inactive'
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

                const tTime = submission ? differenceInDays(parseISO(h.date), parseISO(submission.date)) : 0;

                return {
                    id: h.id,
                    approverName: h.userName,
                    definitionName: h.definitionName,
                    module: def?.module || '—',
                    version: def?.revisions?.[0]?.ticketId || 'v1.0',
                    action: h.action,
                    status: 'Resolved',
                    submittedBy: submission?.userName || 'Author',
                    submittedDate: submission?.date || '—',
                    decisionDate: h.date,
                    turnaroundTime: `${tTime} days`,
                    daysPending: '—',
                    comments: h.comment || '—',
                    resubmissionCount: resubmissionCount > 1 ? resubmissionCount - 1 : 0,
                    previousDecision: prevDecision?.action || 'Initial'
                };
            });

            const pendingRows = drafts.filter(d => d.isPendingApproval).map(d => {
                const submission = history.filter(s => s.action === 'Submitted' && s.definitionId === d.id)
                                          .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
                const daysPend = submission ? differenceInDays(new Date(), parseISO(submission.date)) : 0;
                
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
                    status: 'Pending',
                    submittedBy: d.submittedBy || 'Author',
                    submittedDate: d.submittedAt || submission?.date || '—',
                    decisionDate: '—',
                    turnaroundTime: '—',
                    daysPending: `${daysPend} days`,
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
            result = result.filter(item => String((item as any)[key] || '').toLowerCase() === lowerValue || String((item as any)[key] || '').toLowerCase().includes(lowerValue));
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
        return values.sort((a: any, b: any) => String(a).localeCompare(String(b)));
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

            <ScrollArea className="flex-1 overflow-x-hidden">
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
                                                <ReportHeader label="User Name" id="userName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.userName} onFilterChange={handleFilterChange} className="pl-6 w-[200px]" filterType="dropdown" options={getUniqueValues('userName')} />
                                                <ReportHeader label="Role" id="role" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.role} onFilterChange={handleFilterChange} className="w-[150px]" filterType="dropdown" options={getUniqueValues('role')} />
                                                <ReportHeader label="Action Type" id="actionType" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.actionType} onFilterChange={handleFilterChange} className="w-[180px]" filterType="dropdown" options={getUniqueValues('actionType')} />
                                                <ReportHeader label="Timestamp" id="timestamp" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[150px]" filterType="dropdown" options={getUniqueValues('module')} />
                                                <ReportHeader label="Entity Type" id="entityType" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.entityType} onFilterChange={handleFilterChange} className="w-[140px]" filterType="dropdown" options={getUniqueValues('entityType')} />
                                                <ReportHeader label="Entity Name" id="entityName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.entityName} onFilterChange={handleFilterChange} className="w-[200px]" />
                                                <ReportHeader label="Entity ID" id="entityId" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.entityId} onFilterChange={handleFilterChange} className="w-[120px]" />
                                                <ReportHeader label="Prev Status" id="prevStatus" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.prevStatus} onFilterChange={handleFilterChange} className="w-[140px]" filterType="dropdown" options={getUniqueValues('prevStatus')} />
                                                <ReportHeader label="New Status" id="newStatus" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.newStatus} onFilterChange={handleFilterChange} className="w-[140px]" filterType="dropdown" options={getUniqueValues('newStatus')} />
                                                <ReportHeader label="Version" id="version" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.version} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="Comments" id="comments" currentSort={sortConfig} onSort={handleSort} className="w-[250px]" filterType="none" />
                                                <ReportHeader label="Approver" id="approverName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approverName} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('approverName')} />
                                                <ReportHeader label="Template Used" id="templateUsed" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.templateUsed} onFilterChange={handleFilterChange} className="w-[180px]" filterType="dropdown" options={getUniqueValues('templateUsed')} />
                                                <ReportHeader label="Template Status" id="templateStatusChange" currentSort={sortConfig} onSort={handleSort} className="w-[160px]" filterType="none" />
                                                <ReportHeader label="Related ID" id="relatedId" currentSort={sortConfig} onSort={handleSort} className="w-[120px]" filterType="none" />
                                                <ReportHeader label="Attachment" id="attachment" currentSort={sortConfig} onSort={handleSort} className="pr-6 w-[180px]" filterType="none" />
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
                    ) : appliedFilters.reportType === 'definition-report' ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 px-2">
                                <Library className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Definition Report</h3>
                            </div>
                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                <ScrollArea className="w-full">
                                    <Table className="min-w-[4200px]">
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow>
                                                <ReportHeader label="Name" id="name" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.name} onFilterChange={handleFilterChange} className="pl-6 w-[200px]" />
                                                <ReportHeader label="Version No" id="versionNo" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.versionNo} onFilterChange={handleFilterChange} className="w-[100px]" filterType="dropdown" options={getUniqueValues('versionNo')} />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[150px]" filterType="dropdown" options={getUniqueValues('module')} />
                                                <ReportHeader label="Template Used" id="templateUsed" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.templateUsed} onFilterChange={handleFilterChange} className="w-[180px]" filterType="dropdown" options={getUniqueValues('templateUsed')} />
                                                <ReportHeader label="Description" id="description" currentSort={sortConfig} onSort={handleSort} className="w-[250px]" filterType="none" />
                                                <ReportHeader label="Created By" id="createdBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.createdBy} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('createdBy')} />
                                                <ReportHeader label="Last Modified By" id="lastModifiedBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastModifiedBy} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('lastModifiedBy')} />
                                                <ReportHeader label="Current Owner" id="currentOwner" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.currentOwner} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('currentOwner')} />
                                                <ReportHeader label="Current Status" id="currentStatus" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.currentStatus} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('currentStatus')} />
                                                <ReportHeader label="Created Date" id="createdDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Last Modified Date" id="lastModifiedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Submitted Date" id="submittedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Approved/Rejected Date" id="decisionDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Published Date" id="publishedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Archived Date" id="archivedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Approver Name" id="approverName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approverName} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('approverName')} />
                                                <ReportHeader label="Approval Comments" id="approvalComments" currentSort={sortConfig} onSort={handleSort} className="w-[250px]" filterType="none" />
                                                <ReportHeader label="Turnaround Time" id="turnaroundTime" currentSort={sortConfig} onSort={handleSort} className="w-[150px]" filterType="none" />
                                                <ReportHeader label="Version ID" id="currentVersion" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.currentVersion} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="Total Revisions" id="totalRevisions" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.totalRevisions} onFilterChange={handleFilterChange} className="w-[130px]" filterType="dropdown" options={getUniqueValues('totalRevisions')} />
                                                <ReportHeader label="Is Duplicate" id="isDuplicate" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.isDuplicate} onFilterChange={handleFilterChange} className="w-[120px]" filterType="dropdown" options={getUniqueValues('isDuplicate')} />
                                                <ReportHeader label="Duplicated From" id="duplicatedFrom" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.duplicatedFrom} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="Linked Records" id="linkedRecordsCount" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.linkedRecordsCount} onFilterChange={handleFilterChange} className="w-[130px]" filterType="dropdown" options={getUniqueValues('linkedRecordsCount')} />
                                                <ReportHeader label="Attachments" id="attachmentCount" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.attachmentCount} onFilterChange={handleFilterChange} className="w-[130px]" filterType="dropdown" options={getUniqueValues('attachmentCount')} />
                                                <ReportHeader label="Active/Inactive Flag" id="isActiveFlag" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.isActiveFlag} onFilterChange={handleFilterChange} className="pr-6 w-[160px]" filterType="dropdown" options={getUniqueValues('isActiveFlag')} />
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
                                                    <TableCell className="font-black text-indigo-600 text-xs">{d.turnaroundTime}</TableCell>
                                                    <TableCell><Badge variant="outline" className="font-bold text-[10px] border-slate-200">{d.currentVersion}</Badge></TableCell>
                                                    <TableCell className="font-bold text-center">{d.totalRevisions}</TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-400">{d.isDuplicate}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.duplicatedFrom}</TableCell>
                                                    <TableCell className="font-bold text-center">{d.linkedRecordsCount}</TableCell>
                                                    <TableCell className="font-bold text-center">{d.attachmentCount}</TableCell>
                                                    <TableCell className="pr-6">
                                                        <Badge variant={d.isActiveFlag === 'Active' ? 'success' : 'secondary'} className="font-black text-[9px] uppercase tracking-wider">
                                                            {d.isActiveFlag}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </Card>
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                    ) : appliedFilters.reportType === 'approval-report' ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 px-2">
                                <ClipboardCheck className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Approval Report</h3>
                            </div>
                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                <ScrollArea className="w-full">
                                    <Table className="min-w-[2800px]">
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow>
                                                <ReportHeader label="Approver Name" id="approverName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approverName} onFilterChange={handleFilterChange} className="pl-6 w-[180px]" filterType="dropdown" options={getUniqueValues('approverName')} />
                                                <ReportHeader label="Definition Name" id="definitionName" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.definitionName} onFilterChange={handleFilterChange} className="w-[200px]" />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[150px]" filterType="dropdown" options={getUniqueValues('module')} />
                                                <ReportHeader label="Version" id="version" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.version} onFilterChange={handleFilterChange} className="w-[140px]" />
                                                <ReportHeader label="Action" id="action" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.action} onFilterChange={handleFilterChange} className="w-[180px]" filterType="dropdown" options={getUniqueValues('action')} />
                                                <ReportHeader label="Status" id="status" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.status} onFilterChange={handleFilterChange} className="w-[120px]" filterType="dropdown" options={getUniqueValues('status')} />
                                                <ReportHeader label="Submitted By" id="submittedBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.submittedBy} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('submittedBy')} />
                                                <ReportHeader label="Submitted Date" id="submittedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Decision Date" id="decisionDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Turnaround" id="turnaroundTime" currentSort={sortConfig} onSort={handleSort} className="w-[140px]" filterType="none" />
                                                <ReportHeader label="Days Pending" id="daysPending" currentSort={sortConfig} onSort={handleSort} className="w-[140px]" filterType="none" />
                                                <ReportHeader label="Comments" id="comments" currentSort={sortConfig} onSort={handleSort} className="w-[300px]" filterType="none" />
                                                <ReportHeader label="Resubs" id="resubmissionCount" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.resubmissionCount} onFilterChange={handleFilterChange} className="w-[100px]" filterType="dropdown" options={getUniqueValues('resubmissionCount')} />
                                                <ReportHeader label="Prev Decision" id="previousDecision" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.previousDecision} onFilterChange={handleFilterChange} className="pr-6 w-[160px]" filterType="dropdown" options={getUniqueValues('previousDecision')} />
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
                                                    <TableCell>
                                                        <Badge variant={d.status === 'Resolved' ? 'secondary' : 'outline'} className={cn("text-[9px] font-black uppercase", d.status === 'Pending' && "animate-pulse border-blue-200 text-blue-600")}>
                                                            {d.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-700">{d.submittedBy}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.submittedDate !== '—' ? format(parseISO(d.submittedDate), 'yyyy-MM-dd') : '—'}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-slate-400">{d.decisionDate !== '—' ? format(parseISO(d.decisionDate), 'yyyy-MM-dd') : '—'}</TableCell>
                                                    <TableCell className="font-black text-indigo-600 text-xs">{d.turnaroundTime}</TableCell>
                                                    <TableCell className="font-black text-red-600 text-xs">{d.daysPending}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs italic truncate max-w-[280px]">{d.comments}</TableCell>
                                                    <TableCell className="font-bold text-center">{d.resubmissionCount}</TableCell>
                                                    <TableCell className="pr-6 italic text-slate-400 text-xs">{d.previousDecision}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </Card>
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                    ) : appliedFilters.reportType === 'template-report' ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 px-2">
                                <LayoutTemplate className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Template Report</h3>
                            </div>
                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                <ScrollArea className="w-full">
                                    <Table className="min-w-[2600px]">
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow>
                                                <ReportHeader label="Template Name" id="name" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.name} onFilterChange={handleFilterChange} className="pl-6 w-[220px]" />
                                                <ReportHeader label="Module" id="module" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.module} onFilterChange={handleFilterChange} className="w-[150px]" filterType="dropdown" options={getUniqueValues('module')} />
                                                <ReportHeader label="Status" id="status" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.status} onFilterChange={handleFilterChange} className="w-[130px]" filterType="dropdown" options={getUniqueValues('status')} />
                                                <ReportHeader label="Created By" id="createdBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.createdBy} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('createdBy')} />
                                                <ReportHeader label="Created Date" id="createdDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Last Modified By" id="lastModifiedBy" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastModifiedBy} onFilterChange={handleFilterChange} className="w-[160px]" filterType="dropdown" options={getUniqueValues('lastModifiedBy')} />
                                                <ReportHeader label="Last Modified Date" id="lastModifiedDate" currentSort={sortConfig} onSort={handleSort} className="w-[180px]" filterType="none" />
                                                <ReportHeader label="Usage Count" id="usageCount" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.usageCount} onFilterChange={handleFilterChange} className="w-[130px]" filterType="dropdown" options={getUniqueValues('usageCount')} />
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
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </Card>
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40">
                            <Activity className="h-12 w-12 text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium italic">Detailed visualization for {appliedFilters.reportType} coming soon. Use export functions for raw data.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
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
    filterType = 'search',
    options = []
}: any) {
    const isSorted = currentSort?.key === id;
    const hasActiveFilter = filterValue && filterValue !== 'ALL_RECORDS';

    return (
        <TableHead className={cn("py-4", className)}>
            <div className="flex items-center justify-between gap-1 group/header">
                <button onClick={() => onSort(id)} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors shrink-0">
                    {label}
                    <ArrowUpDown className={cn("ml-1.5 h-3 w-3 transition-opacity", isSorted ? "text-indigo-600 opacity-100" : "opacity-0 group-hover/header:opacity-40")} />
                </button>
                
                {filterType !== 'none' && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-md", hasActiveFilter ? "text-indigo-600 bg-indigo-50" : "text-slate-300")}>
                                <Filter className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 rounded-xl shadow-xl" align="end">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Filter {label}</Label>
                                
                                {filterType === 'search' ? (
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-300" />
                                        <Input 
                                            className="h-9 pl-8 text-xs font-bold" 
                                            placeholder={`Search...`} 
                                            value={filterValue || ''} 
                                            onChange={(e) => onFilterChange(id, e.target.value)} 
                                        />
                                    </div>
                                ) : (
                                    <Select value={filterValue || 'ALL_RECORDS'} onValueChange={(val) => onFilterChange(id, val)}>
                                        <SelectTrigger className="h-9 text-xs font-bold rounded-lg border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL_RECORDS" className="text-xs font-bold text-slate-400">All Records</SelectItem>
                                            {options.map((opt: string) => (
                                                <SelectItem key={opt} value={opt} className="text-xs font-medium">{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                
                                {hasActiveFilter && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="w-full h-7 text-[9px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        onClick={() => onFilterChange(id, '')}
                                    >
                                        Clear Filter
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
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
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || totalItems === 0}>Next<ChevronRight className="h-4 w-4 ml-1.5" /></Button>
            </div>
        </div>
    );
}
