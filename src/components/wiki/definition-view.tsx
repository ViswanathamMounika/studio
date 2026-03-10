
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
import { Pencil, Bookmark, Trash2, Share2, Info, X, Check, Send } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    authorizationStatusCodes, 
    cmsComplianceMatrix, 
    timestampChangedTable, 
    vwAuthActionTimeTable, 
    mpmDatabases, 
    mpmSourceTypes
} from '@/lib/data';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import RelatedDefinitions from './related-definitions';
import DataSourcePreviewDialog from './data-source-preview-dialog';

const RevisionComparisonDialog = dynamic(() => import('./revision-comparison-dialog'), { ssr: false });

type DefinitionViewProps = {
  definition: Definition;
  allDefinitions: Definition[];
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onPublish?: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave: (definition: Definition) => void;
  isAdmin: boolean;
  searchQuery?: string;
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

const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight?.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-300/40 font-semibold rounded-sm px-0.5">{part}</span>
                ) : part
            )}
        </span>
    );
};

const highlightHtml = (html: string, query: string) => {
    if (!query?.trim()) return html;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})(?![^<]*>)`, 'gi');
    return html.replace(regex, '<span class="bg-yellow-300/40 font-semibold rounded-sm px-0.5">$1</span>');
};

export default function DefinitionView({ 
    definition, allDefinitions, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, onPublish,
    activeTab, onTabChange, onSave, isAdmin, searchQuery = "" 
}: DefinitionViewProps) {
    const [selectedTable, setSelectedTable] = useState<SupportingTable | null>(null);
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    const [notesViewTab, setNotesViewTab] = useState<'my' | 'others'>('my');
    
    // Note editing state
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteText, setEditingNoteText] = useState('');

    const { toast } = useToast();

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
        return () => contentArea?.removeEventListener('click', handleContentClick);
    }, [definition]);

    const handleRevisionSelect = (revision: Revision, checked: boolean) => {
        setSelectedRevisions(prev => checked ? (prev.length < 2 ? [...prev, revision] : prev) : prev.filter(r => r.ticketId !== revision.ticketId));
    };
    
    useEffect(() => { setSelectedRevisions([]); }, [definition]);

    const handleShare = () => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.set('definitionId', definition.id);
        if (activeTab) url.searchParams.set('section', activeTab);
        navigator.clipboard.writeText(url.toString()).then(() => {
            toast({ title: 'Link Copied', description: 'Shareable link copied to clipboard.' });
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
            isShared: shareNote 
        };
        onSave({ ...definition, notes: [...(definition.notes || []), newNote] });
        setNoteText('');
        setShareNote(false);
        toast({ title: 'Note Saved', description: 'Your note has been added.' });
    };

    const handleStartEditNote = (note: Note) => {
        setEditingNoteId(note.id);
        setEditingNoteText(note.content);
    };

    const handleCancelEditNote = () => {
        setEditingNoteId(null);
        setEditingNoteText('');
    };

    const handleUpdateNote = (noteId: string) => {
        if (!editingNoteText.trim()) return;
        
        const updatedNotes = (definition.notes || []).map(note => {
            if (note.id === noteId) {
                return { ...note, content: editingNoteText };
            }
            return note;
        });
        
        onSave({ ...definition, notes: updatedNotes });
        setEditingNoteId(null);
        setEditingNoteText('');
        toast({ title: 'Note Updated', description: 'Your changes have been saved.' });
    };

    const handleDeleteNote = (noteId: string) => {
        onSave({ ...definition, notes: definition.notes?.filter(note => note.id !== noteId) });
        toast({ title: 'Note Deleted', description: 'Your note has been removed.' });
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

  return (
    <TooltipProvider>
        <article className="prose prose-sm max-w-none">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-muted-foreground">{definition.module}</p>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold mt-0">
                            <HighlightedText text={definition.name} highlight={searchQuery} />
                        </h2>
                        <Badge variant={definition.isArchived ? 'destructive' : (definition.isDraft ? 'secondary' : 'outline')}>
                            {definition.isArchived ? 'Archived' : (definition.isDraft ? 'Draft' : 'Published')}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {definition.isDraft && onPublish && (
                      <Button 
                        variant="outline" 
                        className="text-primary border-primary hover:bg-primary hover:text-white transition-colors group" 
                        onClick={() => onPublish(definition.id)}
                      >
                        <Send className="mr-2 h-4 w-4 transition-colors group-hover:text-white" />
                        Publish
                      </Button>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={handleShare}><Share2 className="h-6 w-6 text-muted-foreground"/></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Share</p></TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10" onClick={() => onToggleBookmark(definition.id)}>
                        <Bookmark className={cn("h-6 w-6 text-muted-foreground", definition.isBookmarked && "fill-primary text-primary")}/>
                    </Button>
                    {isAdmin && (
                        <>
                            <Button onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                            <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onToggleBookmark={onToggleBookmark} />
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 my-4">
                {definition.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary">
                        <HighlightedText text={keyword} highlight={searchQuery} />
                    </Badge>
                ))}
            </div>

            <div id="definition-content-area">
                <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mt-6">
                    <TabsList className="w-full bg-transparent border-b rounded-none p-0 h-auto flex justify-between">
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 bg-transparent text-muted-foreground hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-semibold transition-all">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="description" className="mt-6 space-y-4">
                        <Accordion type="multiple" defaultValue={['description', 'short-description', 'template-content']} className="space-y-4">
                            <AccordionItem value="data-source" className="bg-card border rounded-lg shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2"><span className="font-bold text-base">Data Source</span><Info className="h-4 w-4 text-muted-foreground" /></div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="flex flex-col gap-4 text-sm">
                                        <div><p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Database</p><p className="mt-1 font-medium">{resolvedSourceInfo.database}</p></div>
                                        <div><p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Source Type</p><p className="mt-1 font-medium">{resolvedSourceInfo.type}</p></div>
                                        <div><p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Source Name</p><p className="mt-1 font-medium">{resolvedSourceInfo.name !== 'N/A' ? (<button onClick={() => setIsPreviewDialogOpen(true)} className="text-primary font-bold hover:underline">{resolvedSourceInfo.name}</button>) : 'N/A'}</p></div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="short-description" className="bg-card border rounded-lg shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-2"><span className="font-bold text-base">Short Description</span><Info className="h-4 w-4 text-muted-foreground" /></div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <p className="text-sm"><HighlightedText text={definition.shortDescription || 'No short description available.'} highlight={searchQuery} /></p>
                                </AccordionContent>
                            </AccordionItem>

                            {definition.templateId && definition.dynamicSections && definition.dynamicSections.length > 0 && (
                                <AccordionItem value="template-content" className="bg-card border rounded-lg shadow-sm px-4 border-primary/20">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2"><span className="font-bold text-base">Template Sections</span><Badge variant="outline" className="ml-2 text-[10px] uppercase">Structured</Badge></div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4 space-y-6">
                                        {definition.dynamicSections.map(section => (
                                            <div key={section.sectionId} className="space-y-2">
                                                <h4 className="font-bold text-sm text-primary flex items-center gap-2">{section.name}{section.isMandatory && <span className="text-destructive">*</span>}</h4>
                                                <div className="text-sm prose prose-sm max-w-none border-l-2 pl-4 py-1" dangerouslySetInnerHTML={{ __html: highlightHtml(section.content, searchQuery) }} />
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            {!definition.templateId && (
                                <>
                                    <AccordionItem value="description" className="bg-card border rounded-lg shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-2"><span className="font-bold text-base">Description</span><Info className="h-4 w-4 text-muted-foreground" /></div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4">
                                            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: highlightHtml(definition.description, searchQuery) }} />
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="technical-details" className="bg-card border rounded-lg shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-2"><span className="font-bold text-base">Technical Details</span><Info className="h-4 w-4 text-muted-foreground" /></div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4">
                                            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: highlightHtml(definition.technicalDetails || 'No technical details provided.', searchQuery) }} />
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="usage-examples" className="bg-card border rounded-lg shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-2"><span className="font-bold text-base">Usage Examples / SQL View</span><Info className="h-4 w-4 text-muted-foreground" /></div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4">
                                            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: highlightHtml(definition.usageExamples || 'No usage examples available.', searchQuery) }} />
                                        </AccordionContent>
                                    </AccordionItem>
                                </>
                            )}
                        </Accordion>
                    </TabsContent>

                    <TabsContent value="revisions" className="mt-6">
                        <Card>
                            <CardHeader><div className="flex justify-end"><Button onClick={() => setShowComparison(true)} disabled={selectedRevisions.length !== 2}>Compare Revisions</Button></div></CardHeader>
                            <CardContent className="p-6">
                                <Table>
                                    <TableHeader><TableRow><TableHead className="w-[40px]"></TableHead><TableHead>Ticket ID</TableHead><TableHead>Date</TableHead><TableHead>Developer</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {definition.revisions.map((rev) => (
                                            <TableRow key={rev.ticketId}><TableCell><Checkbox onCheckedChange={(checked) => handleRevisionSelect(rev, !!checked)} checked={selectedRevisions.some(r => r.ticketId === rev.ticketId)} /></TableCell><TableCell className="font-medium">{rev.ticketId}</TableCell><TableCell>{rev.date}</TableCell><TableCell>{rev.developer}</TableCell><TableCell>{rev.description}</TableCell></TableRow>
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
                            <Card className="bg-card border shadow-sm">
                                <CardHeader className="py-4"><div className="flex items-center gap-2"><span className="font-bold">Add a Note</span><Info className="h-4 w-4 text-muted-foreground" /></div></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative">
                                        <Textarea placeholder="Add a personal or shared note..." className="min-h-[120px] resize-none" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2"><Checkbox id="share-note-check" checked={shareNote} onCheckedChange={(checked) => setShareNote(!!checked)} /><Label htmlFor="share-note-check" className="text-sm cursor-pointer">Share with everyone</Label></div>
                                        <Button onClick={handleSaveNote} className="px-8">Save</Button>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border shadow-sm p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="font-bold text-lg">Saved Notes</span>
                                    <Tabs value={notesViewTab} onValueChange={(val: any) => setNotesViewTab(val)} className="h-auto">
                                        <TabsList className="bg-transparent border-none p-0 h-auto gap-4">
                                            <TabsTrigger value="my" className="bg-transparent text-muted-foreground hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none p-0 py-1 text-sm font-semibold transition-all">My Notes</TabsTrigger>
                                            <TabsTrigger value="others" className="bg-transparent text-muted-foreground hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none p-0 py-1 text-sm font-semibold transition-all">Other's Notes</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <div className="space-y-4">
                                    {filteredNotes?.map(note => (
                                        <div key={note.id} className="p-4 border rounded-lg bg-background group transition-colors hover:border-primary/20">
                                            {editingNoteId === note.id ? (
                                                <div className="space-y-4">
                                                    <Textarea 
                                                        className="min-h-[100px] resize-none" 
                                                        value={editingNoteText} 
                                                        onChange={(e) => setEditingNoteText(e.target.value)} 
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={handleCancelEditNote}>
                                                            <X className="h-4 w-4 mr-2" />
                                                            Cancel
                                                        </Button>
                                                        <Button size="sm" onClick={() => handleUpdateNote(note.id)}>
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Update Note
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-foreground">{note.author}</span>
                                                            <span className="text-xs text-muted-foreground">{new Date(note.date).toLocaleString()}</span>
                                                            {note.isShared && <Badge variant="outline" className="text-[10px] uppercase h-4 px-1">Shared</Badge>}
                                                        </div>
                                                        <p className="text-sm mt-3 text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                                    </div>
                                                    {note.authorId === currentUser.id && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white transition-colors group/note-btn" 
                                                                onClick={() => handleStartEditNote(note)}
                                                            >
                                                                <Pencil className="h-4 w-4 transition-colors group-hover/note-btn:text-white" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 hover:bg-destructive hover:text-white text-muted-foreground transition-colors group/note-btn" 
                                                                onClick={() => handleDeleteNote(note.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 transition-colors group-hover/note-btn:text-white" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredNotes?.length === 0 && (
                                        <p className="text-sm text-center text-muted-foreground py-8">No notes found.</p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="related-definitions" className="mt-6">
                        <RelatedDefinitions currentDefinition={definition} allDefinitions={allDefinitions} onDefinitionClick={handleDefinitionClick} onSave={onSave} isAdmin={isAdmin} />
                    </TabsContent>
                </Tabs>
            </div>
        </article>

        <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
            {selectedTable && (
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>{selectedTable.name}</DialogTitle></DialogHeader>
                    <div className="max-h-[60vh] overflow-auto">
                        <Table><TableHeader><TableRow>{selectedTable.headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{selectedTable.rows.map((r, i) => <TableRow key={i}>{r.map((c, ci) => <TableCell key={ci}>{c ?? 'NULL'}</TableCell>)}</TableRow>)}</TableBody></Table>
                    </div>
                </DialogContent>
            )}
        </Dialog>

        <DataSourcePreviewDialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen} sourceName={definition.sourceName || null} databaseName={resolvedSourceInfo.database} />

        {showComparison && selectedRevisions.length === 2 && (
             <RevisionComparisonDialog open={showComparison} onOpenChange={setShowComparison} revision1={selectedRevisions[0]} revision2={selectedRevisions[1]} currentDefinitionName={definition.name} />
        )}
    </TooltipProvider>
  );
}
