"use client";
import { useState } from 'react';
import type { Definition } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import WysiwygEditor from './wysiwyg-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '../ui/textarea';

type DefinitionEditProps = {
  definition: Definition;
  onSave: (definition: Definition) => void;
  onCancel: () => void;
};

export default function DefinitionEdit({ definition, onSave, onCancel }: DefinitionEditProps) {
  const [name, setName] = useState(definition.name);
  const [module, setModule] = useState(definition.module);
  const [keywords, setKeywords] = useState<string[]>(definition.keywords);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [description, setDescription] = useState(definition.description);
  const [technicalDetails, setTechnicalDetails] = useState(definition.technicalDetails);
  const [examples, setExamples] = useState(definition.examples);
  const [usage, setUsage] = useState(definition.usage);

  const handleSave = () => {
    onSave({
      ...definition,
      name,
      module,
      keywords,
      description,
      technicalDetails,
      examples,
      usage,
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
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="module">Module</Label>
              <Input id="module" value={module} onChange={(e) => setModule(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="keywords">Keywords</Label>
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
              <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <WysiwygEditor content={description} onChange={setDescription} />
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={technicalDetails} onChange={e => setTechnicalDetails(e.target.value)} rows={5} className="font-code" />
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Examples & Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <Label>Examples</Label>
                <Textarea value={examples} onChange={e => setExamples(e.target.value)} rows={5}/>
            </div>
            <div>
                <Label>Usage</Label>
                <Textarea value={usage} onChange={e => setUsage(e.target.value)} rows={5}/>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
