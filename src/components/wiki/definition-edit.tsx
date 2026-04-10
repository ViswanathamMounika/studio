
"use client";
import React, { useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Definition, Attachment, Template, SectionValue, TemplateSection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Save, Pencil, Trash2, ChevronDown, Check, Plus, Info, Undo2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { initialTemplates } from '@/lib/data';
import DataSourcePreviewDialog from './data-source-preview-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const WysiwygEditor = dynamic(() => import('./wysiwyg-editor'), { ssr: false });
const RevisionComparisonDialog = dynamic(() => import('./revision-comparison-dialog'), { ssr: false });

type DefinitionEditProps = {
  definition: Definition;
  liveVersion?: Definition | null;
  onSave: (definition: Definition) => void;
  onDiscard: (id: string) => void;
  onDelete: (id: string) => void;
  onAcceptLiveChanges?: (id: string) => void;
  isAdmin: boolean;
  templates?: Template[];
  isNewBranch?: boolean; 
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];

export default function DefinitionEdit({ definition, liveVersion, onSave, onDiscard, onDelete, onAcceptLiveChanges, isAdmin, templates, isNewBranch }: DefinitionEditProps) {
  const [name, setName] = useState(definition.name);
  const [module, setModule] = useState(definition.module);
  const [keywords, setKeywords] = useState<string[]>(definition.keywords || []);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(definition.attachments || []);
  const [sectionValues, setSectionValues] = useState<SectionValue[]>(definition.sectionValues || []);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showConflictDiff, setShowConflictDiff] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTemplate = useMemo(() => (templates || initialTemplates).find(t => t.id === definition.templateId) || (templates || initialTemplates)[0], [definition.templateId, templates]);

  const updateSectionValue = (sectionId: string, updates: Partial<SectionValue>) => {
    setSectionValues(prev => {
        const idx = prev.findIndex(v => v.sectionId === sectionId);
        if (idx === -1) return [...prev, { sectionId, raw: '', ...updates } as SectionValue];
        const next = [...prev]; next[idx] = { ...next[idx], ...updates };
        return next;
    });
  };

  const isOutdated = useMemo(() => {
    if (!liveVersion) return false;
    const latestLiveTicket = liveVersion.revisions?.[0]?.ticketId;
    const currentBaseTicket = definition.baseVersionId;
    
    if (latestLiveTicket && currentBaseTicket !== latestLiveTicket) {
        return true;
    }
    return false;
  }, [liveVersion, definition.baseVersionId]);

  const groupedSections = useMemo(() => {
    const allSections = selectedTemplate.sections || [];
    const standaloneSections = allSections.filter(s => !s.group);
    const uniqueGroupNames = Array.from(new Set(allSections.filter(s => s.group).map(s => s.group as string)));
    const units: Array<{ type: 'section' | 'group', order: number, name?: string, sections: TemplateSection[] }> = [];
    standaloneSections.forEach(s => units.push({ type: 'section', order: s.order, sections: [s] }));
    uniqueGroupNames.forEach(name => {
      const groupSections = allSections.filter(s => s.group === name);
      units.push({ type: 'group', name, order: groupSections[0]?.groupOrder || 0, sections: groupSections.sort((a, b) => a.order - b.order) });
    });
    return units.sort((a, b) => a.order - b.order);
  }, [selectedTemplate]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-slate-50/30">
        <div className="sticky top-0 z-30 bg-white px-8 py-4 border-b flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Pencil className="h-5 w-5 text-indigo-600" /></div>
              <div><h2 className="text-2xl font-bold tracking-tight">Edit Mode</h2><p className="text-xs text-slate-500 font-medium">Drafting improvements for <span className="font-bold text-slate-900">{definition.name}</span></p></div>
          </div>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 gap-1.5 h-7 px-3"><div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />Editing Lock Active</Badge>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10 max-w-[1000px] mx-auto pb-32">
              {isOutdated && (
                  <div className="animate-in slide-in-from-top-4 fade-in duration-500">
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
                                        Discard Draft
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[24px] border-none p-8 shadow-2xl">
                                    <AlertDialogHeader className="space-y-3">
                                        <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                                            <Trash2 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <AlertDialogTitle className="text-2xl font-bold text-slate-900">Discard Private Draft?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
                                            This will permanently delete your outdated working copy of <strong>{definition.name}</strong>. You will be redirected to the latest published version.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-8 gap-3 sm:justify-end">
                                        <AlertDialogCancel className="rounded-xl font-bold border-slate-200">Keep Draft</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => onDelete(definition.id)} 
                                            className="rounded-xl bg-red-600 hover:bg-red-700 font-bold px-6"
                                        >
                                            Discard Draft
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                      </div>
                  </div>
              )}

              <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b p-6"><CardTitle className="text-sm font-black uppercase text-slate-500 tracking-wider">Categorization</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-400">Definition Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11 font-bold" /></div>
                          <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-400">Module</Label>
                              <Select value={module} onValueChange={setModule}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                          </div>
                      </div>
                      <div className="space-y-2"><Label className="text-[11px] font-black uppercase text-slate-400">Keywords</Label>
                          <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl bg-white min-h-[44px]">{keywords.map(k => <Badge key={k} className="bg-slate-100 text-slate-700 gap-1.5 px-2.5 py-1">{k}<button onClick={() => setKeywords(keywords.filter(kw => kw !== k))}><X className="h-3 w-3" /></button></Badge>)}<Input placeholder="Add keyword..." value={currentKeyword} onChange={e => setCurrentKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && currentKeyword) { e.preventDefault(); if (!keywords.includes(currentKeyword.trim())) setKeywords([...keywords, currentKeyword.trim()]); setCurrentKeyword(''); } }} className="flex-1 border-none shadow-none p-0 h-auto text-sm" /></div>
                      </div>
                  </CardContent>
              </Card>

              {groupedSections.map((unit, idx) => (
                  <div key={idx} className="space-y-6">
                      {unit.type === 'group' && <div className="flex items-center gap-3"><h3 className="text-lg font-bold text-slate-900">{unit.name}</h3><div className="h-px bg-slate-200 flex-1" /></div>}
                      <div className="space-y-6">{unit.sections.map(section => {
                          const value = sectionValues.find(v => v.sectionId === section.id);
                          return (
                              <Card key={section.id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                                  <CardHeader className="py-3 bg-white border-b px-6 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                      {section.name}{section.isRequired && <span className="text-red-500">*</span>}
                                      {section.description && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-slate-400 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="text-xs">{section.description}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </CardTitle>
                                    <Badge variant="ghost" className="text-[9px] font-black uppercase text-slate-400 bg-slate-50">{section.fieldType}</Badge>
                                  </CardHeader>
                                  <CardContent className="p-6">
                                      {section.fieldType === 'RichText' && <WysiwygEditor value={value?.html || ''} onChange={html => updateSectionValue(section.id, { html, raw: html.replace(/<[^>]+>/g, '') })} />}
                                      {section.fieldType === 'PlainText' && <Textarea value={value?.raw || ''} onChange={e => updateSectionValue(section.id, { raw: e.target.value })} maxLength={section.maxLength} className="rounded-xl min-h-[120px]" />}
                                      {section.fieldType === 'Dropdown' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {section.isMulti ? <div className="flex flex-wrap gap-2">{section.options?.map(opt => {
                                              const isSelected = value?.multiValues?.includes(opt.value);
                                              return <button key={opt.id} type="button" className={cn("flex items-center gap-2 px-4 py-2 border rounded-xl font-medium text-sm transition-all", isSelected ? "bg-primary/10 border-primary text-primary" : "bg-white border-slate-200 text-slate-600")} onClick={() => { const current = value?.multiValues || []; const next = isSelected ? current.filter(v => v !== opt.value) : [...current, opt.value]; updateSectionValue(section.id, { multiValues: next, raw: next.join(', ') }); }}><div className={cn("h-4 w-4 rounded-md border flex items-center justify-center transition-colors", isSelected ? "bg-primary border-primary" : "border-slate-300")}>{isSelected && <Check className="h-3 w-3 text-white" />}</div>{opt.label}</button>;
                                          })}</div> : <Select value={value?.raw} onValueChange={v => updateSectionValue(section.id, { raw: v })}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{section.options?.map(opt => <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>}
                                      </div>}
                                      {section.fieldType === 'KeyValue' && <div className="space-y-4"><Table><TableHeader className="bg-slate-50"><TableRow className="border-none">{section.columns?.sort((a,b)=>a.sortOrder-b.sortOrder).map(c=><TableHead key={c.id} className="font-bold text-slate-700 h-10">{c.name}</TableHead>)}<TableHead className="w-10"/></TableRow></TableHeader><TableBody>{value?.structuredRows?.map((row, ri)=><TableRow key={ri} className="border-slate-100">{section.columns?.sort((a,b)=>a.sortOrder-b.sortOrder).map(col=><TableCell key={col.id} className="py-2 px-1">{col.inputType === 'TextBox' ? <Input value={row[col.id] || ''} onChange={e=>{ const rows = [...(value.structuredRows || [])]; rows[ri]={...rows[ri], [col.id]: e.target.value}; updateSectionValue(section.id, {structuredRows: rows}); }} className="h-9 rounded-lg" /> : (col.isMulti ? <Popover><PopoverTrigger asChild><Button variant="outline" className="h-9 w-full justify-between rounded-lg"><span className="truncate">{row[col.id] || "Select..."}</span><ChevronDown className="h-3 w-3 opacity-50"/></Button></PopoverTrigger><PopoverContent className="w-64 p-2 rounded-xl">{col.options?.map(opt=>{ const curr = row[col.id]?.split(', ') || []; const sel = curr.includes(opt.value); return <div key={opt.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer" onClick={()=>{ const next = sel ? curr.filter(v=>v!==opt.value) : [...curr, opt.value]; const rows = [...(value.structuredRows || [])]; rows[ri] = {...rows[ri], [col.id]: next.join(', ')}; updateSectionValue(section.id, {structuredRows: rows}); }}><Checkbox checked={sel} /><span className="text-sm font-medium">{opt.label}</span></div>; })}</PopoverContent></Popover> : <Select value={row[col.id]} onValueChange={v=>{ const rows = [...(value.structuredRows || [])]; rows[ri]={...rows[ri],[col.id]:v}; updateSectionValue(section.id, {structuredRows: rows}); }}><SelectTrigger className="h-9 rounded-lg"><SelectValue/></SelectTrigger><SelectContent>{col.options?.map(o=><SelectItem key={o.id} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>)}</TableCell>)}<TableCell className="w-10 text-center"><Button variant="ghost" size="icon" onClick={()=>{ const rows = value.structuredRows?.filter((_,i)=>i!==ri); updateSectionValue(section.id, {structuredRows: rows}); }}><X className="h-4 w-4"/></Button></TableCell></TableRow>)}</TableBody></Table><Button variant="outline" size="sm" className="rounded-lg h-8 border-dashed font-bold" onClick={()=>{ const rows = [...(value?.structuredRows || []), {}]; updateSectionValue(section.id, {structuredRows: rows}); }}><Plus className="h-3 w-3 mr-1.5"/> Add Row</Button></div>}
                                  </CardContent>
                              </Card>
                          );
                      })}</div>
                  </div>
              ))}

              <Card className="rounded-2xl border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b p-6 flex items-center justify-between"><CardTitle className="text-sm font-black uppercase text-slate-500 tracking-wider">Attachments</CardTitle><Button variant="outline" size="sm" onClick={()=>fileInputRef.current?.click()} className="rounded-xl font-bold bg-white"><Upload className="mr-2 h-4 w-4" />Upload</Button><input type="file" ref={fileInputRef} onChange={e=>{ const files = e.target.files; if (files?.length) { const file = files[0]; setAttachments([...attachments, { name: file.name, url: URL.createObjectURL(file), size: `${(file.size / 1024).toFixed(2)} KB`, type: file.type.split('/')[1]?.toUpperCase() || 'FILE' }]); } }} className="hidden" /></CardHeader>
                  <CardContent className="p-6"><AttachmentList attachments={attachments} onRemove={n=>setAttachments(attachments.filter(a=>a.name!==n))} isEditing /></CardContent>
              </Card>
          </div>
        </ScrollArea>

        <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t p-4 px-10 flex justify-between items-center z-40 shadow-lg">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-slate-500 font-bold gap-2 hover:bg-slate-50">
                <Undo2 className="h-4 w-4" />
                {isNewBranch ? "Discard Draft" : "Cancel"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-none p-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-bold">
                  {isNewBranch ? "Discard This Branch?" : "Cancel Changes?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-sm">
                  {isNewBranch 
                    ? "This will exit edit mode and permanently discard this temporary working branch. You will return to the latest published version."
                    : "This will exit edit mode and discard your unsaved progress for this session. Your draft will remain in 'My Saved Definitions' for future editing."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 gap-3">
                <AlertDialogCancel className="rounded-xl font-bold">Continue Editing</AlertDialogCancel>
                <AlertDialogAction onClick={()=>onDiscard(definition.id)} className="rounded-xl bg-primary font-bold">
                  {isNewBranch ? "Confirm Discard" : "Confirm Cancel"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-3">
              <Button variant="secondary" onClick={()=>onSave({...definition, name, module, keywords, attachments, sectionValues, isDraft: true, isPendingApproval: false})} className="rounded-xl font-bold px-8">Save Draft</Button>
              <Button onClick={()=>onSave({...definition, name, module, keywords, attachments, sectionValues, isDraft: isAdmin ? false : true, isPendingApproval: !isAdmin})} disabled={!name.trim()} className="bg-indigo-600 text-white rounded-xl font-bold px-10">{isAdmin ? 'Publish Changes' : 'Submit for Approval'}</Button>
          </div>
        </div>
        <DataSourcePreviewDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} sourceName={null} />
        
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
                    snapshot: { ...definition, name, module, keywords, attachments, sectionValues }
                }} 
                definition={definition} 
                templates={templates}
            />
        )}
      </div>
    </TooltipProvider>
  );
}
