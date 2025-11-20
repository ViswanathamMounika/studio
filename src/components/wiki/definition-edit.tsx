
"use client";
import React, { useState, useRef } from 'react';
import type { Definition, Attachment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload } from 'lucide-react';
import WysiwygEditor from './wysiwyg-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AttachmentList from './attachments';
import { Textarea } from '../ui/textarea';

type DefinitionEditProps = {
  definition: Definition;
  onSave: (definition: Definition) => void;
  onCancel: () => void;
};

const modules = ['Authorizations', 'Claims', 'Provider', 'Member', 'Core', 'Member Management', 'Provider Network'];
const sourceTypes = ['Table', 'View', 'SQL Query'];

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
  const [sourceType, setSourceType] = useState(definition.sourceType || 'View');
  const [sourceDb, setSourceDb] = useState(definition.sourceDb || '');
  const [sourceName, setSourceName] = useState(definition.sourceName || '');
  const [sourceServer, setSourceServer] = useState(definition.sourceServer || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
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
      sourceServer,
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
        url: URL.createObjectURL(file), // Create a temporary local URL
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
      };
      setAttachments([...attachments, newAttachment]);
    }
    // Reset file input to allow selecting the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  const handleRemoveAttachment = (name: string) => {
    setAttachments(attachments.filter(att => att.name !== name));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Edit Definition</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
      
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
            <CardTitle>Data Source</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="source_type">Source Type (DEF_SOURCE_TYPE)</Label>
                    <Select value={sourceType} onValueChange={setSourceType}>
                        <SelectTrigger id="source_type">
                        <SelectValue placeholder="Select a source type" />
                        </SelectTrigger>
                        <SelectContent>
                        {sourceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                            {type}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="source_server">Source Server (DEF_SOURCE_SERVERS)</Label>
                    <Input id="source_server" value={sourceServer} onChange={(e) => setSourceServer(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="source_db">Source Database (DEF_SOURCE_DB)</Label>
                    <Input id="source_db" value={sourceDb} onChange={(e) => setSourceDb(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="source_name">Source Name (DEF_SOURCE_NAME)</Label>
                    <Input id="source_name" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
                </div>
            </div>
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
              <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <WysiwygEditor value={technicalDetails} onChange={setTechnicalDetails} />
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
  );
}
