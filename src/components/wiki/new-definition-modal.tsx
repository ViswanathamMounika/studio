
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Definition, Attachment, Template, TemplateSection, SectionValue } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Save, Send, Plus, Trash2, ChevronDown, Check, Info, Hash, Table as TableIcon, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AttachmentList from './attachments';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const WysiwygEditor = dynamic(() => import('./wysiwyg-editor'), { ssr: false });

type NewDefinitionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (definition: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => void;
  initialData?: any;
  templates?: Template[];
  isAdmin: boolean;
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];

export default function NewDefinitionModal({ open, onOpenChange, onSave, initialData, templates = [], isAdmin }: NewDefinitionModalProps) {
  const [name, setName] = useState('');
  const [module, setModule] = useState('Core');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [sectionValues, setSectionValues] = useState<SectionValue[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === templateId) || templates.find(t => t.isDefault) || templates[0], 
  [templates, templateId]);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setModule(initialData?.module || 'Core');
      setKeywords(initialData?.keywords || []);
      setAttachments(initialData?.attachments || []);
      
      const tId = (initialData?.templateId && initialData.templateId !== 'blank') 
        ? initialData.templateId 
        : templates.find(t => t.isDefault)?.id || templates[0]?.id;
      
      setTemplateId(tId);
    }
  }, [open, initialData, templates]);

  useEffect(() => {
    if (open && selectedTemplate) {
      setSectionValues(selectedTemplate.sections.map(s => ({
        sectionId: s.id,
        raw: '',
        html: '',
        multiValues: [],
        structuredRows: s.fieldType === 'KeyValue' ? [{}] : []
      })));
    }
  }, [open, selectedTemplate]);

  const updateSectionValue = (sectionId: string, updates: Partial<SectionValue>) => {
    setSectionValues(prev => prev.map(v => v.sectionId === sectionId ? { ...v, ...updates } : v));
  };

  const handleSave = (isDraft: boolean) => {
    onSave({
      name,
      module,
      keywords,
      templateId,
      sectionValues,
      attachments,
      isDraft,
      description: sectionValues.find(v => v.sectionId === '2')?.raw || '',
      supportingTables: []
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

  const displayGroups = useMemo(() => {
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
  }, [selectedTemplate]);

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-[1000px] w-full h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[24px] shadow-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="p-6 border-b bg-white sticky top-0 z-30 flex justify-between items-center shadow-sm">
            <DialogHeader className="p-0">
              <DialogTitle className="text-2xl font-bold tracking-tight">Create Definition</DialogTitle>
              <p className="text-sm text-slate-500">Standardized layout: <span className="font-bold text-primary">{selectedTemplate?.name}</span></p>
            </DialogHeader>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl border-slate-200">Cancel</Button>
              </DialogClose>
              <Button variant="secondary" onClick={() => handleSave(true)} className="rounded-xl bg-slate-100 hover:bg-slate-200 border-none font-bold">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave(false)} disabled={!name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-indigo-100">
                <Send className="mr-2 h-4 w-4" />
                {isAdmin ? 'Publish' : 'Submit for Approval'}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-8 space-y-10 pb-24">
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Definition Name <span className="text-red-500">*</span></Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Required" className="rounded-xl h-11 border-slate-200 text-base font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Module</Label>
                      <Select value={module} onValueChange={setModule}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Keywords</Label>
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
                              placeholder="Type and press Enter..."
                              value={currentKeyword}
                              onChange={e => setCurrentKeyword(e.target.value)}
                              onKeyDown={handleKeywordKeyDown}
                              className="flex-1 border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
                          />
                      </div>
                  </div>
                </CardContent>
              </Card>

              {displayGroups.map((unit, idx) => (
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
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                              {section.name}
                              {section.isRequired && <span className="text-red-500 font-bold">*</span>}
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
                                className="rounded-xl border-slate-200 min-h-[120px]"
                              />
                            )}
                            {section.fieldType === 'Dropdown' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {section.isMulti ? (
                                  <div className="flex flex-wrap gap-2">
                                    {section.options?.map(opt => {
                                      const isSelected = value?.multiValues?.includes(opt.value);
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          className={cn(
                                            "flex items-center gap-2 px-4 py-2 border rounded-xl transition-all font-medium text-sm",
                                            isSelected 
                                              ? "bg-primary/10 border-primary text-primary" 
                                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                          )}
                                          onClick={() => {
                                            const current = value?.multiValues || [];
                                            const next = isSelected ? current.filter(v => v !== opt.value) : [...current, opt.value];
                                            updateSectionValue(section.id, { multiValues: next, raw: next.join(', ') });
                                          }}
                                        >
                                          <div className={cn(
                                            "h-4 w-4 rounded-md border flex items-center justify-center transition-colors",
                                            isSelected ? "bg-primary border-primary" : "border-slate-300"
                                          )}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                          </div>
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <Select value={value?.raw} onValueChange={v => updateSectionValue(section.id, { raw: v })}>
                                    <SelectTrigger className="rounded-xl border-slate-200">
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
                                            className="h-8 w-8 text-slate-300 hover:text-destructive"
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
                                  className="rounded-lg h-8 text-xs font-bold border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"
                                  onClick={() => {
                                    const rows = [...(value?.structuredRows || []), {}];
                                    updateSectionValue(section.id, { structuredRows: rows });
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1.5" /> Add New Row
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
                      <AttachmentList attachments={attachments} onRemove={(name) => setAttachments(attachments.filter(a => a.name !== name))} isEditing />
                  </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
