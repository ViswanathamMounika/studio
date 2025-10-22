

"use client";

import React, { useState, useRef, useMemo } from 'react';
import { defDataTable, allDataTables } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PlusCircle, Edit, Trash2, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type DataRow = (typeof defDataTable.rows)[0];

const initialFormState: Omit<DataRow, 'ID' | 'CREATEDBY' | 'CREATEDDATE' | 'LASTCHANGEDBY' | 'LASTCHANGEDDATE'> = {
  OBJECT_TYPE: 1,
  SERVER_NAME: '',
  DATABASE_NAME: '',
  QUERY: '',
  NAME: '',
  DESCRIPTION: '',
};

const ITEMS_PER_PAGE = 15;

const headerMapping: Record<keyof DataRow, string> = {
    ID: "ID",
    OBJECT_TYPE: "Query Type",
    SERVER_NAME: "Server Name",
    DATABASE_NAME: "Database Name",
    QUERY: "Query",
    NAME: "Name",
    DESCRIPTION: "Description",
    CREATEDBY: "Created By",
    CREATEDDATE: "Created Date",
    LASTCHANGEDBY: "Last Changed By",
    LASTCHANGEDDATE: "Last Changed Date"
}

export default function DataTables() {
  const [rows, setRows] = useState(defDataTable.rows);
  const [formData, setFormData] = useState<DataRow>({ ...initialFormState, ID: 0, CREATEDBY: '', CREATEDDATE: '', LASTCHANGEDBY: '', LASTCHANGEDDATE: ''});
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: (string|number|null)[][] } | null>(null);

  const { toast } = useToast();
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    defDataTable.headers.forEach(h => {
        widths[h] = h === 'QUERY' || h === 'NAME' || h === 'DESCRIPTION' ? 250 : 150;
    });
    return widths;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, col: string) => {
    e.preventDefault();
    resizingRef.current = {
      col,
      startX: e.clientX,
      startWidth: colWidths[col]
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { col, startX, startWidth } = resizingRef.current;
    const newWidth = startWidth + (e.clientX - startX);
    if (newWidth > 50) {
      setColWidths(prev => ({ ...prev, [col]: newWidth }));
    }
  };

  const handleMouseUp = () => {
    resizingRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) as any }));
  }
  
  const handleAddNew = () => {
      setIsEditing(false);
      const newId = rows.length > 0 ? Math.max(...rows.map(r => r.ID)) + 1 : 1;
      setFormData({
        ...initialFormState,
        ID: newId,
        CREATEDBY: 'Current User', // Placeholder
        LASTCHANGEDBY: 'Current User', // Placeholder
        CREATEDDATE: new Date().toISOString(),
        LASTCHANGEDDATE: new Date().toISOString(),
      });
      setIsModalOpen(true);
  };
  
  const handleEdit = (row: DataRow) => {
      setIsEditing(true);
      setFormData(row);
      setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setRows(prev => prev.filter(row => row.ID !== id));
    toast({
        title: "Row Deleted",
        description: `Row with ID ${id} has been successfully deleted.`,
    });
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    if (isEditing) {
      setRows(prev => prev.map(row => (row.ID === formData.ID ? {...formData, LASTCHANGEDDATE: now, LASTCHANGEDBY: 'Current User'} : row)));
      toast({ title: 'Success', description: 'Row updated successfully.' });
    } else {
      setRows(prev => [...prev, { ...formData, CREATEDDATE: now, LASTCHANGEDDATE: now }]);
      toast({ title: 'Success', description: 'New row added successfully.' });
    }
    setIsModalOpen(false);
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery) {
      return rows;
    }
    return rows.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [rows, searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  }

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(startItem + ITEMS_PER_PAGE - 1, filteredRows.length);
  
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const mapObjectType = (type: number) => {
      return type === 1 ? 'View Query' : 'Table Query';
  }

  const handlePreview = (row: DataRow) => {
    // In a real app, you would execute the row.QUERY here.
    // For this prototype, we'll just show some dummy data from allDataTables.
    const dummyData = allDataTables[Math.floor(Math.random() * allDataTables.length)];
    setPreviewData({ headers: dummyData.headers, rows: dummyData.rows.map(r => r.map(c => c)) });
    setIsPreviewModalOpen(true);
  }

  return (
    <div className="w-full p-4 sm:p-6">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>Supporting Queries</CardTitle>
                  <CardDescription>Contains metadata and queries for definitions.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="Search table..."
                          className="w-full rounded-lg bg-background pl-8"
                          value={searchQuery}
                          onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1); // Reset to first page on search
                          }}
                      />
                  </div>
                  <Button onClick={handleAddNew}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New
                  </Button>
              </div>
          </CardHeader>
          <CardContent className="p-0">
               <div className="overflow-x-auto border-t">
                  <Table className="min-w-full">
                      <TableHeader>
                          <TableRow>
                          {defDataTable.headers.map((header) => (
                              <TableHead key={header} style={{ width: colWidths[header], position: 'relative' }}>
                                  <div className="flex items-center justify-between">
                                      {headerMapping[header as keyof DataRow]}
                                      <div
                                      onMouseDown={(e) => handleMouseDown(e, header)}
                                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize" 
                                      />
                                  </div>
                              </TableHead>
                          ))}
                          <TableHead className="w-[120px] text-center">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paginatedRows.map((row) => (
                          <TableRow key={row.ID}>
                              {defDataTable.headers.map((header) => {
                                const cellValue = row[header as keyof typeof row];
                                const displayValue = header === 'CREATEDDATE' || header === 'LASTCHANGEDDATE'
                                    ? formatDate(String(cellValue))
                                    : header === 'OBJECT_TYPE'
                                    ? mapObjectType(cellValue as number)
                                    : cellValue !== null ? String(cellValue) : 'NULL';
                                
                                return (
                                  <TableCell key={header} className="truncate" style={{ maxWidth: colWidths[header]}}>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="block truncate">{displayValue}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{displayValue}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                )
                              })}
                              <TableCell className="text-center">
                                  <div className="flex justify-center gap-1">
                                      <Button variant="ghost" size="icon" onClick={() => handlePreview(row)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                              <AlertDialogDescription>This will permanently delete the row with ID {row.ID}.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(row.ID)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                              </TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
          <div className="flex items-center justify-between p-6 border-t">
              <p className="text-sm text-muted-foreground">
                  Showing {startItem} - {endItem} of {filteredRows.length} items
              </p>
              <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      Previous
                  </Button>
                  {[...Array(totalPages > 5 ? 5 : totalPages).keys()].map(num => {
                      let pageNum = num + 1;
                      if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 2 + num;
                          if (pageNum > totalPages) return null;
                      }
                       return (
                          <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} onClick={() => handlePageChange(pageNum)}>
                              {pageNum}
                          </Button>
                      )
                  })}
                   {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                      <span>...</span>
                      <Button variant="outline" onClick={() => handlePageChange(totalPages)}>{totalPages}</Button>
                      </>
                  )}
                  <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      Next
                  </Button>
              </div>
          </div>
     </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Supporting Query' : 'Add New Supporting Query'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="NAME">{headerMapping.NAME}</Label>
                <Input id="NAME" name="NAME" value={formData.NAME} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="DESCRIPTION">{headerMapping.DESCRIPTION}</Label>
                <Textarea id="DESCRIPTION" name="DESCRIPTION" value={formData.DESCRIPTION || ''} onChange={handleInputChange} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="OBJECT_TYPE">{headerMapping.OBJECT_TYPE}</Label>
                <Select name="OBJECT_TYPE" value={String(formData.OBJECT_TYPE)} onValueChange={(value) => handleSelectChange('OBJECT_TYPE', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a query type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">View Query</SelectItem>
                        <SelectItem value="2">Table Query</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="SERVER_NAME">{headerMapping.SERVER_NAME}</Label>
                <Input id="SERVER_NAME" name="SERVER_NAME" value={formData.SERVER_NAME} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="DATABASE_NAME">{headerMapping.DATABASE_NAME}</Label>
                <Input id="DATABASE_NAME" name="DATABASE_NAME" value={formData.DATABASE_NAME} onChange={handleInputChange} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="QUERY">{headerMapping.QUERY}</Label>
                <Textarea id="QUERY" name="QUERY" value={formData.QUERY} onChange={handleInputChange} className="font-mono h-32" />
              </div>
          </div>
          <DialogFooter className='sm:justify-between w-full'>
            <Button variant="outline" onClick={() => handlePreview(formData)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Data
            </Button>
            <div className='flex gap-2'>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Data Preview</DialogTitle>
                <DialogDescription>Showing a preview of the query results. This is sample data.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {previewData?.headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {previewData?.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex}>{String(cell)}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    