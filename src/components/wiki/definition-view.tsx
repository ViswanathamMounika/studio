"use client";

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import type { Definition, Revision, Note, SectionValue, DiscussionMessage, Template, TemplateSection } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bookmark, Info, Lock as LockIcon, MessageSquare, History, AlertCircle, RefreshCw, Clock, CheckCircle2, ChevronRight, User2, X, Send, AlertTriangle, Trash2, ClipboardList, Share2 } from 'lucide-react';
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
  templates?: Template[];
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
  currentUser: { id: string; name: string; avatar?: string };
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
    definition, allDefinitions, templates, liveVersion, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, 
    activeTab, onTabChange, onSave, onDiscard, isAdmin, currentUser, viewingMode
}: DefinitionViewProps) {
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [showConflictDiff, setShowConflictDiff] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
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

    const groupedSections = useMemo(() => {
        const selectedTemplate = (templates || initialTemplates).find(t => t.id === definition.templateId) || (templates || initialTemplates)[0];
        if (!selectedTemplate) return [];
        const allSections = selectedTemplate.sections || [];
        
        const standaloneSections = allSections.filter(s => !s.group);
        const uniqueGroupNames = Array.from(new Set(allSections.filter(s => s.group).map(s => s.group as string)));

        const units: Array<{ type: 'section' | 'group', order: number, name?: string, sections: TemplateSection[] }> = [];

        standaloneSections.forEach(s => {
          units.push({ type: 'section', order: s.order, sections: [s] });
        });

        uniqueGroupNames.forEach(name => {
          const groupSections = allSections.filter(s => s.group === name);
          const groupOrder = groupSections[0]?.groupOrder || 0;
          units.push({ 
            type: 'group', 
            name, 
            order: groupOrder, 
            sections: groupSections.sort((a, b) => a.order - b.order) 
          });
        });

        return units.sort((a, b) => a.order - b.order);
    }, [definition.templateId, templates]);

    const renderSectionContent = (section: TemplateSection, value?: SectionValue) => {
        if (!value) {
            // Fallback for backward compatibility if template mappings haven't migrated
            if (section.id === '1') return <p className="text-sm text-slate-700">{definition.shortDescription || 'Not provided'}</p>;
            if (section.id === '2') return <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: definition.description || '<p class="italic text-slate-400">No description provided.</p>' }} />;
            if (section.id === '3') return <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: definition.technicalDetails || '<p class="italic text-slate-400">Not provided</p>' }} />;
            if (section.id === '4') return <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: definition.usageExamples || '<p class="italic text-slate-400">Not provided</p>' }} />;
            
            return <p className="italic text-slate-400 text-sm">Not provided</p>;
        }

        switch (section.fieldType) {
            case 'RichText':
                return <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: value.html || value.raw || '<p class="italic text-slate-400">No content provided.</p>' }} />;
            case 'PlainText':
                return <p className="text-sm text-slate-700 whitespace-pre-wrap">{value.raw || 'Not provided'}</p>;
            case 'Dropdown':
                const displayValue = section.isMulti ? (value.multiValues || []).join(', ') : value.raw;
                return <p className="text-sm text-slate-700">{displayValue || 'Not provided'}</p>;
            case 'KeyValue':
                if (!value.structuredRows || value.structuredRows.length === 0) return <p className="italic text-slate-400 text-sm">No records provided</p>;
                const cols = section.columns?.sort((a,b) => a.sortOrder - b.sortOrder) || [];
                return (
                    <div className="border rounded-lg overflow-hidden mt-2">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    {cols.map(col => <TableHead key={col.id} className="font-bold text-slate-700 h-10">{col.name}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {value.structuredRows.map((row, rIdx) => (
                                    <TableRow key={rIdx} className="border-slate-100">
                                        {cols.map(col => <TableCell key={col.id} className="py-2.5 text-sm">{row[col.id] || '—'}</TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                );
            default:
                return <p className="text-sm text-slate-700">{value.raw}</p>;
        }
    };

    const handleSaveNote = () => {
        if (!noteText.trim() || definition.isArchived) return;
        const newNote: Note = { 
            id: Date.now().toString(), 
            authorId: currentUser.id, 
            author: currentUser.name, 
            avatar: currentUser.avatar || '', 
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

    const latestFeedback = feedbackMessages[feedbackMessages.length - 1];

    const getWorkflowStatus = () => {
        if (definition.isPendingApproval) return { draft: 'completed', submitted: 'active', requested: 'pending' };
        if (latestFeedback) return { draft: 'completed', submitted: 'completed', requested: 'active' };
        if (definition.isDraft) return { draft: 'active', submitted: 'pending', requested: 'pending' };
        return { draft: 'completed', submitted: 'completed', requested: 'completed' };
    };

    const status = getWorkflowStatus();

    const myNotes = useMemo(() => (definition.notes || []).filter(n => n.authorId === currentUser.id), [definition.notes, currentUser.id]);
    const othersNotes = useMemo(() => (definition.notes || []).filter(n => n.authorId !== currentUser.id), [definition.notes, currentUser.id]);

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
                                    The published version has changed since you started this draft. Review differences before submitting.
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

            {/* Workflow Ribbon */}
            {(viewingMode === 'draft' || definition.isPendingApproval) && (
              <div className="flex items-center gap-4 px-2 mb-4">
                  <div className="flex items-center gap-4">
                      <WorkflowStep label="Draft" status={status.draft as any} />
                      <WorkflowStep label="Submitted" status={status.submitted as any} />
                      <WorkflowStep label="Requested" status={status.requested as any} isLast />
                  </div>

                  {latestFeedback && (
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

            {/* Inline Feedback Pane */}
            {showFeedbackPane && latestFeedback && (
                <div className="px-2 mb-6 animate-in slide-in-from-top-2 fade-in">
                    <Card className="border-indigo-100 bg-indigo-50/30 rounded-2xl overflow-hidden shadow-sm">
                        <CardHeader className="py-2.5 px-4 bg-white/50 border-b border-indigo-100 flex flex-row items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Latest Approver Feedback</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400" onClick={() => setShowFeedbackPane(false)}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <Avatar className="h-7 w-7"><AvatarImage src={latestFeedback.avatar}/><AvatarFallback>{latestFeedback.author.charAt(0)}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-900">{latestFeedback.author}</span>
                                        <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(latestFeedback.date), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 italic m-0">"{latestFeedback.content}"</p>
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
                    {definition.keywords && definition.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {definition.keywords.map(k => (
                                <Badge key={k} variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold px-3">
                                    {k}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-primary">
                        <Share2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onToggleBookmark(definition.id)} className="text-primary">
                      <Bookmark className={cn("h-5 w-5", definition.isBookmarked && "fill-primary")} />
                    </Button>
                    {!definition.isArchived && (
                        <Button onClick={onEdit} className="bg-primary hover:bg-primary/90 font-bold px-6 h-9 rounded-lg">Edit</Button>
                    )}
                    <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={() => onDuplicate(definition.id)} onArchive={onArchive} onToggleBookmark={onToggleBookmark} isAdmin={isAdmin} />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mt-4">
                <TabsList className="w-full bg-slate-100 rounded-lg p-1 h-12">
                    <TabsTrigger value="description" className="flex-1 font-bold text-sm">Description</TabsTrigger>
                    <TabsTrigger value="version-history" className="flex-1 font-bold text-sm">Version History</TabsTrigger>
                    <TabsTrigger value="attachments" className="flex-1 font-bold text-sm">Attachments</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 font-bold text-sm">Notes</TabsTrigger>
                    <TabsTrigger value="related-definitions" className="flex-1 font-bold text-sm">Related Definitions</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6 space-y-10">
                    {groupedSections.length > 0 ? (
                        groupedSections.map((unit, uIdx) => (
                            <div key={uIdx} className="space-y-6">
                                {unit.type === 'group' && (
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">{unit.name}</h3>
                                        <div className="h-px bg-slate-200 flex-1" />
                                    </div>
                                )}
                                
                                <Accordion type="multiple" defaultValue={unit.sections.map(s => s.id)} className="space-y-4">
                                    {unit.sections.map(section => {
                                        const value = (definition.sectionValues || []).find(v => v.sectionId === section.id);
                                        return (
                                            <AccordionItem key={section.id} value={section.id} className="border rounded-xl px-6 bg-white border-slate-200 shadow-sm overflow-hidden">
                                                <AccordionTrigger className="font-bold py-4 hover:no-underline">
                                                    <div className="flex items-center gap-2">
                                                        {section.name}
                                                        <Info className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6">
                                                    {renderSectionContent(section, value)}
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <Info className="h-8 w-8 text-slate-300 mb-2" />
                            <p className="text-sm font-medium text-slate-400 italic">No documentation structure defined for this item.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="version-history" className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Archive Revisions</h2>
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

                <TabsContent value="notes" className="mt-8 space-y-8">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">Notes</h2>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">Add a Note</h3>
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="relative border border-slate-200 rounded-lg p-1 bg-white focus-within:ring-1 focus-within:ring-primary/20">
                            <Textarea 
                                value={noteText} 
                                onChange={e => setNoteText(e.target.value)} 
                                placeholder="Add a personal or shared note..." 
                                className="border-none shadow-none focus-visible:ring-0 min-h-[100px] resize-none text-sm placeholder:text-slate-400" 
                                maxLength={5000}
                            />
                            <div className="absolute bottom-2 right-3 text-[10px] font-medium text-slate-400">
                                {noteText.length}/5000
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox id="share" checked={shareNote} onCheckedChange={v => setShareNote(!!v)} />
                                <Label htmlFor="share" className="text-xs font-medium text-slate-500 cursor-pointer">Share with everyone</Label>
                            </div>
                            <Button 
                                onClick={handleSaveNote} 
                                disabled={!noteText.trim()} 
                                className="rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 h-9 transition-all"
                            >
                                Save
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-sm font-bold text-slate-900">Saved Notes</h3>
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                        </div>

                        <Tabs defaultValue="my-notes" className="w-full">
                            <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-8">
                                <TabsTrigger value="my-notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 pb-2 text-sm font-bold text-slate-500 data-[state=active]:text-primary">
                                    My Notes
                                </TabsTrigger>
                                <TabsTrigger value="others-notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 pb-2 text-sm font-bold text-slate-500 data-[state=active]:text-primary">
                                    Other's Notes
                                </TabsTrigger>
                                <TabsTrigger value="review-history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 pb-2 text-sm font-bold text-slate-500 data-[state=active]:text-primary">
                                    Review History
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="my-notes" className="mt-6 space-y-4">
                                {myNotes.length > 0 ? (
                                    myNotes.map(note => (
                                        <Card key={note.id} className="p-4 rounded-xl border-slate-200 shadow-sm bg-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6"><AvatarImage src={note.avatar}/><AvatarFallback>{note.author.charAt(0)}</AvatarFallback></Avatar>
                                                    <span className="font-bold text-slate-900 text-xs">{note.author}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(note.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium pl-8">{note.content}</p>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic px-2">You haven't added any personal notes yet.</p>
                                )}
                            </TabsContent>

                            <TabsContent value="others-notes" className="mt-6 space-y-4">
                                {othersNotes.length > 0 ? (
                                    othersNotes.map(note => (
                                        <Card key={note.id} className="p-4 rounded-xl border-slate-200 shadow-sm bg-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6"><AvatarImage src={note.avatar}/><AvatarFallback>{note.author.charAt(0)}</AvatarFallback></Avatar>
                                                    <span className="font-bold text-slate-900 text-xs">{note.author}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(note.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium pl-8">{note.content}</p>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic px-2">No notes shared by other team members.</p>
                                )}
                            </TabsContent>

                            <TabsContent value="review-history" className="mt-6 space-y-4">
                                {definition.discussions && definition.discussions.length > 0 ? (
                                    <div className="space-y-4">
                                        {definition.discussions.map((msg) => (
                                            <Card key={msg.id} className={cn(
                                                "p-4 rounded-xl border-slate-200 shadow-sm",
                                                msg.type === 'change-request' ? "bg-amber-50/30 border-amber-100" :
                                                msg.type === 'rejection' ? "bg-red-50/30 border-red-100" : "bg-white"
                                            )}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={msg.avatar} />
                                                        <AvatarFallback><User2 className="h-3 w-3" /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 text-xs">{msg.author}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(msg.date).toLocaleDateString()}</span>
                                                    </div>
                                                    {msg.type !== 'comment' && (
                                                      <Badge className={cn(
                                                        "ml-auto text-[9px] uppercase font-black",
                                                        msg.type === 'rejection' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                                      )}>
                                                        {msg.type === 'rejection' ? 'Rejected' : 'Changes Requested'}
                                                      </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-700 m-0 leading-relaxed font-medium pl-9">"{msg.content}"</p>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                        <ClipboardList className="h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-xs font-medium text-slate-400">No governance history recorded.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-8">
                    <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b px-6 py-4">
                            <CardTitle className="text-lg font-bold">Reference Attachments</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AttachmentList attachments={definition.attachments} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="related-definitions" className="mt-8">
                    <RelatedDefinitions 
                        currentDefinition={definition} 
                        allDefinitions={allDefinitions} 
                        onDefinitionClick={(id) => {
                            onTabChange('description');
                        }} 
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
