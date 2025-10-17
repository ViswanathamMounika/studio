
"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTopSearches, getTopViews } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type AnalyticsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDefinitionClick: (id: string) => void;
};

type ChartData = {
  name: string;
  count: number;
  id?: string;
}[];

const sampleSearches: ChartData = [
    { name: 'decision date', count: 25 },
    { name: 'sla', count: 22 },
    { name: 'claim status', count: 18 },
    { name: 'provider contract', count: 15 },
    { name: 'urgent', count: 12 },
    { name: 'turnaround time', count: 10 },
    { name: 'carve out', count: 9 },
    { name: 'cpt code', count: 7 },
    { name: 'fee schedule', count: 5 },
    { name: 'member id', count: 3 },
];

const sampleViews: ChartData = [
    { name: 'Auth Decision Date', count: 42, id: '1.1.1' },
    { name: 'Contracted Rates', count: 38, id: '2.1.1' },
    { name: 'Service Type Mapping', count: 35, id: '1.1.2' },
    { name: 'Provider Demographics', count: 31, id: '3.1.1' },
    { name: 'Claim Adjudication Status', count: 28, id: '1.2.1' },
    { name: 'Network Participation Rules', count: 24, id: '3.1.2' },
    { name: 'Credentialing Status', count: 20, id: '3.1.3' },
    { name: 'Authorization Timeliness', count: 19, id: '1.1.3' },
    { name: 'Member Eligibility', count: 15, id: '4.1.1' },
    { name: 'Provider Directory Accuracy', count: 11, id: '3.1.4' },
];


export default function AnalyticsModal({ open, onOpenChange, onDefinitionClick }: AnalyticsModalProps) {
  const [topSearches, setTopSearches] = useState<ChartData>([]);
  const [topViews, setTopViews] = useState<ChartData>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (open) {
      fetchAnalytics();
    }
  }, [open, dateRange]);

  const fetchAnalytics = () => {
    const searches = getTopSearches(10, dateRange);
    setTopSearches(searches.length > 0 ? searches : sampleSearches);
    
    const views = getTopViews(10, dateRange);
    setTopViews(views.length > 0 ? views : sampleViews);
  };
  
  const setPresetRange = (preset: 'today' | 'week' | 'month') => {
    const today = new Date();
    if (preset === 'today') {
      setDateRange({ from: today, to: today });
    } else if (preset === 'week') {
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      setDateRange({ from, to: today });
    } else if (preset === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      setDateRange({ from, to: today });
    }
  };

  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const { value, id } = topViews.find(item => item.name === payload.value) || {};
    
    const handleClick = () => {
        if (id) {
            onDefinitionClick(id);
            onOpenChange(false);
        }
    };

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={0}
          dx={-10}
          textAnchor="end"
          fill="#666"
          fontSize={12}
          className={id ? "cursor-pointer hover:underline" : ""}
          onClick={handleClick}
        >
          {value}
        </text>
      </g>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Usage Analytics</DialogTitle>
          <DialogDescription>
            Showing the most searched terms and most viewed definitions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-4">
            <Button variant="outline" onClick={() => setPresetRange('today')}>Today</Button>
            <Button variant="outline" onClick={() => setPresetRange('week')}>Past Week</Button>
            <Button variant="outline" onClick={() => setPresetRange('month')}>Past Month</Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            <Button onClick={() => setDateRange(undefined)}>Clear</Button>
        </div>
        <ScrollArea className="flex-1 py-4 pr-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Top 10 Searched Terms</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topSearches} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="count" name="Search Count" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                    <CardTitle>Top 10 Viewed Definitions</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topViews} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={150} tick={<CustomTick />} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="count" name="View Count" fill="hsl(var(--accent))" />
                        </BarChart>
                    </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
