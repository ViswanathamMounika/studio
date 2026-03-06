
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
import { Pencil, Bookmark, Trash2, Share2, Info } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    authorizationStatusCodes, 
    cmsComplianceMatrix, 
    timestampChangedTable, 
    vwAuthActionTimeTable, 
    initialDefinitions, 
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
import useLocalStorage from '@/hooks/use-local-storage';
import DataSourcePreviewDialog from './data-source-preview-dialog';

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

/**
 * Highlights a search query within a plain text string.
 */
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight?.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-300/40 font-semibold rounded-sm px-0.5">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

/**
 * Safely highlights a search query within an HTML string without breaking tags.
 */
const highlightHtml = (html: string, query: string) => {
    if (!query?.trim()) return html;
    
    // This regex matches the query only if it's NOT inside an HTML tag.
    // It looks for the query followed by anything that isn't a '>' before it sees a '<'.
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})(?![^<]*>)`, 'gi');
    
    return html.replace(regex, '<span class="bg-yellow-300/40 font-semibold rounded-sm px-0.5">$1</span>');
};

export default function DefinitionView({ 
    definition, 
    onEdit, 
    onDuplicate, 
    onArchive, 
    onDelete, 
    onToggleBookmark, 
    activeTab, 
    onTabChange, 
    onSave, 
    isAdmin,
    searchQuery = "" 
}: DefinitionViewProps) {
    const [selectedTable, setSelectedTable] = useState<SupportingTable | null>(null);
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
    
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

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

  return (
    <TooltipProvider>
        <article className="prose prose-sm max-w-none my-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-muted-foreground">{definition.module}</p>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold mt-0">
                            <HighlightedText text={definition.name} highlight={searchQuery} />
                        </h2>
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
                        <Accordion type="multiple" defaultValue={['description', 'short-description', 'template-content']} className="space-y-4">
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
                                                        onClick={() => setIsPreviewDialogOpen(true)}
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
                                    <p className="text-sm">
                                        <HighlightedText text={definition.shortDescription || 'No short description available.'} highlight={searchQuery} />
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Template Dynamic Sections */}
                            {definition.templateId && definition.dynamicSections && definition.dynamicSections.length > 0 && (
                                <AccordionItem value="template-content" className="bg-card border rounded-lg shadow-sm px-4 border-primary/20">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base">Template Sections</span>
                                            <Badge variant="outline" className="ml-2 text-[10px] uppercase">Structured</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4 space-y-6">
                                        {definition.dynamicSections.sort((a,b) => a.order - b.order).map(section => (
                                            <div key={section.sectionId} className="space-y-2">
                                                <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                                                    {section.name}
                                                    {section.isMandatory && <span className="text-destructive">*</span>}
                                                </h4>
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
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-base">Description</span>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4">
                                            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: highlightHtml(definition.description, searchQuery) }} />
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
                                            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: highlightHtml(definition.technicalDetails || 'No technical details provided.', searchQuery) }} />
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
                                            <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: highlightHtml(definition.usageExamples || 'No usage examples or SQL views available.', searchQuery) }} />
                                        </AccordionContent>
                                    </AccordionItem>
                                </>
                            )}
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
        <DataSourcePreviewDialog 
            open={isPreviewDialogOpen} 
            onOpenChange={setIsPreviewDialogOpen} 
            sourceName={definition.sourceName || null} 
            databaseName={resolvedSourceInfo.database} 
        />

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
