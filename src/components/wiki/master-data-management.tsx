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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '../ui/textarea';
import { 
    Search, 
    Plus, 
    Edit, 
    Trash2, 
    Database, 
    Layers, 
    Settings2, 
    Workflow, 
    History,
    CheckCircle2,
    XCircle,
    Info,
    FilterX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MasterDataState, MasterDataItem, MasterDataCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type MasterDataManagementProps = {
  masterData: MasterDataState;
  onSaveMasterData: (data: MasterDataState) => void;
  onLogAction: (type: string, details?: string) => void;
};

const CATEGORY_LABELS: Record<MasterDataCategory, { label: string; icon: any; description: string }> = {
  modules: { label: 'Modules', icon: Layers, description: 'High-level business domains (Authorizations, Claims, etc.)' },
  sourcesOfTruth: { label: 'Source of Truth', icon: Database, description: 'Standardized data origins for definitions.' },
  sourceTypes: { label: 'Source Type', icon: Workflow, description: 'Technical object categories (Views, Tables, Procs).' },
  definitionStatuses: { label: 'Def. Statuses', icon: Settings2, description: 'Managed lifecycle states for documentation.' },
  versionStatuses: { label: 'Version Statuses', icon: History, description: 'Archive and superseding indicators.' }
};

export default function MasterDataManagement({ masterData, onSaveMasterData, onLogAction }: MasterDataManagementProps) {
    const [activeCategory, setActiveCategory] = useState<MasterDataCategory>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingUser] = useState<Partial<MasterDataItem> | null>(null);
    const { toast } = useToast();

    const filteredItems = useMemo(() => {
        const items = masterData[activeCategory] || [];
        if (!searchQuery.trim()) return items;
        return items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [masterData, activeCategory, searchQuery]);

    const handleAddItem = () => {
        setEditingUser({ id: `md_${Date.now()}`, name: '', description: '', isActive: true });
        setIsModalOpen(true);
    };

    const handleEditItem = (item: MasterDataItem) => {
        setEditingUser({ ...item });
        setIsModalOpen(true);
    };

    const handleSaveItem = () => {
        if (!editingItem?.name?.trim()) return;

        const currentItems = [...masterData[activeCategory]];
        const exists = currentItems.findIndex(i => i.id === editingItem.id);
        
        let newItems: MasterDataItem[];
        let action: 'Created' | 'Updated' = 'Created';

        if (exists > -1) {
            newItems = currentItems.map(i => i.id === editingItem.id ? (editingItem as MasterDataItem) : i);
            action = 'Updated';
        } else {
            newItems = [...currentItems, editingItem as MasterDataItem];
        }

        const updatedMasterData = { ...masterData, [activeCategory]: newItems };
        onSaveMasterData(updatedMasterData);
        onLogAction(`Master Data ${action}`, `Category: ${activeCategory}, Item: ${editingItem.name}`);
        setIsModalOpen(false);
        toast({ title: `Record ${action}` });
    };

    const handleDeleteItem = (id: string) => {
        const item = masterData[activeCategory].find(i => i.id === id);
        if (!item) return;

        const newItems = masterData[activeCategory].filter(i => i.id !== id);
        onSaveMasterData({ ...masterData, [activeCategory]: newItems });
        onLogAction('Master Data Deleted', `Category: ${activeCategory}, Item: ${item.name}`);
        toast({ title: "Record Deleted" });
    };

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        const item = masterData[activeCategory].find(i => i.id === id);
        if (!item) return;

        const newItems = masterData[activeCategory].map(i => i.id === id ? { ...i, isActive: !currentStatus } : i);
        onSaveMasterData({ ...masterData, [activeCategory]: newItems });
        onLogAction('Master Data Status Changed', `Item: ${item.name} set to ${!currentStatus ? 'Active' : 'Inactive'}`);
        toast({ title: "Status Updated" });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Data Management</h1>
                    <p className="text-muted-foreground font-medium">Govern application constants and reference categories globally.</p>
                </div>
                <Button onClick={handleAddItem} className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6 shadow-lg shadow-indigo-100">
                    <Plus className="mr-2 h-4 w-4" />
                    New Record
                </Button>
            </div>

            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as MasterDataCategory)} className="flex-1 flex flex-col">
                <TabsList className="bg-slate-100 p-1 w-fit rounded-xl mb-6">
                    {Object.entries(CATEGORY_LABELS).map(([key, config]) => (
                        <TabsTrigger key={key} value={key} className="rounded-lg px-4 py-2 font-bold gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-slate-900">{CATEGORY_LABELS[activeCategory].label}</h2>
                        <p className="text-xs text-slate-500">{CATEGORY_LABELS[activeCategory].description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search records..." 
                                className="pl-9 rounded-xl border-slate-200" 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                            />
                        </div>
                        {searchQuery && (
                            <Button variant="ghost" size="sm" className="h-9 px-3 text-slate-400 font-bold" onClick={() => setSearchQuery('')}>
                                <FilterX className="h-4 w-4 mr-1.5" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm flex-1 bg-white">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="py-4 px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Record Name</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Description</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">System Status</TableHead>
                                <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map(item => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-100">
                                    <TableCell className="px-6 font-bold text-slate-900">{item.name}</TableCell>
                                    <TableCell className="text-slate-500 text-xs italic max-w-md truncate">
                                        {item.description || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={item.isActive ? 'success' : 'secondary'} 
                                            className={cn("font-bold text-[10px] px-2 h-6 uppercase", item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}
                                        >
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => handleEditItem(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className={cn("h-8 w-8 transition-colors", item.isActive ? "text-slate-400 hover:text-amber-600" : "text-emerald-400 hover:text-emerald-600")}
                                                onClick={() => handleToggleStatus(item.id, item.isActive)}
                                            >
                                                {item.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-[24px] border-none p-8">
                                                    <AlertDialogHeader>
                                                        <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                                                            <Trash2 className="h-6 w-6 text-red-600" />
                                                        </div>
                                                        <AlertDialogTitle className="text-2xl font-bold">Delete Master Record?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-slate-500 text-sm">
                                                            Are you sure you want to remove <strong>{item.name}</strong> from the <strong>{CATEGORY_LABELS[activeCategory].label}</strong> catalog? This may impact dropdown visibility.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="mt-8 gap-3">
                                                        <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="rounded-xl bg-red-600 font-bold px-6">Delete Record</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-3 py-12">
                                            <Info className="h-10 w-10 text-slate-200" />
                                            <p className="text-slate-400 font-medium italic">No master records found matching your search.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </Tabs>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Plus className="h-5 w-5 text-indigo-600" />
                            </div>
                            <DialogTitle className="text-xl font-bold">
                                {masterData[activeCategory].some(i => i.id === editingItem?.id) ? 'Edit Record' : 'New Master Record'}
                            </DialogTitle>
                        </div>
                    </div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-500">Record Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={editingItem?.name || ''} 
                                    onChange={e => setEditingUser(p => p ? ({ ...p, name: e.target.value }) : null)} 
                                    placeholder="e.g. Clinical Workflow"
                                    className="rounded-xl border-slate-200 h-11 font-bold bg-white" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-500">Description / Guidelines</Label>
                                <Textarea 
                                    value={editingItem?.description || ''} 
                                    onChange={e => setEditingUser(p => p ? ({ ...p, description: e.target.value }) : null)} 
                                    placeholder="Provide context for users..."
                                    className="rounded-xl border-slate-200 min-h-[100px] bg-white" 
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-bold text-slate-700">Global Activation</span>
                                    <p className="text-[10px] text-slate-400 font-medium">Control visibility across application dropdowns.</p>
                                </div>
                                <Switch 
                                    checked={editingItem?.isActive} 
                                    onCheckedChange={v => setEditingUser(p => p ? ({ ...p, isActive: v }) : null)} 
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl font-bold">Cancel</Button>
                        </DialogClose>
                        <Button 
                            onClick={handleSaveItem} 
                            disabled={!editingItem?.name?.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-md"
                        >
                            Finalize Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}