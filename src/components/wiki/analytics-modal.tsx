
"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTopSearches, getTopViews } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';

type AnalyticsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChartData = {
  name: string;
  count: number;
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
    { name: 'Auth Decision Date', count: 42 },
    { name: 'Contracted Rates', count: 38 },
    { name: 'Service Type Mapping', count: 35 },
    { name: 'Provider Demographics', count: 31 },
    { name: 'Claim Adjudication Status', count: 28 },
    { name: 'Network Participation Rules', count: 24 },
    { name: 'Credentialing Status', count: 20 },
    { name: 'Authorization Timeliness', count: 19 },
    { name: 'Member Eligibility', count: 15 },
    { name: 'Provider Directory Accuracy', count: 11 },
];


export default function AnalyticsModal({ open, onOpenChange }: AnalyticsModalProps) {
  const [topSearches, setTopSearches] = useState<ChartData>([]);
  const [topViews, setTopViews] = useState<ChartData>([]);

  useEffect(() => {
    if (open) {
      const searches = getTopSearches(10);
      setTopSearches(searches.length > 0 ? searches : sampleSearches);
      
      const views = getTopViews(10);
      setTopViews(views.length > 0 ? views : sampleViews);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Usage Analytics</DialogTitle>
          <DialogDescription>
            Showing the most searched terms and most viewed definitions.
          </DialogDescription>
        </DialogHeader>
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
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
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
