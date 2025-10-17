
"use client";

import React from 'react';
import { defDataTable } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export default function DataTables() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
       <Card>
            <CardHeader>
                <CardTitle>{defDataTable.name}</CardTitle>
                <CardDescription>{defDataTable.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[70vh] overflow-auto border rounded-md">
                    <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                        <TableRow>
                        {defDataTable.headers.map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                        ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {defDataTable.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {defDataTable.headers.map((header, cellIndex) => (
                                <TableCell key={cellIndex}>
                                    {row[header as keyof typeof row] !== null ? String(row[header as keyof typeof row]) : 'NULL'}
                                </TableCell>
                            ))}
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
       </Card>
    </div>
  );
}
