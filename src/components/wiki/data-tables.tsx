

"use client";

import React, { useState, useMemo, useCallback } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PlusCircle, Edit, Trash2, Eye, Info, ArrowUpDown, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';

type DataRow = (typeof defDataTable.rows)[0];
type SortKey = keyof DataRow;

const initialFormState: Omit<DataRow, 'ID' | 'CREATEDBY' | 'CREATEDDATE' | 'LASTCHANGEDBY' | 'LASTCHANGEDDATE'> = {
  OBJECT_TYPE: 1,
  SERVER_NAME: '',
  DATABASE_NAME: '',
  QUERY: '',
  NAME: '',
  DESCRIPTION: '',
};

const ITEMS_PER_PAGE = 10;

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
  const [isConnectionSuccessful, setIsConnectionSuccessful] = useState(false);
  const [isQueryExecuted, setIsQueryExecuted] = useState(false);

  const { toast } = useToast();
  
  const [filters, setFilters] = useState<Partial<Record<keyof DataRow, string>>>({});
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [createdDateFilter, setCreatedDateFilter] = useState<DateRange | undefined>();
  const [lastChangedDateFilter, setLastChangedDateFilter] = useState<DateRange | undefined>();

  const mapObjectType = (type: number) => {
    return type === 1 ? 'View Query' : 'Table Query';
  }
  
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
      setIsConnectionSuccessful(false);
      setIsQueryExecuted(false);
      setIsModalOpen(true);
  };
  
  const handleEdit = (row: DataRow) => {
      setIsEditing(true);
      setFormData(row);
      setIsConnectionSuccessful(false);
      setIsQueryExecuted(false);
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

  const sortedAndFilteredRows = useMemo(() => {
    let filtered = [...rows].filter(row => {
        const isWithinCreatedDate = () => {
          if (!createdDateFilter?.from) return true;
          const date = new Date(row.CREATEDDATE);
          const from = new Date(createdDateFilter.from);
          from.setHours(0,0,0,0);
          const to = createdDateFilter.to ? new Date(createdDateFilter.to) : new Date();
          to.setHours(23,59,59,999);
          return date >= from && date <= to;
        }
        const isWithinLastChangedDate = () => {
            if (!lastChangedDateFilter?.from) return true;
            const date = new Date(row.LASTCHANGEDDATE);
            const from = new Date(lastChangedDateFilter.from);
            from.setHours(0,0,0,0);
            const to = lastChangedDateFilter.to ? new Date(lastChangedDateFilter.to) : new Date();
            to.setHours(23,59,59,999);
            return date >= from && date <= to;
        }

        const textFiltersMatch = Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            const rowValue = row[key as keyof DataRow];
            if (key === 'OBJECT_TYPE') {
                return (value === '1' && mapObjectType(rowValue as number) === 'View Query') ||
                       (value === '2' && mapObjectType(rowValue as number) === 'Table Query');
            }
            return String(rowValue).toLowerCase().includes(value.toLowerCase());
        });

        return textFiltersMatch && isWithinCreatedDate() && isWithinLastChangedDate();
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [rows, filters, sortConfig, createdDateFilter, lastChangedDateFilter]);

  const totalPages = Math.ceil(sortedAndFilteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredRows, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  }
  
  const handleFilterChange = useCallback((key: keyof DataRow, value: string) => {
      setFilters(prev => ({...prev, [key]: value === 'all' ? '' : value}));
      setCurrentPage(1);
  }, []);

  const requestSort = (key: SortKey) => {
    if (!['ID', 'SERVER_NAME', 'DATABASE_NAME', 'CREATEDDATE', 'LASTCHANGEDDATE'].includes(key)) return;
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(startItem + ITEMS_PER_PAGE - 1, sortedAndFilteredRows.length);
  
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

  const handlePreview = (row: DataRow) => {
    // In a real app, you would execute the row.QUERY here.
    const dummyData = allDataTables[Math.floor(Math.random() * allDataTables.length)];
    setPreviewData({ headers: dummyData.headers, rows: dummyData.rows.map(r => r.map(c => c)) });
    setIsQueryExecuted(true);
    setIsPreviewModalOpen(true);
  }
  
  const handleTestConnection = () => {
    toast({ title: "Testing connection...", description: "Please wait." });
    setTimeout(() => {
        setIsConnectionSuccessful(true);
        toast({ title: "Success!", description: "Connection established successfully." });
    }, 1500);
  }
  
  const renderFilter = (headerKey: keyof DataRow) => {
    const nonFilterable = ['ID', 'CREATEDBY', 'LASTCHANGEDBY'];
    if (nonFilterable.includes(headerKey)) return null;

    const filterContent = () => {
        if (headerKey === 'OBJECT_TYPE') {
            return (
                <Select onValueChange={(v) => handleFilterChange(headerKey, v)} defaultValue={filters[headerKey] || 'all'}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Filter..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="1">View Query</SelectItem>
                        <SelectItem value="2">Table Query</SelectItem>
                    </SelectContent>
                </Select>
            );
        }
        if (['CREATEDDATE', 'LASTCHANGEDDATE'].includes(headerKey)) {
          const isCreatedDate = headerKey === 'CREATEDDATE';
          const dateRange = isCreatedDate ? createdDateFilter : lastChangedDateFilter;
          const setDateRange = isCreatedDate ? setCreatedDateFilter : setLastChangedDateFilter;
            return (
              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                      <Button
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal h-8",
                              !dateRange && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                              dateRange.to ? (
                                  <>
                                      {format(dateRange.from, "LLL dd, y")} -{" "}
                                      {format(dateRange.to, "LLL dd, y")}
                                  </>
                              ) : (
                                  format(dateRange.from, "LLL dd, y")
                              )
                          ) : (
                              <span>Pick a date range</span>
                          )}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                      />
                  </PopoverContent>
              </Popover>
              <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} disabled={!dateRange}>Clear</Button>
            </div>
            );
        }
        return <Input className="h-8" placeholder="Filter..." onChange={(e) => handleFilterChange(headerKey, e.target.value)} defaultValue={filters[headerKey]} />;
    };
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent focus-visible:bg-accent">
                    <Filter className="h-4 w-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
                {filterContent()}
            </PopoverContent>
        </Popover>
    );
  }

  return (
    <div className="w-full">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Supporting Tables</CardTitle>
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New
            </Button>
          </CardHeader>
          <CardContent className="p-0">
               <div className="overflow-x-auto border-t">
                  <Table className="min-w-full">
                      <TableHeader>
                          <TableRow>
                          {(defDataTable.headers as Array<keyof DataRow>).map((header) => {
                             const isSortable = ['ID', 'SERVER_NAME', 'DATABASE_NAME', 'CREATEDDATE', 'LASTCHANGEDDATE'].includes(header);
                             return (
                              <TableHead key={header} className="border p-2 bg-muted/50" style={{maxWidth: (header === 'QUERY' || header === 'DESCRIPTION') ? '200px' : 'none'}}>
                                  <div className="flex items-center justify-between">
                                      <Button variant="ghost" onClick={() => isSortable && requestSort(header)} className={cn("p-0 h-auto font-bold text-black hover:bg-transparent dark:text-white dark:hover:text-white", !isSortable && "cursor-default")}>
                                          {headerMapping[header]}
                                          {isSortable && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                      </Button>
                                      {renderFilter(header)}
                                  </div>
                              </TableHead>
                             )
                          })}
                          <TableHead className="w-[120px] text-center border p-2 bg-muted/50 font-bold text-black">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paginatedRows.map((row) => (
                          <TableRow key={row.ID} className="h-12">
                              {(defDataTable.headers as Array<keyof DataRow>).map((header) => {
                                const cellValue = row[header];
                                const displayValue = header === 'CREATEDDATE' || header === 'LASTCHANGEDDATE'
                                    ? formatDate(String(cellValue))
                                    : header === 'OBJECT_TYPE'
                                    ? mapObjectType(cellValue as number)
                                    : cellValue !== null ? String(cellValue) : 'NULL';
                                
                                return (
                                  <TableCell key={header} className="truncate p-4 border" style={{maxWidth: (header === 'QUERY' || header === 'DESCRIPTION') ? '200px' : 'none'}}>
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
                              <TableCell className="text-center p-1 border">
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
                  Showing {paginatedRows.length > 0 ? startItem : 0} - {endItem} of {sortedAndFilteredRows.length} items
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
                  <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                      Next
                  </Button>
              </div>
          </div>
     </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit' : 'Add New Supporting Table'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="NAME">{headerMapping.NAME}</Label>
                <Input id="NAME" name="NAME" value={formData.NAME} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="DESCRIPTION">{headerMapping.DESCRIPTION}</Label>
                <Textarea id="DESCRIPTION" name="DESCRIPTION" value={formData.DESCRIPTION || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="SERVER_NAME">{headerMapping.SERVER_NAME}</Label>
                <div className="flex items-center gap-2">
                  <Input id="SERVER_NAME" name="SERVER_NAME" value={formData.SERVER_NAME} onChange={handleInputChange} className="flex-1" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Using service account to test the connection.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="outline" onClick={handleTestConnection}>Test Connection</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="DATABASE_NAME">{headerMapping.DATABASE_NAME}</Label>
                <Select name="DATABASE_NAME" disabled={!isConnectionSuccessful} value={formData.DATABASE_NAME} onValueChange={(value) => handleSelectChange('DATABASE_NAME', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Test connection to see databases" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DW_Reporting">DW_Reporting</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Provider_Data">Provider_Data</SelectItem>
                        <SelectItem value="Claims">Claims</SelectItem>
                    </SelectContent>
                </Select>
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
              <div className="col-span-2 space-y-2">
                <Label htmlFor="QUERY">{headerMapping.QUERY}</Label>
                <Textarea id="QUERY" name="QUERY" value={formData.QUERY} onChange={handleInputChange} className="font-mono h-32" />
              </div>
          </div>
          <DialogFooter className='sm:justify-between w-full'>
            <Button variant="outline" onClick={() => handlePreview(formData)} disabled={!formData.QUERY}>
                <Eye className="mr-2 h-4 w-4" />
                Run & Preview
            </Button>
            <div className='flex gap-2'>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={!isQueryExecuted}>Save</Button>
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
                            {previewData?.headers.map(header => <TableHead key={header} className="border p-2">{header}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {previewData?.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex} className="p-2 border">{String(cell)}</TableCell>
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

    