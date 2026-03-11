"use client";
import React, { useState, useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Definition, Attachment, DynamicSection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Eye, Save, Send, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';
import { mpmDatabases, mpmSourceTypes, mpmSourceObjects } from '@/lib/data';
import DataSourcePreviewDialog from './data-source-preview-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const WysiwygEditor = dynamic(() => import('./wysiwyg-editor'), { ssr: false });

type DefinitionEditProps = {
  definition: Definition;
  onSave: (definition: Definition) => void;
  onCancel: () => void;
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];

export default function DefinitionEdit({ definition, onSave, onCancel }: DefinitionEditProps) {
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
  
  const [sourceDb, setSourceDb] = useState(definition.sourceDb || '');
  const [sourceType, setSourceType] = useState(definition.sourceType || '');
  const [sourceName, setSourceName] = useState(definition.sourceName || '');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSourceTypes = useMemo(() => {
    return sourceDb ? mpmSourceTypes[sourceDb] || [] : [];
  }, [sourceDb]);

  const availableSourceNames = useMemo(() => {
    if (!sourceDb || !sourceType) return [];
    const key = `${sourceDb}_${sourceType}`;
    return mpmSourceObjects[key] || [];
  }, [sourceDb, sourceType]);

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
    });
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
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (name: string) => {
    setAttachments(attachments.filter(att => att.name !== name));
  };

  const isPreviewAvailable = sourceName && (sourceType === 'Views' || sourceType === 'Tables');

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
            <Button onClick={() => handleSave(false)} disabled={!name.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Submit
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
                      <Label htmlFor="source_db">Database</Label>
                      <Select value={sourceDb} onValueChange={(val) => {
                          setSourceDb(val);
                          setSourceType('');
                          setSourceName('');
                      }}>
                          <SelectTrigger id="source_db">
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
                      <Label htmlFor="source_type">Source Type</Label>
                      <Select 
                          value={sourceType} 
                          onValueChange={(val) => {
                              setSourceType(val);
                              setSourceName('');
                          }}
                          disabled={!sourceDb}
                      >
                          <SelectTrigger id="source_type">
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
            <h3 className="font-bold text-lg">Template Specific Sections</h3>
            {dynamicSections.map(section => (
              <Card key={section.sectionId} className="border-l-4 border-l-primary">
                <CardHeader className="py-3 bg-primary/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    {section.name}
                    {section.isMandatory && <span className="text-destructive font-bold">*</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <WysiwygEditor 
                    value={section.content} 
                    onChange={content => handleUpdateDynamicSection(section.sectionId, content)} 
                  />
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
        databaseName={mpmDatabases.find(d => d.id === sourceDb)?.name} 
      />
    </div>
  );
}
