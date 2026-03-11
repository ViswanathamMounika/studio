"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Definition, Attachment, Template, DynamicSection } from '@/lib/types';
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
import { X, Upload, Eye, Save, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AttachmentList from './attachments';
import { ScrollArea } from '../ui/scroll-area';
import { DraftedDefinition } from './draft-from-sql-modal';
import { Textarea } from '../ui/textarea';
import { mpmDatabases, mpmSourceTypes, mpmSourceObjects } from '@/lib/data';
import DataSourcePreviewDialog from './data-source-preview-dialog';

const WysiwygEditor = dynamic(() => import('./wysiwyg-editor'), { ssr: false });

type NewDefinitionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (definition: Omit<Definition, 'id' | 'revisions' | 'isArchived'>) => void;
  initialData?: Partial<Definition> | DraftedDefinition | null;
  templates?: Template[];
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];

const initialDefinitionState = {
  name: '',
  module: 'Core',
  keywords: [],
  description: '',
  shortDescription: '',
  technicalDetails: '',
  usageExamples: '',
  attachments: [],
  sourceType: '',
  sourceDb: '',
  sourceName: '',
  isDraft: false,
  dynamicSections: [],
};

export default function NewDefinitionModal({ open, onOpenChange, onSave, initialData, templates = [] }: NewDefinitionModalProps) {
  const [name, setName] = useState(initialDefinitionState.name);
  const [module, setModule] = useState(initialDefinitionState.module);
  const [keywords, setKeywords] = useState<string[]>(initialDefinitionState.keywords);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [description, setDescription] = useState(initialDefinitionState.description);
  const [shortDescription, setShortDescription] = useState(initialDefinitionState.shortDescription);
  const [technicalDetails, setTechnicalDetails] = useState(initialDefinitionState.technicalDetails);
  const [usageExamples, setUsageExamples] = useState(initialDefinitionState.usageExamples);
  const [attachments, setAttachments] = useState<Attachment[]>(initialDefinitionState.attachments);
  const [dynamicSections, setDynamicSections] = useState<DynamicSection[]>(initialDefinitionState.dynamicSections);
  
  const [sourceDb, setSourceDb] = useState(initialDefinitionState.sourceDb);
  const [sourceType, setSourceType] = useState(initialDefinitionState.sourceType);
  const [sourceName, setSourceName] = useState(initialDefinitionState.sourceName);

  const [templateId, setTemplateId] = useState<string | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const data = initialData || initialDefinitionState;
      setName(data.name || initialDefinitionState.name);
      setModule(data.module || initialDefinitionState.module);
      setKeywords(data.keywords || initialDefinitionState.keywords);
      setCurrentKeyword('');
      
      // Reset fields first
      setShortDescription('');
      setDescription('');
      setTechnicalDetails('');
      setUsageExamples('');
      setAttachments([]);
      setDynamicSections([]);
      
      // Handle template pre-population
      const template = templates.find(t => t.id === data.templateId);
      if (template) {
        setShortDescription(template.defaultShortDescription || '');
        setDescription(template.defaultDescription || '');
        setTechnicalDetails(template.defaultTechnicalDetails || '');
        setUsageExamples(template.defaultUsageExamples || '');
        setAttachments(template.defaultAttachments || []);
        
        // Initialize dynamic sections from template custom sections
        const dynamicSecs: DynamicSection[] = (template.customSections || []).map(cs => ({
          sectionId: cs.id,
          name: cs.name,
          isMandatory: cs.isMandatory,
          content: cs.defaultValue || '',
          contentType: cs.contentType || 'rich',
        }));
        setDynamicSections(dynamicSecs);
      } else {
        // @ts-ignore
        setDescription(data.longDescription || data.description || initialDefinitionState.description);
        // @ts-ignore
        setShortDescription(data.shortDescription || initialDefinitionState.shortDescription);
        setTechnicalDetails(data.technicalDetails || initialDefinitionState.technicalDetails);
        setUsageExamples(data.usageExamples || initialDefinitionState.usageExamples);
        setAttachments(data.attachments || initialDefinitionState.attachments);
        setDynamicSections(data.dynamicSections || initialDefinitionState.dynamicSections);
      }
      
      setSourceType(data.sourceType || initialDefinitionState.sourceType);
      setSourceDb(data.sourceDb || initialDefinitionState.sourceDb);
      setSourceName(data.sourceName || initialDefinitionState.sourceName);
      setTemplateId(data.templateId);
    }
  }, [open, initialData, templates]);

  const availableSourceTypes = useMemo(() => {
    return sourceDb ? mpmDatabases.find(d => d.id === sourceDb) ? mpmSourceTypes[sourceDb] || [] : [] : [];
  }, [sourceDb]);

  const availableSourceNames = useMemo(() => {
    if (!sourceDb || !sourceType) return [];
    const key = `${sourceDb}_${sourceType}`;
    return mpmSourceObjects[key] || [];
  }, [sourceDb, sourceType]);

  const handleSave = (isDraft: boolean) => {
    const newDefinitionData = {
      name: name,
      shortDescription: shortDescription,
      description: description,
      keywords: keywords,
      module: module,
      sourceType: sourceType,
      sourceDb: sourceDb,
      sourceName: sourceName,
      technicalDetails: technicalDetails,
      usageExamples: usageExamples,
      attachments: attachments,
      templateId,
      supportingTables: [],
      isDraft: isDraft,
      dynamicSections: dynamicSections,
    };
    onSave(newDefinitionData);
  };

  const handleUpdateDynamicSection = (sectionId: string, content: string) => {
    setDynamicSections(prev => prev.map(s => s.sectionId === sectionId ? { ...s, content } : s));
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

  const isPreviewAvailable = sourceName && (sourceType === 'Views' || sourceType === 'Tables');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {templateId ? `Create from Template: ${templates.find(t => t.id === templateId)?.name}` : 'Create New Definition'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-6 py-4">
              <Card>
                <CardHeader>
                    <CardTitle>Core Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-def-name">Definition Name (DEF_NAME) <span className="text-destructive">*</span></Label>
                      <Input id="new-def-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Required" />
                    </div>
                    <div>
                      <Label htmlFor="new-def-module">Module (EZ_Module)</Label>
                      <Select value={module} onValueChange={setModule}>
                        <SelectTrigger id="new-def-module">
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((mod) => (
                            <SelectItem key={mod} value={mod}>
                              {mod}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new-def-short-descr">Short Description (DEF_SHORT_DESCR)</Label>
                    <Textarea id="new-def-short-descr" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="new-def-keywords">Keywords (DEF_KEYWORDS)</Label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[40px]">
                      {keywords.map(keyword => (
                        <Badge key={keyword} variant="secondary" className="gap-1">
                          {keyword}
                          <button onClick={() => removeKeyword(keyword)} className="rounded-full hover:bg-muted-foreground/20">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Input
                        id="new-def-keywords"
                        placeholder="Add a keyword and press Enter"
                        value={currentKeyword}
                        onChange={(e) => setCurrentKeyword(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        className="flex-1 border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                    <CardTitle>Source of Truth</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="new-def-source-db">Database</Label>
                            <Select value={sourceDb} onValueChange={(val) => {
                                setSourceDb(val);
                                setSourceType('');
                                setSourceName('');
                            }}>
                                <SelectTrigger id="new-def-source-db">
                                    <SelectValue placeholder="Select Database" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mpmDatabases.map(db => (
                                        <SelectItem key={db.id} value={db.id}>{db.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="new-def-source-type">Source Type</Label>
                            <Select 
                                value={sourceType} 
                                onValueChange={(val) => {
                                    setSourceType(val);
                                    setSourceName('');
                                }}
                                disabled={!sourceDb}
                            >
                                <SelectTrigger id="new-def-source-type">
                                    <SelectValue placeholder={sourceDb ? "Select Source Type" : "Select Database first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSourceTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="new-def-source-name">Source Name</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Select 
                                  value={sourceName} 
                                  onValueChange={setSourceName}
                                  disabled={!sourceType}
                              >
                                  <SelectTrigger id="new-def-source-name" className="flex-1">
                                      <SelectValue placeholder={sourceType ? "Select Source Name" : "Select Source Type first"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {availableSourceNames.map(obj => (
                                          <SelectItem key={obj.id} value={obj.id}>{obj.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={!isPreviewAvailable}
                                onClick={() => setIsPreviewOpen(true)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </Button>
                            </div>
                        </div>
                   </div>
                </CardContent>
              </Card>

              {dynamicSections.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    Custom Template Sections
                    <Badge variant="outline" className="text-[10px] uppercase">Required Layout</Badge>
                  </h3>
                  {dynamicSections.map(section => (
                    <Card key={section.sectionId} className="border-l-4 border-l-primary">
                      <CardHeader className="py-3 bg-primary/5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          {section.name}
                          <Badge variant="ghost" className="ml-auto text-[10px] uppercase font-normal opacity-60">
                            {section.contentType === 'rich' ? 'Rich Text' : 'Plain Text'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {section.contentType === 'rich' ? (
                          <WysiwygEditor 
                            value={section.content} 
                            onChange={content => handleUpdateDynamicSection(section.sectionId, content)} 
                          />
                        ) : (
                          <Textarea 
                            value={section.content} 
                            onChange={e => handleUpdateDynamicSection(section.sectionId, e.target.value)}
                            className="min-h-[150px]"
                            placeholder={`Enter content for ${section.name}...`}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card>
                  <CardHeader>
                      <CardTitle>Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WysiwygEditor value={technicalDetails} onChange={setTechnicalDetails} />
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle>Definition Content (DEF_LONG_DESCR)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WysiwygEditor value={description} onChange={setDescription} />
                  </CardContent>
              </Card>
              
              <Card>
                  <CardHeader>
                      <CardTitle>Usage Examples / SQL View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WysiwygEditor value={usageExamples} onChange={setUsageExamples} />
                  </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Attachments</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleAddAttachmentClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Add Attachment
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />
                </CardHeader>
                <CardContent>
                  <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} isEditing />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t pt-4">
          <div className="text-sm text-muted-foreground">
            <span className="text-destructive font-bold">*</span> Indicates required fields
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="secondary" onClick={() => handleSave(true)} disabled={!name.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
            </Button>
            <Button onClick={() => handleSave(false)} disabled={!name.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Submit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <DataSourcePreviewDialog 
        open={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
        sourceName={sourceName} 
        databaseName={mpmDatabases.find(d => d.id === sourceDb)?.name} 
      />
    </Dialog>
  );
}
