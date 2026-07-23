
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Search, 
    Plus, 
    Trash2, 
    Database, 
    Layers, 
    Settings2, 
    Workflow, 
    History,
    CheckCircle2,
    XCircle,
    Info,
    Lock,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MasterDataState, MasterDataItem, MasterDataCategory, Definition, Template } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

type MasterDataManagementProps = {
  masterData: MasterDataState;
  onSaveMasterData: (data: MasterDataState) => void;
  onLogAction: (type: string, details?: string) => void;
  definitions: Definition[];
  drafts: Definition[];
  templates: Template[];
};

const CATEGORY_LABELS: Record<MasterDataCategory, { label: string; icon: any; description: string }> = {
  modules: { label: 'Business Modules', icon: Layers, description: 'High-level functional domains like Authorizations or Claims.' },
  sourcesOfTruth: { label: 'Sources of Truth', icon: Database, description: 'Standardized data origins used for system documentation.' },
  sourceTypes: { label: 'Technical Object Types', icon: Workflow, description: 'Categories for technical entities (Views, Tables, Procs).' },
  definitionStatuses: { label: 'Documentation Statuses', icon: Settings2, description: 'Lifecycle states used to manage definition workflows.' },
  versionStatuses: { label: 'Version Indicators', icon: History, description: 'Indicators for superseding or deprecated revisions.' }
};

export default function MasterDataManagement({ masterData, onSaveMasterData, onLogAction, definitions, drafts, templates }: MasterDataManagementProps) {
    const [activeCategory, setActiveCategory] = useState<MasterDataCategory>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Record State
    const [newName, setNewName] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');

    const { toast } = useToast();

    const allDefs = useMemo(() => {
        return [...(Array.isArray(definitions) ? definitions : []), ...(Array.isArray(drafts) ? drafts : [])];
    }, [definitions, drafts]);

    const isItemReferred = (item: MasterDataItem, category: MasterDataCategory) => {
        if (category === 'modules') {
            const usedInDefs = allDefs.some(d => d.module === item.name);
            const usedInTemplates = templates.some(t => t.module === item.name);
            return usedInDefs || usedInTemplates;
        }
        if (category === 'sourcesOfTruth') {
            return allDefs.some(d => d.sectionValues?.some(v => v.sectionId === '8' && (v.raw === item.name || v.multiValues?.includes(item.name))));
        }
        return false;
    };

    const filteredItems = useMemo(() => {
        const items = masterData[activeCategory] || [];
        if (!searchQuery.trim()) return items;
        return items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [masterData, activeCategory, searchQuery]);

    const handleAddItem = () => {
        setNewName('');
        setTags([]);
        setCurrentTag('');
        setIsModalOpen(true);
    };

    const handleAddTag = (e?: React.KeyboardEvent) => {
        if (e && e.key !== 'Enter') return;
        if (e) e.preventDefault();
        
        const trimmed = currentTag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSaveItem = () => {
        if (!newName.trim()) return;

        const currentItems = [...masterData[activeCategory]];
        
        // Check for duplicate name in same category
        if (currentItems.some(i => i.name.toLowerCase() === newName.trim().toLowerCase())) {
            toast({
                variant: 'destructive',
                title: "Duplicate Record",
                description: `"${newName}" already exists in this category.`
            });
            return;
        }

        const newItem: MasterDataItem = {
            id: `md_${Date.now()}`,
            name: newName.trim(),
            description: tags.join(','), // Store tags as comma-separated string
            isActive: true
        };

        const newItems = [...currentItems, newItem];
        onSaveMasterData({ ...masterData, [activeCategory]: newItems });
        onLogAction('Master Data Created', `Category: ${activeCategory}, Item: ${newItem.name}`);
        setIsModalOpen(false);
        toast({ title: "Record Created Successfully" });
    };

    const handleDeleteItem = (id: string) => {
        const item = masterData[activeCategory].find(i => i.id === id);
        if (!item) return;

        if (isItemReferred(item, activeCategory)) {
            toast({
                variant: 'destructive',
                title: "Deletion Restricted",
                description: `"${item.name}" cannot be deleted because it is currently referenced in the library.`
            });
            return;
        }

        const newItems = masterData[activeCategory].filter(i => i.id !== id);
        onSaveMasterData({ ...masterData, [activeCategory]: newItems });
        onLogAction('Master Data Deleted', `Category: ${activeCategory}, Item: ${item.name}`);
        toast({ title: "Record Deleted" });
    };

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        const item = masterData[activeCategory].find(i => i.id === id);
        if (!item) return;

        // Restriction: Prevent inactivation if referred
        if (currentStatus === true && isItemReferred(item, activeCategory)) {
            toast({
                variant: 'destructive',
                title: "Deactivation Restricted",
                description: `"${item.name}" is currently in use and must remain active.`
            });
            return;
        }

        const newItems = masterData[activeCategory].map(i => i.id === id ? { ...i, isActive: !currentStatus } : i);
        onSaveMasterData({ ...masterData, [activeCategory]: newItems });
        onLogAction('Master Data Status Changed', `Item: ${item.name} set to ${!currentStatus ? 'Active' : 'Inactive'}`);
        toast({ title: "Status Updated" });
    };

    const activeLabelConfig = CATEGORY_LABELS[activeCategory];
    const ActiveIcon = activeLabelConfig.icon;

    return (
        <TooltipProvider>
            <div className="space-y-6 h-full flex flex-col bg-slate-50/30 p-8 rounded-[32px]">
                <div className="flex justify-between items-start px-2">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Data Management</h1>
                        <p className="text-muted-foreground font-medium">Govern global system constants, business modules, and reference categories.</p>
                    </div>
                    <Button onClick={handleAddItem} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100 h-11 transition-all active:scale-95">
                        <Plus className="mr-2 h-4 w-4" />
                        New Record
                    </Button>
                </div>

                <div className="space-y-8">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden w-full">
                        <CardHeader className="bg-slate-50/50 border-b py-4 px-6">
                            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Configuration Panel</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <Label className="text-[11px] font-bold text-slate-500">Master Data Category</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs rounded-xl shadow-xl border-none p-3 bg-slate-900 text-white">
                                                <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-primary-foreground/60">Category Guidelines</p>
                                                <p className="text-xs leading-relaxed">{activeLabelConfig.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Select value={activeCategory} onValueChange={(v) => { setActiveCategory(v as MasterDataCategory); setSearchQuery(''); }}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm focus:ring-primary/10">
                                            <div className="flex items-center gap-2">
                                                <ActiveIcon className="h-4 w-4 text-primary" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl p-1">
                                            {Object.entries(CATEGORY_LABELS).map(([key, config]) => (
                                                <SelectItem key={key} value={key} className="rounded-lg font-medium py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <config.icon className="h-3.5 w-3.5 text-slate-400" />
                                                        {config.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-500">Search Records</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Filter entries by name or tag..." 
                                            className="pl-10 rounded-xl border-slate-200 h-12 bg-white font-medium" 
                                            value={searchQuery} 
                                            onChange={e => setSearchQuery(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200 overflow-hidden shadow-sm bg-white min-h-[400px] flex flex-col w-full">
                        <CardHeader className="bg-white border-b py-5 px-8 flex flex-row items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <ActiveIcon className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-bold text-slate-900">{activeLabelConfig.label} Registry</CardTitle>
                            </div>
                            <Badge variant="outline" className="h-6 rounded-full px-3 text-[10px] font-black uppercase bg-slate-50 text-slate-400 border-slate-200">
                                {filteredItems.length} Total Records
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-4 px-8 font-black uppercase text-[10px] tracking-widest text-slate-500">Record Identity</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Tags / Labels</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
                                        <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map(item => {
                                        const referred = isItemReferred(item, activeCategory);
                                        const itemTags = item.description ? item.description.split(',').filter(t => t.trim()) : [];
                                        return (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors h-16">
                                                <TableCell className="px-8 font-bold text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        {item.name}
                                                        {referred && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Lock className="h-3 w-3 text-amber-500" />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="rounded-lg shadow-xl border-none p-2 bg-slate-900 text-white">
                                                                    <p className="text-[10px] font-bold">LOCKED: RECORD IN USE</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-lg">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {itemTags.length > 0 ? (
                                                            itemTags.map(tag => (
                                                                <Badge key={tag} variant="outline" className="bg-white border-slate-200 text-slate-600 text-[10px] font-bold">
                                                                    {tag}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-300 italic text-xs">No tags defined</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        className={cn(
                                                            "font-black text-[9px] px-2 h-6 uppercase rounded-md tracking-wider border", 
                                                            item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                                                        )}
                                                    >
                                                        {item.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-8">
                                                    <div className="flex justify-end gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className={cn("h-8 w-8 transition-all", item.isActive ? "text-slate-300 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-300 hover:text-emerald-600 hover:bg-emerald-50")}
                                                            onClick={() => handleToggleStatus(item.id, item.isActive)}
                                                        >
                                                            {item.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive hover:bg-red-50 transition-all">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="rounded-[32px] border-none p-10 shadow-2xl">
                                                                <AlertDialogHeader className="space-y-4">
                                                                    <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                                                                        <Trash2 className="h-8 w-8 text-red-600" />
                                                                    </div>
                                                                    <AlertDialogTitle className="text-2xl font-bold text-slate-900">Confirm Deletion</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
                                                                        Are you sure you want to permanently remove <strong>{item.name}</strong> from the system metadata? This action cannot be reversed.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter className="mt-10 gap-3">
                                                                    <AlertDialogCancel className="rounded-xl font-bold h-11 px-8 border-slate-200">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="rounded-xl bg-red-600 hover:bg-red-700 font-bold h-11 px-8">Delete Record</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <Database className="h-6 w-6 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 font-bold text-sm italic">No records match your search criteria.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-md rounded-[32px] border-none p-0 overflow-hidden shadow-2xl">
                        <div className="p-8 border-b bg-white">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
                                    <Plus className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold tracking-tight">Create Record</DialogTitle>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">{activeLabelConfig.label} Category</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 space-y-8 bg-slate-50/50">
                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">Master Data Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        value={newName} 
                                        onChange={e => setNewName(e.target.value)} 
                                        placeholder="e.g. Documentation Status"
                                        className="rounded-2xl border-slate-200 h-12 font-bold bg-white text-base shadow-sm focus-visible:ring-primary/20" 
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">Chip Tags (Values)</Label>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2 p-3 min-h-[50px] bg-white border border-slate-200 rounded-2xl shadow-sm">
                                            {tags.map(tag => (
                                                <Badge key={tag} className="bg-indigo-50 text-indigo-700 border-indigo-100 rounded-lg h-8 px-2.5 gap-2 font-bold">
                                                    {tag}
                                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </Badge>
                                            ))}
                                            {tags.length === 0 && (
                                                <span className="text-slate-400 text-xs py-2 px-1 italic">Type and press Enter to add tags...</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input 
                                                value={currentTag} 
                                                onChange={e => setCurrentTag(e.target.value)}
                                                onKeyDown={handleAddTag}
                                                placeholder="Add tag (e.g. Published)..."
                                                className="rounded-2xl border-slate-200 h-12 bg-white text-sm shadow-sm focus-visible:ring-primary/20" 
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute right-2 top-2 h-8 rounded-lg text-primary font-black uppercase text-[10px]"
                                                onClick={() => handleAddTag()}
                                                disabled={!currentTag.trim()}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium px-1 italic">Example: published, archived, deleted</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 bg-white border-t gap-3 flex items-center justify-end">
                            <DialogClose asChild>
                                <Button variant="ghost" className="rounded-xl font-bold text-slate-500 px-6 hover:bg-slate-50">Cancel</Button>
                            </DialogClose>
                            <Button 
                                onClick={handleSaveItem} 
                                disabled={!newName.trim() || tags.length === 0}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11 px-10 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                            >
                                Finalize Record
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
