
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SupportingTable } from '@/lib/types';
import { allDataTables } from '@/lib/data';

type DataSourcePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceName: string | null;
  databaseName?: string;
};

export default function DataSourcePreviewDialog({ open, onOpenChange, sourceName, databaseName }: DataSourcePreviewDialogProps) {
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(5);

  const previewTable = useMemo(() => {
    if (!sourceName) return null;
    // Mock data lookup: find by name substring or return a random one for demo
    return allDataTables.find(t => t.name.toLowerCase().includes(sourceName.toLowerCase())) 
           || allDataTables[Math.floor(Math.random() * allDataTables.length)];
  }, [sourceName]);

  useEffect(() => {
    if (open) {
      setPreviewPage(1);
      setPreviewPageSize(5);
    }
  }, [open]);

  const paginatedRows = useMemo(() => {
    if (!previewTable) return [];
    const start = (previewPage - 1) * previewPageSize;
    return previewTable.rows.slice(start, start + previewPageSize);
  }, [previewTable, previewPage, previewPageSize]);

  const totalPages = useMemo(() => {
    if (!previewTable) return 0;
    return Math.ceil(previewTable.rows.length / previewPageSize);
  }, [previewTable, previewPageSize]);

  if (!sourceName) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{previewTable?.name || 'Data Preview'}</DialogTitle>
          <DialogDescription>
            Displaying top rows from {sourceName} {databaseName ? `in ${databaseName}` : ''}. Showing sample data for documentation purposes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-auto border rounded-md my-4">
          <Table>
            <TableHeader>
              <TableRow>
                {previewTable?.headers.map((header) => (
                  <TableHead key={header} className="whitespace-nowrap bg-muted/50">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="whitespace-nowrap">
                      {cell !== null ? String(cell) : <span className="text-muted-foreground italic">NULL</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {paginatedRows.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No data available for this source.</div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
            <Select value={String(previewPageSize)} onValueChange={(v) => {
              setPreviewPageSize(Number(v));
              setPreviewPage(1);
            }}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                {previewTable && previewTable.rows.length > 5 && (
                  <SelectItem value="10">10</SelectItem>
                )}
                {previewTable && previewTable.rows.length > 10 && (
                  <SelectItem value="20">20</SelectItem>
                )}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-2">
              Page {previewPage} of {totalPages || 1}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
              disabled={previewPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}
              disabled={previewPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
