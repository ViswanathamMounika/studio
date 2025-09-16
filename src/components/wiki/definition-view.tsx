"use client";

import { useEffect, useState } from 'react';
import type { Definition, Revision, SupportingTable } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Comments from './comments';
import { ExternalLink, Pencil } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { authorizationStatusCodes, cmsComplianceMatrix } from '@/lib/data';

type DefinitionViewProps = {
  definition: Definition;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const supportingTablesData: Record<string, SupportingTable> = {
    'auth-status-codes': authorizationStatusCodes,
    'cms-compliance': cmsComplianceMatrix,
};

export default function DefinitionView({ definition, onEdit, onDuplicate, onArchive, activeTab, onTabChange }: DefinitionViewProps) {
    useEffect(() => {
        // Reset to the description tab when the definition changes
        if (activeTab === 'examples' || activeTab === 'usage') {
            onTabChange('examples-usage');
        } else if (activeTab !== 'description' && activeTab !== 'technical-details' && activeTab !== 'revisions' && activeTab !== 'examples-usage') {
            onTabChange('description');
        }
    }, [definition, onTabChange, activeTab]);

    const [selectedTable, setSelectedTable] = useState<SupportingTable | null>(null);

  return (
    <Dialog>
        <article className="prose prose-sm max-w-none">
        <div className="flex justify-between items-start">
            <div>
            <p className="text-sm text-muted-foreground">{definition.module}</p>
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold mt-0">{definition.name}</h2>
                <Badge variant={definition.isArchived ? 'destructive' : 'outline'}>
                    {definition.isArchived ? 'Archived' : 'Active'}
                </Badge>
            </div>
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

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="technical-details">Technical Details</TabsTrigger>
                <TabsTrigger value="examples-usage">Examples & Usage</TabsTrigger>
                <TabsTrigger value="revisions">Version History</TabsTrigger>
            </TabsList>
            <TabsContent value="description" id="section-description" className="mt-4 space-y-4">
            <Card>
                <CardContent className="p-6">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.description }} />
                </CardContent>
            </Card>

            {definition.supportingTables && definition.supportingTables.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Supporting Tables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                        {definition.supportingTables.map(table => (
                            <DialogTrigger key={table.id} asChild>
                                <button 
                                    onClick={() => setSelectedTable(supportingTablesData[table.id])}
                                    className="w-full flex items-center justify-between p-3 border rounded-md hover:bg-accent transition-colors"
                                >
                                    <span>{table.name}</span>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </DialogTrigger>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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
            <TabsContent value="examples-usage" id="section-examples-usage" className="mt-4 space-y-4">
                <Card>
                    <CardHeader><CardTitle>Examples</CardTitle></CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.examples }} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
                    <CardContent>
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

        {selectedTable && (
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{selectedTable.name}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {selectedTable.headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedTable.rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {row.map((cell, cellIndex) => {
                                        const header = selectedTable.headers[cellIndex];
                                        if (selectedTable.id === 'auth-status-codes' && header === 'Is Final Status?') {
                                            if (cell === 'Yes') {
                                                return (
                                                    <TableCell key={cellIndex}>
                                                        <Badge variant={'success'}>Active</Badge>
                                                    </TableCell>
                                                );
                                            }
                                            return (
                                                <TableCell key={cellIndex}>
                                                    <Badge variant={'secondary'}>Inactive</Badge>
                                                </TableCell>
                                            );
                                        }
                                        return <TableCell key={cellIndex}>{cell}</TableCell>
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        )}
    </Dialog>
  );
}
