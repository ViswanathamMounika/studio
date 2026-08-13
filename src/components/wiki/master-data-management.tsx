"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
    X,
    LayoutGrid,
    Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MasterDataState, MasterDataItem, MasterDataCategory, Definition, Template, ActivityType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

type MasterDataManagementProps = {
    masterData: MasterDataState;
    onSaveMasterData: (data: MasterDataState) => void;
    onLogAction: (type: ActivityType, details?: string) => void;
    definitions: Definition[];
    drafts: Definition[];
    templates: Template[];
};

const CATEGORY_LABELS: Record<MasterDataCategory, { label: string; icon: any; description: string }> = {
  modules: { label: 'Business Modules', icon: Layers, description: 'High-level functional domains like Authorizations or Claims.' },
  sourcesOfTruth: { label: 'Sources of Truth', icon: Database, description: 'Standardized data origins used for system documentation.' },
  sourceTypes: { label: 'Source type', icon: Workflow, description: 'Categories for technical entities (Views, Tables, Procs).' },
  definitionStatuses: { label: 'Definition Status', icon: Settings2, description: 'Lifecycle states used to manage definition workflows.' },
  versionStatuses: { label: 'Version Status', icon: History, description: 'Indicators for superseding or deprecated revisions.' }
};

// Define categories that are restricted from adding new records and toggling status
const IMMUTABLE_CATEGORIES: MasterDataCategory[] = ['definitionStatuses', 'versionStatuses'];

export default function MasterDataManagement({ masterData, onSaveMasterData, onLogAction, definitions, drafts, templates }: MasterDataManagementProps) {
    const [activeCategory, setActiveCategory] = useState<MasterDataCategory>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal State
    const [modalCategory, setModalCategory] = useState<MasterDataCategory>('modules');
    const [localItems, setLocalItems] = useState<MasterDataItem[]>([]);
    const [newItemName, setNewItemName] = useState('');

    const { toast } = useToast();

    const allDefs = useMemo(() => {
        const flatten = (items: Definition[]): Definition[] => {
            return (Array.isArray(items) ? items : []).flatMap(d => [d, ...(d.children ? flatten(d.children) : [])]);
        };
        return [...flatten(definitions), ...(Array.isArray(drafts) ? drafts : [])];
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
        if (category === 'sourceTypes') {
            return allDefs.some(d => d.sourceType === item.name);
        }
        return false;
    };

    const filteredItems = useMemo(() => {
        const items = masterData[activeCategory] || [];
        if (!searchQuery.trim()) return items;
        return items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [masterData, activeCategory, searchQuery]);

    // Sync modal data when opened or category changed
    useEffect(() => {
        if (isModalOpen) {
            setLocalItems([...(masterData[modalCategory] || [])]);
        }
    }, [modalCategory, isModalOpen, masterData]);

    const handleAddItem = () => {
        setModalCategory(activeCategory);
        setNewItemName('');
        setIsModalOpen(true);
    };

    const handleAddRecordChip = (e?: React.KeyboardEvent) => {
        if (e && e.key !== 'Enter') return;
        if (e) e.preventDefault();
        
        const name = newItemName.trim();
        if (!name) return;

        if (localItems.some(i => i.name.toLowerCase() === name.toLowerCase())) {
            toast({ variant: 'destructive', title: "Duplicate Record", description: `"${name}" already exists.` });
            return;
        }

        const newItem: MasterDataItem = {
            id: `md_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name,
            isActive: true
        };

        setLocalItems([...localItems, newItem]);
        setNewItemName('');
    };

    const removeLocalRecord = (id: string) => {
        const item = localItems.find(i => i.id === id);
        if (!item) return;

        if (isItemReferred(item, modalCategory)) {
            toast({
                variant: 'destructive',
                title: "Deletion Restricted",
                description: `"${item.name}" is currently in use and cannot be removed.`
            });
            return;
        }

        setLocalItems(localItems.filter(i => i.id !== id));
    };

    const handleSaveModal = () => {
        onSaveMasterData({ ...masterData, [modalCategory]: localItems });
        onLogAction('Master Data Updated', `Category: ${modalCategory} was updated via bulk management.`);
        setIsModalOpen(false);
        toast({ title: "Master Data Synchronized" });
    };

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        if (IMMUTABLE_CATEGORIES.includes(activeCategory)) return;

        const item = masterData[activeCategory].find(i => i.id === id);
        if (!item) return;

        // PER REQUIREMENT: Allow soft delete (deactivation) for modules, sources, and types even if referred.
        // This acts as the alternative to hard deletion which is strictly restricted.
        const allowedSoftDelete = ['modules', 'sourcesOfTruth', 'sourceTypes'].includes(activeCategory);

        if (currentStatus === true && !allowedSoftDelete && isItemReferred(item, activeCategory)) {
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

    const handleDeleteRecord = (id: string) => {
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

    const activeLabelConfig = CATEGORY_LABELS[activeCategory];
    const ActiveIcon = activeLabelConfig.icon;
    const isCategoryRestricted = IMMUTABLE_CATEGORIES.includes(activeCategory);

    return (
        <TooltipProvider>
            <div className="space-y-6 h-full flex flex-col bg-slate-50/30 p-8 rounded-[32px]">
                <div className="flex justify-between items-start px-2">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Data Management</h1>
                        <p className="text-muted-foreground font-medium">Govern global system constants, business modules, and reference categories.</p>
                    </div>
                    {!isCategoryRestricted && (
                        <Button onClick={handleAddItem} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-100 h-11 transition-all active:scale-95">
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Manage Category
                        </Button>
                    )}
                    {isCategoryRestricted && (
                        <div className="bg-amber-50 border border-amber-100 px-6 py-2.5 rounded-xl flex items-center gap-3">
                            <Lock className="h-4 w-4 text-amber-600" />
                            <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider">Registry Entries Locked</span>
                        </div>
                    )}
                </div>

                <div className="space-y-8 flex-1 flex flex-col min-h-0">
                    <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden shrink-0">
                        <CardHeader className="bg-slate-50/50 border-b py-4 px-6">
                            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Registry Explorer</CardTitle>
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
                                                <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-primary-foreground/60">Category Scope</p>
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
                                    <Label className="text-[11px] font-bold text-slate-500">Search Workspace</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Search records in this category..." 
                                            className="pl-10 rounded-xl border-slate-200 h-12 bg-white font-medium shadow-sm" 
                                            value={searchQuery} 
                                            onChange={e => setSearchQuery(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200 overflow-hidden shadow-sm bg-white flex-1 flex flex-col min-h-[400px]">
                        <CardHeader className="bg-white border-b py-5 px-8 flex flex-row items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <ActiveIcon className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-bold text-slate-900">{activeLabelConfig.label} Audit</CardTitle>
                            </div>
                            <Badge variant="outline" className="h-6 rounded-full px-3 text-[10px] font-black uppercase bg-slate-50 text-slate-400 border-slate-200">
                                {filteredItems.length} Total Records
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b">
                                    <TableRow>
                                        <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-slate-500 h-14">Record Name</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Status</TableHead>
                                        {!isCategoryRestricted && <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map(item => {
                                        const referred = isItemReferred(item, activeCategory);
                                        return (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-100 h-20">
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
                                                {!isCategoryRestricted && (
                                                    <TableCell className="text-right px-8">
                                                        <div className="flex justify-end gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className={cn("h-8 w-8 rounded-lg", item.isActive ? "text-slate-300 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-300 hover:text-emerald-600 hover:bg-emerald-50")}
                                                                onClick={() => handleToggleStatus(item.id, item.isActive)}
                                                            >
                                                                {item.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive hover:bg-red-50 rounded-lg">
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
                                                                            Are you sure you want to permanently remove <strong>{item.name}</strong>? This will remove the reference from the global system registry.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="mt-10 gap-3">
                                                                        <AlertDialogCancel className="rounded-xl font-bold h-11 px-8">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteRecord(item.id)} className="rounded-xl bg-red-600 hover:bg-red-700 font-bold h-11 px-8">Delete Record</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <Database className="h-6 w-6 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 font-bold text-sm italic">No records match your filters.</p>
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
                    <DialogContent className="max-w-2xl rounded-[32px] border-none p-0 overflow-hidden shadow-2xl">
                        <div className="p-8 border-b bg-white">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <LayoutGrid className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold tracking-tight">Bulk Registry Manager</DialogTitle>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Manage Category Records & Identity</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8 bg-slate-50/50">
                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">Target Master Data Table</Label>
                                    <Select value={modalCategory} onValueChange={(v) => setModalCategory(v as MasterDataCategory)}>
                                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                {CATEGORY_LABELS[modalCategory].icon && React.createElement(CATEGORY_LABELS[modalCategory].icon, { className: "h-4 w-4 text-primary" })}
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl">
                                            {Object.entries(CATEGORY_LABELS).map(([key, config]) => (
                                                <SelectItem key={key} value={key} className="rounded-lg font-medium py-2.5">
                                                    {config.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">Registry Records (Chip View)</Label>
                                    <div className="p-5 min-h-[160px] bg-white border border-slate-200 rounded-[24px] shadow-inner flex flex-wrap gap-2.5 content-start">
                                        {localItems.map(item => {
                                            const referred = isItemReferred(item, modalCategory);
                                            const isModalCategoryRestricted = IMMUTABLE_CATEGORIES.includes(modalCategory);
                                            return (
                                                <Badge 
                                                    key={item.id} 
                                                    className={cn(
                                                        "h-9 px-3.5 rounded-xl gap-2 font-bold text-sm transition-all group",
                                                        (referred) ? "bg-amber-50 text-amber-700 border-amber-100" : 
                                                        isModalCategoryRestricted ? "bg-slate-100 text-slate-400 border-slate-200" :
                                                        "bg-indigo-50 text-indigo-700 border-indigo-100"
                                                    )}
                                                >
                                                    {item.name}
                                                    {(!referred && !isModalCategoryRestricted) && (
                                                        <button 
                                                            onClick={() => removeLocalRecord(item.id)}
                                                            className="hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    {(referred) && <Lock className="h-3 w-3 opacity-40" />}
                                                </Badge>
                                            );
                                        })}
                                        {localItems.length === 0 && (
                                            <div className="flex flex-col items-center justify-center w-full h-full text-center py-10 opacity-30">
                                                <Plus className="h-8 w-8 mb-2" />
                                                <p className="text-xs font-bold uppercase">No records found. Start adding below.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!IMMUTABLE_CATEGORIES.includes(modalCategory) && (
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-widest px-1">Add New Identity</Label>
                                        <div className="relative">
                                            <Input 
                                                value={newItemName}
                                                onChange={e => setNewItemName(e.target.value)}
                                                onKeyDown={handleAddRecordChip}
                                                placeholder="Enter identity name and press Enter..."
                                                className="h-12 rounded-2xl border-slate-200 bg-white font-bold pl-4 pr-32 shadow-sm text-base focus-visible:ring-primary/20"
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute right-2 top-2 h-8 rounded-xl font-black uppercase text-[10px] text-primary hover:bg-primary/5 px-4"
                                                onClick={() => handleAddRecordChip()}
                                                disabled={!newItemName.trim()}
                                            >
                                                Append Chip
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic px-1">Newly appended chips will be finalized once you click the sync button.</p>
                                    </div>
                                )}
                                
                                {IMMUTABLE_CATEGORIES.includes(modalCategory) && (
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            The <span className="font-bold">{CATEGORY_LABELS[modalCategory].label}</span> category is used for core platform logic. Creation of new statuses is restricted to maintain lifecycle integrity.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-white border-t gap-3 flex items-center justify-end">
                            <DialogClose asChild>
                                <Button variant="ghost" className="rounded-xl font-bold text-slate-500 px-6 hover:bg-slate-50">Cancel</Button>
                            </DialogClose>
                            <Button 
                                onClick={handleSaveModal} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11 px-10 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Finalize Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
