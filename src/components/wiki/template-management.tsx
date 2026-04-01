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
import { Pencil, Trash2, Save, Plus, X, LayoutTemplate, Type, FileType, List, AlignLeft, Hash, Table as TableIcon, Settings2, GripVertical, FolderPlus, Layers, ArrowUpDown, FolderTree } from 'lucide-react';
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

interface GroupForm {
  name: string;
  sectionConfigs: { sectionId: string; order: number; included: boolean }[];
}

export default function TemplateManagement({ templates, onSaveTemplates }: TemplateManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Group editing state
  const [groupForm, setGroupForm] = useState<GroupForm>({ name: '', sectionConfigs: [] });
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);

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
      order: (currentTemplate.sections?.length || 0) + 1,
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

  // Group Management Logic
  const existingGroups = useMemo(() => {
    const groupMap = new Map<string, { name: string, sectionIds: string[] }>();
    (currentTemplate.sections || []).forEach(s => {
      if (s.group) {
        if (!groupMap.has(s.group)) {
          groupMap.set(s.group, { name: s.group, sectionIds: [] });
        }
        groupMap.get(s.group)!.sectionIds.push(s.id);
      }
    });
    return Array.from(groupMap.values());
  }, [currentTemplate.sections]);

  const handleOpenGroupModal = (groupToEdit?: string) => {
    const allSections = currentTemplate.sections || [];
    const configs = allSections.map(s => ({
      sectionId: s.id,
      order: s.order || 1,
      included: s.group === groupToEdit
    }));

    if (groupToEdit) {
      setGroupForm({ name: groupToEdit, sectionConfigs: configs });
      setEditingGroupName(groupToEdit);
    } else {
      setGroupForm({ name: '', sectionConfigs: configs });
      setEditingGroupName(null);
    }
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = () => {
    if (!groupForm.name.trim()) return;

    setCurrentTemplate(prev => {
      const sections = (prev.sections || []).map(s => {
        const config = groupForm.sectionConfigs.find(c => c.sectionId === s.id);
        const wasInEditingGroup = editingGroupName ? s.group === editingGroupName : false;

        if (config?.included) {
          return { ...s, group: groupForm.name, order: config.order };
        } else if (wasInEditingGroup) {
          return { ...s, group: undefined };
        }
        return s;
      });
      return { ...prev, sections };
    });

    setIsGroupModalOpen(false);
    toast({ title: 'Groups Updated', description: `Group "${groupForm.name}" has been configured.` });
  };

  const handleRemoveGroup = (groupName: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      sections: (prev.sections || []).map(s => 
        s.group === groupName ? { ...s, group: undefined } : s
      )
    }));
    toast({ title: 'Group Deleted', description: `All sections from "${groupName}" have been ungrouped.` });
  };

  // Group sections by their group name while maintaining order
  const displayGroups = useMemo(() => {
    const sections = [...(currentTemplate.sections || [])].sort((a, b) => a.order - b.order);
    const result: { groupName?: string; sections: TemplateSection[] }[] = [];
    let activeGroup: { groupName?: string; sections: TemplateSection[] } | null = null;

    sections.forEach(s => {
      if (!s.group) {
        // Individual ungrouped section
        result.push({ sections: [s] });
        activeGroup = null;
      } else if (activeGroup && activeGroup.groupName === s.group) {
        // Continue current group
        activeGroup.sections.push(s);
      } else {
        // Start new group
        activeGroup = { groupName: s.group, sections: [s] };
        result.push(activeGroup);
      }
    });

    return result;
  }, [currentTemplate.sections]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Template Management</h1>
          <p className="text-muted-foreground font-medium">Define structured blueprints for documentation.</p>
        </div>
        <Button onClick={handleCreateNew} className="rounded-xl bg-[#3F51B5] hover:bg-[#3F51B5]/90 px-6 font-bold shadow-md shadow-indigo-100">
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
                    {template.isDefault && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">Default</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? 'success' : 'secondary'} className="font-bold">{template.isActive ? 'Active' : 'Inactive'}</Badge>
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
              <Button onClick={handleSaveTemplate} className="rounded-xl bg-[#3F51B5] hover:bg-[#3F51B5]/90 shadow-md gap-2 font-bold px-6">
                <Save className="h-4 w-4" />
                Save Schema
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-8 space-y-10 pb-32">
              {/* Core Template Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Template Name</Label>
                  <Input 
                    value={currentTemplate.name} 
                    onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Clinical Definition"
                    className="rounded-xl border-slate-200 h-11 text-base font-bold focus-visible:ring-primary/20"
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

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Schema Architecture</h3>
                    <p className="text-sm text-slate-500">Add sections or cluster them into logical groups.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleOpenGroupModal()} className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm gap-2 font-bold h-9">
                      <FolderPlus className="h-4 w-4 text-[#3F51B5]" />
                      Create Group
                    </Button>
                    <Button variant="outline" onClick={handleAddSection} className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm gap-2 font-bold h-9">
                      <Plus className="h-4 w-4 text-[#3F51B5]" />
                      Add Section
                    </Button>
                  </div>
                </div>

                <div className="space-y-8">
                  {displayGroups.map((group, gIdx) => (
                    <div key={gIdx} className={cn(group.groupName ? "bg-slate-100/50 p-6 rounded-[28px] border border-slate-200/60 shadow-inner" : "space-y-6")}>
                      {group.groupName && (
                        <div className="flex items-center justify-between mb-6 px-2">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[#3F51B5]/10 flex items-center justify-center">
                              <FolderTree className="h-4 w-4 text-[#3F51B5]" />
                            </div>
                            <h4 className="text-base font-black text-slate-800 uppercase tracking-widest">{group.groupName}</h4>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenGroupModal(group.groupName)} className="h-8 rounded-lg text-slate-500 font-bold hover:bg-white">
                            <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Edit Group
                          </Button>
                        </div>
                      )}

                      <div className="space-y-6">
                        {group.sections.map((section, sIdx) => (
                          <Card key={section.id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden group/section border-l-4 border-l-[#3F51B5] bg-white">
                            <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-[#3F51B5] text-white h-6 w-6 p-0 rounded-lg flex items-center justify-center font-bold text-[10px]">
                                  {section.order}
                                </Badge>
                                <Input 
                                  value={section.name} 
                                  onChange={e => updateSection(section.id, { name: e.target.value })}
                                  placeholder="Section Name"
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive rounded-lg" onClick={() => removeSection(section.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <CardContent className="p-6 space-y-6">
                              <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Display Order</Label>
                                  <Input 
                                    type="number"
                                    value={section.order || ''} 
                                    onChange={e => updateSection(section.id, { order: parseInt(e.target.value) || 0 })}
                                    className="h-9 rounded-xl border-slate-200 font-bold"
                                  />
                                </div>
                                {section.fieldType !== 'Dropdown' && (
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Max Length</Label>
                                    <Input 
                                      type="number"
                                      value={section.maxLength || ''} 
                                      onChange={e => updateSection(section.id, { maxLength: parseInt(e.target.value) || undefined })}
                                      className="h-9 rounded-xl border-slate-200"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-6">
                                  <Checkbox id={`req-${section.id}`} checked={section.isRequired} onCheckedChange={v => updateSection(section.id, { isRequired: !!v })} />
                                  <Label htmlFor={`req-${section.id}`} className="text-xs font-bold text-slate-600">Mandatory</Label>
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                  <Checkbox id={`multi-${section.id}`} checked={section.isMulti} onCheckedChange={v => updateSection(section.id, { isMulti: !!v })} />
                                  <Label htmlFor={`multi-${section.id}`} className="text-xs font-bold text-slate-600">Allow Multiple</Label>
                                </div>
                              </div>

                              {section.fieldType === 'Dropdown' && (
                                <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-500">Mapped Options</Label>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-[#3F51B5]" onClick={() => handleAddOption(section.id)}>
                                      <Plus className="h-3 w-3 mr-1" /> Add Option
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    {section.options?.map((opt, oIdx) => (
                                      <div key={opt.id} className="flex gap-2 items-center">
                                        <Input 
                                          value={opt.label} 
                                          placeholder="Option Label" 
                                          className="h-8 rounded-lg flex-1 font-medium" 
                                          onChange={e => {
                                            const opts = [...(section.options || [])];
                                            opts[oIdx].label = e.target.value;
                                            updateSection(section.id, { options: opts });
                                          }} 
                                        />
                                        <Input 
                                          value={opt.value} 
                                          placeholder="Storage Value" 
                                          className="h-8 rounded-lg flex-1 text-slate-500" 
                                          onChange={e => {
                                            const opts = [...(section.options || [])];
                                            opts[oIdx].value = e.target.value;
                                            updateSection(section.id, { options: opts });
                                          }} 
                                        />
                                        <div className="w-20">
                                          <Input 
                                            type="number"
                                            value={opt.sortOrder} 
                                            placeholder="Sort" 
                                            className="h-8 rounded-lg text-center" 
                                            onChange={e => {
                                              const opts = [...(section.options || [])];
                                              opts[oIdx].sortOrder = parseInt(e.target.value) || 0;
                                              updateSection(section.id, { options: opts });
                                            }} 
                                          />
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-slate-300 hover:text-destructive"
                                          onClick={() => {
                                            const opts = (section.options || []).filter(o => o.id !== opt.id);
                                            updateSection(section.id, { options: opts });
                                          }}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {section.fieldType === 'KeyValue' && (
                                <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <TableIcon className="h-4 w-4 text-slate-400" />
                                      <Label className="text-[11px] font-black uppercase text-slate-500">Column Definitions</Label>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-[#3F51B5]" onClick={() => handleAddColumn(section.id)}>
                                      <Plus className="h-3 w-3 mr-1" /> Add Column
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    {section.columns?.map((col, cIdx) => (
                                      <Card key={col.id} className="p-3 border-slate-200 shadow-none bg-white rounded-xl">
                                        <div className="grid grid-cols-12 gap-4 items-end">
                                          <div className="col-span-4 space-y-1.5">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Name</Label>
                                            <Input value={col.name} onChange={e => {
                                              const cols = [...(section.columns || [])];
                                              cols[cIdx].name = e.target.value;
                                              updateSection(section.id, { columns: cols });
                                            }} className="h-8 rounded-lg font-bold" />
                                          </div>
                                          <div className="col-span-2 space-y-1.5">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Order</Label>
                                            <Input type="number" value={col.sortOrder} onChange={e => {
                                              const cols = [...(section.columns || [])];
                                              cols[cIdx].sortOrder = parseInt(e.target.value) || 0;
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
                                              <SelectTrigger className="h-8 rounded-lg bg-white text-xs font-bold">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="TextBox">TextBox</SelectItem>
                                                <SelectItem value="Dropdown">Dropdown</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="col-span-1 pb-2">
                                            <Checkbox checked={col.isRequired} onCheckedChange={v => {
                                              const cols = [...(section.columns || [])];
                                              cols[cIdx].isRequired = !!v;
                                              updateSection(section.id, { columns: cols });
                                            }} />
                                          </div>
                                          <div className="col-span-2 flex justify-end pb-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive" onClick={() => {
                                              const cols = (section.columns || []).filter(c => c.id !== col.id);
                                              updateSection(section.id, { columns: cols });
                                            }}>
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
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
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="max-w-2xl border-none rounded-[24px] p-0 overflow-hidden shadow-2xl">
          <div className="p-6 border-b bg-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FolderPlus className="h-5 w-5 text-[#3F51B5]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{editingGroupName ? 'Edit Group' : 'Create Section Group'}</DialogTitle>
                <p className="text-xs text-slate-500">Cluster sections under a shared documentation heading.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6 bg-slate-50/30">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Group Name</Label>
              <Input 
                value={groupForm.name} 
                onChange={e => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Clinical Parameters"
                className="rounded-xl border-slate-200 bg-white h-10 font-bold"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Assign Sections & Define Sequence</Label>
              <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-12 text-center font-black uppercase text-[10px]">Include</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Section Name</TableHead>
                        <TableHead className="w-24 text-center font-black uppercase text-[10px]">Sort Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupForm.sectionConfigs.map((config, idx) => {
                        const section = currentTemplate.sections?.find(s => s.id === config.sectionId);
                        return (
                          <TableRow key={config.sectionId} className={cn(config.included ? "bg-indigo-50/20" : "")}>
                            <TableCell className="text-center">
                              <Checkbox 
                                checked={config.included} 
                                onCheckedChange={(checked) => {
                                  const newConfigs = [...groupForm.sectionConfigs];
                                  newConfigs[idx].included = !!checked;
                                  setGroupForm(prev => ({ ...prev, sectionConfigs: newConfigs }));
                                }} 
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{section?.name || 'Untitled Section'}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">{section?.fieldType}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                disabled={!config.included}
                                value={config.order} 
                                onChange={(e) => {
                                  const newConfigs = [...groupForm.sectionConfigs];
                                  newConfigs[idx].order = parseInt(e.target.value) || 0;
                                  setGroupForm(prev => ({ ...prev, sectionConfigs: newConfigs }));
                                }}
                                className="h-8 rounded-lg text-center font-bold"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t flex gap-2">
            {editingGroupName && (
              <Button variant="ghost" className="text-red-600 font-black uppercase text-[11px] tracking-wider" onClick={() => {
                handleRemoveGroup(editingGroupName);
                setIsGroupModalOpen(false);
              }}>
                Delete Group
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleSaveGroup} className="rounded-xl bg-[#3F51B5] hover:bg-[#3F51B5]/90 font-bold shadow-sm px-8" disabled={!groupForm.name.trim()}>
              Save Group Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
