
"use client";

import React, { useState, useRef } from 'react';
import { defDataTable } from '@/lib/data';
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
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DataRow = (typeof defDataTable.rows)[0];

const initialFormState: DataRow = {
  ID: 0,
  DEF_ID: 0,
  OBJECT_TYPE: 0,
  SERVER_NAME: '',
  DATABASE_NAME: '',
  QUERY: '',
  NAME: '',
  CREATEDBY: '',
  CREATEDDATE: '',
  LASTCHANGEDBY: '',
  LASTCHANGEDDATE: '',
};

export default function DataTables() {
  const [rows, setRows] = useState(defDataTable.rows);
  const [formData, setFormData] = useState<DataRow>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    defDataTable.headers.forEach(h => {
        widths[h] = h === 'QUERY' || h === 'NAME' ? 250 : 150;
    });
    return widths;
  });


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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddNew = () => {
      setIsEditing(false);
      setFormData(initialFormState);
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
    if (isEditing) {
      setRows(prev => prev.map(row => (row.ID === formData.ID ? formData : row)));
      toast({ title: 'Success', description: 'Row updated successfully.' });
    } else {
      const newId = rows.length > 0 ? Math.max(...rows.map(r => r.ID)) + 1 : 1;
      setRows(prev => [...prev, { ...formData, ID: newId }]);
      toast({ title: 'Success', description: 'New row added successfully.' });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 w-full">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>DEF_DATA_TABLE</CardTitle>
                    <CardDescription>Contains metadata and queries for definitions.</CardDescription>
                </div>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto border rounded-md">
                    <Table>
                    <TableHeader className="sticky top-0 bg-muted z-10">
                        <TableRow>
                        {defDataTable.headers.map((header) => (
                            <TableHead key={header} style={{ width: colWidths[header], position: 'relative' }}>
                                <div className="flex items-center justify-between">
                                  {header}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, header)}
                                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize" 
                                  />
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="w-[100px] text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                        <TableRow key={row.ID}>
                            {defDataTable.headers.map((header) => (
                                <TableCell key={header} className="truncate" style={{ maxWidth: colWidths[header]}}>
                                    {row[header as keyof typeof row] !== null ? String(row[header as keyof typeof row]) : 'NULL'}
                                </TableCell>
                            ))}
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
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
       </Card>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Row' : 'Add New Row'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {defDataTable.headers.map(header => (
                (isEditing || header !== 'ID') && (
                    <div key={header}>
                        <Label htmlFor={header}>{header}</Label>
                        <Input
                            id={header}
                            name={header}
                            value={String(formData[header as keyof DataRow])}
                            onChange={handleInputChange}
                            disabled={isEditing && header === 'ID'}
                        />
                    </div>
                )
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
