
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Definition } from '@/lib/types';
import { PlusCircle, Trash2, Pencil, Save, X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { findDefinition } from '@/lib/data';

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

    const flatAllDefinitions = useMemo(() => flattenDefinitions(allDefinitions), [allDefinitions]);

    const relatedDefinitions = useMemo(() => {
        return (currentDefinition.relatedDefinitions || [])
            .map(id => findDefinition(allDefinitions, id))
            .filter((def): def is Definition => def !== null);
    }, [currentDefinition.relatedDefinitions, allDefinitions]);
    
    const unselectedDefinitions = useMemo(() => {
        const relatedIds = new Set(currentDefinition.relatedDefinitions || []);
        relatedIds.add(currentDefinition.id);
        return flatAllDefinitions.filter(def => !relatedIds.has(def.id) && def.description); // Only allow linking to definitions not modules
    }, [flatAllDefinitions, currentDefinition]);

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
                    <div className="flex items-center gap-2 mb-4 p-4 border rounded-lg">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-[300px] justify-between"
                                >
                                    {selectedId
                                        ? unselectedDefinitions.find(def => def.id === selectedId)?.name
                                        : "Select a definition..."}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search definitions..." />
                                    <CommandList>
                                        <CommandEmpty>No definitions found.</CommandEmpty>
                                        <CommandGroup>
                                            {unselectedDefinitions.map((def) => (
                                                <CommandItem
                                                    key={def.id}
                                                    value={def.name}
                                                    onSelect={() => {
                                                        setSelectedId(def.id);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    {def.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button onClick={handleAdd} disabled={!selectedId}><PlusCircle className="mr-2 h-4 w-4" /> Add Relation</Button>
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
