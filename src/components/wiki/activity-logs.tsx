
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isWithinInterval, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CalendarIcon, ArrowUpDown, FilterX, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityLog, ActivityType } from '@/lib/types';
import { initialActivityLogs } from '@/lib/data';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';

const activityTypes: ActivityType[] = ['View', 'Edit', 'Create', 'Download', 'Bookmark', 'Archive', 'Duplicate', 'Search'];

type MultiSelectFilterProps = {
    title: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
    placeholder: string;
}

function MultiSelectFilter({ title, options, selected, onToggle, placeholder }: MultiSelectFilterProps) {
    const [search, setSearch] = useState('');
    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-2">
            <label className="text-xs font-medium">{title}</label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-auto min-h-[40px] px-3"
                    >
                        <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                            {selected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
                            {selected.map(val => (
                                <Badge key={val} variant="secondary" className="mr-1 text-[10px] py-0 px-1">
                                    {val}
                                </Badge>
                            ))}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="p-2 border-b">
                        <Input 
                            placeholder={`Search ${title.toLowerCase()}...`} 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <ScrollArea className="h-64">
                        <div className="p-1">
                            {filteredOptions.length === 0 && (
                                <p className="text-sm text-center py-4 text-muted-foreground">No results found.</p>
                            )}
                            {filteredOptions.map((option) => (
                                <div
                                    key={option}
                                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                                    onClick={() => onToggle(option)}
                                >
                                    <Checkbox
                                        id={`${title}-${option}`}
                                        checked={selected.includes(option)}
                                        onCheckedChange={() => onToggle(option)}
                                    />
                                    <label
                                        htmlFor={`${title}-${option}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                        {option}
                                    </label>
                                    {selected.includes(option) && <Check className="h-4 w-4 text-primary" />}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default function ActivityLogs() {
    const [logs] = useState<ActivityLog[]>(initialActivityLogs);
    const [userFilters, setUserFilters] = useState<string[]>([]);
    const [activityFilters, setActivityFilters] = useState<string[]>([]);
    const [definitionFilters, setDefinitionFilters] = useState<string[]>([]);
    const [timeFrame, setTimeFrame] = useState('all');
    const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const users = useMemo(() => Array.from(new Set(logs.map(log => log.userName))).sort(), [logs]);
    const definitions = useMemo(() => Array.from(new Set(logs.map(log => log.definitionName))).sort(), [logs]);

    const handleToggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], value: string) => {
        if (current.includes(value)) {
            setter(current.filter(v => v !== value));
        } else {
            setter([...current, value]);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const userMatch = userFilters.length === 0 || userFilters.includes(log.userName);
            const activityMatch = activityFilters.length === 0 || activityFilters.includes(log.activityType);
            const definitionMatch = definitionFilters.length === 0 || definitionFilters.includes(log.definitionName);

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
    }, [logs, userFilters, activityFilters, definitionFilters, timeFrame, customRange, sortDirection]);

    const toggleSort = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const resetFilters = () => {
        setUserFilters([]);
        setActivityFilters([]);
        setDefinitionFilters([]);
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
                        <MultiSelectFilter 
                            title="User" 
                            options={users} 
                            selected={userFilters} 
                            onToggle={(val) => handleToggleFilter(setUserFilters, userFilters, val)}
                            placeholder="All Users"
                        />

                        <MultiSelectFilter 
                            title="Activity Type" 
                            options={activityTypes} 
                            selected={activityFilters} 
                            onToggle={(val) => handleToggleFilter(setActivityFilters, activityFilters, val)}
                            placeholder="All Activities"
                        />

                        <MultiSelectFilter 
                            title="Definition" 
                            options={definitions} 
                            selected={definitionFilters} 
                            onToggle={(val) => handleToggleFilter(setDefinitionFilters, definitionFilters, val)}
                            placeholder="All Definitions"
                        />

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
                                    <TableCell>
                                        <Badge variant="outline">{log.activityType}</Badge>
                                    </TableCell>
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
