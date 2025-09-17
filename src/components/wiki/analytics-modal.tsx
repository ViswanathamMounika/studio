
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

const MODULES = ['Member Management', 'Provider Network', 'Authorizations', 'Claims', 'Core'];

export default function AnalyticsModal({ open, onOpenChange }: AnalyticsModalProps) {
  const [topSearches, setTopSearches] = useState<ChartData>([]);
  const [topViewsByModule, setTopViewsByModule] = useState<Record<string, ChartData>>({});

  useEffect(() => {
    if (open) {
      setTopSearches(getTopSearches(10));
      const viewsData: Record<string, ChartData> = {};
      MODULES.forEach(module => {
        viewsData[module] = getTopViewsByModule(module, 10);
      });
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
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="count" name="Search Count" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                    </CardContent>
                </Card>
                
                {MODULES.map(module => {
                    const moduleData = topViewsByModule[module] || [];
                    if (moduleData.length === 0) return null;
                    return (
                        <Card key={module}>
                            <CardHeader>
                            <CardTitle>Top 10 Viewed in: {module}</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={moduleData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
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
