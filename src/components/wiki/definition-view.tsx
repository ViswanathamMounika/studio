
"use client";

import { useEffect, useState } from 'react';
import type { Definition, Revision, SupportingTable, Note } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Bookmark, Trash2, Share2, Save } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Switch } from '../ui/switch';
import RelatedDefinitions from './related-definitions';

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
    id: "user_123",
    name: "Current User",
    avatar: "https://picsum.photos/seed/user/40/40"
};

export default function DefinitionView({ definition, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, activeTab, onTabChange, onSave, isAdmin }: DefinitionViewProps) {
    const [selectedTable, setSelectedTable] = useState<SupportingTable | null>(null);
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
    
    const [noteText, setNoteText] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteText, setEditingNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    const [notesView, setNotesView] = useState<'my' | 'others'>('my');
    const { toast } = useToast();

    const tabs = [
        { value: 'description', label: 'Description', condition: !!definition.description },
        { value: 'revisions', label: 'Version History', condition: true },
        { value: 'attachments', label: 'Attachments', condition: true },
        { value: 'notes', label: 'Notes', condition: true },
        { value: 'related', label: 'Related', condition: true },
    ];

    const visibleTabs = tabs.filter(tab => tab.condition);
    
    useEffect(() => {
        const validTabs = visibleTabs.map(t => t.value);
        if (activeTab && !validTabs.includes(activeTab)) {
            onTabChange('description');
        }
    }, [definition, activeTab, onTabChange, visibleTabs]);

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

    const handleShare = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('definitionId', definition.id);
        if (activeTab) {
            url.searchParams.set('section', activeTab);
        }
        navigator.clipboard.writeText(url.toString()).then(() => {
            toast({
                title: 'Link Copied',
                description: 'A shareable link has been copied to your clipboard.',
            });
        });
    };

    const handleSaveNote = () => {
        if (!noteText.trim()) {
            toast({ variant: 'destructive', title: 'Note cannot be empty.' });
            return;
        }

        const newNote: Note = {
            id: Date.now().toString(),
            authorId: currentUser.id,
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
        toast({ title: 'Note saved!' });
    };

    const handleEditNote = (note: Note) => {
        setEditingNoteId(note.id);
        setEditingNoteText(note.content);
    };

    const handleUpdateNote = () => {
        if (!editingNoteId || !editingNoteText.trim()) return;

        const updatedDefinition = {
            ...definition,
            notes: definition.notes?.map(note => 
                note.id === editingNoteId ? { ...note, content: editingNoteText, date: new Date().toISOString() } : note
            ),
        };
        onSave(updatedDefinition);
        setEditingNoteId(null);
        setEditingNoteText('');
        toast({ title: 'Note updated!' });
    };
    
    const handleToggleShareNote = (noteId: string, isShared: boolean) => {
         const updatedDefinition = {
            ...definition,
            notes: definition.notes?.map(note => 
                note.id === noteId ? { ...note, isShared: isShared, date: new Date().toISOString() } : note
            ),
        };
        onSave(updatedDefinition);
        toast({ title: `Note ${isShared ? 'shared' : 'made private'}.` });
    }

    const handleDeleteNote = (noteId: string) => {
        const updatedDefinition = {
            ...definition,
            notes: definition.notes?.filter(note => note.id !== noteId),
        };
        onSave(updatedDefinition);
        toast({ title: 'Note deleted.' });
    }
    
    const filteredNotes = definition.notes?.filter(note => {
        if (notesView === 'my') return note.authorId === currentUser.id;
        if (notesView === 'others') return note.isShared && note.authorId !== currentUser.id;
        return false;
    });

  return (
    <TooltipProvider>
        <article className="prose prose-sm max-w-none my-6">
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={handleShare}>
                            <Share2 className="h-6 w-6 text-muted-foreground"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Share</p>
                    </TooltipContent>
                </Tooltip>
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
                <TabsList className="w-full">
                    {visibleTabs.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value} className="flex-1">{tab.label}</TabsTrigger>
                    ))}
                </TabsList>

                {visibleTabs.find(t => t.value === 'description') &&
                    <TabsContent value="description" id="section-description" className="mt-4 space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.description }} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                }
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
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Add a Note</h3>
                                <div className="p-4 border rounded-lg">
                                    <Textarea
                                        id="new-note-textarea"
                                        className="mt-2"
                                        placeholder="Add a personal or shared note..."
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="share-note" checked={shareNote} onCheckedChange={(checked) => setShareNote(!!checked)} />
                                            <Label htmlFor="share-note">Share with everyone</Label>
                                        </div>
                                        <Button onClick={handleSaveNote}>Save</Button>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <h3 className="text-lg font-semibold">Saved Notes</h3>
                                    <div className="flex items-center space-x-2">
                                        <Label>My Notes</Label>
                                        <Switch checked={notesView === 'others'} onCheckedChange={(c) => setNotesView(c ? 'others' : 'my')} />
                                        <Label>Others' Notes</Label>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    {filteredNotes && filteredNotes.map(note => (
                                        <div key={note.id} className="flex items-start gap-4 p-3 border rounded-md bg-background">
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
                                                        {note.authorId === currentUser.id ? (
                                                            <div className='flex items-center gap-2'>
                                                                <Label htmlFor={`share-switch-${note.id}`} className='text-sm'>Share</Label>
                                                                <Switch id={`share-switch-${note.id}`} checked={note.isShared} onCheckedChange={(c) => handleToggleShareNote(note.id, c)}/>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline">Shared</Badge>
                                                        )}
                                                        {note.authorId === currentUser.id && (
                                                            <>
                                                                {editingNoteId === note.id ? (
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUpdateNote}>
                                                                        <Save className="h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditNote(note)}>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNote(note.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {editingNoteId === note.id ? (
                                                    <Textarea value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} className="mt-2"/>
                                                ) : (
                                                    <p className="text-sm mt-1">{note.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {(!filteredNotes || filteredNotes.length === 0) && (
                                        <p className="text-center text-muted-foreground py-4">No notes in this view.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="related" id="section-related" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Definitions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RelatedDefinitions currentDefinition={definition} />
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
    </TooltipProvider>
  );
}
