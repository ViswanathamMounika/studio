
"use client";

import { useEffect, useState } from 'react';
import type { Definition, Revision, SupportingTable, Note } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Comments from './comments';
import { Pencil, Bookmark } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { authorizationStatusCodes, cmsComplianceMatrix, timestampChangedTable, vwAuthActionTimeTable } from '@/lib/data';
import { Checkbox } from '../ui/checkbox';
import RevisionComparisonDialog from './revision-comparison-dialog';
import { cn } from '@/lib/utils';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';

type DefinitionViewProps = {
  definition: Definition;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave: (definition: Definition) => void;
  isAdmin: boolean;
};

const supportingTablesData: Record<string, SupportingTable> = {
    'auth-status-codes': authorizationStatusCodes,
    'cms-compliance': cmsComplianceMatrix,
    'timestamp-changed': timestampChangedTable,
    'vw-authactiontime': vwAuthActionTimeTable,
};

const currentUser = {
    name: "Current User",
    avatar: "https://picsum.photos/seed/user/40/40"
};

export default function DefinitionView({ definition, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, activeTab, onTabChange, onSave, isAdmin }: DefinitionViewProps) {
    const [selectedTable, setSelectedTable] = useState<SupportingTable | null>(null);
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
    
    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (activeTab === 'examples' || activeTab === 'usage') {
            onTabChange('examples-usage');
        } else if (activeTab !== 'description' && activeTab !== 'technical-details' && activeTab !== 'revisions' && active-tab !== 'attachments' && activeTab !== 'notes') {
            onTabChange('description');
        }
    }, [definition, onTabChange, activeTab]);

    useEffect(() => {
        const handleContentClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a[data-supporting-table-id]');
            if (anchor) {
                e.preventDefault();
                const tableId = anchor.getAttribute('data-supporting-table-id');
                if (tableId && supportingTablesData[tableId]) {
                    setSelectedTable(supportingTablesData[tableId]);
                    setIsTableDialogOpen(true);
                }
            }
        };

        const contentArea = document.getElementById('definition-content-area');
        contentArea?.addEventListener('click', handleContentClick);

        return () => {
            contentArea?.removeEventListener('click', handleContentClick);
        };
    }, [definition]);


    const handleRevisionSelect = (revision: Revision, checked: boolean) => {
        setSelectedRevisions(prev => {
            if (checked) {
                if (prev.length < 2) {
                    return [...prev, revision];
                }
                return prev;
            } else {
                return prev.filter(r => r.ticketId !== revision.ticketId);
            }
        });
    };
    
    useEffect(() => {
        setSelectedRevisions([]);
    }, [definition]);

    const handleSaveNote = () => {
        if (!noteText.trim()) {
            toast({
                variant: 'destructive',
                title: 'Note cannot be empty.',
            });
            return;
        }

        const newNote: Note = {
            id: Date.now().toString(),
            author: currentUser.name,
            avatar: currentUser.avatar,
            date: new Date().toISOString(),
            content: noteText,
            isShared: shareNote,
        };
        
        const updatedDefinition = {
            ...definition,
            notes: [...(definition.notes || []), newNote],
        };

        onSave(updatedDefinition);
        setNoteText('');
        setShareNote(false);
        toast({
            title: 'Note saved!',
            description: 'Your note has been added to this definition.',
        });
    };

    const handleDeleteNote = (noteId: string) => {
        const updatedDefinition = {
            ...definition,
            notes: definition.notes?.filter(note => note.id !== noteId),
        };
        onSave(updatedDefinition);
        toast({
            title: 'Note deleted.',
        });
    }

  return (
    <>
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
                <Button variant="ghost" size="icon" className="hover:bg-primary/10" onClick={() => onToggleBookmark(definition.id)}>
                    <Bookmark className={cn("h-6 w-6 text-muted-foreground", definition.isBookmarked && "fill-primary text-primary")}/>
                </Button>
                {isAdmin && (
                    <>
                        <Button onClick={onEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onDelete={onDelete} onToggleBookmark={onToggleBookmark} />
                    </>
                )}
            </div>
        </div>

        <div className="flex flex-wrap gap-2 my-4">
            {definition.keywords.map(keyword => (
            <Badge key={keyword} variant="secondary">{keyword}</Badge>
            ))}
        </div>

        <div id="definition-content-area">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="technical-details">Technical Details</TabsTrigger>
                    <TabsTrigger value="examples-usage">Examples & Usage</TabsTrigger>
                    <TabsTrigger value="revisions">Version History</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="description" id="section-description" className="mt-4 space-y-4">
                <Card>
                    <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.description }} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Comments</CardTitle>
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
                    <CardHeader>
                        <div className="flex justify-end">
                            <Button 
                                onClick={() => setShowComparison(true)} 
                                disabled={selectedRevisions.length !== 2}
                            >
                                Compare Revisions
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]"></TableHead>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Developer</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {definition.revisions.map((rev: Revision) => (
                            <TableRow key={rev.ticketId}>
                            <TableCell>
                                <Checkbox 
                                    onCheckedChange={(checked) => handleRevisionSelect(rev, !!checked)}
                                    checked={selectedRevisions.some(r => r.ticketId === rev.ticketId)}
                                    disabled={selectedRevisions.length >= 2 && !selectedRevisions.some(r => r.ticketId === rev.ticketId)}
                                />
                            </TableCell>
                            <TableCell className="font-medium">{rev.ticketId}</TableCell>
                            <TableCell>{rev.date}</TableCell>
                            <TableCell>{rev.developer}</TableCell>
                            <TableCell>{rev.description}</TableCell>
                            </TableRow>
                        ))}
                            {definition.revisions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">No revision history.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="attachments" id="section-attachments" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
                        <CardContent>
                            <AttachmentList attachments={definition.attachments} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="notes" id="section-notes" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Textarea 
                                    placeholder="Add a personal or shared note..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="share-note" checked={shareNote} onCheckedChange={(checked) => setShareNote(!!checked)} />
                                        <Label htmlFor="share-note">Share with everyone</Label>
                                    </div>
                                    <Button onClick={handleSaveNote}>Save Note</Button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                {definition.notes && definition.notes
                                    .filter(note => note.isShared || note.author === currentUser.name)
                                    .map(note => (
                                    <div key={note.id} className="flex items-start gap-4 p-3 border rounded-md">
                                        <Avatar>
                                            <AvatarImage src={note.avatar} />
                                            <AvatarFallback>{note.author.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="font-semibold">{note.author}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">{new Date(note.date).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {note.isShared && <Badge variant="outline">Shared</Badge>}
                                                    {note.author === currentUser.name && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNote(note.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm mt-1">{note.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!definition.notes || definition.notes.length === 0) && (
                                    <p className="text-center text-muted-foreground py-4">No notes for this definition yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        </article>

        <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
            {selectedTable && (
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTable.name}</DialogTitle>
                        <DialogDescription>{selectedTable.description}</DialogDescription>
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
                                                            <Badge variant={'success'}>Yes</Badge>
                                                        </TableCell>
                                                    );
                                                }
                                                return (
                                                    <TableCell key={cellIndex}>
                                                        <Badge variant={'secondary'}>No</Badge>
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

        {showComparison && selectedRevisions.length === 2 && (
             <RevisionComparisonDialog
                open={showComparison}
                onOpenChange={setShowComparison}
                revision1={selectedRevisions[0]}
                revision2={selectedRevisions[1]}
                currentDefinitionName={definition.name}
            />
        )}
    </>
  );
}
