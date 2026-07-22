"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Settings, 
    Mail, 
    FileUp, 
    Languages, 
    ShieldCheck, 
    Save, 
    Plus, 
    Trash2, 
    Info, 
    Globe, 
    Clock, 
    HardDrive,
    MessageSquare,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemConfigurationState, EmailTemplate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

type SystemConfigurationProps = {
  config: SystemConfigurationState;
  onSaveConfig: (config: SystemConfigurationState) => void;
  onLogAction: (type: string, details?: string) => void;
};

export default function SystemConfiguration({ config, onSaveConfig, onLogAction }: SystemConfigurationProps) {
    const [localConfig, setLocalConfig] = useState<SystemConfigurationState>(config);
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

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
                    <p className="text-muted-foreground font-medium">Manage operational, branding, and governance policies.</p>
                </div>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-8 shadow-lg shadow-indigo-100 h-11">
                    <Save className="mr-2 h-4 w-4" />
                    Apply Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="flex-1 flex flex-col">
                <TabsList className="bg-slate-100 p-1 w-fit rounded-xl mb-6">
                    <TabsTrigger value="general" className="rounded-lg px-6 font-bold gap-2">
                        <Globe className="h-4 w-4" />
                        General & Branding
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-lg px-6 font-bold gap-2">
                        <Mail className="h-4 w-4" />
                        Email Templates
                    </TabsTrigger>
                    <TabsTrigger value="localization" className="rounded-lg px-6 font-bold gap-2">
                        <Languages className="h-4 w-4" />
                        Localization
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg px-6 font-bold gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Security & Files
                    </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 -mx-2 px-2">
                    <TabsContent value="general" className="m-0 space-y-6">
                        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-base font-bold">Application Identity</CardTitle>
                                <CardDescription>Configure how the application presents itself to users.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Application Name</Label>
                                        <Input 
                                            value={localConfig.settings.appName} 
                                            onChange={e => updateSettings({ appName: e.target.value })}
                                            className="rounded-xl h-11 font-bold border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Logo URL (Icon)</Label>
                                        <Input 
                                            value={localConfig.settings.logoUrl || ''} 
                                            onChange={e => updateSettings({ logoUrl: e.target.value })}
                                            placeholder="https://example.com/logo.svg"
                                            className="rounded-xl h-11 border-slate-200"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">System Description / Tagline</Label>
                                        <Textarea 
                                            value={localConfig.settings.appDescription} 
                                            onChange={e => updateSettings({ appDescription: e.target.value })}
                                            className="rounded-xl border-slate-200 min-h-[100px]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="email" className="m-0 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {localConfig.emailTemplates.map(template => (
                                <Card key={template.id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-bold">{template.name}</CardTitle>
                                            <CardDescription>Workflow notification template.</CardDescription>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap justify-end max-w-xs">
                                            {template.variables.map(v => (
                                                <Badge key={v} variant="outline" className="text-[9px] font-black bg-white border-slate-200 text-indigo-600">
                                                    {v}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Subject Line</Label>
                                            <Input 
                                                value={template.subject} 
                                                onChange={e => updateEmailTemplate(template.id, { subject: e.target.value })}
                                                className="rounded-xl h-11 border-slate-200 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Body Content</Label>
                                            <Textarea 
                                                value={template.body} 
                                                onChange={e => updateEmailTemplate(template.id, { body: e.target.value })}
                                                className="rounded-xl border-slate-200 min-h-[150px] font-mono text-xs leading-relaxed"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="localization" className="m-0 space-y-6">
                        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-base font-bold">Regional Standards</CardTitle>
                                <CardDescription>Define global date, time, and language formats.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Global Date Format</Label>
                                        <Select value={localConfig.settings.dateFormat} onValueChange={v => updateSettings({ dateFormat: v })}>
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold">
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
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                                <SelectItem value="UTC">Universal Time Coordinated (UTC)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Default Application Language</Label>
                                        <Select value={localConfig.settings.language} onValueChange={v => updateSettings({ language: v })}>
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold">
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="m-0 space-y-6">
                        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-base font-bold">Inbound Governance</CardTitle>
                                <CardDescription>Configure upload limits and technical security parameters.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Max File Upload Size (MB)</Label>
                                            <Badge variant="outline" className="text-[10px] bg-slate-50">Per File</Badge>
                                        </div>
                                        <div className="relative">
                                            <HardDrive className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                                            <Input 
                                                type="number" 
                                                value={localConfig.settings.maxFileUploadSizeMb} 
                                                onChange={e => updateSettings({ maxFileUploadSizeMb: parseInt(e.target.value) || 0 })}
                                                className="rounded-xl h-11 pl-10 border-slate-200 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Session Inactivity Timeout</Label>
                                            <Badge variant="outline" className="text-[10px] bg-slate-50">Minutes</Badge>
                                        </div>
                                        <div className="relative">
                                            <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                                            <Input 
                                                type="number" 
                                                value={localConfig.settings.sessionTimeoutMinutes} 
                                                onChange={e => updateSettings({ sessionTimeoutMinutes: parseInt(e.target.value) || 0 })}
                                                className="rounded-xl h-11 pl-10 border-slate-200 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Authorized File Extensions</Label>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap gap-3">
                                        {localConfig.settings.allowedFileTypes.map(type => (
                                            <Badge key={type} className="bg-white border-slate-200 text-slate-700 h-9 px-4 rounded-xl gap-2 font-bold shadow-sm">
                                                {type}
                                                <button 
                                                    onClick={() => updateSettings({ allowedFileTypes: localConfig.settings.allowedFileTypes.filter(t => t !== type) })}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                placeholder=".zip" 
                                                className="h-9 w-24 rounded-xl text-xs"
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
                                            <span className="text-[10px] text-slate-400 font-medium">Press Enter</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
                                        <Info className="h-3 w-3" />
                                        Restricts definition reference attachments to these technical standards globally.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
}