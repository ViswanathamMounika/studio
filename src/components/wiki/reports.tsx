
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
    ClipboardCheck,
    Clock,
    UserCheck,
    AlertCircle,
    LayoutTemplate,
    Activity,
    Settings2,
    Zap,
    Timer,
    Play
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

type ReportType = 'user-activity' | 'definition-report' | 'approval-report' | 'template-report' | 'system-usage';

type AppliedFilters = {
    reportType: ReportType;
    dateRange: { from: Date; to: Date } | undefined;
    approverFilter: string;
};

export default function ReportsDashboard({ users, definitions, drafts, activityLogs, approvalHistory, templates, masterData }: ReportsDashboardProps) {
    // Input States (Pending)
    const [selectedReport, setSelectedReport] = useState<ReportType>('user-activity');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: subMonths(new Date(), 12),
        to: new Date()
    });
    const [approverFilter, setApproverFilter] = useState<string>('all');

    // Committed States (Data Trigger)
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);
    
    // UI Table States
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
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

    // -- DATA PROCESSING LOGIC (COMMITTED) --

    const filteredLogs = useMemo(() => {
        const safeLogs = Array.isArray(activityLogs) ? activityLogs : [];
        if (!appliedFilters?.dateRange?.from) return safeLogs;
        return safeLogs.filter(log => {
            const logDate = parseISO(log.occurredDate);
            return isWithinInterval(logDate, { 
                start: startOfDay(appliedFilters.dateRange!.from), 
                end: endOfDay(appliedFilters.dateRange!.to || appliedFilters.dateRange!.from) 
            });
        });
    }, [activityLogs, appliedFilters]);

    const filteredHistory = useMemo(() => {
        const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];
        let result = safeHistory;
        
        if (appliedFilters?.dateRange?.from) {
            result = result.filter(h => {
                const hDate = parseISO(h.date);
                return isWithinInterval(hDate, { 
                    start: startOfDay(appliedFilters.dateRange!.from), 
                    end: endOfDay(appliedFilters.dateRange!.to || appliedFilters.dateRange!.from) 
                });
            });
        }
        
        if (appliedFilters?.approverFilter && appliedFilters.approverFilter !== 'all') {
            result = result.filter(h => h.userName === appliedFilters.approverFilter);
        }
        
        return result;
    }, [approvalHistory, appliedFilters]);

    const processedUserStats = useMemo(() => {
        if (!appliedFilters || appliedFilters.reportType !== 'user-activity') return [];
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
    }, [users, filteredLogs, filteredHistory, appliedFilters]);

    const definitionReportStats = useMemo(() => {
        if (!appliedFilters || appliedFilters.reportType !== 'definition-report') return null;
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
    }, [definitions, drafts, filteredLogs, appliedFilters]);

    const approvalReportStats = useMemo(() => {
        if (!appliedFilters || appliedFilters.reportType !== 'approval-report') return null;
        const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];
        const safeDrafts = Array.isArray(drafts) ? drafts : [];
        
        const approved = filteredHistory.filter(h => h.action === 'Approved');
        const rejected = filteredHistory.filter(h => h.action === 'Rejected' || h.action === 'Changes Requested');
        const pending = safeDrafts.filter(d => d.isPendingApproval);

        let totalMinutes = 0;
        let countWithTime = 0;
        
        filteredHistory.forEach(h => {
            if (h.action === 'Approved' || h.action === 'Rejected' || h.action === 'Changes Requested') {
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
    }, [approvalHistory, filteredHistory, drafts, appliedFilters]);

    const templateReportStats = useMemo(() => {
        if (!appliedFilters || appliedFilters.reportType !== 'template-report') return null;
        const safeTemplates = Array.isArray(templates) ? templates : [];
        const safeDefinitions = Array.isArray(definitions) ? definitions : [];
        const safeDrafts = Array.isArray(drafts) ? drafts : [];

        const usageMap: Record<string, number> = {};
        const countUsage = (items: Definition[]) => {
            items.forEach(item => {
                if (item.templateId) {
                    usageMap[item.templateId] = (usageMap[item.templateId] || 0) + 1;
                }
                if (item.children) countUsage(item.children);
            });
        };
        countUsage(safeDefinitions);
        countUsage(safeDrafts);

        const mostUsed = safeTemplates.map(t => ({
            id: t.id,
            name: t.name,
            module: t.module,
            usage: usageMap[t.id] || 0
        })).sort((a, b) => b.usage - a.usage);

        const modificationLogs = filteredLogs.filter(l => 
            l.activityType === 'Template Created' || l.activityType === 'Template Updated'
        );
        
        const recentlyModified = Array.from(new Set(modificationLogs.map(l => {
            const templateName = l.details?.includes('Template: ') ? l.details.split('Template: ')[1] : l.definitionName;
            return {
                name: templateName,
                user: l.userName,
                date: l.occurredDate,
                type: l.activityType
            };
        }))).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

        return {
            counts: {
                total: safeTemplates.length,
                active: safeTemplates.filter(t => t.isActive).length,
                inactive: safeTemplates.filter(t => !t.isActive).length,
                recentlyModifiedCount: recentlyModified.length
            },
            mostUsed,
            recentlyModified
        };
    }, [templates, definitions, drafts, filteredLogs, appliedFilters]);

    const systemUsageStats = useMemo(() => {
        if (!appliedFilters || appliedFilters.reportType !== 'system-usage') return null;
        const getShortDate = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');

        const creationsMap: Record<string, number> = {};
        filteredLogs.filter(l => l.activityType === 'Definition Created').forEach(l => {
            const d = getShortDate(l.occurredDate);
            creationsMap[d] = (creationsMap[d] || 0) + 1;
        });
        const creationsPerDay = Object.entries(creationsMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date));

        const approvalsMap: Record<string, number> = {};
        filteredHistory.filter(h => h.action !== 'Submitted').forEach(h => {
            const d = getShortDate(h.date);
            approvalsMap[d] = (approvalsMap[d] || 0) + 1;
        });
        const approvalsPerDay = Object.entries(approvalsMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date));

        const activeUsersMap: Record<string, Set<string>> = {};
        filteredLogs.forEach(l => {
            const d = getShortDate(l.occurredDate);
            if (!activeUsersMap[d]) activeUsersMap[d] = new Set();
            activeUsersMap[d].add(l.userName);
        });
        const activeUsersPerDay = Object.entries(activeUsersMap)
            .map(([date, users]) => ({ date, count: users.size }))
            .sort((a, b) => b.date.localeCompare(a.date));

        const hoursMap: Record<number, number> = {};
        filteredLogs.filter(l => l.activityType === 'User Login').forEach(l => {
            const hour = parseISO(l.occurredDate).getHours();
            hoursMap[hour] = (hoursMap[hour] || 0) + 1;
        });
        const peakHours = Object.entries(hoursMap)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => b.count - a.count);

        const moduleActivityMap: Record<string, number> = {};
        const safeDefs = Array.isArray(definitions) ? definitions : [];
        const safeDrafts = Array.isArray(drafts) ? drafts : [];

        filteredLogs.forEach(log => {
            if (log.definitionName === 'System Governance' || log.definitionName === 'Template Governance' || log.definitionName === 'Security Administration') return;
            
            let def = (Array.isArray(safeDefs) ? safeDefs : []).find(d => d.name === log.definitionName);
            if (!def) def = (Array.isArray(safeDrafts) ? safeDrafts : []).find(d => d.name === log.definitionName);
            
            const moduleName = def?.module || 'Core';
            moduleActivityMap[moduleName] = (moduleActivityMap[moduleName] || 0) + 1;
        });

        const activeModules = Object.entries(moduleActivityMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            creationsPerDay,
            approvalsPerDay,
            activeUsersPerDay,
            peakHours,
            activeModules
        };
    }, [filteredLogs, filteredHistory, definitions, drafts, appliedFilters]);

    const uniqueApprovers = useMemo(() => {
        const safeHistory = Array.isArray(approvalHistory) ? approvalHistory : [];
        const names = Array.from(new Set(safeHistory.filter(h => h.action !== 'Submitted').map(h => h.userName)));
        return names.sort();
    }, [approvalHistory]);

    // -- TABLE CONTROLS --

    const filteredAndSortedData = useMemo(() => {
        let result = [...processedUserStats];
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
        setApproverFilter('all');
        setAppliedFilters(null);
    };

    const handleExport = async (formatType: 'xlsx' | 'csv' | 'pdf') => {
        if (!appliedFilters) {
            toast({ variant: 'destructive', title: "No Data", description: "Please generate a report before exporting." });
            return;
        }

        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const filename = `MPM_Report_${appliedFilters.reportType.replace('-', '_')}_${timestamp}`;
        
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        if (appliedFilters.reportType === 'user-activity') {
            const exportData = filteredAndSortedData.map(u => ({
                'User Name': u.name,
                'Email': u.email,
                'Role': u.role,
                'Status': u.status,
                'Logins': u.logins,
                'Last Login': u.lastLogin,
                'Last Activity': u.lastActivity,
                'Definitions Created': u.creations,
                'Definitions Edited': u.edits,
                'Approvals Performed': u.approvals,
                'Templates Managed': u.templates
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "User Activity");
        } else if (appliedFilters.reportType === 'definition-report' && definitionReportStats) {
            const summary = [
                { Category: 'Total Definitions', Count: definitionReportStats.counts.total },
                { Category: 'Published', Count: definitionReportStats.counts.published },
                { Category: 'Draft', Count: definitionReportStats.counts.draft },
                { Category: 'Pending', Count: definitionReportStats.counts.pending },
                { Category: 'Rejected', Count: definitionReportStats.counts.rejected },
                { Category: 'Archived', Count: definitionReportStats.counts.archived }
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Library Summary");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(definitionReportStats.creationsByUser), "By Author");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(definitionReportStats.creationsByMonth), "By Month");
        } else if (appliedFilters.reportType === 'approval-report' && approvalReportStats) {
            const metrics = [
                { Metric: 'Total Requests', Value: approvalReportStats.metrics.totalRequests },
                { Metric: 'Pending', Value: approvalReportStats.metrics.pendingCount },
                { Metric: 'Approved', Value: approvalReportStats.metrics.approvedCount },
                { Metric: 'Rejected', Value: approvalReportStats.metrics.rejectedCount },
                { Metric: 'Avg Decision Time (Hrs)', Value: approvalReportStats.metrics.avgDecisionTime }
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metrics), "Performance");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(approvalReportStats.byApprover), "By Approver");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(approvalReportStats.oldestPending.map(p => ({
                Name: p.name,
                Author: p.submittedBy,
                Submitted: p.submittedAt
            }))), "Oldest Pending");
        } else if (appliedFilters.reportType === 'template-report' && templateReportStats) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([templateReportStats.counts]), "Architecture Overview");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templateReportStats.mostUsed), "Template Adoption");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templateReportStats.recentlyModified), "Modification Audit");
        } else if (appliedFilters.reportType === 'system-usage' && systemUsageStats) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(systemUsageStats.creationsPerDay), "Creation Velocity");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(systemUsageStats.approvalsPerDay), "Governance Throughput");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(systemUsageStats.activeUsersPerDay), "Daily Active Users");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(systemUsageStats.peakHours), "Hourly Peak Patterns");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(systemUsageStats.activeModules), "Module Engagement");
        }

        if (formatType === 'xlsx') {
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } else if (formatType === 'csv') {
            const firstSheetName = wb.SheetNames[0];
            const csv = XLSX.utils.sheet_to_csv(wb.Sheets[firstSheetName]);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF('l', 'mm', 'a4');
            doc.setFontSize(18);
            doc.text(`MedPoint Wiki: ${appliedFilters.reportType.replace('-', ' ').toUpperCase()}`, 14, 20);
            doc.setFontSize(10);
            doc.text(`Exported on: ${format(new Date(), 'PPP p')}`, 14, 28);
            doc.save(`${filename}.pdf`);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col bg-slate-50/30">
            {/* STICKY HEADER ACTIONS */}
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
                            <DropdownMenuItem onClick={() => handleExport('pdf')} className="font-bold py-3"><FileSearch className="mr-2 h-4 w-4 text-red-600" /> PDF Summary</DropdownMenuItem>
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
                                <SelectItem value="system-usage" className="font-medium">System Usage Report</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedReport === 'approval-report' && (
                        <div className="flex-1 min-w-[200px] max-w-xs space-y-1.5 animate-in fade-in slide-in-from-left-2">
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
                                <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
                                    Please select your report type and observation period in the header above, then click <strong>Run Report</strong> to generate the audit data.
                                </p>
                            </div>
                        </div>
                    ) : appliedFilters.reportType === 'user-activity' ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 px-2">
                                <Users className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">User Activity Audit Ledger</h3>
                            </div>
                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b">
                                        <TableRow>
                                            <ReportHeader label="User Name" id="name" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.name} onFilterChange={handleFilterChange} className="pl-6 flex-1 min-w-[200px]" />
                                            <ReportHeader label="Last Login" id="lastLogin" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastLogin} onFilterChange={handleFilterChange} className="min-w-[160px]" />
                                            <ReportHeader label="Logins" id="logins" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.logins} onFilterChange={handleFilterChange} className="min-w-[100px]" />
                                            <ReportHeader label="Last Activity" id="lastActivity" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.lastActivity} onFilterChange={handleFilterChange} className="min-w-[140px]" />
                                            <ReportHeader label="Created" id="creations" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.creations} onFilterChange={handleFilterChange} className="min-w-[100px]" />
                                            <ReportHeader label="Edited" id="edits" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.edits} onFilterChange={handleFilterChange} className="min-w-[100px]" />
                                            <ReportHeader label="Approvals" id="approvals" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.approvals} onFilterChange={handleFilterChange} className="min-w-[110px]" />
                                            <ReportHeader label="Templates" id="templates" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.templates} onFilterChange={handleFilterChange} className="min-w-[110px]" />
                                            <ReportHeader label="Status" id="status" currentSort={sortConfig} onSort={handleSort} filterValue={columnFilters.status} onFilterChange={handleFilterChange} isSelectFilter className="pr-6 min-w-[120px]" />
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
                                                <TableCell className="pr-6">
                                                    <Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="font-black text-[9px] uppercase px-2">
                                                        {u.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {paginatedData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={9} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Search className="h-10 w-10 text-slate-200" />
                                                        <p className="text-slate-400 font-bold italic">No user activity records match your filters.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                            <ReportPagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} setPageSize={setPageSize} onPageChange={setCurrentPage} totalItems={filteredAndSortedData.length} />
                        </div>
                    ) : appliedFilters.reportType === 'definition-report' && definitionReportStats ? (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2"><FilePieChart className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Library Summary Ledger</h3></div>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow><TableHead className="px-6 h-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Definition State</TableHead><TableHead className="text-right px-6 h-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Count</TableHead></TableRow>
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
                                                <TableRow key={i} className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium text-slate-700">{row.label}</TableCell><TableCell className={cn("px-6 text-right font-black text-lg tabular-nums", row.color)}>{row.count}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><UserCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Top Authors</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm"><Table><TableBody>{definitionReportStats.creationsByUser.map((u, i) => (<TableRow key={i} className="h-12 border-slate-100 hover:bg-slate-50/50"><TableCell className="px-6 font-bold text-slate-700">{u.name}</TableCell><TableCell className="px-6 text-right font-black text-indigo-600 tabular-nums">{u.count}</TableCell></TableRow>))}</TableBody></Table></Card>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><Activity className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Creation Trends</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm"><Table><TableBody>{definitionReportStats.creationsByMonth.map((m, i) => (<TableRow key={i} className="h-12 border-slate-100 hover:bg-slate-50/50"><TableCell className="px-6 font-mono font-bold text-slate-700">{m.month}</TableCell><TableCell className="px-6 text-right font-black text-emerald-600 tabular-nums">{m.count}</TableCell></TableRow>))}</TableBody></Table></Card>
                                </div>
                            </div>
                        </div>
                    ) : appliedFilters.reportType === 'approval-report' && approvalReportStats ? (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2"><ClipboardCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Approval Workflow Performance</h3></div>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow><TableHead className="px-6 h-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Performance Metric</TableHead><TableHead className="text-right px-6 h-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Value</TableHead></TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium">Total Approval Requests</TableCell><TableCell className="px-6 text-right font-black text-slate-900 tabular-nums">{approvalReportStats.metrics.totalRequests}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium">Pending Approvals</TableCell><TableCell className="px-6 text-right font-black text-indigo-600 tabular-nums">{approvalReportStats.metrics.pendingCount}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium">Approved Count</TableCell><TableCell className="px-6 text-right font-black text-emerald-600 tabular-nums">{approvalReportStats.metrics.approvedCount}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium">Rejected Count</TableCell><TableCell className="px-6 text-right font-black text-red-600 tabular-nums">{approvalReportStats.metrics.rejectedCount}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 bg-indigo-50/20"><TableCell className="px-6 font-bold text-primary flex items-center gap-2"><Clock className="h-4 w-4" /> Average Approval Time</TableCell><TableCell className="px-6 text-right font-black text-primary text-xl tabular-nums">{approvalReportStats.metrics.avgDecisionTime} hrs</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><Users className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Workload by Approver</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Approver Name</TableHead>
                                                    <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-slate-500">Total</TableHead>
                                                    <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-emerald-600">Appr.</TableHead>
                                                    <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-red-600">Rej.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {approvalReportStats.byApprover.map((app, i) => (
                                                    <TableRow key={i} className="h-14 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-bold text-slate-700">{app.name}</TableCell>
                                                        <TableCell className="text-center font-black text-slate-900 tabular-nums">{app.total}</TableCell>
                                                        <TableCell className="text-center font-bold text-emerald-600 tabular-nums">{app.approved}</TableCell>
                                                        <TableCell className="text-center font-bold text-red-600 tabular-nums">{app.rejected}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><AlertCircle className="h-4 w-4 text-red-500" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Queue Aging: Oldest Pending</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow><TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Definition</TableHead><TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Author</TableHead><TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Age</TableHead></TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {approvalReportStats.oldestPending.map((p, i) => {
                                                    const hours = differenceInHours(new Date(), parseISO(p.submittedAt!));
                                                    return (
                                                        <TableRow key={i} className="h-14 border-slate-100 hover:bg-slate-50/50">
                                                            <TableCell className="px-6 font-bold text-slate-700 truncate max-w-[200px]">{p.name}</TableCell>
                                                            <TableCell className="text-sm text-slate-500">{p.submittedBy}</TableCell>
                                                            <TableCell className="text-right px-6"><Badge className={cn("rounded-lg font-black uppercase text-[10px]", hours > 48 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>{hours} hrs</Badge></TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : appliedFilters.reportType === 'template-report' && templateReportStats ? (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2"><LayoutTemplate className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Template Architecture Summary</h3></div>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow><TableHead className="px-6 h-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Classification</TableHead><TableHead className="text-right px-6 h-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Value</TableHead></TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium">Total Registered Blueprints</TableCell><TableCell className="px-6 text-right font-black text-slate-900 tabular-nums">{templateReportStats.counts.total}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium">Active Templates</TableCell><TableCell className="px-6 text-right font-black text-emerald-600 tabular-nums">{templateReportStats.counts.active}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 hover:bg-slate-50/30"><TableCell className="px-6 font-medium">Inactive/Draft Templates</TableCell><TableCell className="px-6 text-right font-black text-slate-400 tabular-nums">{templateReportStats.counts.inactive}</TableCell></TableRow>
                                            <TableRow className="border-slate-100 h-14 bg-indigo-50/20"><TableCell className="px-6 font-bold text-primary flex items-center gap-2"><Settings2 className="h-4 w-4" /> Recently Modified (Selected Period)</TableCell><TableCell className="px-6 text-right font-black text-primary text-xl tabular-nums">{templateReportStats.counts.recentlyModifiedCount}</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><Activity className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Library Adoption Tracking</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Template Identity</TableHead>
                                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Module</TableHead>
                                                    <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Usage</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {templateReportStats.mostUsed.map((t, i) => (
                                                    <TableRow key={i} className="h-14 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-bold text-slate-700">{t.name}</TableCell>
                                                        <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase border-slate-200 bg-slate-50">{t.module}</Badge></TableCell>
                                                        <TableCell className="text-right px-6"><span className="font-black text-indigo-600 text-lg tabular-nums">{t.usage}</span></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2"><Clock className="h-4 w-4 text-primary" /><h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Governance Evolution Audit</h3></div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Template</TableHead>
                                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Action By</TableHead>
                                                    <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {templateReportStats.recentlyModified.map((m, i) => (
                                                    <TableRow key={i} className="h-14 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-bold text-slate-700 truncate max-w-[150px]">{m.name}</TableCell>
                                                        <TableCell className="text-sm text-slate-500 font-medium">{m.user}</TableCell>
                                                        <TableCell className="text-right px-6 text-slate-400 font-mono text-[11px]">{format(parseISO(m.date), 'yyyy-MM-dd')}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {templateReportStats.recentlyModified.length === 0 && (
                                                    <TableRow><TableCell colSpan={3} className="h-32 text-center text-slate-400 italic">No governance changes detected in this period.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : appliedFilters.reportType === 'system-usage' && systemUsageStats ? (
                        <div className="space-y-10 animate-in fade-in duration-500">
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Definition Creation Velocity</h3>
                                    </div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Calendar Date</TableHead>
                                                    <TableHead className="text-right px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Creations</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {systemUsageStats.creationsPerDay.map((row, i) => (
                                                    <TableRow key={i} className="h-12 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-mono text-xs">{row.date}</TableCell>
                                                        <TableCell className="px-6 text-right font-black text-indigo-600 tabular-nums">{row.count}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {systemUsageStats.creationsPerDay.length === 0 && (
                                                    <TableRow><TableCell colSpan={2} className="h-24 text-center text-slate-400 italic">No creation data for selected period.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <ClipboardCheck className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Governance Throughput (Approvals)</h3>
                                    </div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Calendar Date</TableHead>
                                                    <TableHead className="text-right px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Decisions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {systemUsageStats.approvalsPerDay.map((row, i) => (
                                                    <TableRow key={i} className="h-12 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-mono text-xs">{row.date}</TableCell>
                                                        <TableCell className="px-6 text-right font-black text-emerald-600 tabular-nums">{row.count}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {systemUsageStats.approvalsPerDay.length === 0 && (
                                                    <TableRow><TableCell colSpan={2} className="h-24 text-center text-slate-400 italic">No approval data for selected period.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Daily Active Users (DAU)</h3>
                                    </div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Calendar Date</TableHead>
                                                    <TableHead className="text-right px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Unique Users</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {systemUsageStats.activeUsersPerDay.map((row, i) => (
                                                    <TableRow key={i} className="h-12 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-mono text-xs">{row.date}</TableCell>
                                                        <TableCell className="px-6 text-right font-black text-primary tabular-nums">{row.count}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {systemUsageStats.activeUsersPerDay.length === 0 && (
                                                    <TableRow><TableCell colSpan={2} className="h-24 text-center text-slate-400 italic">No engagement data recorded.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <Timer className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Peak System Access Hours</h3>
                                    </div>
                                    <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50 border-b">
                                                <TableRow>
                                                    <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Hour Block (24h)</TableHead>
                                                    <TableHead className="text-right px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Login Volume</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {systemUsageStats.peakHours.map((row, i) => (
                                                    <TableRow key={i} className="h-12 border-slate-100 hover:bg-slate-50/50">
                                                        <TableCell className="px-6 font-bold text-slate-700">{row.hour}:00 - {row.hour}:59</TableCell>
                                                        <TableCell className="px-6 text-right font-black text-indigo-600 tabular-nums">{row.count}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {systemUsageStats.peakHours.length === 0 && (
                                                    <TableRow><TableCell colSpan={2} className="h-24 text-center text-slate-400 italic">No login data for period.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Module Engagement Intensity</h3>
                                </div>
                                <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow>
                                                <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Business Module</TableHead>
                                                <TableHead className="text-right px-6 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500">System Interaction Count</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {systemUsageStats.activeModules.map((row, i) => (
                                                <TableRow key={i} className="h-14 border-slate-100 hover:bg-slate-50/50">
                                                    <TableCell className="px-6 font-bold text-slate-900">{row.name}</TableCell>
                                                    <TableCell className="px-6 text-right">
                                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-sm px-4 h-8 tabular-nums">
                                                            {row.count}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {systemUsageStats.activeModules.length === 0 && (
                                                <TableRow><TableCell colSpan={2} className="h-32 text-center text-slate-400 italic">No module interactions detected.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40">
                            <Activity className="h-12 w-12 text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">Ready to analyze system data.</p>
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
        <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-200 shadow-sm mt-2">
            <div className="flex items-center gap-6">
                <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} records</div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Rows per page:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); onPageChange(1); }}>
                        <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1.5" />Previous</Button>
                <div className="flex items-center justify-center min-w-[3.5rem] h-9 rounded-xl bg-white border border-slate-200 text-sm font-black text-indigo-600">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold border-slate-200 bg-white" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || totalPages === 0}>Next<ChevronRight className="h-4 w-4 ml-1.5" /></Button>
            </div>
        </div>
    );
}
