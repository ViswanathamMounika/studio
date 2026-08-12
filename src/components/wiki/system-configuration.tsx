"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    Accordion, 
    AccordionContent, 
    AccordionItem, 
    AccordionTrigger 
} from "@/components/ui/accordion";
import { 
    Folder, 
    Lock, 
    Check, 
    Search, 
    Save, 
    Plus, 
    Terminal,
    Settings2,
    ShieldCheck,
    Pencil,
    Trash2,
    SlidersHorizontal,
    Table as TableIcon,
    Shield,
    ChevronDown,
    SearchX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemConfigurationState, ConfigKey } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

type SystemConfigurationProps = {
  config: SystemConfigurationState;
  onSaveConfig: (config: SystemConfigurationState) => void;
  onLogAction: (type: string, details?: string) => void;
};

const CONFIG_TYPES = [
    { label: 'Integer', value: 'int' },
    { label: 'String / Text', value: 'string' },
    { label: 'Boolean', value: 'bool' },
    { label: 'Minutes', value: 'minutes' },
    { label: 'Record Count', value: 'record count' },
    { label: 'File Path', value: 'path' },
    { label: 'Decimal', value: 'decimal' },
];

const KEY_DISPLAY_NAMES: Record<string, string> = {
    'SESSION_TIMEOUT': 'Session Timeout',
    'REVISION_RECORD_COUNT': 'Revision History Limit',
    'DATA_PREVIEW_COUNT': 'Data Preview Row Limit',
    'DEF_RECENT_COUNT': 'Recent Definitions Count',
    'INITIAL_DEF_COUNT': 'Initial Definition Load Count',
    'ACTIVITY_LOGS_GRID_RECORDS_COUNT': 'Activity Log Records Per Page',
    'DASHBOARD_CHART_DAY_THRESHOLD': 'Dashboard Chart Daily Limit (Days)',
    'DASHBOARD_CHART_WEEK_THRESHOLD': 'Dashboard Chart Weekly Limit (Days)',
    'DASHBOARD_NEEDS_ATTENTION_DAYS': 'Needs Attention Threshold (Days)'
};

export default function SystemConfiguration({ config, onSaveConfig, onLogAction }: SystemConfigurationProps) {
    const [localConfig, setLocalConfig] = useState<SystemConfigurationState>(config);
    const [configSearch, setConfigSearch] = useState('');
    const [prefSearch, setPrefSearch] = useState('');
    
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [editingKeyEntry, setEditingKeyEntry] = useState<ConfigKey | null>(null);

    const { toast } = useToast();

    const handleSave = () => {
        onSaveConfig(localConfig);
        onLogAction('System Configuration Updated', 'Platform registry parameters modified.');
        toast({ title: "Configuration Synchronized", description: "Changes have been applied globally." });
    };

    const handleDiscard = () => {
        setLocalConfig(config);
        toast({ title: "Changes Discarded" });
    };

    const updateSettings = (updates: Partial<typeof localConfig.settings>) => {
        setLocalConfig(prev => ({
            ...prev,
            settings: { ...prev.settings, ...updates }
        }));
    };

    const handleUpdateParamValue = (id: string, value: string) => {
        setLocalConfig(prev => ({
            ...prev,
            configKeys: prev.configKeys.map(k => k.id === id ? { ...k, value } : k)
        }));
    };

    const handleToggleParamActive = (id: string, active: boolean) => {
        setLocalConfig(prev => ({
            ...prev,
            configKeys: prev.configKeys.map(k => k.id === id ? { ...k, active } : k)
        }));
    };

    const handleDeleteParam = (id: string) => {
        setLocalConfig(prev => ({
            ...prev,
            configKeys: prev.configKeys.filter(k => k.id !== id)
        }));
        toast({ title: "Registry Key Removed" });
    };

    const getSettingName = (item: ConfigKey) => {
        return KEY_DISPLAY_NAMES[item.key] || item.description || item.key;
    };

    const filteredConfigKeys = useMemo(() => {
        const keys = localConfig.configKeys || [];
        const sorted = [...keys].sort((a, b) => {
            const order = Object.keys(KEY_DISPLAY_NAMES);
            const aIdx = order.indexOf(a.key);
            const bIdx = order.indexOf(b.key);
            if (aIdx === -1 && bIdx === -1) return a.key.localeCompare(b.key);
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
        });

        if (!configSearch.trim()) return sorted;
        const lower = configSearch.toLowerCase();
        return sorted.filter(k => 
            k.key.toLowerCase().includes(lower) || 
            getSettingName(k).toLowerCase().includes(lower)
        );
    }, [localConfig.configKeys, configSearch]);

    const preferenceSections = [
        {
            id: 'file-storage',
            title: 'File Storage',
            key: 'FileStorage',
            icon: Folder,
            fields: 1,
            content: (
                <div className="grid grid-cols-1 gap-8 max-w-5xl">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Network Path</Label>
                        <Input 
                            value={localConfig.settings.fileStoragePath} 
                            onChange={e => updateSettings({ fileStoragePath: e.target.value })}
                            className="rounded-xl h-11 bg-white border-slate-200 font-medium"
                        />
                    </div>
                </div>
            )
        },
        {
            id: 'search-sync',
            title: 'Search Sync — Wiki',
            key: 'SearchSync.Wiki',
            icon: Search,
            fields: 4,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Index Name</Label>
                        <Input value={localConfig.settings.searchIndexName} onChange={e => updateSettings({ searchIndexName: e.target.value })} className="rounded-xl h-11 bg-white border-slate-200 font-bold" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 self-end h-11">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">Enabled</span>
                            <span className="text-[9px] font-mono text-slate-400">Search Sync Active</span>
                        </div>
                        <Switch checked={localConfig.settings.searchSyncEnabled} onCheckedChange={v => updateSettings({ searchSyncEnabled: v })} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Sync Interval</Label>
                        <div className="relative">
                            <Input type="number" value={localConfig.settings.searchSyncInterval} onChange={e => updateSettings({ searchSyncInterval: parseInt(e.target.value) || 0 })} className="rounded-xl h-11 bg-white border-slate-200 font-bold pr-16" />
                            <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-400 uppercase">minutes</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Search Result Size</Label>
                        <Input type="number" value={localConfig.settings.searchResultSize} onChange={e => updateSettings({ searchResultSize: parseInt(e.target.value) || 0 })} className="rounded-xl h-11 bg-white border-slate-200 font-bold" />
                    </div>
                </div>
            )
        },
        {
            id: 'global-security',
            title: 'Global Security',
            key: 'Global*',
            icon: Shield,
            fields: 2,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Global Security API URL</Label>
                        <div className="h-11 flex items-center px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-500">
                            {localConfig.settings.globalSecurityApiUrl}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Global Security App ID</Label>
                        <div className="h-11 flex items-center px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-500">
                            {localConfig.settings.globalSecurityAppId}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const filteredPreferences = useMemo(() => {
        if (!prefSearch.trim()) return preferenceSections;
        const lower = prefSearch.toLowerCase();
        return preferenceSections.filter(s => 
            s.title.toLowerCase().includes(lower) || 
            s.key.toLowerCase().includes(lower)
        );
    }, [prefSearch]);

    const handleEditParam = (item: ConfigKey) => {
        setEditingKeyEntry({ ...item });
        setIsKeyModalOpen(true);
    };

    const handleSaveKeyEntry = () => {
        if (!editingKeyEntry || !editingKeyEntry.key.trim()) {
            toast({ variant: 'destructive', title: "Validation Error", description: "Configuration Key is required." });
            return;
        }

        const isNew = !localConfig.configKeys.some(k => k.id === editingKeyEntry.id);
        
        setLocalConfig(prev => ({
            ...prev,
            configKeys: isNew 
                ? [...prev.configKeys, editingKeyEntry]
                : prev.configKeys.map(k => k.id === editingKeyEntry.id ? editingKeyEntry : k)
        }));

        setIsKeyModalOpen(false);
        toast({ 
            title: isNew ? "Registry Key Created" : "Configuration Updated",
            description: `Changes for "${editingKeyEntry.key}" have been staged.`
        });
    };

    const sectionCount = preferenceSections.length;
    const keysCount = localConfig.configKeys.length;

    return (
        <div className="h-full flex flex-col bg-[#F8F9FC]">
            <div className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm shrink-0 z-30">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-1.5">
                        <Settings2 className="h-3 w-3" />
                        Configuration
                    </p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">System Settings</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleDiscard} className="rounded-xl border-slate-200 h-10 px-6 font-bold bg-white hover:bg-slate-50">
                        Discard
                    </Button>
                    <Button onClick={handleSave} className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white rounded-xl h-10 px-8 gap-2 font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
                        <Save className="h-4 w-4" />
                        Save All Changes
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-32">
                    <Card className="rounded-[24px] border-slate-200 bg-white p-8 shadow-sm overflow-hidden border-l-4 border-l-indigo-600">
                        <div className="flex flex-wrap items-center gap-10">
                            <div className="h-16 w-16 rounded-[20px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                <Terminal className="h-8 w-8" />
                            </div>
                            <div className="flex-1 min-w-[300px] space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Application Name</Label>
                                <Input 
                                    value={localConfig.settings.appName} 
                                    onChange={e => updateSettings({ appName: e.target.value })}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-200 font-bold text-xl px-4 focus-visible:bg-white transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Environment</Label>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 h-10 px-6 rounded-xl font-bold text-sm">
                                    {localConfig.settings.environment}
                                </Badge>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Version</Label>
                                <span className="text-xl font-black text-slate-300 tracking-tight block pt-1">{localConfig.settings.version}</span>
                            </div>
                        </div>
                    </Card>

                    <Tabs defaultValue="preferences" className="space-y-6">
                        <TabsList className="bg-white p-1.5 h-12 rounded-2xl border border-slate-200 inline-flex shadow-sm gap-2">
                            <TabsTrigger 
                                value="preferences" 
                                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-xs gap-3 transition-all data-[state=active]:text-[#3F51B5] group"
                            >
                                <SlidersHorizontal className="h-4 w-4 group-data-[state=active]:text-[#3F51B5] text-slate-400" />
                                Web App Configuration
                                <Badge variant="secondary" className="ml-1 h-5 px-2 bg-indigo-50 text-[#3F51B5] border-transparent font-bold text-[10px] rounded-lg">
                                    {sectionCount} sections
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="parameters" 
                                className="rounded-xl px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-xs gap-3 transition-all data-[state=active]:text-[#3F51B5] group"
                            >
                                <TableIcon className="h-4 w-4 group-data-[state=active]:text-[#3F51B5] text-slate-400" />
                                System Parameters
                                <Badge variant="secondary" className="ml-1 h-5 px-2 bg-slate-100 text-slate-500 border-transparent font-bold text-[10px] rounded-lg group-data-[state=active]:bg-indigo-50 group-data-[state=active]:text-[#3F51B5]">
                                    {keysCount} keys
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="preferences" className="space-y-6 mt-0">
                            <div className="flex items-center justify-between">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Find a configuration section..." 
                                        value={prefSearch}
                                        onChange={e => setPrefSearch(e.target.value)}
                                        className="pl-9 h-10 rounded-xl bg-white border-slate-200 shadow-sm"
                                    />
                                </div>
                            </div>

                            <Card className="rounded-[24px] border-slate-200 overflow-hidden shadow-sm bg-white">
                                {filteredPreferences.length > 0 ? (
                                    <Accordion type="multiple" defaultValue={filteredPreferences.map(s => s.id)} className="w-full">
                                        {filteredPreferences.map((section) => (
                                            <AccordionItem key={section.id} value={section.id} className="border-b last:border-b-0 border-slate-100">
                                                <AccordionTrigger className="hover:no-underline py-5 px-8 group">
                                                    <div className="flex items-center gap-5 flex-1">
                                                        <div className="h-10 w-10 rounded-xl bg-[#F3F1FF] flex items-center justify-center border border-indigo-100 group-hover:bg-[#EAE6FF] transition-colors">
                                                            <section.icon className="h-5 w-5 text-[#3F51B5]" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h3 className="font-bold text-[15px] text-slate-900 leading-tight">{section.title}</h3>
                                                            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-tighter">{section.key}</span>
                                                        </div>
                                                        <div className="ml-auto flex items-center gap-6">
                                                            <span className="text-[11px] font-bold text-slate-400 mr-4">{section.fields} fields</span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="bg-[#FBFBFF] px-8 py-8 border-t border-slate-50">
                                                    {section.content}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                            <SearchX className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-bold text-slate-900">No matching configuration</p>
                                            <p className="text-sm text-slate-500">We couldn't find any configuration sections matching your search.</p>
                                        </div>
                                        <Button variant="ghost" className="text-indigo-600 font-bold" onClick={() => setPrefSearch('')}>Clear Search</Button>
                                    </div>
                                )}
                            </Card>
                        </TabsContent>

                        <TabsContent value="parameters" className="space-y-6 mt-0">
                            <div className="flex items-center justify-between">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Filter parameters..." 
                                        value={configSearch}
                                        onChange={e => setConfigSearch(e.target.value)}
                                        className="pl-9 h-10 rounded-xl bg-white border-slate-200 shadow-sm"
                                    />
                                </div>
                            </div>

                            <Card className="rounded-[28px] border-slate-200 shadow-sm overflow-hidden bg-white">
                                <div className="overflow-x-auto">
                                    <Table className="min-w-[1400px]">
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow className="h-12 border-none">
                                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest text-slate-400">SETTING NAME</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">VALUE</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">TYPE</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">EFFECTIVE FROM</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">ACTIVE</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">DESCRIPTION</TableHead>
                                                <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest text-slate-400">ACTIONS</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredConfigKeys.map(item => (
                                                <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-100 h-20">
                                                    <TableCell className="px-8 py-5">
                                                        <span className="font-bold text-slate-900 text-[15px]">
                                                            {getSettingName(item)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            value={item.value} 
                                                            onChange={e => handleUpdateParamValue(item.id, e.target.value)}
                                                            className="h-10 w-32 rounded-xl bg-white border-slate-200 font-bold text-center focus-visible:ring-indigo-100 focus-visible:border-indigo-300"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="bg-[#F1F3F9] text-slate-500 font-bold text-[11px] px-3.5 h-8 rounded-lg uppercase tracking-tight whitespace-nowrap">
                                                            {item.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col text-[12px] font-medium text-slate-500">
                                                            <span className="font-bold text-slate-700">{format(parseISO(item.effectiveFrom), 'dd MMM yyyy')}</span>
                                                            <span className="text-[10px] uppercase text-slate-400">{format(parseISO(item.effectiveFrom), 'hh:mm a')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Switch 
                                                            checked={item.active} 
                                                            onCheckedChange={v => handleToggleParamActive(item.id, v)} 
                                                            className="data-[state=checked]:bg-emerald-500"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                            {item.description || 'No description provided.'}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-right px-8">
                                                        <div className="flex justify-end gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => handleEditParam(item)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleDeleteParam(item.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-6 px-8 border-t bg-slate-50/50 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        Platform Registry Governance • {filteredConfigKeys.length} ACTIVE KEYS
                                    </span>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>

            <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
                <DialogContent className="max-w-[500px] rounded-[24px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b bg-white flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
                            {editingKeyEntry && localConfig.configKeys.some(k => k.id === editingKeyEntry.id) ? <Pencil className="h-5 w-5 text-indigo-600" /> : <Plus className="h-5 w-5 text-indigo-600" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Registry Parameter</DialogTitle>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">Define Application Constant</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-500">Parameter Key (System)</Label>
                                    <input 
                                        value={editingKeyEntry?.key || ''} 
                                        onChange={e => setEditingKeyEntry(p => p ? ({ ...p, key: e.target.value }) : null)} 
                                        placeholder="e.g. TIMEOUT_LIMIT"
                                        className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm ring-offset-background font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-500">Data Type</Label>
                                    <select 
                                        value={editingKeyEntry?.type} 
                                        className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm ring-offset-background font-bold"
                                        onChange={e => setEditingKeyEntry(p => p ? ({ ...p, type: e.target.value }) : null)} 
                                    >
                                        {CONFIG_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-500">Current Value</Label>
                                    <Input 
                                        value={editingKeyEntry?.value || ''} 
                                        onChange={e => setEditingKeyEntry(p => p ? ({ ...p, value: e.target.value }) : null)} 
                                        className="rounded-xl border-slate-200 h-11 font-bold bg-white shadow-sm" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-500">Effective Date</Label>
                                    <Input 
                                        type="datetime-local"
                                        value={editingKeyEntry?.effectiveFrom ? format(parseISO(editingKeyEntry.effectiveFrom), "yyyy-MM-dd'T'HH:mm") : ''} 
                                        onChange={e => setEditingKeyEntry(p => p ? ({ ...p, effectiveFrom: new Date(e.target.value).toISOString() }) : null)} 
                                        className="rounded-xl border-slate-200 h-11 font-bold bg-white shadow-sm" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase text-slate-500">Description / Scope</Label>
                                <Textarea 
                                    value={editingKeyEntry?.description || ''} 
                                    onChange={e => setEditingKeyEntry(p => p ? ({ ...p, description: e.target.value }) : null)} 
                                    placeholder="Enter administrative details..."
                                    className="rounded-xl border-slate-200 min-h-[80px] bg-white shadow-sm resize-none" 
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">Active Status</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-black">Enable in Production</span>
                                </div>
                                <Switch 
                                    checked={editingKeyEntry?.active} 
                                    onCheckedChange={v => setEditingKeyEntry(p => p ? ({ ...p, active: v }) : null)} 
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-white border-t gap-2">
                        <DialogClose asChild>
                            <Button variant="ghost" className="rounded-xl font-bold text-slate-500 px-6 hover:bg-slate-50">Cancel</Button>
                        </DialogClose>
                        <Button 
                            onClick={handleSaveKeyEntry} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-10 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            Finalize Parameter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
