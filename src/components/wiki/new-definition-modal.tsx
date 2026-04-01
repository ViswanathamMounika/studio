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
import { X, Upload, Eye, Save, Send, Plus, Trash2, ChevronDown, Check, Info, Hash, Table as TableIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AttachmentList from './attachments';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { mpmDatabases, mpmSourceTypes } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
    templates.find(t => t.id === templateId) || templates.find(t => t.isDefault), 
  [templates, templateId]);

  useEffect(() => {
    if (open) {
      setName('');
      setModule('Core');
      setKeywords([]);
      setAttachments([]);
      
      const tId = initialData?.templateId || templates.find(t => t.isDefault)?.id;
      setTemplateId(tId);
      
      if (selectedTemplate) {
        setSectionValues(selectedTemplate.sections.map(s => ({
          sectionId: s.id,
          raw: '',
          html: '',
          multiValues: [],
          structuredRows: s.fieldType === 'KeyValue' ? [{}] : []
        })));
      }
    }
  }, [open, initialData, templates, selectedTemplate]);

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

  // Group sections by their `group` field
  const groupedSections = useMemo(() => {
    if (!selectedTemplate) return {};
    return selectedTemplate.sections.reduce((acc, section) => {
      const g = section.group || 'General Documentation';
      if (!acc[g]) acc[g] = [];
      acc[g].push(section);
      return acc;
    }, {} as Record<string, TemplateSection[]>);
  }, [selectedTemplate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[24px]">
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
            <Button onClick={() => handleSave(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-indigo-100">
              <Send className="mr-2 h-4 w-4" />
              {isAdmin ? 'Publish' : 'Submit for Approval'}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-slate-50/30">
          <div className="p-8 space-y-10 pb-24">
            {/* Core Info */}
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
              </CardContent>
            </Card>

            {/* Dynamic Template Sections */}
            {Object.entries(groupedSections).map(([groupName, sections]) => (
              <div key={groupName} className="space-y-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{groupName}</h3>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
                
                <div className="space-y-6">
                  {sections.map(section => {
                    const value = sectionValues.find(v => v.sectionId === section.id);
                    
                    return (
                      <Card key={section.id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="py-3 bg-white border-b px-6 flex flex-row items-center justify-between">
                          <div className="flex flex-col">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                              {section.name}
                              {section.isRequired && <span className="text-red-500 font-bold">*</span>}
                            </CardTitle>
                          </div>
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
                                  {section.options?.map(opt => (
                                    <div key={opt.id} className="flex items-center gap-2 p-2 border rounded-xl hover:bg-slate-50 transition-colors">
                                      <Checkbox 
                                        checked={value?.multiValues?.includes(opt.value)}
                                        onCheckedChange={checked => {
                                          const current = value?.multiValues || [];
                                          const next = checked ? [...current, opt.value] : current.filter(v => v !== opt.value);
                                          updateSectionValue(section.id, { multiValues: next, raw: next.join(', ') });
                                        }}
                                      />
                                      <span className="text-sm font-medium">{opt.label}</span>
                                    </div>
                                  ))}
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
                                    {section.columns?.map(col => (
                                      <TableHead key={col.id} className="font-bold text-slate-700 h-10">{col.name}</TableHead>
                                    ))}
                                    <TableHead className="w-10"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {value?.structuredRows?.map((row, rIdx) => (
                                    <TableRow key={rIdx} className="border-slate-100 hover:bg-transparent">
                                      {section.columns?.map(col => (
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
