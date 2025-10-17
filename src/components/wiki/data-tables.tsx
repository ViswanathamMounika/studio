
"use client";

import React from 'react';
import { allDataTables } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '../ui/badge';

export default function DataTables() {
  return (
    <div className="container mx-auto p-0 sm:p-6">
      <Accordion type="single" collapsible className="w-full">
        {allDataTables.map((dataTable) => (
          <AccordionItem value={dataTable.id} key={dataTable.id}>
            <AccordionTrigger>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-lg font-semibold">{dataTable.name}</span>
                <Badge variant="outline">{dataTable.rows.length} rows</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground mb-4">{dataTable.description}</p>
              <div className="max-h-[400px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      {dataTable.headers.map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataTable.rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
