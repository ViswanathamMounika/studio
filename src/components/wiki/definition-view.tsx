
"use client";

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import type { Definition, Revision, SupportingTable, Note, DiscussionMessage, Template, SectionValue } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Pencil, Bookmark, Trash2, Share2, Info, X, Check, Send, ShieldCheck, Undo2, Lock as LockIcon, MessageSquare, Braces, Table as TableIcon, History, FileClock } from 'lucide-react';
import DefinitionActions from './definition-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { initialTemplates } from '@/lib/data';
import { cn } from '@/lib/utils';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RelatedDefinitions from './related-definitions';
import ChangeRequestModal from './change-request-modal';
import DiscussionsPanel from './discussions-panel';
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
};

export default function DefinitionView({ 
    definition, allDefinitions, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, onPublish, onReject, onSendApproval,
    activeTab, onTabChange, onSave, isAdmin, searchQuery = "", currentUser 
}: DefinitionViewProps) {
    const [selectedRevisions, setSelectedRevisions] = useState<Revision[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackMode, setFeedbackMode] = useState<'request' | 'reject'>('request');
    const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(false);
    
    const [noteText, setNoteText] = useState('');
    const [shareNote, setShareNote] = useState(false);
    
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

    const handleShare = () => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.set('definitionId', definition.id);
        navigator.clipboard.writeText(url.toString()).then(() => {
            toast({ title: 'Link Copied', description: 'Shareable link copied to clipboard.' });
        });
    };

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
            if (isSelected) return prev.filter(r => r.ticketId !== rev.ticketId);
            if (prev.length >= 2) return [prev[1], rev];
            return [...prev, rev];
        });
    };

    const groupedSections = useMemo(() => {
      if (!selectedTemplate) return null;
      return selectedTemplate.sections.reduce((acc, section) => {
        const g = section.group || 'Documentation';
        if (!acc[g]) acc[g] = [];
        acc[g].push(section);
        return acc;
      }, {} as Record<string, typeof selectedTemplate.sections>);
    }, [selectedTemplate]);

  return (
    <TooltipProvider>
        <article className="prose prose-sm max-w-none">
            {definition.isDraft && (
                <Alert className="mb-6 bg-indigo-50 border-indigo-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <LockIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <AlertTitle className="text-indigo-900 font-bold text-lg mb-0.5">Working Draft Workspace</AlertTitle>
                            <AlertDescription className="text-indigo-700 font-medium">
                                You are viewing a private working copy.
                                {definition.lock && <span className="ml-2 opacity-70">Locked by {definition.lock.userName}</span>}
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}

            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-muted-foreground uppercase font-black tracking-widest">{definition.module}</p>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold mt-0">{definition.name}</h2>
                        <Badge variant="outline">{definition.isArchived ? 'Archived' : (definition.isDraft ? 'Draft' : 'Published')}</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleShare} disabled={definition.isDraft}><Share2 className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onToggleBookmark(definition.id)} disabled={definition.isDraft}>
                      <Bookmark className={cn("h-5 w-5", definition.isBookmarked && "fill-primary")} />
                    </Button>
                    {!definition.isArchived && <Button onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>}
                    <DefinitionActions definition={definition} onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} onToggleBookmark={onToggleBookmark} isAdmin={isAdmin} />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mt-6">
                <TabsList className="w-full bg-transparent border-b rounded-none p-0 h-auto flex justify-between">
                    {['description', 'revisions', 'attachments', 'notes'].map(v => (
                        <TabsTrigger key={v} value={v} className="flex-1 bg-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 text-sm font-bold uppercase tracking-widest">{v}</TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="description" className="mt-6 space-y-8">
                    {groupedSections ? (
                      Object.entries(groupedSections).map(([groupName, sections]) => (
                        <div key={groupName} className="space-y-4">
                          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            {groupName}
                          </h3>
                          <div className="space-y-6">
                            {sections.map(section => {
                              const value = definition.sectionValues?.find(v => v.sectionId === section.id);
                              if (!value && !section.isRequired) return null;

                              return (
                                <div key={section.id} className="space-y-2">
                                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest m-0">{section.name}</h4>
                                  
                                  {section.fieldType === 'RichText' && (
                                    <div className="prose prose-sm max-w-none text-slate-700 bg-white p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: value?.html || '<p class="italic text-slate-400">Not provided</p>' }} />
                                  )}
                                  
                                  {section.fieldType === 'PlainText' && (
                                    <p className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 m-0">{value?.raw || 'Not provided'}</p>
                                  )}

                                  {section.fieldType === 'Dropdown' && (
                                    <div className="flex flex-wrap gap-2">
                                      {section.isMulti ? (
                                        value?.multiValues?.map(v => <Badge key={v} className="bg-indigo-50 text-indigo-700 border-indigo-100">{v}</Badge>)
                                      ) : (
                                        <Badge className="bg-slate-100 text-slate-700 border-slate-200">{value?.raw || 'N/A'}</Badge>
                                      )}
                                    </div>
                                  )}

                                  {section.fieldType === 'KeyValue' && (
                                    <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden">
                                      <Table>
                                        <TableHeader className="bg-slate-50">
                                          <TableRow className="hover:bg-transparent">
                                            {section.columns?.map(col => <TableHead key={col.id} className="h-10 font-bold text-slate-700">{col.name}</TableHead>)}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {value?.structuredRows?.map((row, ri) => (
                                            <TableRow key={ri} className="hover:bg-transparent border-slate-100">
                                              {section.columns?.map(col => <TableCell key={col.id}>{row[col.id] || '—'}</TableCell>)}
                                            </TableRow>
                                          ))}
                                          {!value?.structuredRows?.length && <TableRow><TableCell colSpan={section.columns?.length} className="text-center italic text-slate-400 py-4">No data</TableCell></TableRow>}
                                        </TableBody>
                                      </Table>
                                    </Card>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: definition.description }} />
                    )}
                </TabsContent>

                <TabsContent value="revisions" className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold mt-0">Version History</h2>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={selectedRevisions.length !== 2 || definition.isArchived}
                            onClick={() => setShowComparison(true)}
                            className="rounded-xl font-bold"
                        >
                            Compare Selected ({selectedRevisions.length})
                        </Button>
                    </div>
                    <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-slate-50">
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
                                        <TableCell className="text-slate-600">{r.developer}</TableCell>
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

                <TabsContent value="attachments" className="mt-6">
                    <AttachmentList attachments={definition.attachments} />
                </TabsContent>

                <TabsContent value="notes" className="mt-6 space-y-6">
                    <h2 className="text-2xl font-bold mt-0">Notes</h2>
                    {!definition.isArchived && (
                      <Card className="p-6 bg-indigo-50/30 border-indigo-100 rounded-2xl shadow-none">
                        <Label className="text-sm font-bold text-indigo-900 mb-2 block">Add a Note</Label>
                        <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Personal or shared insights..." className="rounded-xl border-indigo-100 mb-4 h-24 bg-white" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox id="share" checked={shareNote} onCheckedChange={v => setShareNote(!!v)} />
                            <Label htmlFor="share" className="text-xs font-bold text-indigo-700 cursor-pointer">Share with team</Label>
                          </div>
                          <Button onClick={handleSaveNote} disabled={!noteText.trim()} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold">Save Note</Button>
                        </div>
                      </Card>
                    )}
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Saved Notes</h3>
                      {definition.notes && definition.notes.length > 0 ? (
                        definition.notes.map(note => (
                            <Card key={note.id} className="p-4 rounded-xl border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{note.author}</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">•</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(note.date).toLocaleDateString()}</span>
                                </div>
                                {note.isShared && <Badge variant="outline" className="text-[9px] uppercase font-black h-5 border-indigo-100 text-indigo-600 bg-indigo-50">Shared</Badge>}
                            </div>
                            <p className="text-sm text-slate-600 m-0 leading-relaxed">{note.content}</p>
                            </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 italic">No notes found for this definition.</p>
                        </div>
                      )}
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
    </TooltipProvider>
  );
}
