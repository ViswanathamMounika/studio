
"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopSearchedTerms, getMostViewedDefinitions } from "@/lib/analytics";
import { Menu } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type SearchTerm = {
    term: string;
    count: number;
};

type ViewedDefinition = {
    id: string;
    name: string;
    count: number;
};

export default function AnalyticsPage() {
    const [topSearches, setTopSearches] = useState<SearchTerm[]>([]);
    const [mostViewed, setMostViewed] = useState<ViewedDefinition[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setTopSearches(getTopSearchedTerms());
        setMostViewed(getMostViewedDefinitions());
    }, []);
    
    if (!isMounted) {
        return null; // or a loading spinner
    }

    const searchChartConfig = {
      count: {
        label: "Searches",
        color: "hsl(var(--chart-1))",
      },
    };

    const viewedChartConfig = {
      count: {
        label: "Views",
        color: "hsl(var(--chart-2))",
      },
    };

    return (
        <SidebarProvider>
            <Sidebar>
                <AppSidebar />
            </Sidebar>
            <SidebarInset>
                <AppHeader>
                    <SidebarTrigger className="sm:hidden">
                        <Menu />
                    </SidebarTrigger>
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hidden sm:flex h-7 w-7">
                            <Menu />
                        </SidebarTrigger>
                        <h1 className="text-xl font-bold tracking-tight">Usage Analytics</h1>
                    </div>
                </AppHeader>
                <main className="p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Searched Terms</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {topSearches.length > 0 ? (
                                    <ChartContainer config={searchChartConfig} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topSearches} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="term" tickLine={false} tickMargin={10} axisLine={false} />
                                                <YAxis />
                                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                        No search data available.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Viewed Definitions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {mostViewed.length > 0 ? (
                                    <ChartContainer config={viewedChartConfig} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={mostViewed} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                                <YAxis />
                                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                        No view data available.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
