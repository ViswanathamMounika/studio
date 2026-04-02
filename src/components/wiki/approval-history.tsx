"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    Download, 
    FileSpreadsheet, 
    FileText, 
    FilterX, 
    ArrowUpDown, 
    History,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Send
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ApprovalHistoryEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 15;

export default function ApprovalHistory({ history }: { history: ApprovalHistoryEntry[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ApprovalHistoryEntry; direction: 'asc' | 'desc' }>({
        key: 'date',
        direction: 'desc'
    });
    const { toast } = useToast();

    const filteredAndSortedHistory = useMemo(() => {
        if (!Array.isArray(history)) return [];

        return history.filter(entry => {
            const matchesSearch = !searchQuery || 
                entry.definitionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (entry.comment || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        }).sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            
            if (sortConfig.key === 'date') {
                return sortConfig.direction === 'desc' 
                    ? new Date(valB as string).getTime() - new Date(valA as string).getTime()
                    : new Date(valA as string).getTime() - new Date(valB as string).getTime();
            }
            
            const stringA = String(valA).toLowerCase();
            const stringB = String(valB).toLowerCase();
            return sortConfig.direction === 'asc' 
                ? stringA.localeCompare(stringB) 
                : stringB.localeCompare(stringA);
        });
    }, [history, searchQuery, sortConfig]);

    const paginatedHistory = filteredAndSortedHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredAndSortedHistory.length / ITEMS_PER_PAGE);

    const handleSort = (key: keyof ApprovalHistoryEntry) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getActionBadge = (action: ApprovalHistoryEntry['action']) => {
        switch (action) {
            case 'Approved':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold gap-1.5 h-6"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
            case 'Rejected':
                return <Badge className="bg-red-50 text-red-700 border-red-100 font-bold gap-1.5 h-6"><XCircle className="h-3 w-3" /> Rejected</Badge>;
            case 'Changes Requested':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold gap-1.5 h-6"><RefreshCw className="h-3 w-3" /> Requested</Badge>;
            case 'Submitted':
                return <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-bold gap-1.5 h-6"><Send className="h-3 w-3" /> Submitted</Badge>;
        }
    };

    const handleExportExcel = async () => {
        const XLSX = await import('xlsx');
        const exportData = filteredAndSortedHistory.map(h => ({
            'Definition': h.definitionName,
            'Action': h.action,
            'User': h.userName,
            'Date': format(new Date(h.date), 'yyyy-MM-dd HH:mm'),
            'Comments': h.comment || ''
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Approval History');
        XLSX.writeFile(wb, `Approval_History_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Success", description: "History exported to Excel." });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Approval History</h1>
                    <p className="text-sm text-slate-500 font-medium">Global audit trail of documentation governance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportExcel}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Export as Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                        <FilterX className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="py-4 border-b bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Filter by definition, user, or keyword..." 
                            className="pl-9 bg-white rounded-xl border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/50 border-none">
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('definitionName')}>
                                    Definition Name <ArrowUpDown className="h-3 w-3 inline ml-1" />
                                </TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Action</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('userName')}>
                                    User <ArrowUpDown className="h-3 w-3 inline ml-1" />
                                </TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('date')}>
                                    Date <ArrowUpDown className="h-3 w-3 inline ml-1" />
                                </TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Comments</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedHistory.map(entry => (
                                <TableRow key={entry.id} className="hover:bg-slate-50/50 border-slate-100">
                                    <TableCell className="font-bold text-slate-900 py-4">{entry.definitionName}</TableCell>
                                    <TableCell>{getActionBadge(entry.action)}</TableCell>
                                    <TableCell className="text-slate-600 font-medium">{entry.userName}</TableCell>
                                    <TableCell className="text-slate-500 whitespace-nowrap">{format(new Date(entry.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                                    <TableCell className="text-slate-500 text-xs italic max-w-xs truncate">
                                        {entry.comment || '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {paginatedHistory.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-3 py-12">
                                            <History className="h-10 w-10 text-slate-200" />
                                            <p className="text-slate-400 font-medium italic">No approval records match your criteria.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {totalPages > 1 && (
                    <div className="p-4 border-t bg-slate-50/50 flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Page {currentPage} of {totalPages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 rounded-lg font-bold">Prev</Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 rounded-lg font-bold">Next</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
