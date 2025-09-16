"use client";

import type { Definition, Revision } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <Tabs defaultValue="description" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="technical-details">Technical Details</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="revisions">Version History</TabsTrigger>
        </TabsList>
        <TabsContent value="description" id="section-description" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.description }} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Comments & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Comments />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="technical-details" id="section-technical-details" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none prose-code:font-code" dangerouslySetInnerHTML={{ __html: definition.technicalDetails }} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="examples" id="section-examples" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.examples }} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="usage" id="section-usage" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.usage }} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="revisions" id="section-revisions" className="mt-4">
          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </article>
  );
}
