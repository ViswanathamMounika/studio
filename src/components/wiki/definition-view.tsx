
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
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Bookmark, Info, History, Share2, XCircle, RefreshCw, AlertTriangle, ArrowRight, ChevronRight, Trash2 } from 'lucide-react';
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
  onReject?: (id: string, requestData?: { content: string; isRejection?: boolean }) => void;
  onSendApproval?: (id: string) => void;
  onDiscard?: (id: string) => void;
  onRetract?: (id: string) => void;
  onAcceptLiveChanges?: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave: (definition: Definition) => void;
  isAdmin: boolean;
  currentUser: { id: string; name: string; avatar?: string };
  viewingMode: 'live' | 'draft';
};

export default function DefinitionView({ 
    definition, allDefinitions, templates, liveVersion, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, 
    activeTab, onTabChange, onSave, isAdmin, currentUser, viewingMode, onAcceptLiveChanges
}: DefinitionViewProps) {
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [showConflictDiff, setShowConflictDiff] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    const [notesSubTab, setNotesSubTab] = useState('my-notes');
    
    const { toast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => { Prism.highlightAll(); }, 100);
        return () => clearTimeout(timer);
    }, [definition, activeTab]);

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

    const isOutdated = useMemo(() => {
        if (viewingMode !== 'draft' || !liveVersion) return false;
        const latestLiveTicket = liveVersion.revisions?.[0]?.ticketId;
        const currentBaseTicket = definition.baseVersionId;
        
        if (latestLiveTicket && currentBaseTicket !== latestLiveTicket) {
            return true;
        }
        return false;
    }, [viewingMode, liveVersion, definition.baseVersionId]);

    const handleShowReviewHistory = () => {
        setNotesSubTab('review-history');
        onTabChange('notes');
    };

  return (
    <TooltipProvider>
        <article className="max-w-none">
            {/* VERSION CONFLICT BANNER */}
            {isOutdated && (
                <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="group relative flex items-center justify-between p-4 rounded-[20px] bg-[#FFF9EB] border border-[#FFE0B2] shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-[#FFF3E0] flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-[#E65100]" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#5D4037]">Older Draft Version Detected</span>
                                    <span className="bg-[#FFE0B2] text-[#E65100] text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none h-4 flex items-center">OUTDATED</span>
                                </div>
                                <p className="text-[13px] text-[#8D6E63] font-medium mt-0.5">
                                    The live definition was updated by an admin while you were drafting. Your workspace is currently out of sync.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-5 rounded-xl border-[#FFE0B2] bg-white text-[#E65100] font-bold hover:bg-[#FFF3E0] transition-colors shadow-sm"
                                onClick={() => setShowConflictDiff(true)}
                            >
                                View Differences
                            </Button>
                            <Button 
                                size="sm" 
                                className="h-9 px-5 rounded-xl bg-[#E65100] hover:bg-[#D84315] text-white font-bold shadow-md shadow-orange-100 flex items-center gap-2 transition-all active:scale-95"
                                onClick={() => onAcceptLiveChanges?.(definition.id)}
                            >
                                Accept Live Changes
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 px-4 text-[#8D6E63] hover:text-red-600 font-bold hover:bg-red-50/50 rounded-xl transition-all"
                                    >
                                        Discard Changes
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[24px] border-none p-8 shadow-2xl">
                                    <AlertDialogHeader className="space-y-3">
                                        <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                                            <Trash2 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <AlertDialogTitle className="text-2xl font-bold text-slate-900">Discard Private Draft?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
                                            This will permanently delete your outdated working copy of <strong>{definition.name}</strong>. You will be redirected to the latest published version. This action cannot be reversed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-8 gap-3 sm:justify-end">
                                        <AlertDialogCancel className="rounded-xl font-bold border-slate-200">Keep Draft</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => onDelete(definition.id)} 
                                            className="rounded-xl bg-red-600 hover:bg-red-700 font-bold px-6"
                                        >
                                            Discard Changes
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER SECTION */}
            <div className="flex justify-between items-start mb-6 px-2">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">{definition.module}</p>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{definition.name}</h1>
                        <Badge variant="outline" className={cn("h-6 rounded-full text-[10px] font-bold uppercase", 
                            viewingMode === 'live' ? "bg-emerald-50 text-emerald-700" : 
                            definition.isPendingApproval ? "bg-blue-50 text-blue-700 border-blue-100 shadow-sm" : 
                            latestFeedback?.type === 'rejection' ? "bg-red-50 text-red-700 border-red-100" :
                            latestFeedback?.type === 'change-request' ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-amber-50 text-amber-700"
                        )}>
                            {definition.isArchived ? 'Archived' : 
                             viewingMode === 'live' ? 'Published' : 
                             definition.isPendingApproval ? 'Pending Review' : 
                             latestFeedback?.type === 'rejection' ? 'Rejected' :
                             latestFeedback?.type === 'change-request' ? 'Changes Requested' :
                             'Draft'}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5 rounded-xl transition-all"><Share2 className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onToggleBookmark(definition.id)} className="text-primary hover:bg-primary/5 rounded-xl transition-all"><Bookmark className={cn("h-5 w-5", definition.isBookmarked && "fill-primary")} /></Button>
                    
                    {!definition.isArchived && !definition.isPendingApproval && (
                        <Button onClick={onEdit} className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white font-bold px-6 h-9 rounded-xl shadow-sm transition-all active:scale-95">Edit</Button>
                    )}

                    <DefinitionActions 
                        definition={definition} 
                        onEdit={onEdit} 
                        onDuplicate={() => onDuplicate(definition.id)} 
                        onArchive={onArchive} 
                        onToggleBookmark={onToggleBookmark} 
                        isAdmin={isAdmin} 
                    />
                </div>
            </div>

            {/* FEEDBACK BANNER */}
            {latestFeedback && (
                <div className="mb-6 animate-in slide-in-from-top-2 fade-in">
                    <Card className={cn(
                        "rounded-2xl overflow-hidden shadow-sm border",
                        latestFeedback.type === 'rejection' ? "bg-red-50/30 border-red-100" : "bg-amber-50/30 border-amber-100"
                    )}>
                        <CardHeader className="py-2.5 px-4 bg-white/50 border-b flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                {latestFeedback.type === 'rejection' ? <XCircle className="h-4 w-4 text-red-600" /> : <RefreshCw className="h-4 w-4 text-amber-600" />}
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", latestFeedback.type === 'rejection' ? "text-red-900" : "text-amber-900")}>
                                    {latestFeedback.type === 'rejection' ? 'Latest Feedback: Submission Rejected' : 'Latest Feedback: Change Request Issued'}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDistanceToNow(new Date(latestFeedback.date), { addSuffix: true })}</span>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <Avatar className="h-7 w-7"><AvatarImage src={latestFeedback.avatar}/><AvatarFallback>{latestFeedback.author[0]}</AvatarFallback></Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900">{latestFeedback.author}</p>
                                    <p className="text-xs text-slate-700 italic mt-1 leading-relaxed line-clamp-3">
                                        "{latestFeedback.content}"
                                    </p>
                                    <button 
                                        onClick={handleShowReviewHistory}
                                        className="mt-2 inline-flex items-center text-[11px] font-bold text-primary hover:underline"
                                    >
                                        View full history & older comments
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* MAIN CONTENT TABS */}
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="w-full bg-slate-100 rounded-xl p-1 h-12">
                    <TabsTrigger value="description" className="flex-1 font-bold text-sm rounded-lg transition-all">Description</TabsTrigger>
                    <TabsTrigger value="version-history" className="flex-1 font-bold text-sm rounded-lg transition-all">Version History</TabsTrigger>
                    <TabsTrigger value="attachments" className="flex-1 font-bold text-sm rounded-lg transition-all">Attachments</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 font-bold text-sm rounded-lg transition-all">Notes</TabsTrigger>
                    <TabsTrigger value="related-definitions" className="flex-1 font-bold text-sm rounded-lg transition-all">Related Definitions</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6 space-y-10">
                    {groupedSections.map((unit, uIdx) => (
                        <div key={uIdx} className="space-y-6">
                            {unit.type === 'group' && <div className="flex items-center gap-3"><h3 className="text-lg font-bold text-slate-900">{unit.name}</h3><div className="h-px bg-slate-200 flex-1" /></div>}
                            <Accordion type="multiple" defaultValue={unit.sections.map(s => s.id)} className="space-y-4">
                                {unit.sections.map(section => (
                                    <AccordionItem key={section.id} value={section.id} className="border rounded-xl px-6 bg-white border-slate-200 shadow-sm overflow-hidden group/accordion">
                                        <AccordionTrigger className="font-bold py-4 hover:no-underline group-data-[state=open]/accordion:border-b group-data-[state=open]/accordion:border-slate-100 mb-0">
                                            <div className="flex items-center gap-2">
                                                {section.name}
                                                {section.description && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-slate-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            <p className="text-xs">{section.description}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-6 pt-4">{renderSectionContent(section, (definition.sectionValues || []).find(v => v.sectionId === section.id))}</AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ))}
                </TabsContent>

                <TabsContent value="version-history" className="mt-8 space-y-6">
                    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Archive Revisions</h2><Button variant="outline" size="sm" disabled={selectedRevisions.length !== 2} onClick={() => setShowComparison(true)} className="rounded-xl font-bold">Compare Selected</Button></div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
                      <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="w-12"/><TableHead className="text-[10px] font-black uppercase">Date</TableHead><TableHead className="text-[10px] font-black uppercase">User</TableHead><TableHead className="text-[10px] font-black uppercase">Summary</TableHead></TableRow></TableHeader>
                        <TableBody>{definition.revisions.map(r => <TableRow key={r.ticketId} className="hover:bg-slate-50 transition-colors"><TableCell><Checkbox checked={selectedRevisions.some(sr => sr.ticketId === r.ticketId)} onCheckedChange={() => setSelectedRevisions(prev => prev.some(sr => sr.ticketId === r.ticketId) ? prev.filter(sr => sr.ticketId !== r.ticketId) : (prev.length < 2 ? [...prev, r] : prev))}/></TableCell><TableCell className="font-bold">{r.date}</TableCell><TableCell className="font-medium text-slate-600">{r.developer}</TableCell><TableCell className="text-slate-500">{r.description}</TableCell></TableRow>)}</TableBody>
                      </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="notes" className="mt-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2"><h3 className="text-sm font-bold">Add a Note</h3><Info className="h-3.5 w-3.5 text-slate-400" /></div>
                        <div className="relative border border-slate-200 rounded-xl p-1 bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                            <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a personal or shared note..." className="border-none shadow-none focus-visible:ring-0 min-h-[100px] text-sm" maxLength={5000}/>
                            <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-bold">{noteText.length}/5000</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Checkbox id="share" checked={shareNote} onCheckedChange={v => setShareNote(!!v)} /><Label htmlFor="share" className="text-xs font-bold text-slate-500 cursor-pointer">Share with everyone</Label></div>
                            <Button onClick={handleSaveNote} disabled={!noteText.trim()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-8 h-9 rounded-xl transition-all">Save Note</Button>
                        </div>
                    </div>
                    <div className="pt-4 space-y-6">
                        <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-bold">Saved Notes</h3><Info className="h-3.5 w-3.5 text-slate-400" /></div>
                        <Tabs value={notesSubTab} onValueChange={setNotesSubTab} className="w-full">
                            <TabsList className="bg-transparent border-b h-auto p-0 gap-8 rounded-none">
                                <TabsTrigger value="my-notes" className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-primary transition-all">My Notes</TabsTrigger>
                                <TabsTrigger value="others-notes" className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-primary transition-all">Other's Notes</TabsTrigger>
                                <TabsTrigger value="review-history" className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-primary transition-all">Review History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="my-notes" className="mt-6 space-y-4">{(definition.notes || []).filter(n => n.authorId === currentUser.id).map(n => <Card key={n.id} className="p-4 rounded-xl shadow-sm border-slate-100 hover:border-slate-200 transition-all"><div className="flex items-center gap-2 mb-2"><Avatar className="h-6 w-6"><AvatarImage src={n.avatar}/><AvatarFallback>{n.author[0]}</AvatarFallback></Avatar><span className="font-bold text-xs">{n.author}</span><span className="text-[10px] text-slate-400 uppercase font-black">{new Date(n.date).toLocaleDateString()}</span></div><p className="text-sm text-slate-600 pl-8">{n.content}</p></Card>)}</TabsContent>
                            <TabsContent value="others-notes" className="mt-6 space-y-4">{(definition.notes || []).filter(n => n.authorId !== currentUser.id).map(n => <Card key={n.id} className="p-4 rounded-xl shadow-sm border-slate-100 hover:border-slate-200 transition-all"><div className="flex items-center gap-2 mb-2"><Avatar className="h-6 w-6"><AvatarImage src={n.avatar}/><AvatarFallback>{n.author[0]}</AvatarFallback></Avatar><span className="font-bold text-xs">{n.author}</span><span className="text-[10px] text-slate-400 uppercase font-black">{new Date(n.date).toLocaleDateString()}</span></div><p className="text-sm text-slate-600 pl-8">{n.content}</p></Card>)}</TabsContent>
                            <TabsContent value="review-history" className="mt-6 space-y-4">{(definition.discussions || []).map(m => <Card key={m.id} className={cn("p-4 rounded-xl shadow-sm transition-all", m.type === 'change-request' ? "bg-amber-50/30 border-amber-100" : m.type === 'rejection' ? "bg-red-50/30 border-red-100" : "bg-white border-slate-100")}><div className="flex items-center gap-3 mb-3"><Avatar className="h-6 w-6"><AvatarImage src={m.avatar} /><AvatarFallback>{m.author[0]}</AvatarFallback></Avatar><div className="flex items-center gap-2"><span className="font-bold text-xs">{m.author}</span><span className="text-[10px] text-slate-400 uppercase font-black">{new Date(m.date).toLocaleDateString()}</span></div>{m.type !== 'comment' && <Badge className={cn("ml-auto text-[9px] uppercase font-black", m.type === 'rejection' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{m.type === 'rejection' ? 'Rejected' : 'Changes Requested'}</Badge>}</div><p className="text-sm text-slate-700 pl-9 leading-relaxed">"{m.content}"</p></Card>)}</TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-8"><Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm"><CardHeader className="bg-slate-50/50 border-b px-6 py-4"><CardTitle className="text-lg font-bold">Reference Attachments</CardTitle></CardHeader><CardContent className="p-6"><AttachmentList attachments={definition.attachments} /></CardContent></Card></TabsContent>
                <TabsContent value="related-definitions" className="mt-8"><RelatedDefinitions currentDefinition={definition} allDefinitions={allDefinitions} onDefinitionClick={(id) => onTabChange('description')} onSave={onSave} isAdmin={isAdmin} /></TabsContent>
            </Tabs>
        </article>

        {showComparison && selectedRevisions.length === 2 && <RevisionComparisonDialog open={showComparison} onOpenChange={setShowComparison} revision1={selectedRevisions[0]} revision2={selectedRevisions[1]} definition={definition} templates={templates} />}
        
        {showConflictDiff && liveVersion && (
            <RevisionComparisonDialog 
                open={showConflictDiff} 
                onOpenChange={setShowConflictDiff} 
                revision1={{ 
                    ticketId: 'LIVE', 
                    date: liveVersion.revisions?.[0]?.date || 'Now', 
                    developer: liveVersion.revisions?.[0]?.developer || 'System', 
                    description: 'Latest Published Version', 
                    snapshot: liveVersion 
                }} 
                revision2={{ 
                    ticketId: 'DRAFT', 
                    date: 'Current', 
                    developer: 'You', 
                    description: 'Your Current Draft', 
                    snapshot: definition 
                }} 
                definition={definition} 
                templates={templates}
            />
        )}
    </TooltipProvider>
  );
}
