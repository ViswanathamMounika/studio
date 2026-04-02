
"use client";

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import type { Definition, Revision, Note, SectionValue, DiscussionMessage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bookmark, Info, Lock as LockIcon, MessageSquare, History, AlertCircle, RefreshCw, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { initialTemplates } from '@/lib/data';
import { cn } from '@/lib/utils';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import RelatedDefinitions from './related-definitions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  onReject?: (id: string, requestData?: { content: string; priority?: 'Low' | 'Medium' | 'High'; isRejection?: boolean }) => void;
  onSendApproval?: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave: (definition: Definition) => void;
  isAdmin: boolean;
  searchQuery?: string;
  currentUser: { id: string; name: string };
  onOpenFeedback?: () => void;
};

const WorkflowStep = ({ label, status, isLast = false }: { label: string, status: 'completed' | 'active' | 'pending', isLast?: boolean }) => {
    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                status === 'completed' ? "bg-emerald-50 text-emerald-600" : 
                status === 'active' ? "bg-primary text-white shadow-sm" : 
                "bg-slate-100 text-slate-400"
            )}>
                {status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : null}
                {label}
            </div>
            {!isLast && <ChevronRight className="h-3 w-3 text-slate-300" />}
        </div>
    );
};

export default function DefinitionView({ 
    definition, allDefinitions, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, 
    activeTab, onTabChange, onSave, isAdmin, currentUser, onOpenFeedback 
}: DefinitionViewProps) {
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    const [notesTab, setNotesTab] = useState('my-notes');
    
    const { toast } = useToast();

    const selectedTemplate = useMemo(() => 
      initialTemplates.find(t => t.id === definition.templateId), 
    [definition.templateId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            Prism.highlightAll();
        }, 100);
        return () => clearTimeout(timer);
    }, [definition, activeTab]);

    const handleSaveNote = () => {
        if (!noteText.trim() || definition.isArchived) return;
        const newNote: Note = { 
            id: Date.now().toString(), 
            authorId: currentUser.id, 
            author: currentUser.name, 
            avatar: "https://picsum.photos/seed/dhilip/40/40", 
            date: new Date().toISOString(), 
            content: noteText, 
            isShared: shareNote 
        };
        onSave({ ...definition, notes: [...(definition.notes || []), newNote] });
        setNoteText('');
        setShareNote(false);
        toast({ title: 'Note Saved', description: 'Your note has been added.' });
    };

    const handleToggleRevision = (rev: Revision) => {
        if (definition.isArchived) return;
        setSelectedRevisions(prev => {
            const isSelected = prev.some(r => r.ticketId === rev.ticketId);
            if (isSelected) {
                return prev.filter(r => r.ticketId !== rev.ticketId);
            }
            if (prev.length >= 2) {
                return prev;
            }
            return [...prev, rev];
        });
    };

    const myNotes = (definition.notes || []).filter(n => n.authorId === currentUser.id);
    const otherNotes = (definition.notes || []).filter(n => n.authorId !== currentUser.id);

    const activeFeedback = useMemo(() => {
      const messages = definition.discussions || [];
      return messages.filter(d => d.type === 'change-request' || d.type === 'rejection').slice(-1)[0];
    }, [definition.discussions]);

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'revisions', label: 'Version History' },
        { id: 'attachments', label: 'Attachments' },
        { id: 'notes', label: 'Notes' },
        { id: 'related-definitions', label: 'Related Definitions' },
    ];

    const getSectionValue = (sectionId: string) => {
        return definition.sectionValues?.find(v => v.sectionId === sectionId);
    };

    const getWorkflowStatus = () => {
        if (definition.isPendingApproval) return { draft: 'completed', submitted: 'active', requested: 'pending' };
        if (activeFeedback) return { draft: 'completed', submitted: 'completed', requested: 'active' };
        if (definition.isDraft) return { draft: 'active', submitted: 'pending', requested: 'pending' };
        return { draft: 'completed', submitted: 'completed', requested: 'completed' }; // Published
    };

    const status = getWorkflowStatus();

  return (
    <TooltipProvider>
        <article className="max-w-none">
            <div className="flex justify-between items-start mb-2 px-2">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">{definition.module}</p>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 m-0">{definition.name}</h1>
                        <Badge variant="outline" className={cn(
                          "h-6 rounded-full font-bold text-[10px] uppercase",
                          definition.isPendingApproval ? "bg-amber-50 text-amber-700 border-amber-200" :
                          activeFeedback ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          "bg-slate-50"
                        )}>
                            {definition.isArchived ? 'Archived' : 
                             definition.isPendingApproval ? 'Pending Approval' :
                             activeFeedback ? 'Update Required' :
                             definition.isDraft ? 'Draft' : 'Published'}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {activeFeedback && (
                      <Button variant="outline" size="sm" onClick={onOpenFeedback} className="rounded-xl border-slate-200 font-bold gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Feedback History
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onToggleBookmark(definition.id)} className="text-slate-400">
                      <Bookmark className={cn("h-5 w-5", definition.isBookmarked && "fill-primary text-primary")} />
                    </Button>
                    {!definition.isArchived && !definition.isPendingApproval && (
                        <Button onClick={onEdit} className="bg-primary hover:bg-primary/90 font-bold px-6 shadow-sm">
                            Edit
                        </Button>
                    )}
                    <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onToggleBookmark={onToggleBookmark} isAdmin={isAdmin} />
                </div>
            </div>

            {/* Workflow Strip */}
            <div className="flex flex-col gap-3 px-2 mb-8">
                <div className="flex items-center gap-4">
                    <WorkflowStep label="Draft Completed" status={status.draft as any} />
                    <WorkflowStep label="Submitted" status={status.submitted as any} />
                    <WorkflowStep label="Requested Changes" status={status.requested as any} isLast />
                </div>

                {activeFeedback && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">Latest Admin Comment</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            "{activeFeedback.content}"
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-bold">Author: {activeFeedback.author}</span>
                            <span className="text-slate-200">•</span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(activeFeedback.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="w-full bg-slate-100/80 border-b-0 rounded-lg p-1 h-12 flex justify-between gap-1 overflow-hidden">
                    {tabs.map(tab => (
                        <TabsTrigger 
                            key={tab.id} 
                            value={tab.id} 
                            className="flex-1 rounded-md text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary py-2.5 text-sm font-bold transition-all"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="description" className="mt-6">
                    <Accordion type="multiple" defaultValue={["source-of-truth", "short-description"]} className="space-y-4">
                        {/* 1. Source of Truth */}
                        <AccordionItem value="source-of-truth" className="border rounded-xl px-6 bg-white shadow-sm overflow-hidden border-slate-200">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">Source of Truth</span>
                                    <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-3">
                                        <p className="text-sm font-bold text-slate-900">Source of Truth for Objects:</p>
                                        <div className="space-y-2 pl-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">Source Type:</span>
                                                <span className="text-sm text-slate-600">{definition.sourceType || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">Source Name:</span>
                                                <span className="text-sm text-slate-600">{definition.sourceName || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {getSectionValue('8') && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                                            {getSectionValue('8')?.multiValues?.map(v => (
                                                <Badge key={v} className="bg-slate-100 text-slate-700 border-slate-200 font-bold">{v}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 2. Short Description */}
                        <AccordionItem value="short-description" className="border rounded-xl px-6 bg-white shadow-sm overflow-hidden border-slate-200">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">Short Description</span>
                                    <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <p className="text-sm text-slate-700 leading-relaxed pt-2">
                                    {definition.shortDescription || getSectionValue('1')?.raw || 'Not provided'}
                                </p>
                            </AccordionContent>
                        </AccordionItem>

                        {/* 3. Description */}
                        <AccordionItem value="description" className="border rounded-xl px-6 bg-white shadow-sm overflow-hidden border-slate-200">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">Description</span>
                                    <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="prose prose-sm max-w-none text-slate-700 pt-2" dangerouslySetInnerHTML={{ __html: getSectionValue('2')?.html || definition.description || '<p class="italic text-slate-400">Not provided</p>' }} />
                            </AccordionContent>
                        </AccordionItem>

                        {/* 4. Technical Details */}
                        <AccordionItem value="technical-details" className="border rounded-xl px-6 bg-white shadow-sm overflow-hidden border-slate-200">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">Technical Details</span>
                                    <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="prose prose-sm max-w-none text-slate-700 pt-2" dangerouslySetInnerHTML={{ __html: getSectionValue('3')?.html || definition.technicalDetails || '<p class="italic text-slate-400">Not provided</p>' }} />
                            </AccordionContent>
                        </AccordionItem>

                        {/* 5. Usage Examples */}
                        <AccordionItem value="usage-examples" className="border rounded-xl px-6 bg-white shadow-sm overflow-hidden border-slate-200">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">Usage Examples</span>
                                    <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="prose prose-sm max-w-none text-slate-700 pt-2" dangerouslySetInnerHTML={{ __html: getSectionValue('4')?.html || definition.usageExamples || '<p class="italic text-slate-400">Not provided</p>' }} />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>

                <TabsContent value="revisions" className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 mt-0">Version History</h2>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={selectedRevisions.length !== 2 || definition.isArchived}
                            onClick={() => setShowComparison(true)}
                            className="rounded-xl font-bold border-slate-200"
                        >
                            Compare Revision ({selectedRevisions.length})
                        </Button>
                    </div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm bg-white">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-200">
                                <TableHead className="w-12"></TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Date</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Developer</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {definition.revisions.length > 0 ? (
                                definition.revisions.map(r => (
                                    <TableRow key={r.ticketId} className="border-slate-100 hover:bg-slate-50/50">
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedRevisions.some(sr => sr.ticketId === r.ticketId)}
                                                onCheckedChange={() => handleToggleRevision(r)}
                                                disabled={definition.isArchived}
                                            />
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">{r.date}</TableCell>
                                        <TableCell className="text-slate-600 font-medium">{r.developer}</TableCell>
                                        <TableCell className="text-slate-500">{r.description}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">No historical records available.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="attachments" className="mt-8">
                    <AttachmentList attachments={definition.attachments} />
                </TabsContent>

                <TabsContent value="notes" className="mt-8 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 mt-0 px-2">Notes</h2>
                    {!definition.isArchived && (
                      <Card className="p-6 bg-primary/5 border-primary/10 rounded-2xl shadow-none">
                        <Label className="text-sm font-bold text-primary mb-2 block">Add a Note</Label>
                        <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Personal or shared insights..." className="rounded-xl border-primary/10 mb-4 h-24 bg-white focus-visible:ring-primary/20" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox id="share" checked={shareNote} onCheckedChange={v => setShareNote(!!v)} />
                            <Label htmlFor="share" className="text-xs font-bold text-primary cursor-pointer">Share with team</Label>
                          </div>
                          <Button onClick={handleSaveNote} disabled={!noteText.trim()} className="bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-sm">Save Note</Button>
                        </div>
                      </Card>
                    )}
                    
                    <Tabs value={notesTab} onValueChange={setNotesTab} className="w-full">
                        <TabsList className="bg-slate-100 p-1 rounded-lg h-9 mb-6 mx-2">
                            <TabsTrigger value="my-notes" className="text-xs font-bold px-4 data-[state=active]:bg-white data-[state=active]:text-primary">My Notes</TabsTrigger>
                            <TabsTrigger value="others-notes" className="text-xs font-bold px-4 data-[state=active]:bg-white data-[state=active]:text-primary">Others' Notes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-notes" className="space-y-4 m-0 px-2">
                            {myNotes.length > 0 ? (
                                myNotes.map(note => (
                                    <Card key={note.id} className="p-4 rounded-xl border-slate-200 shadow-sm bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{note.author}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">•</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(note.date).toLocaleDateString()}</span>
                                            </div>
                                            {note.isShared && <Badge variant="outline" className="text-[9px] uppercase font-black h-5 border-primary/10 text-primary bg-primary/5">Shared</Badge>}
                                        </div>
                                        <p className="text-sm text-slate-600 m-0 leading-relaxed font-medium">{note.content}</p>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400 italic">No notes found from you.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="others-notes" className="space-y-4 m-0 px-2">
                            {otherNotes.length > 0 ? (
                                otherNotes.map(note => (
                                    <Card key={note.id} className="p-4 rounded-xl border-slate-200 shadow-sm bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{note.author}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">•</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(note.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 m-0 leading-relaxed font-medium">{note.content}</p>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400 italic">No team notes found for this definition.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="related-definitions" className="mt-8">
                    <RelatedDefinitions 
                        currentDefinition={definition} 
                        allDefinitions={allDefinitions} 
                        onDefinitionClick={(id) => onTabChange('description')} 
                        onSave={onSave} 
                        isAdmin={isAdmin} 
                    />
                </TabsContent>
            </Tabs>
        </article>

        {showComparison && selectedRevisions.length === 2 && (
            <RevisionComparisonDialog
                open={showComparison}
                onOpenChange={setShowComparison}
                revision1={selectedRevisions[0]}
                revision2={selectedRevisions[1]}
                definition={definition}
            />
        )}
    </TooltipProvider>
  );
}
