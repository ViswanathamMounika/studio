
"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import AppHeader from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTopSearchedTerms, getMostViewedDefinitions } from "@/lib/analytics";
import { Menu } from "lucide-react";

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
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Search Term</TableHead>
                                            <TableHead className="text-right">Count</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topSearches.map((search) => (
                                            <TableRow key={search.term}>
                                                <TableCell className="font-medium">{search.term}</TableCell>
                                                <TableCell className="text-right">{search.count}</TableCell>
                                            </TableRow>
                                        ))}
                                        {topSearches.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground">No search data available.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Viewed Definitions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Definition Name</TableHead>
                                            <TableHead className="text-right">Views</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mostViewed.map((def) => (
                                            <TableRow key={def.id}>
                                                <TableCell className="font-medium">{def.name}</TableCell>
                                                <TableCell className="text-right">{def.count}</TableCell>
                                            </TableRow>
                                        ))}
                                         {mostViewed.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground">No view data available.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
