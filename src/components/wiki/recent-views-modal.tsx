
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getRecentViews } from '@/lib/analytics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RecentViewsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDefinitionClick: (id: string) => void;
};

type RecentViewData = {
    id: string;
    name: string;
    date: string;
    module: string;
    status: string;
}

export default function RecentViewsModal({ open, onOpenChange, onDefinitionClick }: RecentViewsModalProps) {
  const [recentViews, setRecentViews] = useState<RecentViewData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (open) {
      const recents = getRecentViews();
      setRecentViews(recents);
      setCurrentPage(1);
    }
  }, [open]);

  const paginatedViews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return recentViews.slice(start, start + itemsPerPage);
  }, [recentViews, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(recentViews.length / itemsPerPage);

  const handleDefinitionClick = (id: string) => {
    onDefinitionClick(id);
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Archived':
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold">Archived</Badge>;
      case 'Draft':
        return <Badge variant="secondary" className="text-[10px] uppercase font-bold">Draft</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-bold text-green-600 border-green-200 bg-green-50">Published</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden border-none rounded-[20px] shadow-2xl">
        <DialogHeader className="p-6 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Recent Activity</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                    A comprehensive history of definitions you have accessed recently.
                </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 bg-slate-50/30">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-slate-200">
                                    <TableHead className="font-black text-slate-900 h-12 uppercase text-[11px] tracking-wider px-6">Definition Name</TableHead>
                                    <TableHead className="font-black text-slate-900 h-12 uppercase text-[11px] tracking-wider">Status</TableHead>
                                    <TableHead className="text-right font-black text-slate-900 h-12 uppercase text-[11px] tracking-wider px-6">Last Viewed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedViews.map((item, idx) => {
                                    const itemDate = new Date(item.date);
                                    return (
                                        <TableRow key={`${item.id}-${item.date}-${idx}`} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                                            <TableCell className="py-4 px-6">
                                                <button 
                                                    className="text-primary hover:underline font-bold text-left text-[13px] block"
                                                    onClick={() => handleDefinitionClick(item.id)}
                                                >
                                                    {item.name}
                                                </button>
                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 block">
                                                    {item.module}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 whitespace-nowrap text-xs font-medium px-6">
                                                {isValid(itemDate) ? formatDistanceToNow(itemDate, { addSuffix: true }) : 'Recently'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {paginatedViews.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Clock className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-900">No recent activity</p>
                                                    <p className="text-xs text-slate-500">Definitions you view will appear here for quick access.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t p-4 px-6 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Showing {recentViews.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, recentViews.length)} of {recentViews.length}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Items per page:</span>
                    <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                        <SelectTrigger className="h-7 w-16 text-[11px] font-bold rounded-lg border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1.5" />
                    Previous
                </Button>
                <div className="flex items-center justify-center min-w-[3.5rem] h-9 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-primary">
                    {currentPage} / {totalPages || 1}
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || totalPages === 0}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
