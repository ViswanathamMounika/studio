
"use client";
import React, { useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Definition, Attachment, LockInfo, Template, SectionValue, TemplateSection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Eye, Save, Send, Lock, Plus, Trash2, ChevronDown, Check, Info, Hash, Trash, Table as TableIcon, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { mpmDatabases, mpmSourceTypes, initialTemplates } from '@/lib/data';
import DataSourcePreviewDialog from './data-source-preview-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

const WysiwygEditor = dynamic(() => import('./wysiwyg-editor'), { ssr: false });

type DefinitionEditProps = {
  definition: Definition;
  onSave: (definition: Definition) => void;
  onDiscard: (id: string) => void;
  isAdmin: boolean;
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];

export default function DefinitionEdit({ definition, onSave, onDiscard, isAdmin }: DefinitionEditProps) {
  const [name, setName] = useState(definition.name);
  const [module, setModule] = useState(definition.module);
  const [keywords, setKeywords] = useState<string[]>(definition.keywords || []);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(definition.attachments || []);
  const [sectionValues, setSectionValues] = useState<SectionValue[]>(definition.sectionValues || []);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeSourcePreview, setActiveSourcePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTemplate = useMemo(() => 
    initialTemplates.find(t => t.id === definition.templateId) || initialTemplates[0], 
  [definition.templateId]);

  const updateSectionValue = (sectionId: string, updates: Partial<SectionValue>) => {
    setSectionValues(prev => {
        const idx = prev.findIndex(v => v.sectionId === sectionId);
        if (idx === -1) return [...prev, { sectionId, raw: '', ...updates } as SectionValue];
        const next = [...prev];
        next[idx] = { ...next[idx], ...updates };
        return next;
    });
  };

  const handleSaveManual = (isDraft: boolean) => {
    onSave({
      ...definition,
      name,
      module,
      keywords,
      attachments,
      sectionValues,
      isDraft: isDraft,
      isPendingApproval: !isDraft && !isAdmin, 
      description: sectionValues.find(v => v.sectionId === '2')?.raw || definition.description,
    });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentKeyword) {
      e.preventDefault();
      if (!keywords.includes(currentKeyword.trim())) {
        setKeywords([...keywords, currentKeyword.trim()]);
      }
      setCurrentKeyword('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };
  
  const handleAddAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newAttachment: Attachment = {
        name: file.name,
        url: URL.createObjectURL(file),
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
      };
      setAttachments([...attachments, newAttachment]);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (name: string) => {
    setAttachments(attachments.filter(att => att.name !== name));
  };

  const groupedSections = useMemo(() => {
    if (!selectedTemplate) return [];
    const allSections = selectedTemplate.sections || [];
    
    const standaloneSections = allSections.filter(s => !s.group);
    const uniqueGroupNames = Array.from(new Set(allSections.filter(s => s.group).map(s => s.group as string)));

    const units: Array<{ type: 'section' | 'group', order: number, name?: string, sections: TemplateSection[] }> = [];

    // Add standalone sections
    standaloneSections.forEach(s => {
      units.push({ type: 'section', order: s.order, sections: [s] });
    });

    // Add groups
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

    // Sort globally by 'order'
    return units.sort((a, b) => a.order - b.order);
  }, [selectedTemplate]);

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <div className="sticky top-0 z-30 bg-white px-8 py-4 border-b space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Pencil className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Mode</h2>
                    <p className="text-xs font-medium text-slate-500">Drafting improvements for <span className="font-bold text-slate-900">{definition.name}</span></p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 gap-1.5 h-7 px-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Lock Active: 29m remaining
                </Badge>
            </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-10 max-w-[1000px] mx-auto pb-32">
            {/* Core Info */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-wider">Identity & Categorization</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Definition Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11 border-slate-200 font-bold text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Module</Label>
                            <Select value={module} onValueChange={setModule}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Keywords</Label>
                        <div className="flex flex-wrap items-center gap-2 p-3 border border-slate-200 rounded-xl bg-white min-h-[44px]">
                            {keywords.map(k => (
                                <Badge key={k} className="bg-slate-100 text-slate-700 border-slate-200 rounded-lg gap-1.5 px-2.5 py-1">
                                    {k}
                                    <button onClick={() => removeKeyword(k)} className="hover:text-red-500 transition-colors">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            <Input
                                placeholder="Add keyword..."
                                value={currentKeyword}
                                onChange={e => setCurrentKeyword(e.target.value)}
                                onKeyDown={handleKeywordKeyDown}
                                className="flex-1 border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {groupedSections.map((unit, idx) => (
                <div key={idx} className="space-y-6">
                    {unit.type === 'group' && unit.name && (
                      <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-900">{unit.name}</h3>
                          <div className="h-px bg-slate-200 flex-1" />
                      </div>
                    )}
                    
                    <div className="space-y-6">
                        {unit.sections.map(section => {
                            const value = sectionValues.find(v => v.sectionId === section.id);
                            
                            return (
                                <Card key={section.id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                                    <CardHeader className="py-3 bg-white border-b px-6 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            {section.name}
                                            {section.isRequired && <span className="text-red-500 font-bold">*</span>}
                                        </CardTitle>
                                        <Badge variant="ghost" className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 border-slate-100">
                                            {section.fieldType}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {section.fieldType === 'RichText' && (
                                            <WysiwygEditor 
                                                value={value?.html || ''} 
                                                onChange={html => updateSectionValue(section.id, { html, raw: html.replace(/<[^>]+>/g, '') })} 
                                            />
                                        )}
                                        {section.fieldType === 'PlainText' && (
                                            <Textarea 
                                                value={value?.raw || ''} 
                                                onChange={e => updateSectionValue(section.id, { raw: e.target.value })}
                                                maxLength={section.maxLength}
                                                className="rounded-xl border-slate-200 min-h-[120px] focus-visible:ring-primary/20"
                                            />
                                        )}
                                        {section.fieldType === 'Dropdown' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {section.isMulti ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {section.options?.map(opt => (
                                                            <div key={opt.id} className="flex items-center gap-2 p-2.5 border rounded-xl hover:bg-slate-50 transition-colors bg-white cursor-pointer" onClick={() => {
                                                                const current = value?.multiValues || [];
                                                                const next = current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value];
                                                                updateSectionValue(section.id, { multiValues: next, raw: next.join(', ') });
                                                            }}>
                                                                <Checkbox checked={value?.multiValues?.includes(opt.value)} />
                                                                <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Select value={value?.raw} onValueChange={v => updateSectionValue(section.id, { raw: v })}>
                                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                                                            <SelectValue placeholder="Select option..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {section.options?.map(opt => <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        )}
                                        {section.fieldType === 'KeyValue' && (
                                            <div className="space-y-4">
                                                <Table>
                                                    <TableHeader className="bg-slate-50 rounded-lg">
                                                        <TableRow className="hover:bg-transparent border-none">
                                                            {section.columns?.sort((a,b) => a.sortOrder - b.sortOrder).map(col => (
                                                                <TableHead key={col.id} className="font-bold text-slate-700 h-10">{col.name}</TableHead>
                                                            ))}
                                                            <TableHead className="w-10"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {value?.structuredRows?.map((row, rIdx) => (
                                                            <TableRow key={rIdx} className="border-slate-100 hover:bg-transparent">
                                                                {section.columns?.sort((a,b) => a.sortOrder - b.sortOrder).map(col => (
                                                                    <TableCell key={col.id} className="py-2 px-1">
                                                                        {col.inputType === 'TextBox' ? (
                                                                            <Input 
                                                                                value={row[col.id] || ''} 
                                                                                onChange={e => {
                                                                                    const rows = [...(value.structuredRows || [])];
                                                                                    rows[rIdx] = { ...rows[rIdx], [col.id]: e.target.value };
                                                                                    updateSectionValue(section.id, { structuredRows: rows });
                                                                                }}
                                                                                className="h-9 rounded-lg border-slate-200"
                                                                            />
                                                                        ) : (
                                                                            <Select 
                                                                                value={row[col.id]} 
                                                                                onValueChange={v => {
                                                                                    const rows = [...(value.structuredRows || [])];
                                                                                    rows[rIdx] = { ...rows[rIdx], [col.id]: v };
                                                                                    updateSectionValue(section.id, { structuredRows: rows });
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {col.options?.map(o => <SelectItem key={o.id} value={o.value}>{o.label}</SelectItem>)}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        )}
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell className="w-10 p-0 text-center">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8 text-slate-300 hover:text-red-500"
                                                                        onClick={() => {
                                                                            const rows = value.structuredRows?.filter((_, i) => i !== rIdx);
                                                                            updateSectionValue(section.id, { structuredRows: rows });
                                                                        }}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="rounded-lg h-8 text-xs font-bold border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 bg-white"
                                                    onClick={() => {
                                                        const rows = [...(value?.structuredRows || []), {}];
                                                        updateSectionValue(section.id, { structuredRows: rows });
                                                    }}
                                                >
                                                    <Plus className="h-3 w-3 mr-1.5" /> Add Row
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ))}

            <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-wider">Attachments</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleAddAttachmentClick} className="rounded-xl font-bold bg-white">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Reference
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </CardHeader>
                <CardContent className="p-6">
                    <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} isEditing />
                </CardContent>
            </Card>
        </div>
      </ScrollArea>

      <div className="fixed bottom-0 left-[var(--sidebar-width)] right-0 bg-white border-t p-4 px-10 flex justify-between items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="rounded-xl text-red-600 hover:bg-red-50 font-bold gap-2">
              <Trash className="h-4 w-4" />
              Discard Draft
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl border-none p-8">
            <AlertDialogHeader className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <AlertDialogTitle className="text-2xl font-bold text-slate-900">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-base mt-2">
                  This will permanently delete your working copy. Your exclusive lock will be released, allowing other team members to edit this definition.
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="rounded-xl border-slate-200 font-bold px-6">Keep My Draft</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDiscard(definition.id)} className="rounded-xl bg-red-600 hover:bg-red-700 font-bold px-8">
                Confirm Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-3">
            <Button 
                variant="secondary" 
                onClick={() => handleSaveManual(true)} 
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-8 transition-all"
            >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
            </Button>
            <Button 
                onClick={() => handleSaveManual(false)} 
                disabled={!name.trim()}
                className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white rounded-xl font-bold px-10 shadow-lg shadow-indigo-100 transition-all"
            >
                <Send className="mr-2 h-4 w-4" />
                {isAdmin ? 'Publish Changes' : 'Submit for Approval'}
            </Button>
        </div>
      </div>

      <DataSourcePreviewDialog 
        open={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
        sourceName={activeSourcePreview} 
      />
    </div>
  );
}
