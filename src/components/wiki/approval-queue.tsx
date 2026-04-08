
"use client";

import React, { useState, useMemo } from 'react';
import type { Definition, ApprovalHistoryEntry } from '@/lib/types';
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
        <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="px-4 py-2.5 bg-slate-50 border-b flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">{title}</h4>
                {isModified ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 h-6 text-[10px] uppercase font-bold"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" />Modified</Badge> : <Badge variant="outline" className="text-slate-400 h-6 text-[10px] uppercase font-bold">No change</Badge>}
            </div>
            <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x border-slate-100">
                    <div className="p-6 bg-slate-50/30">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Original Version</p>
                        <div className="text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: isHtml ? renderDiff('deletion') : (renderDiff('deletion') || 'No content provided.') }} />
                    </div>
                    <div className={cn("p-6 transition-colors", isModified ? "bg-green-50/10" : "bg-slate-50/10")}>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Submitted Changes</p>
                        <div className="text-sm text-slate-800 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: isHtml ? renderDiff('insertion') : (renderDiff('insertion') || 'No content provided.') }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ApprovalQueue({ pendingDefinitions, history, allDefinitions, drafts, onApprove, onReject }: ApprovalQueueProps) {
    const [sidebarTab, setSidebarTab] = useState<'pending' | 'decided'>('pending');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackMode, setFeedbackMode] = useState<'request' | 'reject'>('request');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

    // Filtered lists based on date
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
        if (!dateRange?.from) return decisions.slice(0, 20);
        
        return decisions.filter(h => {
            const hDate = new Date(h.date);
            return isWithinInterval(hDate, { 
                start: startOfDay(dateRange.from), 
                end: endOfDay(dateRange.to || dateRange.from) 
            });
        }).slice(0, 20);
    }, [history, dateRange]);

    // Selection logic when data or tabs change
    useMemo(() => {
        if (sidebarTab === 'pending') {
            if (!selectedItemId || !filteredPending.some(d => d.id === selectedItemId)) {
                setSelectedItemId(filteredPending[0]?.id || null);
            }
        } else {
            if (!selectedItemId || !filteredDecisions.some(h => h.id === selectedItemId)) {
                setSelectedItemId(filteredDecisions[0]?.id || null);
            }
        }
    }, [sidebarTab, filteredPending, filteredDecisions, selectedItemId]);

    const selectedDef = useMemo(() => {
        if (sidebarTab === 'pending') {
            return filteredPending.find(d => d.id === selectedItemId);
        } else {
            const h = filteredDecisions.find(item => item.id === selectedItemId);
            if (!h) return undefined;
            return findDefinition(allDefinitions, h.definitionId) || findDefinition(drafts, h.definitionId);
        }
    }, [sidebarTab, selectedItemId, filteredPending, filteredDecisions, allDefinitions, drafts]);

    const selectedHistoryItem = useMemo(() => {
        if (sidebarTab === 'decided') {
            return filteredDecisions.find(h => h.id === selectedItemId);
        }
        return null;
    }, [sidebarTab, filteredDecisions, selectedItemId]);

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
                                        "w-full justify-start text-left font-medium text-[11px] rounded-lg border-slate-200 h-8",
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
                                    {dateRange && <p className="text-[10px] mt-1">Try adjusting the date range</p>}
                                </div>
                            ) : (
                                filteredPending.map(def => (
                                    <button key={def.id} onClick={() => setSelectedItemId(def.id)} className={cn("w-full text-left p-4 rounded-xl transition-all border", selectedItemId === def.id ? "bg-indigo-50 border-indigo-100 ring-1 ring-indigo-100" : "bg-transparent border-transparent hover:bg-slate-50")}>
                                        <div className="flex items-start justify-between gap-2"><span className={cn("text-[13px] font-bold truncate flex-1", selectedItemId === def.id ? "text-indigo-900" : "text-slate-700")}>{def.name}</span><Badge variant="outline" className="h-5 px-1.5 text-[9px] uppercase font-black bg-white">{def.module}</Badge></div>
                                        <div className="flex items-center gap-2 mt-2.5"><span className="text-[11px] font-medium text-slate-500 truncate">{def.submittedBy || "System"}</span><span className="text-slate-300">•</span><span className="text-[10px] font-bold text-slate-400 uppercase">{def.submittedAt ? format(new Date(def.submittedAt), 'MMM dd') : 'Recent'}</span></div>
                                    </button>
                                ))
                            )
                        ) : (
                            filteredDecisions.length === 0 ? (
                                <div className="py-12 px-4 text-center text-slate-400">
                                    <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No recent decisions</p>
                                    {dateRange && <p className="text-[10px] mt-1">Try adjusting the date range</p>}
                                </div>
                            ) : (
                                filteredDecisions.map(h => (
                                    <button key={h.id} onClick={() => setSelectedItemId(h.id)} className={cn("w-full text-left p-4 rounded-xl transition-all border", selectedItemId === h.id ? "bg-slate-50 border-slate-200 ring-1 ring-slate-100" : "bg-transparent border-transparent hover:bg-slate-50")}>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={cn("text-[13px] font-bold truncate flex-1", selectedItemId === h.id ? "text-slate-900" : "text-slate-700")}>{h.definitionName}</span>
                                            <Badge variant="outline" className={cn("h-5 px-1.5 text-[8px] uppercase font-black", getActionColor(h.action))}>{h.action}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2.5"><span className="text-[11px] font-medium text-slate-500 truncate">By {h.userName}</span><span className="text-slate-300">•</span><span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(h.date), 'MMM dd')}</span></div>
                                    </button>
                                ))
                            )
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {selectedDef ? (
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
                                            ? `Submitted by ${selectedDef.submittedBy} • ${selectedDef.submittedAt ? formatDistanceToNow(new Date(selectedDef.submittedAt), { addSuffix: true }) : 'Recently'}`
                                            : `Decision record from governance audit trail`
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {sidebarTab === 'pending' && (
                                    <div className="flex items-center gap-3 ml-2 pl-4 border-l">
                                        <Button variant="outline" size="sm" className="rounded-xl text-red-600 font-bold bg-white" onClick={() => handleActionClick('reject')}>Reject</Button>
                                        <Button variant="outline" size="sm" className="rounded-xl text-amber-600 font-bold bg-white" onClick={() => handleActionClick('request')}>Request Changes</Button>
                                        <Button size="sm" className="rounded-xl bg-[#3F51B5] text-white font-bold px-6" onClick={handleApprove}><ShieldCheck className="h-4 w-4 mr-2" />Approve & Publish</Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {sidebarTab === 'decided' && selectedHistoryItem && (
                            <div className="bg-slate-100/50 px-8 py-3 border-b flex items-center gap-4 animate-in slide-in-from-top-1 fade-in">
                                <Badge className={cn("rounded-lg font-black uppercase text-[10px] py-1 px-3", getActionColor(selectedHistoryItem.action))}>
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
                                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase"><span>Governance Review</span><ChevronRight className="h-3 w-3" /><span className="text-primary">{selectedDef.module}</span></div>
                                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">{selectedDef.name}</h1>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-3"><h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Field Comparison</h3><div className="h-px bg-slate-200 flex-1" /></div>
                                    <ComparisonSection title="Summary" published={selectedDef.publishedSnapshot?.shortDescription} submitted={selectedDef.shortDescription} />
                                    <ComparisonSection title="Description" published={selectedDef.publishedSnapshot?.description} submitted={selectedDef.description} isHtml />
                                    <ComparisonSection title="Technical Logic" published={selectedDef.publishedSnapshot?.technicalDetails} submitted={selectedDef.technicalDetails} isHtml />
                                </div>
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                        <History className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Governance Review Workspace</h3>
                        <p className="text-sm text-slate-500 max-w-xs mt-2">Select a definition from the queue to start reviewing metadata improvements.</p>
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
