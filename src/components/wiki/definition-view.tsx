"use client";

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Definition, Revision, SupportingTable, Note } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Pencil, Bookmark, Trash2, Share2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
    authorizationStatusCodes, 
    cmsComplianceMatrix, 
    timestampChangedTable, 
    vwAuthActionTimeTable, 
    initialDefinitions, 
    mpmDatabases, 
    mpmSourceTypes,
    allDataTables
} from '@/lib/data';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import RelatedDefinitions from './related-definitions';
import useLocalStorage from '@/hooks/use-local-storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const RevisionComparisonDialog = dynamic(() => import('./revision-comparison-dialog'), { ssr: false });

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
    name: "Dhilip Sagadevan",
    avatar: "https://picsum.photos/seed/dhilip/40/40"
};

export default function DefinitionView({ definition, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, activeTab, onTabChange, onSave, isAdmin }: DefinitionViewProps) {
    const [selectedTable, setSelectedTable] = useState<SupportingTable | null>(null);
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
    
    // Preview States
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [previewTable, setPreviewTable] = useState<SupportingTable | null>(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewPageSize, setPreviewPageSize] = useState(5);

    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    const [notesViewTab, setNotesViewTab] = useState<'my' | 'others'>('my');
    const { toast } = useToast();
    const [definitions] = useLocalStorage<Definition[]>('definitions', initialDefinitions);

    const tabs = [
        { value: 'description', label: 'Description' },
        { value: 'revisions', label: 'Version History' },
        { value: 'attachments', label: 'Attachments' },
        { value: 'notes', label: 'Notes' },
        { value: 'related-definitions', label: 'Related Definitions' },
    ];

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
        if (!noteText.trim()) return;
        const newNote: Note = {
            id: Date.now().toString(),
            authorId: currentUser.id,
            author: currentUser.name,
            avatar: currentUser.avatar,
            date: new Date().toISOString(),
            content: noteText,
            isShared: shareNote,
        };
        const updatedDefinition = { ...definition, notes: [...(definition.notes || []), newNote] };
        onSave(updatedDefinition);
        setNoteText('');
        setShareNote(false);
    };

    const handleDeleteNote = (noteId: string) => {
        const updatedDefinition = { ...definition, notes: definition.notes?.filter(note => note.id !== noteId) };
        onSave(updatedDefinition);
    };

    const filteredNotes = definition.notes?.filter(note => {
        if (notesViewTab === 'my') return note.authorId === currentUser.id;
        return note.isShared && note.authorId !== currentUser.id;
    });

    const handleDefinitionClick = (id: string, sectionId?: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('definitionId', id);
        if (sectionId) url.searchParams.set('section', sectionId);
        window.history.pushState({}, '', url.toString());
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const resolvedSourceInfo = useMemo(() => {
        const db = mpmDatabases.find(d => d.id === definition.sourceDb);
        const types = definition.sourceDb ? mpmSourceTypes[definition.sourceDb] : [];
        const type = types?.find(t => t.id === definition.sourceType);
        return {
            database: db?.name || definition.sourceDb || 'N/A',
            type: type?.name || definition.sourceType || 'N/A',
            name: definition.sourceName || 'N/A'
        };
    }, [definition]);

    const handleOpenPreview = (sourceName: string) => {
        const mockTable = allDataTables.find(t => t.name.toLowerCase().includes(sourceName.toLowerCase())) 
                          || allDataTables[Math.floor(Math.random() * allDataTables.length)];
        
        setPreviewTable(mockTable);
        setPreviewPage(1);
        setPreviewPageSize(5);
        setIsPreviewDialogOpen(true);
    };

    const paginatedPreviewRows = useMemo(() => {
        if (!previewTable) return [];
        const start = (previewPage - 1) * previewPageSize;
        return previewTable.rows.slice(start, start + previewPageSize);
    }, [previewTable, previewPage, previewPageSize]);

    const totalPreviewPages = useMemo(() => {
        if (!previewTable) return 0;
        return Math.ceil(previewTable.rows.length / previewPageSize);
    }, [previewTable, previewPageSize]);

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
                        <TooltipContent><p>Share</p></TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10" onClick={() => onToggleBookmark(definition.id)}>
                        <Bookmark className={cn("h-6 w-6 text-muted-foreground", definition.isBookmarked && "fill-primary text-primary")}/>
                    </Button>
                    {isAdmin && (
                        <>
                            <Button onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                            <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onDelete={onDelete} onToggleBookmark={onToggleBookmark} />
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 my-4">
                {definition.keywords.map(keyword => (<Badge key={keyword} variant="secondary">{keyword}</Badge>))}
            </div>

            <div id="definition-content-area">
                <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mt-6">
                    <TabsList className="w-full bg-transparent border-b rounded-none p-0 h-auto flex justify-between">
                        {tabs.map(tab => (
                            <TabsTrigger 
                                key={tab.value} 
                                value={tab.value} 
                                className="flex-1 bg-transparent text-muted-foreground hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-semibold transition-all"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="description" className="mt-6 space-y-4">
                        <Accordion type="multiple" defaultValue={['description', 'short-description']} className="space-y-4">
                            <AccordionItem value="data-source" className="bg-card border rounded-lg shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base">Data Source</span>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="flex flex-col gap-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Database</p>
                                            <p className="mt-1 font-medium">{resolvedSourceInfo.database}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Source Type</p>
                                            <p className="mt-1 font-medium">{resolvedSourceInfo.type}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Source Name</p>
                                            <p className="mt-1 font-medium">
                                                {resolvedSourceInfo.name !== 'N/A' ? (
                                                    <button 
                                                        onClick={() => handleOpenPreview(resolvedSourceInfo.name)}
                                                        className="text-primary font-bold hover:underline"
                                                    >
                                                        {resolvedSourceInfo.name}
                                                    </button>
                                                ) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="short-description" className="bg-card border rounded-lg shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base">Short Description</span>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <p className="text-sm">{definition.shortDescription || 'No short description available.'}</p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="description" className="bg-card border rounded-lg shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base">Description</span>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: definition.description }} />
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="technical-details" className="bg-card border rounded-lg shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base">Technical Details</span>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: definition.technicalDetails || 'No technical details provided.' }} />
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="usage-examples" className="bg-card border rounded-lg shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base">Usage Examples / SQL View</span>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: definition.usageExamples || 'No usage examples or SQL views available.' }} />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>

                    <TabsContent value="revisions" className="mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-end">
                                    <Button onClick={() => setShowComparison(true)} disabled={selectedRevisions.length !== 2}>Compare Revisions</Button>
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
                                        {definition.revisions.map((rev) => (
                                            <TableRow key={rev.ticketId}>
                                                <TableCell>
                                                    <Checkbox 
                                                        onCheckedChange={(checked) => handleRevisionSelect(rev, !!checked)}
                                                        checked={selectedRevisions.some(r => r.ticketId === rev.ticketId)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{rev.ticketId}</TableCell>
                                                <TableCell>{rev.date}</TableCell>
                                                <TableCell>{rev.developer}</TableCell>
                                                <TableCell>{rev.description}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attachments" className="mt-6">
                        <Card><CardHeader><CardTitle>Attachments</CardTitle></CardHeader><CardContent><AttachmentList attachments={definition.attachments} /></CardContent></Card>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-6">
                        <div className="space-y-8">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold my-0">Notes</h3>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <Card className="bg-card border shadow-sm">
                                    <CardHeader className="py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">Add a Note</span>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="relative">
                                            <Textarea 
                                                placeholder="Add a personal or shared note..." 
                                                className="min-h-[120px] resize-none pr-4 pt-4"
                                                value={noteText}
                                                onChange={(e) => setNoteText(e.target.value.slice(0, 5000))}
                                            />
                                            <div className="text-right text-[10px] text-muted-foreground mt-1">
                                                {noteText.length}/5000
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="share-note-check" checked={shareNote} onCheckedChange={(checked) => setShareNote(!!checked)} />
                                                <Label htmlFor="share-note-check" className="text-sm cursor-pointer">Share with everyone</Label>
                                            </div>
                                            <Button onClick={handleSaveNote} className="px-8">Save</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Card className="bg-card border shadow-sm p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">Saved Notes</span>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <Tabs value={notesViewTab} onValueChange={(val: any) => setNotesViewTab(val)} className="h-auto">
                                            <TabsList className="bg-transparent border-none p-0 h-auto gap-4">
                                                <TabsTrigger 
                                                    value="my" 
                                                    className="bg-transparent text-muted-foreground hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none p-0 py-1 text-sm font-semibold transition-all"
                                                >
                                                    My Notes
                                                </TabsTrigger>
                                                <TabsTrigger 
                                                    value="others" 
                                                    className="bg-transparent text-muted-foreground hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none p-0 py-1 text-sm font-semibold transition-all"
                                                >
                                                    Other's Notes
                                                </TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {filteredNotes?.map(note => (
                                            <div key={note.id} className="p-4 border rounded-lg bg-background group transition-colors hover:border-primary/20">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-foreground">{note.author}</span>
                                                            <span className="text-xs text-muted-foreground">{new Date(note.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm mt-3 text-muted-foreground leading-relaxed">{note.content}</p>
                                                    </div>
                                                    {note.authorId === currentUser.id && (
                                                        <div className="flex items-center gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 hover:bg-primary/10"
                                                                onClick={() => toast({ title: "Edit Note", description: "Edit functionality coming soon." })}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                                                onClick={() => handleDeleteNote(note.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {filteredNotes?.length === 0 && (
                                            <p className="text-center py-12 text-muted-foreground text-sm italic">No {notesViewTab === 'my' ? 'personal' : 'shared'} notes found for this definition.</p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="related-definitions" className="mt-6">
                        <RelatedDefinitions currentDefinition={definition} allDefinitions={definitions} onDefinitionClick={handleDefinitionClick} onSave={onSave} isAdmin={isAdmin} />
                    </TabsContent>
                </Tabs>
            </div>
        </article>

        <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
            {selectedTable && (
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>{selectedTable.name}</DialogTitle></DialogHeader>
                    <div className="max-h-[60vh] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>{selectedTable.headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedTable.rows.map((r, i) => <TableRow key={i}>{r.map((c, ci) => <TableCell key={ci}>{c ?? 'NULL'}</TableCell>)}</TableRow>)}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            )}
        </Dialog>

        {/* Source Data Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
            <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{previewTable?.name || 'Data Preview'}</DialogTitle>
                    <DialogDescription>
                        Displaying top rows from {resolvedSourceInfo.name}. Showing sample data for documentation purposes.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 min-h-0 overflow-auto border rounded-md my-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {previewTable?.headers.map((header) => (
                                    <TableHead key={header} className="whitespace-nowrap bg-muted/50">{header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedPreviewRows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell key={cellIndex} className="whitespace-nowrap">
                                            {cell !== null ? String(cell) : <span className="text-muted-foreground italic">NULL</span>}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {paginatedPreviewRows.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">No data available for this source.</div>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
                        <Select value={String(previewPageSize)} onValueChange={(v) => {
                            setPreviewPageSize(Number(v));
                            setPreviewPage(1);
                        }}>
                            <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                {previewTable && previewTable.rows.length > 5 && (
                                    <SelectItem value="10">10</SelectItem>
                                )}
                                {previewTable && previewTable.rows.length > 10 && (
                                    <SelectItem value="20">20</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground ml-2">
                            Page {previewPage} of {totalPreviewPages}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                            disabled={previewPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                            disabled={previewPage === totalPreviewPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
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
