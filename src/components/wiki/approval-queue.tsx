
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Definition, ApprovalHistoryEntry, Template, TemplateSection, SectionValue } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Clock, 
    CheckCircle2, 
    ChevronRight, 
    ShieldCheck, 
    History, 
    UserCheck,
    Calendar as CalendarIcon,
    FilterX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';
import ChangeRequestModal from './change-request-modal';
import diff_match_patch from 'diff-match-patch';
import { findDefinition } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const dmp = new diff_match_patch();

type ApprovalQueueProps = {
    pendingDefinitions: Definition[];
    history: ApprovalHistoryEntry[];
    allDefinitions: Definition[];
    drafts: Definition[];
    templates: Template[];
    onApprove: (id: string) => void;
    onReject: (id: string, comment: string, isRejection: boolean) => void;
};

const ComparisonSection = ({ title, published = '', submitted = '', isHtml = false }: { title: string; published?: string; submitted?: string; isHtml?: boolean }) => {
    const isModified = (published || '').trim() !== (submitted || '').trim();
    const diffs = dmp.diff_main(published || '', submitted || '');
    dmp.diff_cleanupSemantic(diffs);

    const renderDiff = (type: 'deletion' | 'insertion') => {
        let html = '';
        for (const [op, text] of diffs) {
            if (op === 0) html += text;
            else if (op === -1 && type === 'deletion') html += `<del class="bg-red-100 text-red-900 border-b border-red-200 no-underline">${text}</del>`;
            else if (op === 1 && type === 'insertion') html += `<ins class="bg-green-100 text-green-900 border-b border-green-200 no-underline font-bold">${text}</ins>`;
        }
        return html;
    };

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
            <div className="px-4 py-2.5 bg-slate-50 border-b flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">{title}</h4>
                {isModified ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 h-6 text-[10px] uppercase font-bold">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Modified
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-slate-400 h-6 text-[10px] uppercase font-bold border-slate-200">
                        No change
                    </Badge>
                )}
            </div>
            <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x border-slate-100">
                    <div className="p-6 bg-slate-50/30 min-h-[100px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Original Version</p>
                        <div className="text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: isHtml ? renderDiff('deletion') : (renderDiff('deletion') || '<span class="italic opacity-50">Empty</span>') }} />
                    </div>
                    <div className={cn("p-6 min-h-[100px] transition-colors", isModified ? "bg-green-50/10" : "bg-slate-50/10")}>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Submitted Changes</p>
                        <div className="text-sm text-slate-800 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: isHtml ? renderDiff('insertion') : (renderDiff('insertion') || '<span class="italic opacity-50">Empty</span>') }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

function getSectionVal(def: any, sectionId: string, templates: Template[]): string {
    if (!def) return '';
    
    // Check template-defined values
    const sectionVal = (def.sectionValues || []).find((v: any) => v.sectionId === sectionId);
    if (sectionVal) {
        const template = templates.find(t => t.id === def.templateId) || templates[0];
        const section = template?.sections.find(s => s.id === sectionId);
        
        if (section?.fieldType === 'KeyValue') {
            if (!sectionVal.structuredRows?.length) return '';
            return sectionVal.structuredRows.map((row: any) => 
                Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | ')
            ).join('\n');
        }
        
        if (section?.fieldType === 'Dropdown' && section.isMulti) {
            return (sectionVal.multiValues || []).join(', ');
        }
        
        return sectionVal.raw || '';
    }
    
    // Fallback to legacy fields for historical compatibility
    if (sectionId === '1') return def.shortDescription || '';
    if (sectionId === '2') return def.description || '';
    if (sectionId === '3') return def.technicalDetails || '';
    if (sectionId === '4') return def.usageExamples || '';
    
    return '';
}

export default function ApprovalQueue({ pendingDefinitions, history, allDefinitions, drafts, templates, onApprove, onReject }: ApprovalQueueProps) {
    const [sidebarTab, setSidebarTab] = useState<'pending' | 'decided'>('pending');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackMode, setFeedbackMode] = useState<'request' | 'reject'>('request');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

    const filteredPending = useMemo(() => {
        if (!dateRange?.from) return pendingDefinitions;
        return pendingDefinitions.filter(d => {
            if (!d.submittedAt) return false;
            const dDate = new Date(d.submittedAt);
            return isWithinInterval(dDate, { 
                start: startOfDay(dateRange.from), 
                end: endOfDay(dateRange.to || dateRange.from) 
            });
        });
    }, [pendingDefinitions, dateRange]);

    const filteredDecisions = useMemo(() => {
        const decisions = (history || []).filter(h => h.action !== 'Submitted');
        if (!dateRange?.from) return decisions;
        
        return decisions.filter(h => {
            const hDate = new Date(h.date);
            return isWithinInterval(hDate, { 
                start: startOfDay(dateRange.from), 
                end: endOfDay(dateRange.to || dateRange.from) 
            });
        });
    }, [history, dateRange]);

    // Handle selection synchronization when changing tabs or data updates
    useEffect(() => {
        if (sidebarTab === 'pending') {
            const currentIsValid = selectedItemId && filteredPending.some(d => d.id === selectedItemId);
            if (!currentIsValid && filteredPending.length > 0) {
                setSelectedItemId(filteredPending[0].id);
            } else if (filteredPending.length === 0) {
                setSelectedItemId(null);
            }
        } else {
            const currentIsValid = selectedItemId && filteredDecisions.some(h => h.id === selectedItemId);
            if (!currentIsValid && filteredDecisions.length > 0) {
                setSelectedItemId(filteredDecisions[0].id);
            } else if (filteredDecisions.length === 0) {
                setSelectedItemId(null);
            }
        }
    }, [sidebarTab, filteredPending, filteredDecisions, selectedItemId]);

    const selectedHistoryItem = useMemo(() => {
        if (sidebarTab === 'decided' && selectedItemId) {
            return filteredDecisions.find(h => h.id === selectedItemId);
        }
        return null;
    }, [sidebarTab, filteredDecisions, selectedItemId]);

    const selectedDef = useMemo(() => {
        if (sidebarTab === 'pending') {
            return filteredPending.find(d => d.id === selectedItemId);
        } else {
            if (!selectedHistoryItem) return undefined;
            // Robust lookup across live library and drafts
            return findDefinition(allDefinitions, selectedHistoryItem.definitionId) || 
                   findDefinition(drafts, selectedHistoryItem.definitionId);
        }
    }, [sidebarTab, selectedItemId, filteredPending, selectedHistoryItem, allDefinitions, drafts]);

    const comparisonData = useMemo(() => {
        if (!selectedDef) return null;
        
        // Handle approved items by comparing the processed version against the previous revision
        if (!selectedDef.isDraft && selectedDef.revisions && selectedDef.revisions.length > 1 && sidebarTab === 'decided') {
            return {
                original: selectedDef.revisions[1].snapshot,
                submitted: selectedDef.revisions[0].snapshot
            };
        }
        
        // Handle drafts, rejected items, or new published items with single revision
        return {
            original: selectedDef.publishedSnapshot || (selectedDef.revisions && selectedDef.revisions.length > 0 ? selectedDef.revisions[0].snapshot : undefined),
            submitted: selectedDef
        };
    }, [selectedDef, sidebarTab]);

    const handleActionClick = (mode: 'request' | 'reject') => {
        setFeedbackMode(mode);
        setIsFeedbackModalOpen(true);
    };

    const handleFeedbackSubmit = (data: { content: string }) => {
        if (!selectedItemId) return;
        onReject(selectedItemId, data.content, feedbackMode === 'reject');
    };

    const handleApprove = () => {
        if (!selectedItemId) return;
        onApprove(selectedItemId);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'Approved': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'Rejected': return 'text-red-600 bg-red-50 border-red-100';
            case 'Changes Requested': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-slate-50/30">
            {/* Sidebar List */}
            <div className="w-80 border-r bg-white flex flex-col shrink-0 shadow-sm z-10">
                <div className="p-4 border-b bg-slate-50/50 space-y-4">
                    <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full h-9 p-1 bg-slate-200/50 rounded-xl">
                            <TabsTrigger value="pending" className="text-[10px] font-black uppercase tracking-wider rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                Queue ({filteredPending.length})
                            </TabsTrigger>
                            <TabsTrigger value="decided" className="text-[10px] font-black uppercase tracking-wider rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                Decisions
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter by Date</Label>
                            {dateRange && (
                                <Button 
                                    variant="ghost" 
                                    className="h-5 px-1.5 text-[9px] font-bold text-primary hover:bg-primary/5" 
                                    onClick={() => setDateRange(undefined)}
                                >
                                    <FilterX className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                        "w-full justify-start text-left font-medium text-[11px] rounded-lg border-slate-200 h-8 bg-white",
                                        !dateRange && "text-slate-400"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}</>
                                        ) : format(dateRange.from, "MMM dd, yyyy")
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange as any}
                                    onSelect={(range) => setDateRange(range as any)}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                
                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-1">
                        {sidebarTab === 'pending' ? (
                            filteredPending.length === 0 ? (
                                <div className="py-12 px-4 text-center text-slate-400">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No pending items found</p>
                                </div>
                            ) : (
                                filteredPending.map(def => (
                                    <button 
                                        key={def.id} 
                                        onClick={() => setSelectedItemId(def.id)} 
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl transition-all border", 
                                            selectedItemId === def.id ? "bg-indigo-50 border-indigo-100 ring-1 ring-indigo-100" : "bg-transparent border-transparent hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={cn("text-[13px] font-bold truncate flex-1", selectedItemId === def.id ? "text-indigo-900" : "text-slate-700")}>{def.name}</span>
                                            <Badge variant="outline" className="h-5 px-1.5 text-[9px] uppercase font-black bg-white">{def.module}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <span className="text-[11px] font-medium text-slate-500 truncate">{def.submittedBy || "Author"}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{def.submittedAt ? format(new Date(def.submittedAt), 'MMM dd') : 'Recent'}</span>
                                        </div>
                                    </button>
                                ))
                            )
                        ) : (
                            filteredDecisions.length === 0 ? (
                                <div className="py-12 px-4 text-center text-slate-400">
                                    <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No recent decisions</p>
                                </div>
                            ) : (
                                filteredDecisions.map(h => (
                                    <button 
                                        key={h.id} 
                                        onClick={() => setSelectedItemId(h.id)} 
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl transition-all border", 
                                            selectedItemId === h.id ? "bg-slate-50 border-slate-200 ring-1 ring-slate-100" : "bg-transparent border-transparent hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={cn("text-[13px] font-bold truncate flex-1", selectedItemId === h.id ? "text-slate-900" : "text-slate-700")}>{h.definitionName}</span>
                                            <Badge variant="outline" className={cn("h-5 px-1.5 text-[8px] uppercase font-black", getActionColor(h.action))}>{h.action}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <span className="text-[11px] font-medium text-slate-500 truncate">By {h.userName}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{format(new Date(h.date), 'MMM dd')}</span>
                                        </div>
                                    </button>
                                ))
                            )
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Details Panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedDef && comparisonData ? (
                    <>
                        <div className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center border",
                                    sidebarTab === 'pending' ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
                                )}>
                                    {sidebarTab === 'pending' ? <Clock className="h-5 w-5 text-amber-600" /> : <UserCheck className="h-5 w-5 text-slate-600" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Reviewing <span className="text-primary">{selectedDef.name}</span></p>
                                    <p className="text-[11px] text-slate-500">
                                        {sidebarTab === 'pending' 
                                            ? `Submitted by ${selectedDef.submittedBy || 'Author'} • ${selectedDef.submittedAt ? formatDistanceToNow(new Date(selectedDef.submittedAt), { addSuffix: true }) : 'Recently'}`
                                            : `Historical decision audit log`
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            {sidebarTab === 'pending' && (
                                <div className="flex items-center gap-3 ml-2 pl-4 border-l">
                                    <Button variant="outline" size="sm" className="rounded-xl text-red-600 font-bold bg-white" onClick={() => handleActionClick('reject')}>Reject</Button>
                                    <Button variant="outline" size="sm" className="rounded-xl text-amber-600 font-bold bg-white" onClick={() => handleActionClick('request')}>Request Changes</Button>
                                    <Button size="sm" className="rounded-xl bg-[#3F51B5] text-white font-bold px-6" onClick={handleApprove}><ShieldCheck className="h-4 w-4 mr-2" />Approve & Publish</Button>
                                </div>
                            )}
                        </div>

                        {sidebarTab === 'decided' && selectedHistoryItem && (
                            <div className="bg-slate-100/50 px-8 py-3 border-b flex items-center gap-4 animate-in slide-in-from-top-1 fade-in">
                                <Badge className={cn("rounded-lg font-black uppercase text-[10px] py-1 px-3 border", getActionColor(selectedHistoryItem.action))}>
                                    {selectedHistoryItem.action}
                                </Badge>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    <span>Acted upon by <strong>{selectedHistoryItem.userName}</strong> on {format(new Date(selectedHistoryItem.date), 'PPP p')}</span>
                                    {selectedHistoryItem.comment && (
                                        <>
                                            <span className="text-slate-300">|</span>
                                            <span className="italic text-slate-500">"{selectedHistoryItem.comment}"</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <ScrollArea className="flex-1">
                            <div className="p-8 max-w-7xl mx-auto space-y-10 pb-32">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase">
                                        <span>Governance {sidebarTab === 'decided' ? 'Audit' : 'Review'}</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="text-primary">{selectedDef.module}</span>
                                    </div>
                                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">{selectedDef.name}</h1>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-3"><h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Metadata Comparison</h3><div className="h-px bg-slate-200 flex-1" /></div>
                                    
                                    <ComparisonSection 
                                        title="Keywords" 
                                        published={(comparisonData.original?.keywords || []).join(', ')} 
                                        submitted={(comparisonData.submitted?.keywords || []).join(', ')} 
                                    />
                                    
                                    <ComparisonSection 
                                        title="Short Description" 
                                        published={getSectionVal(comparisonData.original, '1', templates)} 
                                        submitted={getSectionVal(comparisonData.submitted, '1', templates)} 
                                    />

                                    <ComparisonSection 
                                        title="Source of Truth" 
                                        published={getSectionVal(comparisonData.original, '8', templates)} 
                                        submitted={getSectionVal(comparisonData.submitted, '8', templates)} 
                                    />

                                    <ComparisonSection 
                                        title="Description" 
                                        published={getSectionVal(comparisonData.original, '2', templates)} 
                                        submitted={getSectionVal(comparisonData.submitted, '2', templates)} 
                                        isHtml 
                                    />

                                    <ComparisonSection 
                                        title="Technical Details" 
                                        published={getSectionVal(comparisonData.original, '3', templates)} 
                                        submitted={getSectionVal(comparisonData.submitted, '3', templates)} 
                                        isHtml 
                                    />

                                    <ComparisonSection 
                                        title="Usage Examples" 
                                        published={getSectionVal(comparisonData.original, '4', templates)} 
                                        submitted={getSectionVal(comparisonData.submitted, '4', templates)} 
                                        isHtml 
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                        <History className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Governance Archive</h3>
                        <p className="text-sm text-slate-500 max-w-xs mt-2">Select a record from the history list to view the full metadata audit and decision details.</p>
                    </div>
                )}
            </div>

            <ChangeRequestModal 
                open={isFeedbackModalOpen} 
                onOpenChange={setIsFeedbackModalOpen} 
                definitionName={selectedDef?.name || ''} 
                title={feedbackMode === 'reject' ? "Reject Submission" : "Request Changes"} 
                description={feedbackMode === 'reject' ? "" : "Specify necessary updates."} 
                buttonText={feedbackMode === 'reject' ? "Confirm Rejection" : "Send Request"} 
                isRejection={feedbackMode === 'reject'} 
                onSend={handleFeedbackSubmit} 
            />
        </div>
    );
}
