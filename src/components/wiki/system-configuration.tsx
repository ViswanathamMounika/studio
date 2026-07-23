
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Mail, 
    ShieldCheck, 
    Save, 
    Info, 
    Globe, 
    Clock, 
    HardDrive,
    Languages,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemConfigurationState, EmailTemplate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

type SystemConfigurationProps = {
  config: SystemConfigurationState;
  onSaveConfig: (config: SystemConfigurationState) => void;
  onLogAction: (type: string, details?: string) => void;
};

type ConfigArea = 'general' | 'email' | 'localization' | 'security';

const AREA_LABELS: Record<ConfigArea, { label: string; icon: any; description: string }> = {
  general: { 
    label: 'General & Branding', 
    icon: Globe, 
    description: 'Manage core application identity and public-facing branding.' 
  },
  email: { 
    label: 'Email Templates', 
    icon: Mail, 
    description: 'Configure automated workflow notifications and system alerts.' 
  },
  localization: { 
    label: 'Localization', 
    icon: Languages, 
    description: 'Define regional standards for language, dates, and time zones.' 
  },
  security: { 
    label: 'Security & Files', 
    icon: ShieldCheck, 
    description: 'Govern technical security, upload policies, and session parameters.' 
  }
};

export default function SystemConfiguration({ config, onSaveConfig, onLogAction }: SystemConfigurationProps) {
    const [localConfig, setLocalConfig] = useState<SystemConfigurationState>(config);
    const [activeArea, setActiveArea] = useState<ConfigArea>('general');
    const { toast } = useToast();

    const handleSave = () => {
        onSaveConfig(localConfig);
        onLogAction('System Configuration Updated', 'Modified global application parameters.');
        toast({ title: "Configuration Saved", description: "Changes have been applied globally." });
    };

    const updateSettings = (updates: Partial<typeof localConfig.settings>) => {
        setLocalConfig(prev => ({
            ...prev,
            settings: { ...prev.settings, ...updates }
        }));
    };

    const updateEmailTemplate = (id: string, updates: Partial<EmailTemplate>) => {
        setLocalConfig(prev => ({
            ...prev,
            emailTemplates: prev.emailTemplates.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    };

    const ActiveIcon = AREA_LABELS[activeArea].icon;

    return (
        <TooltipProvider>
            <div className="space-y-6 h-full flex flex-col bg-slate-50/30 p-8 rounded-[32px]">
                {/* HEADER ACTIONS */}
                <div className="flex justify-between items-start px-2">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
                        <p className="text-muted-foreground font-medium">Manage operational, branding, and governance policies.</p>
                    </div>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-8 shadow-lg shadow-indigo-100 h-11 transition-all active:scale-95">
                        <Save className="mr-2 h-4 w-4" />
                        Apply Changes
                    </Button>
                </div>

                <div className="flex flex-1 gap-8 min-h-0">
                    {/* SIDENAV */}
                    <div className="w-72 flex flex-col gap-2 shrink-0">
                        {Object.entries(AREA_LABELS).map(([key, config]) => {
                            const Icon = config.icon;
                            const isActive = activeArea === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveArea(key as ConfigArea)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all group",
                                        isActive 
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                                            : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
                                    )}
                                >
                                    <div className={cn(
                                        "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                                        isActive ? "bg-indigo-50" : "bg-slate-100 group-hover:bg-slate-200"
                                    )}>
                                        <Icon className={cn("h-4.5 w-4.5", isActive ? "text-indigo-600" : "text-slate-400")} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-bold truncate">{config.label}</span>
                                        <span className="text-[10px] font-medium opacity-60 line-clamp-1 truncate">{config.description}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-1 bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0">
                        <div className="bg-slate-50/50 border-b py-4 px-8 flex items-center gap-3">
                             <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                                <ActiveIcon className="h-4 w-4 text-indigo-600" />
                             </div>
                             <div>
                                <h2 className="font-bold text-slate-800 text-sm">{AREA_LABELS[activeArea].label}</h2>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">System Registry Configuration</p>
                             </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-8 space-y-8">
                                {activeArea === 'general' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Application Name</Label>
                                            <Input 
                                                value={localConfig.settings.appName} 
                                                onChange={e => updateSettings({ appName: e.target.value })}
                                                className="rounded-xl h-12 font-bold border-slate-200 bg-white text-base shadow-sm focus-visible:ring-primary/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">System Description / Tagline</Label>
                                            <Textarea 
                                                value={localConfig.settings.appDescription} 
                                                onChange={e => updateSettings({ appDescription: e.target.value })}
                                                placeholder="Enter descriptive system info..."
                                                className="rounded-2xl border-slate-200 min-h-[140px] bg-white text-sm shadow-sm focus-visible:ring-primary/20 leading-relaxed resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeArea === 'email' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                                        {localConfig.emailTemplates.map(template => (
                                            <Card key={template.id} className="rounded-2xl border-slate-200 overflow-hidden shadow-none bg-slate-50/50">
                                                <CardHeader className="bg-white border-b py-4 px-6 flex flex-row items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                                            <Mail className="h-4 w-4 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-sm font-bold text-slate-900">{template.name}</CardTitle>
                                                            <CardDescription className="text-[10px]">System workflow notification</CardDescription>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1.5 flex-wrap justify-end max-w-xs">
                                                        {template.variables.map(v => (
                                                            <Badge key={v} variant="outline" className="text-[8px] font-black bg-white border-slate-200 text-indigo-600 px-1.5">
                                                                {v}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Subject Line</Label>
                                                        <Input 
                                                            value={template.subject} 
                                                            onChange={e => updateEmailTemplate(template.id, { subject: e.target.value })}
                                                            className="rounded-xl h-10 border-slate-200 font-bold bg-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Template Body</Label>
                                                        <Textarea 
                                                            value={template.body} 
                                                            onChange={e => updateEmailTemplate(template.id, { body: e.target.value })}
                                                            className="rounded-2xl border-slate-200 min-h-[140px] font-mono text-[11px] leading-relaxed bg-white"
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {activeArea === 'localization' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Date Format</Label>
                                                <Select value={localConfig.settings.dateFormat} onValueChange={v => updateSettings({ dateFormat: v })}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</SelectItem>
                                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (International)</SelectItem>
                                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">System Time Zone</Label>
                                                <Select value={localConfig.settings.timeZone} onValueChange={v => updateSettings({ timeZone: v })}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                                        <SelectItem value="UTC">Universal Time (UTC)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Display Language</Label>
                                                <Select value={localConfig.settings.language} onValueChange={v => updateSettings({ language: v })}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="English (US)">English (US)</SelectItem>
                                                        <SelectItem value="English (UK)">English (UK)</SelectItem>
                                                        <SelectItem value="Spanish">Spanish</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeArea === 'security' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Max File Upload Size (MB)</Label>
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200">System Limit</Badge>
                                                </div>
                                                <div className="relative">
                                                    <HardDrive className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                                    <Input 
                                                        type="number" 
                                                        value={localConfig.settings.maxFileUploadSizeMb} 
                                                        onChange={e => updateSettings({ maxFileUploadSizeMb: parseInt(e.target.value) || 0 })}
                                                        className="rounded-xl h-12 pl-10 border-slate-200 font-bold bg-white shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Session Timeout (Minutes)</Label>
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200">Idle Guard</Badge>
                                                </div>
                                                <div className="relative">
                                                    <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                                    <Input 
                                                        type="number" 
                                                        value={localConfig.settings.sessionTimeoutMinutes} 
                                                        onChange={e => updateSettings({ sessionTimeoutMinutes: parseInt(e.target.value) || 0 })}
                                                        className="rounded-xl h-12 pl-10 border-slate-200 font-bold bg-white shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Authorized File Extensions</Label>
                                            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-wrap gap-3">
                                                {localConfig.settings.allowedFileTypes.map(type => (
                                                    <Badge key={type} className="bg-white border-slate-200 text-slate-700 h-10 px-4 rounded-xl gap-3 font-bold shadow-sm group">
                                                        {type}
                                                        <button 
                                                            onClick={() => updateSettings({ allowedFileTypes: localConfig.settings.allowedFileTypes.filter(t => t !== type) })}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                <div className="flex items-center gap-3">
                                                    <Input 
                                                        placeholder=".zip" 
                                                        className="h-10 w-24 rounded-xl text-sm font-bold bg-white border-slate-200"
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                const val = (e.target as HTMLInputElement).value.trim();
                                                                if (val && !localConfig.settings.allowedFileTypes.includes(val)) {
                                                                    updateSettings({ allowedFileTypes: [...localConfig.settings.allowedFileTypes, val] });
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Press Enter</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 italic flex items-center gap-2 px-2">
                                                <Info className="h-3.5 w-3.5" />
                                                Attachment policy enforces these technical extensions globally across the library.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
