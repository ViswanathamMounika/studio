"use client";
import React, { useState, useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Definition, Attachment, DynamicSection, SqlFunctionDetails, InputParameter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Eye, Save, Send, Lock, Plus, Trash2, ChevronDown, Check, Info, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { mpmDatabases, mpmSourceTypes, mpmSourceObjects } from '@/lib/data';
import DataSourcePreviewDialog from './data-source-preview-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';

const WysiwygEditor = dynamic(() => import('./wysiwyg-editor'), { ssr: false });

type DefinitionEditProps = {
  definition: Definition;
  onSave: (definition: Definition) => void;
  onCancel: () => void;
  isAdmin: boolean;
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];
const sqlDataTypes = ["varchar", "int", "date", "datetime", "bit", "decimal"];

const defaultSqlDetails: SqlFunctionDetails = {
  inputParameters: [{ name: '', type: 'varchar' }],
  outputType: 'varchar',
  outputExample: '',
};

export default function DefinitionEdit({ definition, onSave, onCancel, isAdmin }: DefinitionEditProps) {
  const [name, setName] = useState(definition.name);
  const [module, setModule] = useState(definition.module);
  const [keywords, setKeywords] = useState<string[]>(definition.keywords);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [description, setDescription] = useState(definition.description);
  const [shortDescription, setShortDescription] = useState(definition.shortDescription || '');
  const [technicalDetails, setTechnicalDetails] = useState(definition.technicalDetails || '');
  const [usageExamples, setUsageExamples] = useState(definition.usageExamples || '');
  const [attachments, setAttachments] = useState<Attachment[]>(definition.attachments);
  const [dynamicSections, setDynamicSections] = useState<DynamicSection[]>(definition.dynamicSections || []);
  
  const [sourceDb, setSourceDb] = useState(definition.sourceDb || ''); // stored as comma separated string
  const [sourceType, setSourceType] = useState(definition.sourceType || '');
  const [sourceName, setSourceName] = useState(definition.sourceName || '');
  
  const [sqlDetails, setSqlDetails] = useState<SqlFunctionDetails>(definition.sqlFunctionDetails || defaultSqlDetails);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDbs = useMemo(() => sourceDb ? sourceDb.split(',').map(s => s.trim()) : [], [sourceDb]);

  const isSupportTblsOnly = useMemo(() => selectedDbs.length === 1 && selectedDbs[0] === 'SupportTbls', [selectedDbs]);

  const availableSourceTypes = useMemo(() => {
    const firstDb = selectedDbs[0];
    return firstDb ? mpmSourceTypes[firstDb] || [] : [];
  }, [selectedDbs]);

  const availableSourceNames = useMemo(() => {
    const firstDb = selectedDbs[0];
    if (!firstDb || !sourceType) return [];
    const key = `${firstDb}_${sourceType}`;
    return mpmSourceObjects[key] || [];
  }, [selectedDbs, sourceType]);

  // Handle auto-population for SupportTbls SQL Functions
  useEffect(() => {
    if (isSupportTblsOnly && sourceType === 'SQL Functions' && sourceName) {
      const selectedObject = availableSourceNames.find(obj => obj.id === sourceName);
      if (selectedObject?.sqlMetadata) {
        const meta = selectedObject.sqlMetadata;
        setSqlDetails({
          inputParameters: meta.inputParameters.map(p => ({ ...p })),
          outputType: meta.outputType,
          outputExample: meta.outputExample,
        });
      }
    }
  }, [sourceName, isSupportTblsOnly, sourceType, availableSourceNames]);

  const handleSave = (isDraft: boolean) => {
    onSave({
      ...definition,
      name,
      module,
      keywords,
      description,
      shortDescription,
      technicalDetails,
      usageExamples,
      attachments,
      sourceType,
      sourceDb,
      sourceName,
      isDraft: isDraft,
      dynamicSections: dynamicSections,
      sqlFunctionDetails: sourceType === 'SQL Functions' ? sqlDetails : undefined,
    });
  };

  const toggleDatabase = (dbId: string) => {
    setSourceDb(prev => {
      const current = prev ? prev.split(',').map(s => s.trim()) : [];
      const updated = current.includes(dbId) 
        ? current.filter(id => id !== dbId)
        : [...current, dbId];
      return updated.join(', ');
    });
    setSourceType('');
    setSourceName('');
    setSqlDetails(defaultSqlDetails);
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

  const handleAddSqlParam = () => {
    setSqlDetails(prev => ({ 
      ...prev, 
      inputParameters: [...prev.inputParameters, { name: '', type: 'varchar' }] 
    }));
  };

  const handleUpdateSqlParam = (index: number, updates: Partial<InputParameter>) => {
    const params = [...sqlDetails.inputParameters];
    params[index] = { ...params[index], ...updates };
    setSqlDetails(prev => ({ ...prev, inputParameters: params }));
  };

  const handleRemoveSqlParam = (index: number) => {
    setSqlDetails(prev => ({ 
      ...prev, 
      inputParameters: prev.inputParameters.filter((_, i) => i !== index) 
    }));
  };

  const isPreviewAvailable = isSupportTblsOnly && sourceName && (sourceType === 'Views' || sourceType === 'Tables');
  const showPreviewButton = sourceType === 'Views' || sourceType === 'Tables';

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-[100] bg-background px-6 py-4 border-b space-y-4 shadow-sm">
        <Alert className="bg-primary/5 border-primary/20">
          <Lock className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">Edit Mode Active</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            This definition is currently being modified. Your session is locked.
          </AlertDescription>
        </Alert>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Edit Definition</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSave(true)} disabled={!name.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
            </Button>
            <Button 
              onClick={() => handleSave(false)} 
              disabled={!name.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            >
                <Send className="mr-2 h-4 w-4" />
                {isAdmin ? 'Publish' : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
              <CardTitle>Core Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Definition Name (DEF_NAME)</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="module">Module (EZ_Module)</Label>
                <Select value={module} onValueChange={setModule}>
                  <SelectTrigger id="module">
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
              <Label htmlFor="short_description">Short Description (DEF_SHORT_DESCR)</Label>
              <Textarea id="short_description" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="keywords">Keywords (DEF_KEYWORDS)</Label>
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
                  id="keywords"
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
                      <Label htmlFor="source_db">Databases</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal">
                            <span className="truncate">
                              {selectedDbs.length > 0 ? selectedDbs.join(', ') : "Select Databases"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <div className="p-2 space-y-1">
                            {mpmDatabases.map(db => (
                              <div 
                                key={db.id} 
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                                onClick={() => toggleDatabase(db.id)}
                              >
                                <Checkbox checked={selectedDbs.includes(db.id)} onCheckedChange={() => toggleDatabase(db.id)} />
                                <span className="text-sm font-medium">{db.name}</span>
                                {selectedDbs.includes(db.id) && <Check className="ml-auto h-4 w-4 text-primary" />}
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                  </div>
                  <div>
                      <Label htmlFor="source_type">Source Type</Label>
                      <Select 
                          value={sourceType} 
                          onValueChange={(val) => {
                              setSourceType(val);
                              setSourceName('');
                              setSqlDetails(defaultSqlDetails);
                          }}
                          disabled={selectedDbs.length === 0}
                      >
                          <SelectTrigger id="source_type">
                              <SelectValue placeholder={selectedDbs.length > 0 ? "Select Source Type" : "Select Database first"} />
                          </SelectTrigger>
                          <SelectContent>
                              {availableSourceTypes.map(type => (
                                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="col-span-2">
                      <Label htmlFor="source_name">Source Name</Label>
                      <div className="flex items-center gap-2 mt-1">
                          <Select 
                              value={sourceName} 
                              onValueChange={setSourceName}
                              disabled={!sourceType}
                          >
                              <SelectTrigger id="source_name" className="flex-1">
                                  <SelectValue placeholder={sourceType ? "Select Source Name" : "Select Source Type first"} />
                              </SelectTrigger>
                              <SelectContent>
                                  {availableSourceNames.map(obj => (
                                      <SelectItem key={obj.id} value={obj.id}>{obj.name}</SelectItem>
                                  ))}
                                  {availableSourceNames.length === 0 && (
                                    <div className="p-2 text-xs text-muted-foreground italic text-center">No objects found</div>
                                  )}
                              </SelectContent>
                          </Select>
                        {showPreviewButton && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={!isPreviewAvailable}
                            onClick={() => setIsPreviewOpen(true)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                        )}
                      </div>
                  </div>
              </div>

              {sourceType === 'SQL Functions' && (
                <div className="mt-6 p-4 border rounded-lg bg-primary/5 space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wider">SQL Function Specifications</h4>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold">Input Parameter(s)</Label>
                    {sqlDetails.inputParameters.map((param, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Parameter Name</Label>
                          <Input 
                            placeholder="@Name" 
                            value={param.name} 
                            onChange={(e) => handleUpdateSqlParam(idx, { name: e.target.value })} 
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Type</Label>
                          <Select 
                            value={param.type} 
                            onValueChange={(v) => handleUpdateSqlParam(idx, { type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sqlDataTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveSqlParam(idx)}
                          disabled={sqlDetails.inputParameters.length <= 1}
                          className="mb-0.5"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddSqlParam} className="mt-2">
                      <Plus className="mr-2 h-4 w-4" /> Add Parameter
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Output Type</Label>
                      <Select 
                        value={sqlDetails.outputType} 
                        onValueChange={(v: any) => setSqlDetails(prev => ({ ...prev, outputType: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sqlDataTypes.slice(0, 4).map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Output Example</Label>
                      <Input 
                        placeholder="e.g., '2024-01-01' or 42" 
                        value={sqlDetails.outputExample}
                        onChange={(e) => setSqlDetails(prev => ({ ...prev, outputExample: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {dynamicSections.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Template Specific Sections</h3>
            {dynamicSections.map(section => (
              <Card key={section.sectionId} className="border-l-4 border-l-primary shadow-sm overflow-hidden">
                <CardHeader className="py-3 bg-primary/5 flex flex-row items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      {section.name}
                      {section.isMandatory && <span className="text-destructive font-bold">*</span>}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {section.description && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Info className="h-3 w-3" />
                          {section.description}
                        </div>
                      )}
                      {section.maxLength && (
                        <div className="flex items-center gap-1 text-xs font-bold text-primary/60 uppercase">
                          <Hash className="h-3 w-3" /> Max: {section.maxLength}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="ghost" className="text-[10px] uppercase font-normal opacity-60">
                    {section.contentType}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  {section.contentType === 'rich' ? (
                    <WysiwygEditor 
                      value={section.content} 
                      onChange={content => handleUpdateDynamicSection(section.sectionId, content)} 
                    />
                  ) : section.contentType === 'dropdown' ? (
                    <Select 
                      value={section.content} 
                      onValueChange={val => handleUpdateDynamicSection(section.sectionId, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${section.name}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {section.dropdownOptions?.split(',').map(opt => (
                          <SelectItem key={opt.trim()} value={opt.trim()}>{opt.trim()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Textarea 
                      value={section.content} 
                      onChange={e => handleUpdateDynamicSection(section.sectionId, e.target.value)}
                      className="min-h-[150px]"
                      placeholder={`Enter content for ${section.name}...`}
                      maxLength={section.maxLength}
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
      <DataSourcePreviewDialog 
        open={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
        sourceName={sourceName} 
        databaseName={selectedDbs[0] ? mpmDatabases.find(d => d.id === selectedDbs[0])?.name : undefined} 
      />
    </div>
  );
}
