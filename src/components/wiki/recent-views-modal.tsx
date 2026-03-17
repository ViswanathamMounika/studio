
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

const ITEMS_PER_PAGE = 10;

export default function RecentViewsModal({ open, onOpenChange, onDefinitionClick }: RecentViewsModalProps) {
  const [recentViews, setRecentViews] = useState<RecentViewData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (open) {
      const recents = getRecentViews();
      setRecentViews(recents);
      setCurrentPage(1);
    }
  }, [open]);

  const paginatedViews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return recentViews.slice(start, start + ITEMS_PER_PAGE);
  }, [recentViews, currentPage]);

  const totalPages = Math.ceil(recentViews.length / ITEMS_PER_PAGE);

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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Clock className="h-5 w-5 text-primary" />
            Recently Viewed Definitions
          </DialogTitle>
          <DialogDescription className="text-sm">
            A history of definitions you have accessed recently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 bg-slate-50/30">
            <ScrollArea className="h-full">
                <div className="p-6 pt-4">
                    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="font-bold">Definition Name</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="text-right font-bold">Last Viewed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedViews.map(item => {
                                    const itemDate = new Date(item.date);
                                    return (
                                        <TableRow key={`${item.id}-${item.date}`} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="py-4">
                                                <button 
                                                    className="text-primary hover:underline font-bold text-left text-sm"
                                                    onClick={() => handleDefinitionClick(item.id)}
                                                >
                                                    {item.name}
                                                </button>
                                                <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">{item.module}</p>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground whitespace-nowrap text-xs">
                                                {isValid(itemDate) ? formatDistanceToNow(itemDate, { addSuffix: true }) : ''}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {paginatedViews.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2 opacity-40">
                                                <Clock className="h-10 w-10" />
                                                <p className="text-sm font-medium">No recent activity found.</p>
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

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t p-4 px-6 bg-white">
            <div className="text-sm text-muted-foreground font-medium">
                Showing {recentViews.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, recentViews.length)} of {recentViews.length}
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-lg h-9 px-4"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                <div className="flex items-center justify-center min-w-[3rem] text-sm font-bold text-slate-700">
                    {currentPage} / {totalPages || 1}
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-lg h-9 px-4"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || totalPages === 0}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
