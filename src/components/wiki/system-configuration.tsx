"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Folder, 
    Lock, 
    Check, 
    Search, 
    Save, 
    Plus, 
    Eye, 
    EyeOff,
    Terminal,
    Settings2,
    ShieldCheck,
    Pencil,
    Trash2,
    Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemConfigurationState, ConfigKey } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format, parseISO } from 'date-fns';

type SystemConfigurationProps = {
  config: SystemConfigurationState;
  onSaveConfig: (config: SystemConfigurationState) => void;
  onLogAction: (type: string, details?: string) => void;
};

export default function SystemConfiguration({ config, onSaveConfig, onLogAction }: SystemConfigurationProps) {
    const [localConfig, setLocalConfig] = useState<SystemConfigurationState>(config);
    const [showPassword, setShowPassword] = useState(false);
    const [configSearch, setConfigSearch] = useState('');
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

    const filteredConfigKeys = useMemo(() => {
        if (!configSearch.trim()) return localConfig.configKeys;
        const lower = configSearch.toLowerCase();
        return localConfig.configKeys.filter(k => 
            k.key.toLowerCase().includes(lower) || 
            k.description.toLowerCase().includes(lower)
        );
    }, [localConfig.configKeys, configSearch]);

    const handleUpdateConfigKey = (id: string, updates: Partial<ConfigKey>) => {
        setLocalConfig(prev => ({
            ...prev,
            configKeys: prev.configKeys.map(k => k.id === id ? { ...k, ...updates } : k)
        }));
    };

    const handleRemoveConfigKey = (id: string) => {
        setLocalConfig(prev => ({
            ...prev,
            configKeys: prev.configKeys.filter(k => k.id !== id)
        }));
        toast({ title: "Configuration Key Removed" });
    };

    const handleAddConfigKey = () => {
        const newId = (Math.max(...localConfig.configKeys.map(k => parseInt(k.id) || 0)) + 1).toString();
        const newKey: ConfigKey = {
            id: newId,
            key: 'NEW_CONFIG_KEY',
            value: '0',
            type: 'int',
            effectiveFrom: new Date().toISOString(),
            active: true,
            description: 'New system configuration parameter.'
        };
        setLocalConfig(prev => ({
            ...prev,
            configKeys: [...prev.configKeys, newKey]
        }));
        toast({ title: "New Key Initialized" });
    };

    return (
        <div className="h-full flex flex-col bg-[#F8F9FC]">
            {/* TOP ACTION HEADER */}
            <div className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm shrink-0 z-30">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-1.5">
                        <Settings2 className="h-3 w-3" />
                        Configuration
                    </p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">System Settings</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Unsaved changes are per-section
                    </span>
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
                <div className="p-8 max-w-[1400px] mx-auto space-y-8 pb-32">
                    {/* APP IDENTITY HEADER CARD */}
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

                    {/* MAIN CONFIG TABS */}
                    <Tabs defaultValue="app-settings" className="space-y-6">
                        <TabsList className="bg-slate-200/40 p-1.5 h-12 rounded-2xl border border-slate-200 inline-flex shadow-sm">
                            <TabsTrigger 
                                value="app-settings" 
                                className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary font-bold text-xs gap-2 transition-all"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                App Settings
                            </TabsTrigger>
                            <TabsTrigger 
                                value="app-configs" 
                                className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary font-bold text-xs gap-2 transition-all"
                            >
                                <Terminal className="h-4 w-4" />
                                App Configs
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="app-settings" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* FILE STORAGE CARD */}
                                <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
                                    <div className="p-6 border-b bg-slate-50/50 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Folder className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-none">File Storage</h3>
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">FileStorage</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Network Path</Label>
                                            <Input 
                                                value={localConfig.settings.fileStoragePath} 
                                                onChange={e => updateSettings({ fileStoragePath: e.target.value })}
                                                className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-medium"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Username</Label>
                                                <Input 
                                                    value={localConfig.settings.fileStorageUser} 
                                                    onChange={e => updateSettings({ fileStorageUser: e.target.value })}
                                                    className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Password</Label>
                                                <div className="relative">
                                                    <Input 
                                                        type={showPassword ? "text" : "password"}
                                                        value={localConfig.settings.fileStoragePass} 
                                                        onChange={e => updateSettings({ fileStoragePass: e.target.value })}
                                                        className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-medium pr-10"
                                                    />
                                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-indigo-600 transition-colors">
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">Use Credentials</span>
                                                <span className="text-[10px] font-mono text-slate-400">UseCredentials</span>
                                            </div>
                                            <Switch checked={localConfig.settings.fileStorageEnabled} onCheckedChange={v => updateSettings({ fileStorageEnabled: v })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* LOCK CLEANUP CARD */}
                                <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
                                    <div className="p-6 border-b bg-slate-50/50 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Lock className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-none">Lock Cleanup Settings</h3>
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">LockCleanupSettings</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Cleanup Interval</Label>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    value={localConfig.settings.lockCleanupInterval} 
                                                    onChange={e => updateSettings({ lockCleanupInterval: parseInt(e.target.value) || 0 })}
                                                    className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-black pr-20"
                                                />
                                                <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-400 uppercase">minutes</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">Enabled</span>
                                                <span className="text-[10px] font-mono text-slate-400">Enabled</span>
                                            </div>
                                            <Switch checked={localConfig.settings.lockCleanupEnabled} onCheckedChange={v => updateSettings({ lockCleanupEnabled: v })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* APPROVAL SETTINGS CARD */}
                                <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
                                    <div className="p-6 border-b bg-slate-50/50 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Check className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-none">Approval Settings</h3>
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ApprovalSettings</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Approver Role ID</Label>
                                                <Input value={localConfig.settings.approverRoleId} onChange={e => updateSettings({ approverRoleId: e.target.value })} className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Admin Role ID</Label>
                                                <Input value={localConfig.settings.adminRoleId} onChange={e => updateSettings({ adminRoleId: e.target.value })} className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-bold" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Approval Requests Count</Label>
                                                <Input type="number" value={localConfig.settings.approvalRequestLimit} onChange={e => updateSettings({ approvalRequestLimit: parseInt(e.target.value) || 0 })} className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Approval History Count</Label>
                                                <Input type="number" value={localConfig.settings.approvalHistoryLimit} onChange={e => updateSettings({ approvalHistoryLimit: parseInt(e.target.value) || 0 })} className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-bold" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* SEARCH SYNC CARD */}
                                <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
                                    <div className="p-6 border-b bg-slate-50/50 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Search className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-none">Search Sync — Wiki</h3>
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">SearchSync.Wiki</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Index Name</Label>
                                            <Input value={localConfig.settings.searchIndexName} onChange={e => updateSettings({ searchIndexName: e.target.value })} className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-bold" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Sync Interval</Label>
                                                <div className="relative">
                                                    <Input type="number" value={localConfig.settings.searchSyncInterval} onChange={e => updateSettings({ searchSyncInterval: parseInt(e.target.value) || 0 })} className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-bold pr-16" />
                                                    <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-400 uppercase">minutes</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Search Result Size</Label>
                                                <Input type="number" value={localConfig.settings.searchResultSize} onChange={e => updateSettings({ searchResultSize: parseInt(e.target.value) || 0 })} className="rounded-xl h-11 bg-slate-50/50 border-slate-200 font-bold" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">Enabled</span>
                                                <span className="text-[10px] font-mono text-slate-400">Enabled</span>
                                            </div>
                                            <Switch checked={localConfig.settings.searchSyncEnabled} onCheckedChange={v => updateSettings({ searchSyncEnabled: v })} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="app-configs" className="space-y-6 mt-0">
                            {/* SEARCH & ADD ACTION BAR */}
                            <div className="flex items-center justify-between">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Filter by key or description..." 
                                        value={configSearch}
                                        onChange={e => setConfigSearch(e.target.value)}
                                        className="pl-9 h-10 rounded-xl bg-white border-slate-200 shadow-sm"
                                    />
                                </div>
                                <Button onClick={handleAddConfigKey} className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white rounded-xl h-10 px-6 gap-2 font-bold shadow-md transition-all active:scale-95">
                                    <Plus className="h-4 w-4" />
                                    Add Config
                                </Button>
                            </div>

                            <Card className="rounded-[28px] border-slate-200 shadow-sm overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b">
                                        <TableRow className="h-12 border-none">
                                            <TableHead className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 w-16">ID</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Config Key</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Value</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Type</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Effective From</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Active</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Description</TableHead>
                                            <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 w-24">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredConfigKeys.map(item => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-100 h-20">
                                                <TableCell className="px-6 font-bold text-slate-400 text-xs tabular-nums">{item.id}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 border-transparent font-black text-[11px] tracking-wider px-2.5 h-7 rounded-lg">
                                                        {item.key}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        value={item.value} 
                                                        onChange={(e) => handleUpdateConfigKey(item.id, { value: e.target.value })}
                                                        className="h-9 w-24 rounded-xl border-slate-200 bg-white font-black text-center shadow-inner"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[10px] px-2 h-6 rounded-lg uppercase">
                                                        {item.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{format(parseISO(item.effectiveFrom), 'dd MMM yyyy')}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{format(parseISO(item.effectiveFrom), 'hh:mm a')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Switch 
                                                        checked={item.active} 
                                                        onCheckedChange={v => handleUpdateConfigKey(item.id, { active: v })}
                                                        className="data-[state=checked]:bg-emerald-500"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-xs font-medium max-w-xs leading-relaxed">
                                                    {item.description}
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-primary hover:bg-white rounded-lg">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-destructive hover:bg-white rounded-lg" onClick={() => handleRemoveConfigKey(item.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="p-4 px-6 border-t bg-slate-50/50 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        Showing {filteredConfigKeys.length} of {localConfig.configKeys.length} config keys
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 italic">
                                        Effective To values are NULL — configs apply indefinitely once active
                                    </span>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>
        </div>
    );
}