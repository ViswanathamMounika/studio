"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isWithinInterval, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CalendarIcon, ArrowUpDown, FilterX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityLog, ActivityType } from '@/lib/types';
import { initialActivityLogs } from '@/lib/data';

const activityTypes: ActivityType[] = ['View', 'Edit', 'Create', 'Download', 'Delete', 'Archive', 'Duplicate', 'Search'];

export default function ActivityLogs() {
    const [logs] = useState<ActivityLog[]>(initialActivityLogs);
    const [userFilter, setUserFilter] = useState('all');
    const [activityFilter, setActivityFilter] = useState('all');
    const [definitionFilter, setDefinitionFilter] = useState('all');
    const [timeFrame, setTimeFrame] = useState('all');
    const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const users = useMemo(() => Array.from(new Set(logs.map(log => log.userName))), [logs]);
    const definitions = useMemo(() => Array.from(new Set(logs.map(log => log.definitionName))), [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const userMatch = userFilter === 'all' || log.userName === userFilter;
            const activityMatch = activityFilter === 'all' || log.activityType === activityFilter;
            const definitionMatch = definitionFilter === 'all' || log.definitionName === definitionFilter;

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
            } else if (timeFrame === 'last-month') {
                const startOfLast = startOfMonth(subMonths(now, 1));
                const endOfLast = endOfMonth(subMonths(now, 1));
                timeMatch = isWithinInterval(logDate, { start: startOfLast, end: endOfLast });
            } else if (timeFrame === 'custom' && customRange?.from && customRange?.to) {
                timeMatch = isWithinInterval(logDate, { start: customRange.from, end: customRange.to });
            }

            return userMatch && activityMatch && definitionMatch && timeMatch;
        }).sort((a, b) => {
            const dateA = new Date(a.occurredDate).getTime();
            const dateB = new Date(b.occurredDate).getTime();
            return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [logs, userFilter, activityFilter, definitionFilter, timeFrame, customRange, sortDirection]);

    const toggleSort = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const resetFilters = () => {
        setUserFilter('all');
        setActivityFilter('all');
        setDefinitionFilter('all');
        setTimeFrame('all');
        setCustomRange(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                    <FilterX className="h-4 w-4 mr-2" />
                    Reset Filters
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">User</label>
                            <Select value={userFilter} onValueChange={setUserFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user} value={user}>{user}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium">Activity Type</label>
                            <Select value={activityFilter} onValueChange={setActivityFilter}>
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
                            <label className="text-xs font-medium">Definition</label>
                            <Select value={definitionFilter} onValueChange={setDefinitionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Definitions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Definitions</SelectItem>
                                    {definitions.map(def => (
                                        <SelectItem key={def} value={def}>{def}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium">Time Frame</label>
                            <Select value={timeFrame} onValueChange={setTimeFrame}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="this-week">This Week</SelectItem>
                                    <SelectItem value="last-week">Last Week</SelectItem>
                                    <SelectItem value="this-month">This Month</SelectItem>
                                    <SelectItem value="last-month">Last Month</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {timeFrame === 'custom' && (
                        <div className="flex items-center gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Date Range</label>
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
                                                onSelect={(range: any) => setCustomRange(range)}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Name</TableHead>
                                <TableHead>Definition Name</TableHead>
                                <TableHead>Activity Type</TableHead>
                                <TableHead className="cursor-pointer" onClick={toggleSort}>
                                    <div className="flex items-center">
                                        Occurred Date
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.userName}</TableCell>
                                    <TableCell>{log.definitionName}</TableCell>
                                    <TableCell>{log.activityType}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(log.occurredDate), 'MMM dd, yyyy HH:mm')}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredLogs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No logs found matching the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
