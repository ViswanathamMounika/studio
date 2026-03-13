
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isWithinInterval, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import { CalendarIcon, ArrowUpDown, FilterX, Search, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Check, X, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityLog, ActivityType } from '@/lib/types';
import { initialActivityLogs } from '@/lib/data';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

const activityTypes: ActivityType[] = ['View', 'Edit', 'Create', 'Download', 'Bookmark', 'Archive', 'Duplicate', 'Search', 'Submit', 'Approve', 'Reject', 'Request Changes'];
const ITEMS_PER_PAGE = 10;

export default function ActivityLogs() {
    const [logs] = useState<ActivityLog[]>(initialActivityLogs);
    const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
    const [definitionSearch, setDefinitionSearch] = useState<string>('');
    const [timeFrame, setTimeFrame] = useState('last-30-days'); // Default to Last 30 Days
    const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ActivityLog; direction: 'asc' | 'desc' }>({
        key: 'occurredDate',
        direction: 'desc'
    });
    
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Extract unique definition names for auto-population
    const uniqueDefinitions = useMemo(() => {
        const names = Array.from(new Set(logs.map(log => log.definitionName)));
        return names.sort((a, b) => a.localeCompare(b));
    }, [logs]);

    const suggestions = useMemo(() => {
        if (!definitionSearch) return uniqueDefinitions;
        return uniqueDefinitions.filter(name => 
            name.toLowerCase().includes(definitionSearch.toLowerCase())
        );
    }, [uniqueDefinitions, definitionSearch]);

    // Show results if definition search has content
    const showResults = definitionSearch.trim().length > 0;

    const filteredAndSortedLogs = useMemo(() => {
        if (!showResults) return [];

        return logs.filter(log => {
            const activityMatch = activityTypeFilter === 'all' || log.activityType === activityTypeFilter;
            const definitionMatch = !definitionSearch || log.definitionName.toLowerCase().includes(definitionSearch.toLowerCase());

            let timeMatch = true;
            const logDate = new Date(log.occurredDate);
            const now = new Date();

            if (timeFrame === 'this-week') {
                timeMatch = isWithinInterval(logDate, { start: startOfWeek(now), end: endOfWeek(now) });
            } else if (timeFrame === 'last-week') {
                const startOfLast = startOfWeek(subWeeks(now, 1));
                const endOfLast = endOfWeek(subWeeks(now, 1));
                timeMatch = isWithinInterval(logDate, { start: startOfLast, end: endOfLast });
            } else if (timeFrame === 'this-month') {
                timeMatch = isWithinInterval(logDate, { start: startOfMonth(now), end: endOfMonth(now) });
            } else if (timeFrame === 'last-30-days') {
                const thirtyDaysAgo = subDays(now, 30);
                timeMatch = isWithinInterval(logDate, { start: thirtyDaysAgo, end: now });
            } else if (timeFrame === 'custom' && customRange?.from && customRange?.to) {
                timeMatch = isWithinInterval(logDate, { start: customRange.from, end: customRange.to });
            }

            return activityMatch && definitionMatch && timeMatch;
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
    }, [logs, activityTypeFilter, definitionSearch, timeFrame, customRange, sortConfig, showResults]);

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
        setDefinitionSearch('');
        setTimeFrame('last-30-days');
        setCustomRange(undefined);
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
            'Occurred Date': format(new Date(log.occurredDate), 'yyyy-MM-dd HH:mm:ss')
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');
        XLSX.writeFile(workbook, `Activity_Logs_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
        
        toast({
            title: "Export Success",
            description: "Activity logs have been exported to Excel.",
        });
    };

    const handleExportPDF = async () => {
        if (filteredAndSortedLogs.length === 0) {
            toast({
                variant: "destructive",
                title: "Export Failed",
                description: "No results found to export.",
            });
            return;
        }

        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('MedPoint Wiki - Activity Logs', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 30);
        
        let y = 40;
        const headers = ['User', 'Definition', 'Activity', 'Date'];
        const colWidths = [40, 70, 30, 50];
        
        // Header
        doc.setFont('helvetica', 'bold');
        headers.forEach((h, i) => {
            const x = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(h, x, y);
        });
        
        y += 5;
        doc.line(14, y, 200, y);
        y += 7;
        
        // Data
        doc.setFont('helvetica', 'normal');
        filteredAndSortedLogs.slice(0, 50).forEach((log) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            
            const row = [
                log.userName,
                log.definitionName,
                log.activityType,
                format(new Date(log.occurredDate), 'yyyy-MM-dd')
            ];
            
            row.forEach((text, i) => {
                const x = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
                const truncated = String(text).substring(0, i === 1 ? 35 : 20);
                doc.text(truncated, x, y);
            });
            
            y += 8;
        });

        if (filteredAndSortedLogs.length > 50) {
            doc.setFontSize(8);
            doc.text(`* Export limited to first 50 entries in PDF. Use Excel for full export.`, 14, y + 10);
        }
        
        doc.save(`Activity_Logs_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
        
        toast({
            title: "Export Success",
            description: "Activity logs have been exported to PDF.",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export Results
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportExcel}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Export as Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPDF}>
                                <FileText className="h-4 w-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                        <FilterX className="h-4 w-4 mr-2" />
                        Reset Filters
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="py-3 bg-muted/5 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Filters</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600">Definition Name</label>
                            <div className="relative" ref={searchRef}>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Type to search definition..." 
                                        className="pl-8 pr-10 bg-background"
                                        value={definitionSearch}
                                        onChange={(e) => {
                                            setDefinitionSearch(e.target.value);
                                            setIsSearchOpen(true);
                                            setCurrentPage(1);
                                        }}
                                        onFocus={() => setIsSearchOpen(true)}
                                    />
                                    {definitionSearch && (
                                        <button 
                                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setDefinitionSearch('');
                                                setIsSearchOpen(false);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                
                                {isSearchOpen && suggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95">
                                        <div className="p-1">
                                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Suggestions
                                            </div>
                                            {suggestions.map((name) => (
                                                <div
                                                    key={name}
                                                    className={cn(
                                                        "px-2 py-1.5 text-sm rounded-sm cursor-pointer flex items-center gap-2 transition-colors",
                                                        definitionSearch === name ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent hover:text-accent-foreground"
                                                    )}
                                                    onClick={() => {
                                                        setDefinitionSearch(name);
                                                        setIsSearchOpen(false);
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    <Check className={cn("h-3.5 w-3.5", definitionSearch === name ? "opacity-100" : "opacity-0")} />
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600">Activity Type</label>
                            <Select value={activityTypeFilter} onValueChange={(v) => { setActivityTypeFilter(v); setCurrentPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Activities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Activities</SelectItem>
                                    {activityTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600">Time Frame</label>
                            <Select value={timeFrame} onValueChange={(v) => { setTimeFrame(v); setCurrentPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Time Frame" />
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
                    </div>

                    {timeFrame === 'custom' && (
                        <div className="flex items-center gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Date Range</label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !customRange && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {customRange?.from ? (customRange.to ? <>{format(customRange.from, "LLL dd, y")} - {format(customRange.to, "LLL dd, y")}</> : format(customRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={customRange?.from}
                                                selected={customRange as any}
                                                onSelect={(range) => { setCustomRange(range as any); setCurrentPage(1); }}
                                                numberOfMonths={2}
                                                disabled={{ after: new Date() }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="min-h-[400px] flex flex-col overflow-hidden">
                <CardContent className="p-0 overflow-hidden flex-1">
                    {!showResults ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-32 px-4 bg-muted/5">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <History className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Activity History Ready</h3>
                            <p className="text-sm text-slate-500 max-w-sm mt-2">
                                Search the definition name to get the activity logs.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors py-4" onClick={() => handleSort('userName')}>
                                        <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                                            User Name
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'userName' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('definitionName')}>
                                        <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                                            Definition Name
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'definitionName' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('activityType')}>
                                        <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                                            Activity Type
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'activityType' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('occurredDate')}>
                                        <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                                            Occurred Date
                                            <ArrowUpDown className={cn("ml-2 h-3 w-3", sortConfig.key === 'occurredDate' ? "text-primary opacity-100" : "opacity-30")} />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium py-4">{log.userName}</TableCell>
                                        <TableCell>{log.definitionName}</TableCell>
                                        <TableCell>
                                            {log.activityType}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(log.occurredDate), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center bg-muted/5">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="h-8 w-8 text-muted-foreground/30" />
                                                <p className="text-sm font-medium text-muted-foreground">No logs found matching your selected filters.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                
                {showResults && filteredAndSortedLogs.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                            Showing {paginatedLogs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedLogs.length)} of {filteredAndSortedLogs.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <div className="flex items-center justify-center min-w-[3rem] text-sm font-medium">
                                {currentPage} / {totalPages || 1}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
