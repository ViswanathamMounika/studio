
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Definition } from '@/lib/types';
import { PlusCircle, Trash2, Pencil, X, Wand2 } from 'lucide-react';
import { findDefinition } from '@/lib/data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { suggestDefinitions } from '@/ai/flows/definition-suggestion';
import { useToast } from '@/hooks/use-toast';

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
    const [suggestedDefinitions, setSuggestedDefinitions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const { toast } = useToast();

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
        const filtered = flatAllDefinitions.filter(def => !relatedIds.has(def.id) && def.description);
        
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

    const handleGetSuggestions = async () => {
        setIsSuggesting(true);
        try {
            const result = await suggestDefinitions({
                currentDefinitionName: currentDefinition.name,
                currentDefinitionDescription: currentDefinition.description,
                keywords: currentDefinition.keywords,
            });
            const suggestions = result.suggestedDefinitions
                .map(name => flatAllDefinitions.find(def => def.name === name)?.id)
                .filter((id): id is string => !!id && id !== currentDefinition.id && !(currentDefinition.relatedDefinitions || []).includes(id));
            
            setSuggestedDefinitions(suggestions.slice(0, 3)); // Limit to 3 suggestions
            if(suggestions.length === 0) {
                 toast({ title: 'No new suggestions found.' });
            }
        } catch (error) {
            console.error("Error getting suggestions:", error);
            toast({ variant: 'destructive', title: 'Could not fetch suggestions.' });
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleAddSuggestion = (id: string) => {
        const updatedRelated = [...(currentDefinition.relatedDefinitions || []), id];
        onSave({ ...currentDefinition, relatedDefinitions: updatedRelated });
        setSuggestedDefinitions(prev => prev.filter(sId => sId !== id));
    };


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Related Definitions</CardTitle>
                {isAdmin && (
                    <div className="flex gap-2">
                        {isEditing ? (
                             <Button variant="outline" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4" />Cancel</Button>
                        ) : (
                            <Button variant="outline" onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {isEditing && (
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-2 p-4 border rounded-lg">
                            <DropdownMenu open={open} onOpenChange={setOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-[300px] justify-between"
                                    >
                                        {selectedId
                                            ? flatAllDefinitions.find(def => def.id === selectedId)?.name
                                            : "Select a definition..."}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[300px] p-2">
                                    <Input 
                                        autoFocus
                                        placeholder="Search definitions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-2"
                                    />
                                    <ScrollArea className="h-[200px]">
                                        {unselectedDefinitions.length > 0 ? (
                                            unselectedDefinitions.map((def) => (
                                                <div
                                                    key={def.id}
                                                    onClick={() => {
                                                        setSelectedId(def.id);
                                                        setOpen(false);
                                                    }}
                                                    className="p-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                                                >
                                                    {def.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-sm text-muted-foreground">
                                                No definitions found.
                                            </div>
                                        )}
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={handleAdd} disabled={!selectedId}><PlusCircle className="mr-2 h-4 w-4" /> Add Relation</Button>
                        </div>

                         <div className="p-4 border rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">AI Suggestions</h4>
                                <Button size="sm" onClick={handleGetSuggestions} disabled={isSuggesting}>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    {isSuggesting ? 'Suggesting...' : 'Get Suggestions'}
                                </Button>
                            </div>
                            {suggestedDefinitions.length > 0 && (
                                <div className="space-y-2">
                                    {suggestedDefinitions.map(id => {
                                        const def = findDefinition(allDefinitions, id);
                                        if (!def) return null;
                                        return (
                                            <div key={id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                                <span>{def.name}</span>
                                                <Button size="sm" variant="ghost" onClick={() => handleAddSuggestion(id)}>Add</Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                         </div>

                    </div>
                )}
                <div className="space-y-3">
                    {relatedDefinitions.length > 0 ? (
                        relatedDefinitions.map(def => (
                            <Card key={def.id} className="hover:bg-muted/50 transition-colors group">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <button
                                        onClick={() => onDefinitionClick(def.id)}
                                        className="text-left flex-1"
                                    >
                                        <p className="font-semibold text-primary">{def.name}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: def.description.replace(/<[^>]+>/g, '') }}></p>
                                    </button>
                                    {isEditing && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive opacity-0 group-hover:opacity-100"
                                            onClick={() => handleDelete(def.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No related definitions have been linked.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
