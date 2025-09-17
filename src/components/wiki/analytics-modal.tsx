
"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTopSearches, getTopViewsByModule } from '@/lib/analytics';
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

const sampleMMViews: ChartData = [
    { name: 'Auth Decision Date', count: 42 },
    { name: 'Service Type Mapping', count: 35 },
    { name: 'Claim Adjudication Status', count: 28 },
    { name: 'Authorization Timeliness', count: 19 },
    { name: 'Member Eligibility', count: 15 },
];

const samplePNViews: ChartData = [
    { name: 'Contracted Rates', count: 38 },
    { name: 'Provider Demographics', count: 31 },
    { name: 'Network Participation Rules', count: 24 },
    { name: 'Credentialing Status', count: 20 },
    { name: 'Provider Directory Accuracy', count: 11 },
];

const MODULES = ['Member Management', 'Provider Network', 'Authorizations', 'Claims', 'Core'];

export default function AnalyticsModal({ open, onOpenChange }: AnalyticsModalProps) {
  const [topSearches, setTopSearches] = useState<ChartData>([]);
  const [topViewsByModule, setTopViewsByModule] = useState<Record<string, ChartData>>({});

  useEffect(() => {
    if (open) {
      const searches = getTopSearches(10);
      setTopSearches(searches.length > 0 ? searches : sampleSearches);
      
      const viewsData: Record<string, ChartData> = {};
      MODULES.forEach(module => {
        const views = getTopViewsByModule(module, 10);
        if(views.length > 0){
            viewsData[module] = views;
        }
      });

      if (Object.keys(viewsData).length === 0) {
        viewsData['Member Management'] = sampleMMViews;
        viewsData['Provider Network'] = samplePNViews;
      }
      
      setTopViewsByModule(viewsData);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Usage Analytics</DialogTitle>
          <DialogDescription>
            Showing the most searched terms and most viewed definitions by module.
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
                
                {Object.keys(topViewsByModule).map(module => {
                    const moduleData = topViewsByModule[module] || [];
                    if (moduleData.length === 0) return null;
                    return (
                        <Card key={module}>
                            <CardHeader>
                            <CardTitle>Top Viewed in: {module}</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={moduleData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="count" name="View Count" fill="hsl(var(--accent))" />
                                </BarChart>
                            </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
