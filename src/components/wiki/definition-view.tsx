"use client";

import type { Definition, Revision } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Comments from './comments';
import { Pencil } from 'lucide-react';
import DefinitionActions from './definition-actions';

type DefinitionViewProps = {
  definition: Definition;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
};

export default function DefinitionView({ definition, onEdit, onDuplicate, onArchive }: DefinitionViewProps) {
  return (
    <article className="prose prose-sm max-w-none">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">{definition.module}</p>
          <h2 className="text-3xl font-bold mt-0">{definition.name}</h2>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 my-4">
        {definition.keywords.map(keyword => (
          <Badge key={keyword} variant="secondary">{keyword}</Badge>
        ))}
      </div>

      <Accordion type="multiple" defaultValue={['description', 'revisions']} className="w-full">
        <AccordionItem value="description">
          <AccordionTrigger className="text-lg font-semibold">Description</AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.description }} />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="technical-details">
          <AccordionTrigger className="text-lg font-semibold">Technical Details</AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none prose-code:font-code" dangerouslySetInnerHTML={{ __html: definition.technicalDetails }} />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="examples">
          <AccordionTrigger className="text-lg font-semibold">Example</AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.examples }} />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="usage">
          <AccordionTrigger className="text-lg font-semibold">Usage</AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.usage }} />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="revisions">
          <AccordionTrigger className="text-lg font-semibold">Version History</AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {definition.revisions.map((rev: Revision) => (
                  <TableRow key={rev.ticketId}>
                    <TableCell className="font-medium">{rev.ticketId}</TableCell>
                    <TableCell>{rev.date}</TableCell>
                    <TableCell>{rev.developer}</TableCell>
                    <TableCell>{rev.description}</TableCell>
                  </TableRow>
                ))}
                 {definition.revisions.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No revision history.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Comments />
    </article>
  );
}
