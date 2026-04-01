'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Save, Plus, X, LayoutTemplate, Type, FileType, List, AlignLeft, Hash, Table as TableIcon, Settings2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Template, TemplateSection, TemplateOption, TemplateColumn, FieldType } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

type TemplateManagementProps = {
  templates: Template[];
  onSaveTemplates: (templates: Template[]) => void;
};

export default function TemplateManagement({ templates, onSaveTemplates }: TemplateManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({});
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleCreateNew = () => {
    setIsEditing(false);
    setCurrentTemplate({
      id: `t-${Date.now()}`,
      name: '',
      description: '',
      isDefault: false,
      isActive: true,
      sections: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setIsEditing(true);
    setCurrentTemplate({ ...template });
    setIsModalOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!currentTemplate.name?.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Template Name is required.' });
      return;
    }

    const templateToSave = currentTemplate as Template;
    let updatedTemplates: Template[];

    if (isEditing) {
      updatedTemplates = templates.map(t => t.id === templateToSave.id ? templateToSave : t);
    } else {
      updatedTemplates = [...templates, templateToSave];
    }

    onSaveTemplates(updatedTemplates);
    setIsModalOpen(false);
    toast({ title: 'Success', description: 'Template configuration saved.' });
  };

  const handleAddSection = () => {
    const newSection: TemplateSection = {
      id: `sec-${Date.now()}`,
      templateId: currentTemplate.id!,
      name: '',
      fieldType: 'PlainText',
      isMulti: false,
      isRequired: false,
      options: [],
      columns: []
    };
    setCurrentTemplate(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const updateSection = (id: string, updates: Partial<TemplateSection>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      sections: (prev.sections || []).map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const removeSection = (id: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      sections: (prev.sections || []).filter(s => s.id !== id)
    }));
  };

  const handleAddOption = (sectionId: string, columnId?: string) => {
    setCurrentTemplate(prev => {
      const sections = (prev.sections || []).map(s => {
        if (s.id === sectionId) {
          const newOption: TemplateOption = {
            id: `opt-${Date.now()}`,
            templateSectionId: sectionId,
            columnId,
            label: '',
            value: '',
            sortOrder: (s.options?.length || 0) + 1,
            isDefault: false
          };
          
          if (columnId) {
            // Add to specific column's options
            return {
              ...s,
              columns: (s.columns || []).map(c => 
                c.id === columnId ? { ...c, options: [...(c.options || []), newOption] } : c
              )
            };
          }
          return { ...s, options: [...(s.options || []), newOption] };
        }
        return s;
      });
      return { ...prev, sections };
    });
  };

  const handleAddColumn = (sectionId: string) => {
    setCurrentTemplate(prev => {
      const sections = (prev.sections || []).map(s => {
        if (s.id === sectionId) {
          const newCol: TemplateColumn = {
            id: `col-${Date.now()}`,
            templateSectionId: sectionId,
            name: '',
            inputType: 'TextBox',
            isMulti: false,
            sortOrder: (s.columns?.length || 0) + 1,
            isRequired: false
          };
          return { ...s, columns: [...(s.columns || []), newCol] };
        }
        return s;
      });
      return { ...prev, sections };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Management</h1>
          <p className="text-muted-foreground font-medium">Define structured blueprints for MPM documentation based on the SQL schema.</p>
        </div>
        <Button onClick={handleCreateNew} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 dark:bg-slate-900 border-none">
                <TableHead className="py-4 px-6 font-black uppercase text-[11px] tracking-widest text-slate-900 dark:text-slate-100">Template Name</TableHead>
                <TableHead className="font-black uppercase text-[11px] tracking-widest text-slate-900 dark:text-slate-100">Default</TableHead>
                <TableHead className="font-black uppercase text-[11px] tracking-widest text-slate-900 dark:text-slate-100">Status</TableHead>
                <TableHead className="text-right px-6 font-black uppercase text-[11px] tracking-widest text-slate-900 dark:text-slate-100">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(template => (
                <TableRow key={template.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="px-6 py-4">
                    <p className="font-bold text-slate-900">{template.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{template.description}</p>
                  </TableCell>
                  <TableCell>
                    {template.isDefault && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">Default</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? 'success' : 'secondary'}>{template.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[24px] shadow-2xl">
          <div className="p-6 border-b bg-white sticky top-0 z-50 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {isEditing ? 'Edit Template' : 'New Blueprint'}
                </DialogTitle>
                <p className="text-sm text-slate-500">Configure sections and validation logic.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl border-slate-200">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveTemplate} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md gap-2">
                <Save className="h-4 w-4" />
                Save Schema
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-8 space-y-8">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Template Name</Label>
                  <Input 
                    value={currentTemplate.name} 
                    onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Clinical Definition"
                    className="rounded-xl border-slate-200 h-11 text-base font-medium focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Default Status</Label>
                  <div className="flex items-center gap-4 h-11">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="is-default" 
                        checked={currentTemplate.isDefault} 
                        onCheckedChange={v => setCurrentTemplate(prev => ({ ...prev, isDefault: !!v }))}
                      />
                      <Label htmlFor="is-default" className="text-sm font-bold text-slate-700 cursor-pointer">Set as System Default</Label>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Description</Label>
                  <Textarea 
                    value={currentTemplate.description} 
                    onChange={e => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the usage of this template..."
                    className="rounded-xl border-slate-200 min-h-[80px]"
                  />
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Sections Editor */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Schema Sections</h3>
                    <p className="text-sm text-slate-500">Each section corresponds to a row in <code>wiki.DEF_Template_Section</code></p>
                  </div>
                  <Button variant="outline" onClick={handleAddSection} className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-6">
                  {currentTemplate.sections?.map((section, sIdx) => (
                    <Card key={section.id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden group/section border-l-4 border-l-indigo-500">
                      <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-indigo-600 text-white h-6 w-6 p-0 rounded-lg flex items-center justify-center font-bold text-[10px]">
                            {sIdx + 1}
                          </Badge>
                          <Input 
                            value={section.name} 
                            onChange={e => updateSection(section.id, { name: e.target.value })}
                            placeholder="Section Name (e.g. Technical Details)"
                            className="bg-transparent border-none shadow-none font-bold text-slate-800 p-0 h-auto focus-visible:ring-0 w-64"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={section.fieldType} 
                            onValueChange={v => updateSection(section.id, { fieldType: v as any })}
                          >
                            <SelectTrigger className="h-8 w-36 rounded-lg text-xs font-bold border-slate-200 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RichText"><div className="flex items-center gap-2"><FileType className="h-3 w-3" /> Rich Text</div></SelectItem>
                              <SelectItem value="PlainText"><div className="flex items-center gap-2"><Type className="h-3 w-3" /> Plain Text</div></SelectItem>
                              <SelectItem value="Dropdown"><div className="flex items-center gap-2"><List className="h-3 w-3" /> Dropdown</div></SelectItem>
                              <SelectItem value="KeyValue"><div className="flex items-center gap-2"><TableIcon className="h-3 w-3" /> Structured Grid</div></SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive rounded-lg" onClick={() => removeSection(section.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-6 space-y-6 bg-white">
                        <div className="grid grid-cols-4 gap-6">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Group Name</Label>
                            <Input 
                              value={section.group || ''} 
                              onChange={e => updateSection(section.id, { group: e.target.value })}
                              placeholder="Optional Grouping"
                              className="h-9 rounded-xl border-slate-200"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max Length</Label>
                            <Input 
                              type="number"
                              value={section.maxLength || ''} 
                              onChange={e => updateSection(section.id, { maxLength: parseInt(e.target.value) || undefined })}
                              className="h-9 rounded-xl border-slate-200"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Checkbox id={`req-${section.id}`} checked={section.isRequired} onCheckedChange={v => updateSection(section.id, { isRequired: !!v })} />
                            <Label htmlFor={`req-${section.id}`} className="text-xs font-bold text-slate-600">Mandatory</Label>
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Checkbox id={`multi-${section.id}`} checked={section.isMulti} onCheckedChange={v => updateSection(section.id, { isMulti: !!v })} />
                            <Label htmlFor={`multi-${section.id}`} className="text-xs font-bold text-slate-600">Allow Multiple</Label>
                          </div>
                        </div>

                        {/* Special UI for Dropdowns (Options) */}
                        {section.fieldType === 'Dropdown' && (
                          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-[11px] font-black uppercase text-slate-500">Selection Options</Label>
                              <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-indigo-600 hover:text-indigo-700" onClick={() => handleAddOption(section.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Option
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {section.options?.map((opt, oIdx) => (
                                <div key={opt.id} className="flex gap-2 items-center">
                                  <Input value={opt.label} placeholder="Label" className="h-8 rounded-lg" onChange={e => {
                                    const opts = [...(section.options || [])];
                                    opts[oIdx].label = e.target.value;
                                    opts[oIdx].value = e.target.value; // Keep simple for prototype
                                    updateSection(section.id, { options: opts });
                                  }} />
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive">
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Special UI for KeyValue (Columns) */}
                        {section.fieldType === 'KeyValue' && (
                          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <TableIcon className="h-4 w-4 text-slate-400" />
                                <Label className="text-[11px] font-black uppercase text-slate-500">Grid Column Definitions</Label>
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-indigo-600 hover:text-indigo-700" onClick={() => handleAddColumn(section.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Column
                              </Button>
                            </div>
                            
                            <div className="space-y-4">
                              {section.columns?.map((col, cIdx) => (
                                <Card key={col.id} className="p-3 border-slate-200 shadow-none bg-white rounded-xl">
                                  <div className="grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-4 space-y-1.5">
                                      <Label className="text-[9px] font-black uppercase text-slate-400">Column Name</Label>
                                      <Input value={col.name} onChange={e => {
                                        const cols = [...(section.columns || [])];
                                        cols[cIdx].name = e.target.value;
                                        updateSection(section.id, { columns: cols });
                                      }} className="h-8 rounded-lg" />
                                    </div>
                                    <div className="col-span-3 space-y-1.5">
                                      <Label className="text-[9px] font-black uppercase text-slate-400">Input Type</Label>
                                      <Select value={col.inputType} onValueChange={v => {
                                        const cols = [...(section.columns || [])];
                                        cols[cIdx].inputType = v as any;
                                        updateSection(section.id, { columns: cols });
                                      }}>
                                        <SelectTrigger className="h-8 rounded-lg bg-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="TextBox">TextBox</SelectItem>
                                          <SelectItem value="Dropdown">Dropdown</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-2 pb-2">
                                      <div className="flex items-center gap-2">
                                        <Checkbox checked={col.isRequired} onCheckedChange={v => {
                                          const cols = [...(section.columns || [])];
                                          cols[cIdx].isRequired = !!v;
                                          updateSection(section.id, { columns: cols });
                                        }} />
                                        <Label className="text-xs font-bold">Req.</Label>
                                      </div>
                                    </div>
                                    <div className="col-span-3 flex justify-end pb-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {col.inputType === 'Dropdown' && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase text-slate-400">Col Options</span>
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold" onClick={() => handleAddOption(section.id, col.id)}>
                                          Add Option
                                        </Button>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {col.options?.map((opt, oIdx) => (
                                          <Badge key={opt.id} variant="outline" className="bg-white border-slate-200 px-2 py-0 h-6 flex items-center gap-1.5">
                                            {opt.label}
                                            <button className="text-slate-400 hover:text-red-500"><X className="h-2.5 w-2.5" /></button>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
