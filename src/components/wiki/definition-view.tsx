
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
import { Bookmark, Info, Lock as LockIcon, MessageSquare, History, AlertCircle, RefreshCw, Clock, CheckCircle2, ChevronRight, User2, X, Send, AlertTriangle, Trash2 } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { initialTemplates } from '@/lib/data';
import { cn } from '@/lib/utils';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import RelatedDefinitions from './related-definitions';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RevisionComparisonDialog = dynamic(() => import('./revision-comparison-dialog'), { ssr: false });

type DefinitionViewProps = {
  definition: Definition;
  allDefinitions: Definition[];
  liveVersion?: Definition | null;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onPublish?: (id: string) => void;
  onReject?: (id: string, requestData?: { content: string; priority?: 'Low' | 'Medium' | 'High'; isRejection?: boolean }) => void;
  onSendApproval?: (id: string) => void;
  onDiscard?: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave: (definition: Definition) => void;
  isAdmin: boolean;
  currentUser: { id: string; name: string };
  viewingMode: 'live' | 'draft';
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
    definition, allDefinitions, liveVersion, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, 
    activeTab, onTabChange, onSave, onDiscard, isAdmin, currentUser, viewingMode
}: DefinitionViewProps) {
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [showConflictDiff, setShowConflictDiff] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    const [notesTab, setNotesTab] = useState('my-notes');
    const [showFeedbackPane, setShowFeedbackPane] = useState(false);
    
    const { toast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => {
            Prism.highlightAll();
        }, 100);
        return () => clearTimeout(timer);
    }, [definition, activeTab]);

    const isOutdated = useMemo(() => {
        if (viewingMode !== 'draft' || !definition.baseVersionId || !liveVersion) return false;
        const currentLiveRevId = liveVersion.revisions[0]?.ticketId;
        return currentLiveRevId && definition.baseVersionId !== currentLiveRevId;
    }, [viewingMode, definition.baseVersionId, liveVersion]);

    const handleSaveNote = () => {
        if (!noteText.trim() || definition.isArchived) return;
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
        toast({ title: 'Note Saved' });
    };

    const handleToggleRevision = (rev: Revision) => {
        setSelectedRevisions(prev => {
            const isSelected = prev.some(r => r.ticketId === rev.ticketId);
            if (isSelected) return prev.filter(r => r.ticketId !== rev.ticketId);
            if (prev.length >= 2) return prev;
            return [...prev, rev];
        });
    };

    const feedbackMessages = useMemo(() => {
      return (definition.discussions || []).filter(d => d.type === 'change-request' || d.type === 'rejection');
    }, [definition.discussions]);

    const activeFeedback = feedbackMessages[feedbackMessages.length - 1];

    const getWorkflowStatus = () => {
        if (definition.isPendingApproval) return { draft: 'completed', submitted: 'active', requested: 'pending' };
        if (activeFeedback) return { draft: 'completed', submitted: 'completed', requested: 'active' };
        if (definition.isDraft) return { draft: 'active', submitted: 'pending', requested: 'pending' };
        return { draft: 'completed', submitted: 'completed', requested: 'completed' };
    };

    const status = getWorkflowStatus();

  return (
    <TooltipProvider>
        <article className="max-w-none">
            {/* Version Conflict Warning */}
            {isOutdated && (
                <div className="px-2 mb-6">
                    <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-2xl shadow-sm">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div className="flex-1 ml-3 flex items-center justify-between">
                            <div>
                                <AlertTitle className="text-red-900 font-bold">Version Conflict Detected</AlertTitle>
                                <AlertDescription className="text-red-700 text-xs font-medium">
                                    The published version has changed since you started this draft. Your draft is based on an older version. Review differences before submitting.
                                </AlertDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="bg-white border-red-200 text-red-700 hover:bg-red-100 font-bold rounded-xl h-8" onClick={() => setShowConflictDiff(true)}>
                                    <History className="h-3.5 w-3.5 mr-1.5" /> View Diff
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 font-bold rounded-xl h-8" onClick={() => onDiscard?.(definition.id)}>
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard Draft
                                </Button>
                            </div>
                        </div>
                    </Alert>
                </div>
            )}

            {viewingMode === 'draft' && (
              <div className="flex items-center gap-4 px-2 mb-4">
                  <div className="flex items-center gap-4">
                      <WorkflowStep label="Draft" status={status.draft as any} />
                      <WorkflowStep label="Submitted" status={status.submitted as any} />
                      <WorkflowStep label="Feedback" status={status.requested as any} isLast />
                  </div>

                  {activeFeedback && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowFeedbackPane(!showFeedbackPane)}
                        className={cn("h-8 w-8 rounded-xl border transition-all", showFeedbackPane ? "bg-primary text-white border-primary" : "bg-indigo-50 text-indigo-600 border-indigo-100")}
                      >
                          <MessageSquare className="h-4 w-4" />
                      </Button>
                  )}
              </div>
            )}

            {viewingMode === 'draft' && showFeedbackPane && activeFeedback && (
                <div className="px-2 mb-6 animate-in slide-in-from-top-2 fade-in">
                    <Card className="border-indigo-100 bg-indigo-50/30 rounded-2xl overflow-hidden shadow-sm">
                        <CardHeader className="py-2.5 px-4 bg-white/50 border-b border-indigo-100 flex flex-row items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Latest Feedback</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400" onClick={() => setShowFeedbackPane(false)}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <Avatar className="h-7 w-7"><AvatarImage src={activeFeedback.avatar}/><AvatarFallback>{activeFeedback.author.charAt(0)}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-900">{activeFeedback.author}</span>
                                        <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(activeFeedback.date), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 italic m-0">"{activeFeedback.content}"</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex justify-between items-start mb-2 px-2">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">{definition.module}</p>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 m-0">{definition.name}</h1>
                        <Badge variant="outline" className={cn(
                          "h-6 rounded-full font-bold text-[10px] uppercase",
                          viewingMode === 'live' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                            {definition.isArchived ? 'Archived' : viewingMode === 'live' ? 'Published' : 'Draft'}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onToggleBookmark(definition.id)} className="text-slate-400">
                      <Bookmark className={cn("h-5 w-5", definition.isBookmarked && "fill-primary text-primary")} />
                    </Button>
                    {!definition.isArchived && (
                        <Button onClick={onEdit} className="bg-primary hover:bg-primary/90 font-bold px-6">Edit</Button>
                    )}
                    <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={() => onDuplicate(definition.id)} onArchive={onArchive} onToggleBookmark={onToggleBookmark} isAdmin={isAdmin} />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="w-full bg-slate-100 rounded-lg p-1 h-12">
                    <TabsTrigger value="description" className="flex-1 font-bold text-sm">Description</TabsTrigger>
                    <TabsTrigger value="revisions" className="flex-1 font-bold text-sm">History</TabsTrigger>
                    <TabsTrigger value="attachments" className="flex-1 font-bold text-sm">Attachments</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 font-bold text-sm">Notes</TabsTrigger>
                    <TabsTrigger value="related-definitions" className="flex-1 font-bold text-sm">Links</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6">
                    <Accordion type="multiple" defaultValue={["short-description", "description"]} className="space-y-4">
                        <AccordionItem value="short-description" className="border rounded-xl px-6 bg-white border-slate-200 shadow-sm overflow-hidden">
                            <AccordionTrigger className="font-bold py-4">Short Description</AccordionTrigger>
                            <AccordionContent className="pb-6 text-sm text-slate-700 leading-relaxed">
                                {definition.shortDescription || 'Not provided'}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="description" className="border rounded-xl px-6 bg-white border-slate-200 shadow-sm overflow-hidden">
                            <AccordionTrigger className="font-bold py-4">Description</AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: definition.description || '<p class="italic text-slate-400">No description provided.</p>' }} />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="technical-details" className="border rounded-xl px-6 bg-white border-slate-200 shadow-sm overflow-hidden">
                            <AccordionTrigger className="font-bold py-4">Technical Details</AccordionTrigger>
                            <AccordionContent className="pb-6">
                                <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: definition.technicalDetails || '<p class="italic text-slate-400">Not provided</p>' }} />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>

                <TabsContent value="revisions" className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Version History</h2>
                        <Button variant="outline" size="sm" disabled={selectedRevisions.length !== 2} onClick={() => setShowComparison(true)} className="rounded-xl font-bold">Compare Revisions</Button>
                    </div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow><TableHead className="w-12"/><TableHead className="text-[10px] font-black uppercase">Date</TableHead><TableHead className="text-[10px] font-black uppercase">User</TableHead><TableHead className="text-[10px] font-black uppercase">Summary</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {definition.revisions.map(r => (
                                <TableRow key={r.ticketId} className="hover:bg-slate-50">
                                    <TableCell><Checkbox checked={selectedRevisions.some(sr => sr.ticketId === r.ticketId)} onCheckedChange={() => handleToggleRevision(r)}/></TableCell>
                                    <TableCell className="font-bold text-slate-900">{r.date}</TableCell>
                                    <TableCell className="text-slate-600 font-medium">{r.developer}</TableCell>
                                    <TableCell className="text-slate-500">{r.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="notes" className="mt-8 space-y-6">
                    <Card className="p-6 bg-primary/5 border-primary/10 rounded-2xl">
                        <Label className="text-sm font-bold text-primary mb-2 block">Add Insight</Label>
                        <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Share internal context or caveats..." className="rounded-xl mb-4 h-24 bg-white" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Checkbox id="share" checked={shareNote} onCheckedChange={v => setShareNote(!!v)} /><Label htmlFor="share" className="text-xs font-bold text-primary">Visible to team</Label></div>
                            <Button onClick={handleSaveNote} disabled={!noteText.trim()} className="rounded-xl font-bold">Save Note</Button>
                        </div>
                    </Card>
                    <div className="space-y-4">
                        {(definition.notes || []).map(note => (
                            <Card key={note.id} className="p-4 rounded-xl border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{note.author}</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(note.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{note.content}</p>
                            </Card>
                        ))}
                    </div>
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

        {showConflictDiff && liveVersion && (
            <RevisionComparisonDialog
                open={showConflictDiff}
                onOpenChange={setShowConflictDiff}
                revision1={{
                    ticketId: 'DRAFT',
                    date: 'Current',
                    developer: 'You',
                    description: 'Your Personal Draft',
                    snapshot: definition
                }}
                revision2={{
                    ticketId: 'LIVE',
                    date: liveVersion.revisions[0]?.date || 'Now',
                    developer: liveVersion.revisions[0]?.developer || 'System',
                    description: 'Current Published Version',
                    snapshot: liveVersion
                }}
                definition={definition}
            />
        )}
    </TooltipProvider>
  );
}
