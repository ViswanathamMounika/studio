
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
        const timer = setTimeout(() => { Prism.highlightAll(); }, 100);
        return () => clearTimeout(timer);
    }, [definition, activeTab]);

    const isOutdated = useMemo(() => {
        if (viewingMode !== 'draft' || !definition.baseVersionId || !liveVersion) return false;
        return liveVersion.revisions[0]?.ticketId && definition.baseVersionId !== liveVersion.revisions[0].ticketId;
    }, [viewingMode, definition.baseVersionId, liveVersion]);

    const groupedSections = useMemo(() => {
        const selectedTemplate = (templates || initialTemplates).find(t => t.id === definition.templateId) || (templates || initialTemplates)[0];
        if (!selectedTemplate) return [];
        const sections = selectedTemplate.sections || [];
        const units: Array<{ type: 'section' | 'group', order: number, name?: string, sections: TemplateSection[] }> = [];
        
        sections.filter(s => !s.group).forEach(s => units.push({ type: 'section', order: s.order, sections: [s] }));
        Array.from(new Set(sections.filter(s => s.group).map(s => s.group as string))).forEach(name => {
            const groupSections = sections.filter(s => s.group === name);
            units.push({ type: 'group', name, order: groupSections[0]?.groupOrder || 0, sections: groupSections.sort((a, b) => a.order - b.order) });
        });
        return units.sort((a, b) => a.order - b.order);
    }, [definition.templateId, templates]);

    const renderSectionContent = (section: TemplateSection, value?: SectionValue) => {
        if (!value) return <p className="italic text-slate-400 text-sm">Not provided</p>;
        switch (section.fieldType) {
            case 'RichText': return <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: value.html || value.raw || '<p class="italic">No content.</p>' }} />;
            case 'PlainText': return <p className="text-sm text-slate-700 whitespace-pre-wrap">{value.raw || 'Not provided'}</p>;
            case 'Dropdown': return <p className="text-sm text-slate-700">{section.isMulti ? (value.multiValues || []).join(', ') : value.raw || 'Not provided'}</p>;
            case 'KeyValue':
                if (!value.structuredRows?.length) return <p className="italic text-slate-400 text-sm">No records.</p>;
                const cols = section.columns?.sort((a,b) => a.sortOrder - b.sortOrder) || [];
                return (
                    <div className="border rounded-lg overflow-hidden mt-2"><Table><TableHeader className="bg-slate-50"><TableRow>{cols.map(c => <TableHead key={c.id} className="font-bold h-10">{c.name}</TableHead>)}</TableRow></TableHeader><TableBody>{value.structuredRows.map((row, ri) => <TableRow key={ri}>{cols.map(c => <TableCell key={c.id} className="py-2.5 text-sm">{row[c.id] || '—'}</TableCell>)}</TableRow>)}</TableBody></Table></div>
                );
            default: return <p className="text-sm">{value.raw}</p>;
        }
    };

    const handleSaveNote = () => {
        if (!noteText.trim()) return;
        const newNote: Note = { id: Date.now().toString(), authorId: currentUser.id, author: currentUser.name, avatar: currentUser.avatar || '', date: new Date().toISOString(), content: noteText, isShared: shareNote };
        onSave({ ...definition, notes: [...(definition.notes || []), newNote] });
        setNoteText(''); setShareNote(false);
        toast({ title: 'Note Saved' });
    };

    const latestFeedback = useMemo(() => {
      const fb = (definition.discussions || []).filter(d => d.type === 'change-request' || d.type === 'rejection');
      return fb[fb.length - 1];
    }, [definition.discussions]);

    const status = {
        draft: definition.isPendingApproval ? 'completed' : (definition.isDraft ? 'active' : 'completed'),
        submitted: definition.isPendingApproval ? 'active' : (latestFeedback ? 'completed' : 'pending'),
        requested: latestFeedback ? 'active' : 'pending'
    };

  return (
    <TooltipProvider>
        <article className="max-w-none">
            {isOutdated && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-2xl shadow-sm mb-6">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div className="flex-1 ml-3 flex items-center justify-between">
                        <div>
                            <AlertTitle className="text-red-900 font-bold">Version Conflict</AlertTitle>
                            <AlertDescription className="text-red-700 text-xs">The published version has changed. Review differences before submitting.</AlertDescription>
                        </div>
                        <Button variant="outline" size="sm" className="bg-white rounded-xl h-8 font-bold" onClick={() => setShowConflictDiff(true)}>View Diff</Button>
                    </div>
                </Alert>
            )}

            {(viewingMode === 'draft' || definition.isPendingApproval) && (
              <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                      <WorkflowStep label="Draft" status={status.draft as any} />
                      <WorkflowStep label="Submitted" status={status.submitted as any} />
                      <WorkflowStep label="Requested" status={status.requested as any} isLast />
                  </div>
                  {latestFeedback && (
                      <Button variant="ghost" size="icon" onClick={() => setShowFeedbackPane(!showFeedbackPane)} className={cn("h-8 w-8 rounded-xl border", showFeedbackPane ? "bg-primary text-white" : "bg-indigo-50 text-indigo-600")}>
                          <MessageSquare className="h-4 w-4" />
                      </Button>
                  )}
              </div>
            )}

            {showFeedbackPane && latestFeedback && (
                <div className="mb-6 animate-in slide-in-from-top-2 fade-in">
                    <Card className="border-indigo-100 bg-indigo-50/30 rounded-2xl overflow-hidden shadow-sm">
                        <CardHeader className="py-2.5 px-4 bg-white/50 border-b flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Feedback Received</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFeedbackPane(false)}><X className="h-3.5 w-3.5" /></Button>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <Avatar className="h-7 w-7"><AvatarImage src={latestFeedback.avatar}/><AvatarFallback>{latestFeedback.author[0]}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-900">{latestFeedback.author} • <span className="text-slate-400 font-normal">{formatDistanceToNow(new Date(latestFeedback.date), { addSuffix: true })}</span></p>
                                    <p className="text-xs text-slate-700 italic mt-1">"{latestFeedback.content}"</p>
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
                        <h1 className="text-2xl font-bold text-slate-900">{definition.name}</h1>
                        <Badge variant="outline" className={cn("h-6 rounded-full text-[10px] font-bold uppercase", viewingMode === 'live' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{definition.isArchived ? 'Archived' : viewingMode === 'live' ? 'Published' : 'Draft'}</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-primary"><Share2 className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onToggleBookmark(definition.id)} className="text-primary"><Bookmark className={cn("h-5 w-5", definition.isBookmarked && "fill-primary")} /></Button>
                    {!definition.isArchived && <Button onClick={onEdit} className="bg-primary font-bold px-6 h-9 rounded-lg">Edit</Button>}
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
                    {groupedSections.map((unit, uIdx) => (
                        <div key={uIdx} className="space-y-6">
                            {unit.type === 'group' && <div className="flex items-center gap-3"><h3 className="text-lg font-bold text-slate-900">{unit.name}</h3><div className="h-px bg-slate-200 flex-1" /></div>}
                            <Accordion type="multiple" defaultValue={unit.sections.map(s => s.id)} className="space-y-4">
                                {unit.sections.map(section => (
                                    <AccordionItem key={section.id} value={section.id} className="border rounded-xl px-6 bg-white border-slate-200 shadow-sm overflow-hidden">
                                        <AccordionTrigger className="font-bold py-4 hover:no-underline"><div className="flex items-center gap-2">{section.name}<Info className="h-4 w-4 text-slate-400" /></div></AccordionTrigger>
                                        <AccordionContent className="pb-6">{renderSectionContent(section, (definition.sectionValues || []).find(v => v.sectionId === section.id))}</AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ))}
                </TabsContent>

                <TabsContent value="version-history" className="mt-8 space-y-6">
                    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Archive Revisions</h2><Button variant="outline" size="sm" disabled={selectedRevisions.length !== 2} onClick={() => setShowComparison(true)} className="rounded-xl font-bold">Compare</Button></div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
                      <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="w-12"/><TableHead className="text-[10px] font-black uppercase">Date</TableHead><TableHead className="text-[10px] font-black uppercase">User</TableHead><TableHead className="text-[10px] font-black uppercase">Summary</TableHead></TableRow></TableHeader>
                        <TableBody>{definition.revisions.map(r => <TableRow key={r.ticketId} className="hover:bg-slate-50"><TableCell><Checkbox checked={selectedRevisions.some(sr => sr.ticketId === r.ticketId)} onCheckedChange={() => setSelectedRevisions(prev => prev.some(sr => sr.ticketId === r.ticketId) ? prev.filter(sr => sr.ticketId !== r.ticketId) : (prev.length < 2 ? [...prev, r] : prev))}/></TableCell><TableCell className="font-bold">{r.date}</TableCell><TableCell className="font-medium text-slate-600">{r.developer}</TableCell><TableCell className="text-slate-500">{r.description}</TableCell></TableRow>)}</TableBody>
                      </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="notes" className="mt-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2"><h3 className="text-sm font-bold">Add a Note</h3><Info className="h-3.5 w-3.5 text-slate-400" /></div>
                        <div className="relative border border-slate-200 rounded-lg p-1 bg-white">
                            <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a personal or shared note..." className="border-none shadow-none focus-visible:ring-0 min-h-[100px] text-sm" maxLength={5000}/>
                            <div className="absolute bottom-2 right-3 text-[10px] text-slate-400">{noteText.length}/5000</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Checkbox id="share" checked={shareNote} onCheckedChange={v => setShareNote(!!v)} /><Label htmlFor="share" className="text-xs font-medium text-slate-500">Share with everyone</Label></div>
                            <Button onClick={handleSaveNote} disabled={!noteText.trim()} className="bg-slate-200 text-slate-700 font-bold px-6 h-9">Save</Button>
                        </div>
                    </div>
                    <div className="pt-4 space-y-6">
                        <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-bold">Saved Notes</h3><Info className="h-3.5 w-3.5 text-slate-400" /></div>
                        <Tabs defaultValue="my-notes" className="w-full">
                            <TabsList className="bg-transparent border-b h-auto p-0 gap-8">
                                <TabsTrigger value="my-notes" className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-bold">My Notes</TabsTrigger>
                                <TabsTrigger value="others-notes" className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-bold">Other's Notes</TabsTrigger>
                                <TabsTrigger value="review-history" className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-bold">Review History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="my-notes" className="mt-6 space-y-4">{(definition.notes || []).filter(n => n.authorId === currentUser.id).map(n => <Card key={n.id} className="p-4 rounded-xl shadow-sm"><div className="flex items-center gap-2 mb-2"><Avatar className="h-6 w-6"><AvatarImage src={n.avatar}/><AvatarFallback>{n.author[0]}</AvatarFallback></Avatar><span className="font-bold text-xs">{n.author}</span><span className="text-[10px] text-slate-400 uppercase font-black">{new Date(n.date).toLocaleDateString()}</span></div><p className="text-sm text-slate-600 pl-8">{n.content}</p></Card>)}</TabsContent>
                            <TabsContent value="others-notes" className="mt-6 space-y-4">{(definition.notes || []).filter(n => n.authorId !== currentUser.id).map(n => <Card key={n.id} className="p-4 rounded-xl shadow-sm"><div className="flex items-center gap-2 mb-2"><Avatar className="h-6 w-6"><AvatarImage src={n.avatar}/><AvatarFallback>{n.author[0]}</AvatarFallback></Avatar><span className="font-bold text-xs">{n.author}</span><span className="text-[10px] text-slate-400 uppercase font-black">{new Date(n.date).toLocaleDateString()}</span></div><p className="text-sm text-slate-600 pl-8">{n.content}</p></Card>)}</TabsContent>
                            <TabsContent value="review-history" className="mt-6 space-y-4">{(definition.discussions || []).map(m => <Card key={m.id} className={cn("p-4 rounded-xl shadow-sm", m.type === 'change-request' ? "bg-amber-50/30 border-amber-100" : m.type === 'rejection' ? "bg-red-50/30 border-red-100" : "bg-white")}><div className="flex items-center gap-3 mb-3"><Avatar className="h-6 w-6"><AvatarImage src={m.avatar} /><AvatarFallback>{m.author[0]}</AvatarFallback></Avatar><div className="flex items-center gap-2"><span className="font-bold text-xs">{m.author}</span><span className="text-[10px] text-slate-400 uppercase font-black">{new Date(m.date).toLocaleDateString()}</span></div>{m.type !== 'comment' && <Badge className={cn("ml-auto text-[9px] uppercase font-black", m.type === 'rejection' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{m.type === 'rejection' ? 'Rejected' : 'Changes Requested'}</Badge>}</div><p className="text-sm text-slate-700 pl-9">"{m.content}"</p></Card>)}</TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-8"><Card className="rounded-2xl border-slate-200 overflow-hidden"><CardHeader className="bg-slate-50/50 border-b px-6 py-4"><CardTitle className="text-lg font-bold">Reference Attachments</CardTitle></CardHeader><CardContent className="p-6"><AttachmentList attachments={definition.attachments} /></CardContent></Card></TabsContent>
                <TabsContent value="related-definitions" className="mt-8"><RelatedDefinitions currentDefinition={definition} allDefinitions={allDefinitions} onDefinitionClick={(id) => onTabChange('description')} onSave={onSave} isAdmin={isAdmin} /></TabsContent>
            </Tabs>
        </article>

        {showComparison && selectedRevisions.length === 2 && <RevisionComparisonDialog open={showComparison} onOpenChange={setShowComparison} revision1={selectedRevisions[0]} revision2={selectedRevisions[1]} definition={definition} />}
        {showConflictDiff && liveVersion && <RevisionComparisonDialog open={showConflictDiff} onOpenChange={setShowConflictDiff} revision1={{ ticketId: 'DRAFT', date: 'Current', developer: 'You', description: 'Your Draft', snapshot: definition }} revision2={{ ticketId: 'LIVE', date: liveVersion.revisions[0]?.date || 'Now', developer: liveVersion.revisions[0]?.developer || 'System', description: 'Current Published', snapshot: liveVersion }} definition={definition} />}
    </TooltipProvider>
  );
}
