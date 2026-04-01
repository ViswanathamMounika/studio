
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Definition } from '@/lib/types';
import { PlusCircle, Trash2, Pencil, X, Link as LinkIcon } from 'lucide-react';
import { findDefinition } from '@/lib/data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type RelatedDefinitionsProps = {
  currentDefinition: Definition;
  allDefinitions: Definition[];
  onDefinitionClick: (id: string, sectionId?: string) => void;
  onSave: (definition: Definition) => void;
  isAdmin: boolean;
};

const flattenDefinitions = (definitions: Definition[]): Definition[] => {
    let flat: Definition[] = [];
    for (const def of definitions) {
        flat.push(def);
        if (def.children) {
            flat = flat.concat(flattenDefinitions(def.children));
        }
    }
    return flat;
}


export default function RelatedDefinitions({
    currentDefinition,
    allDefinitions,
    onDefinitionClick,
    onSave,
    isAdmin
}: RelatedDefinitionsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!open) {
            setSearchQuery('');
        }
    }, [open]);

    const flatAllDefinitions = useMemo(() => flattenDefinitions(allDefinitions), [allDefinitions]);

    const relatedDefinitions = useMemo(() => {
        return (currentDefinition.relatedDefinitions || [])
            .map(id => findDefinition(allDefinitions, id))
            .filter((def): def is Definition => def !== null);
    }, [currentDefinition.relatedDefinitions, allDefinitions]);
    
    const unselectedDefinitions = useMemo(() => {
        const relatedIds = new Set(currentDefinition.relatedDefinitions || []);
        relatedIds.add(currentDefinition.id);
        const filtered = flatAllDefinitions.filter(def => !relatedIds.has(def.id) && (def.description || def.shortDescription));
        
        if (!searchQuery) {
            return filtered;
        }

        return filtered.filter(def => def.name.toLowerCase().includes(searchQuery.toLowerCase()));

    }, [flatAllDefinitions, currentDefinition, searchQuery]);

    const handleAdd = () => {
        if (!selectedId) return;

        const updatedRelated = [...(currentDefinition.relatedDefinitions || []), selectedId];
        onSave({ ...currentDefinition, relatedDefinitions: updatedRelated });
        setSelectedId(null);
        setOpen(false);
    }

    const handleDelete = (idToDelete: string) => {
        const updatedRelated = (currentDefinition.relatedDefinitions || []).filter(id => id !== idToDelete);
        onSave({ ...currentDefinition, relatedDefinitions: updatedRelated });
    };

    return (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b px-6 py-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    Related Definitions
                </CardTitle>
                {isAdmin && !currentDefinition.isArchived && (
                    <div className="flex gap-2">
                        {isEditing ? (
                             <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg font-bold"><X className="mr-2 h-4 w-4" />Cancel</Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-lg font-bold bg-white"><Pencil className="mr-2 h-4 w-4" />Manage</Button>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-6">
                {isEditing && !currentDefinition.isArchived && (
                    <div className="space-y-4 mb-8 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <DropdownMenu open={open} onOpenChange={setOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="flex-1 justify-between rounded-xl bg-white border-slate-200 font-medium"
                                    >
                                        {selectedId
                                            ? flatAllDefinitions.find(def => def.id === selectedId)?.name
                                            : "Select a definition to link..."}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[400px] p-2 rounded-xl shadow-xl">
                                    <Input 
                                        autoFocus
                                        placeholder="Search by name or module..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-2 h-9 rounded-lg"
                                    />
                                    <ScrollArea className="h-[250px]">
                                        {unselectedDefinitions.length > 0 ? (
                                            unselectedDefinitions.map((def) => (
                                                <div
                                                    key={def.id}
                                                    onClick={() => {
                                                        setSelectedId(def.id);
                                                        setOpen(false);
                                                    }}
                                                    className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex flex-col gap-0.5 transition-colors"
                                                >
                                                    <span className="text-[13px] font-bold text-slate-900">{def.name}</span>
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{def.module}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-xs text-slate-400 italic">
                                                No matches found.
                                            </div>
                                        )}
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={handleAdd} disabled={!selectedId} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold px-6 shadow-sm">
                                <PlusCircle className="mr-2 h-4 w-4" /> Link
                            </Button>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedDefinitions.length > 0 ? (
                        relatedDefinitions.map(def => (
                            <Card key={def.id} className="hover:border-primary/30 transition-all group rounded-xl shadow-none border-slate-200">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <button
                                        onClick={() => onDefinitionClick(def.id)}
                                        className="text-left flex-1 min-w-0"
                                    >
                                        <p className="font-bold text-primary text-sm truncate">{def.name}</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{def.module}</p>
                                    </button>
                                    {isEditing && !currentDefinition.isArchived && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(def.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <LinkIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 italic">No related definitions have been linked.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
