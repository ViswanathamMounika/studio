
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isWithinInterval, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import { CalendarIcon, ArrowUpDown, FilterX, Search as SearchIcon, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Check, X, History, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityLog, ActivityType, UserAccount } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

const activityTypes: ActivityType[] = [
  'Definition Created',
  'Definition Updated',
  'Definition Deleted',
  'Definition Bookmarked',
  'Definition Archived',
  'Definition Unarchived',
  'Definition Duplicate',
  'Definition Export',
  'Definition Notes Added',
  'Definition Notes Updated',
  'Definition Notes Deleted',
  'Definition Related Added',
  'Definition Related Deleted',
  'Definition Viewed',
  'Definition Shared',
  'Definition Searched',
  'Definition Attachment Downloaded',
  'User Login',
  'User Logout',
  'User Profile Updated',
  'User Status Changed',
  'User Role Modified',
  'Role Created',
  'Role Updated',
  'Role Status Changed',
  'Role Deleted',
  'Permission Created',
  'Permission Updated',
  'Permission Deleted',
  'Master Data Created',
  'Master Data Updated',
  'Master Data Deleted',
  'Master Data Status Changed',
  'System Configuration Updated',
  'Template Created',
  'Template Updated',
  'Template Deleted',
  'Approval Decision'
];

const ITEMS_PER_PAGE = 15;

type ActivityLogsProps = {
    isAdmin: boolean;
    users: UserAccount[];
};

export default function ActivityLogs({ isAdmin, users }: ActivityLogsProps) {
    const [logs] = useState<ActivityLog[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = window.localStorage.getItem('activity_logs_v19');
        return saved ? JSON.parse(saved) : [];
    });
    
    // UI Filter States (Pending Application)
    const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [definitionSearch, setDefinitionSearch] = useState<string>('');
    const [timeFrame, setTimeFrame] = useState('last-30-days');
    const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
    const [isViewedOnly, setIsViewedOnly] = useState(false);

    // Applied Filter State (Commit on Search)
    const [appliedFilters, setAppliedFilters] = useState<{
        activityType: string;
        userFilter: string;
        definitionSearch: string;
        timeFrame: string;
        customRange: { from: Date; to: Date } | undefined;
        isViewedOnly: boolean;
    } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ActivityLog; direction: 'asc' | 'desc' }>({
        key: 'occurredDate',
        direction: 'desc'
    });
    
    const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchSuggestionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Extract unique definition names for auto-population
    const uniqueDefinitions = useMemo(() => {
        if (!Array.isArray(logs)) return [];
        const names = Array.from(new Set(logs.map(log => log.definitionName)));
        return names.sort((a, b) => a.localeCompare(b));
    }, [logs]);

    const suggestions = useMemo(() => {
        if (!definitionSearch.trim()) return [];
        return uniqueDefinitions.filter(name => 
            name.toLowerCase().includes(definitionSearch.toLowerCase())
        );
    }, [uniqueDefinitions, definitionSearch]);

    const handleSearch = () => {
        setAppliedFilters({
            activityType: activityTypeFilter,
            userFilter,
            definitionSearch,
            timeFrame,
            customRange,
            isViewedOnly
        });
        setCurrentPage(1);
    };

    const filteredAndSortedLogs = useMemo(() => {
        if (!appliedFilters || !Array.isArray(logs)) return [];

        return logs.filter(log => {
            const isMainMatch = appliedFilters.activityType === 'all' 
                ? (log.activityType !== 'Definition Viewed' && log.activityType !== 'Definition Searched')
                : (log.activityType === appliedFilters.activityType);
            
            const isViewedMatch = appliedFilters.isViewedOnly && (log.activityType === 'Definition Viewed' || log.activityType === 'Definition Searched');
            const activityMatch = isMainMatch || isViewedMatch;

            const userMatch = appliedFilters.userFilter === 'all' || log.userName === appliedFilters.userFilter;
            const definitionMatch = !appliedFilters.definitionSearch || log.definitionName.toLowerCase().includes(appliedFilters.definitionSearch.toLowerCase());

            let timeMatch = true;
            const logDate = new Date(log.occurredDate);
            const now = new Date();

            if (appliedFilters.timeFrame === 'this-week') {
                timeMatch = isWithinInterval(logDate, { start: startOfWeek(now), end: endOfWeek(now) });
            } else if (appliedFilters.timeFrame === 'last-week') {
                const startOfLast = startOfWeek(subWeeks(now, 1));
                const endOfLast = endOfWeek(subWeeks(now, 1));
                timeMatch = isWithinInterval(logDate, { start: startOfLast, end: endOfLast });
            } else if (appliedFilters.timeFrame === 'this-month') {
                timeMatch = isWithinInterval(logDate, { start: startOfMonth(now), end: endOfMonth(now) });
            } else if (appliedFilters.timeFrame === 'last-30-days') {
                const thirtyDaysAgo = subDays(now, 30);
                timeMatch = isWithinInterval(logDate, { start: thirtyDaysAgo, end: now });
            } else if (appliedFilters.timeFrame === 'custom' && appliedFilters.customRange?.from && appliedFilters.customRange?.to) {
                timeMatch = isWithinInterval(logDate, { start: appliedFilters.customRange.from, end: appliedFilters.customRange.to });
            }

            return activityMatch && userMatch && definitionMatch && timeMatch;
        }).sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            
            if (sortConfig.key === 'occurredDate') {
                const dateA = new Date(valA as string).getTime();
                const dateB = new Date(valB as string).getTime();
                return sortConfig.direction === 'desc' ? dateB - dateA : dateA - dateB;
            }
            
            const stringA = String(valA).toLowerCase();
            const stringB = String(valB).toLowerCase();
            
            if (stringA < stringB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (stringA > stringB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [logs, appliedFilters, sortConfig]);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedLogs.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSortedLogs, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedLogs.length / ITEMS_PER_PAGE);

    const handleSort = (key: keyof ActivityLog) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setActivityTypeFilter('all');
        setUserFilter('all');
        setDefinitionSearch('');
        setTimeFrame('last-30-days');
        setCustomRange(undefined);
        setIsViewedOnly(false);
        setAppliedFilters(null);
        setCurrentPage(1);
    };

    const handleExportExcel = async () => {
        if (filteredAndSortedLogs.length === 0) {
            toast({
                variant: "destructive",
                title: "Export Failed",
                description: "No results found to export.",
            });
            return;
        }

        const XLSX = await import('xlsx');
        const exportData = filteredAndSortedLogs.map(log => ({
            'User Name': log.userName,
            'Definition Name': log.definitionName,
            'Activity Type': log.activityType,
            'Details': log.details || '',
            'Occurred Date': format(new Date(log.occurredDate), 'yyyy-MM-dd HH:mm:ss')
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');
        XLSX.writeFile(workbook, `Activity_Logs_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity Logs</h1>
                    <p className="text-muted-foreground font-medium">Complete system telemetry and documentation audit trail.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white" onClick={handleExportExcel} disabled={!appliedFilters}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white" onClick={resetFilters}>
                        <FilterX className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </div>

            <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="py-3 px-6 bg-slate-50/80 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Governance Filters</CardTitle>
                    {isAdmin && (
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="viewed-only" 
                                checked={isViewedOnly}
                                onCheckedChange={setIsViewedOnly}
                            />
                            <Label htmlFor="viewed-only" className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 cursor-pointer">
                                view as
                            </Label>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Definition Name</Label>
                            <div className="relative" ref={searchRef}>
                                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Filter by name..." 
                                    className="pl-9 rounded-xl border-slate-200 h-10"
                                    value={definitionSearch}
                                    onChange={(e) => {
                                        setDefinitionSearch(e.target.value);
                                        setIsSearchSuggestionsOpen(true);
                                    }}
                                    onFocus={() => setIsSearchSuggestionsOpen(true)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">User Account</Label>
                            <Select value={userFilter} onValueChange={setUserFilter}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                                    <div className="flex items-center gap-2">
                                        <User2 className="h-3.5 w-3.5 text-slate-400" />
                                        <SelectValue placeholder="All Users" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Event Category</Label>
                            <Select 
                                value={activityTypeFilter} 
                                onValueChange={setActivityTypeFilter}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                                    <SelectValue placeholder="All Activities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Standard & System Logs</SelectItem>
                                    {activityTypes
                                        .filter(t => t !== 'Definition Viewed' && t !== 'Definition Searched')
                                        .map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Time Frame</Label>
                            <Select value={timeFrame} onValueChange={setTimeFrame}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="this-week">This Week</SelectItem>
                                    <SelectItem value="last-week">Last Week</SelectItem>
                                    <SelectItem value="this-month">This Month</SelectItem>
                                    <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button className="h-10 w-full rounded-xl bg-[#3F51B5] font-bold shadow-lg shadow-indigo-100" onClick={handleSearch}>
                                <SearchIcon className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {timeFrame === 'custom' && (
                        <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Date Range</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-[280px] h-10 justify-start text-left font-bold rounded-xl border-slate-200", !customRange && "text-slate-400")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {customRange?.from ? (customRange.to ? <>{format(customRange.from, "LLL dd, y")} - {format(customRange.to, "LLL dd, y")}</> : format(customRange.from, "LLL dd, y")) : <span>Select range...</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={customRange?.from}
                                            selected={customRange as any}
                                            onSelect={(range) => setCustomRange(range as any)}
                                            numberOfMonths={2}
                                            disabled={{ after: new Date() }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 shadow-sm overflow-hidden flex flex-col bg-white">
                <CardContent className="p-0 overflow-hidden flex-1">
                    {!appliedFilters ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                <History className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Audit History Ready</h3>
                            <p className="text-sm text-slate-500 max-w-sm mt-2 font-medium">
                                Configure your governance filters and click <strong>Search</strong> to retrieve system activity logs.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-5 px-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('userName')}>
                                        <div className="flex items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            User Account
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'userName' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('definitionName')}>
                                        <div className="flex items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            Definition Name
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'definitionName' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('activityType')}>
                                        <div className="flex items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            Event
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'activityType' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                    {isAdmin && (
                                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            Audit Details
                                        </TableHead>
                                    )}
                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors text-right px-6" onClick={() => handleSort('occurredDate')}>
                                        <div className="flex items-center justify-end text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            Timestamp
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'occurredDate' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedLogs.map(log => (
                                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                                        <TableCell className="px-6 py-5 font-bold text-slate-900">{log.userName}</TableCell>
                                        <TableCell className="text-slate-600 font-medium">{log.definitionName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold text-[10px] uppercase bg-slate-50 text-slate-600 border-slate-200">
                                                {log.activityType}
                                            </Badge>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-slate-500 text-xs italic max-w-xs truncate">
                                                {log.details || '—'}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right px-6 text-slate-400 font-bold tabular-nums text-[11px] uppercase whitespace-nowrap">
                                            {format(new Date(log.occurredDate), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                
                {appliedFilters && filteredAndSortedLogs.length > 0 && (
                    <div className="flex items-center justify-between p-6 border-t bg-slate-50/50">
                        <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                            Showing {paginatedLogs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedLogs.length)} of {filteredAndSortedLogs.length} records
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl h-9 px-4 font-bold border-slate-200"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1.5" />
                                Prev
                            </Button>
                            <div className="flex items-center justify-center min-w-[3.5rem] h-9 rounded-xl bg-white border border-slate-200 text-sm font-black text-[#3F51B5]">
                                {currentPage} / {totalPages || 1}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl h-9 px-4 font-bold border-slate-200"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
