
"use client";

import React, { useState, useMemo } from 'react';
import type { Definition } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    User, 
    History, 
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

type ApprovalQueueProps = {
    pendingDefinitions: Definition[];
    onApprove: (id: string) => void;
    onReject: (id: string, comment: string) => void;
    onRequestChanges: (id: string, comment: string) => void;
};

const ComparisonSection = ({ 
    title, 
    published, 
    submitted, 
    isHtml = false 
}: { 
    title: string; 
    published?: string; 
    submitted?: string; 
    isHtml?: boolean 
}) => {
    const isModified = published !== submitted;

    return (
        <Card className="overflow-hidden border-slate-200">
            <div className="px-4 py-2.5 bg-slate-50 border-b flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">{title}</h4>
                {isModified ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 h-6 text-[10px] uppercase font-bold">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Modified
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-slate-400 border-slate-200 h-6 text-[10px] uppercase font-bold">
                        No change
                    </Badge>
                )}
            </div>
            <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x border-slate-100">
                    <div className="p-4 bg-slate-50/30">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Published Version</p>
                        <div className="text-sm text-slate-600 leading-relaxed">
                            {isHtml ? (
                                <div className="prose prose-sm max-w-none opacity-60" dangerouslySetInnerHTML={{ __html: published || '<p class="italic">No content provided.</p>' }} />
                            ) : (
                                <p className="opacity-60">{published || "No content provided."}</p>
                            )}
                        </div>
                    </div>
                    <div className={cn("p-4 transition-colors", isModified ? "bg-green-50/20" : "bg-slate-50/10")}>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3">Submitted Changes</p>
                        <div className="text-sm text-slate-800 leading-relaxed font-medium">
                            {isHtml ? (
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: submitted || '<p class="italic">No content provided.</p>' }} />
                            ) : (
                                <p>{submitted || "No content provided."}</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ApprovalQueue({ pendingDefinitions, onApprove, onReject, onRequestChanges }: ApprovalQueueProps) {
    const [selectedId, setSelectedId] = useState<string | null>(pendingDefinitions[0]?.id || null);
    const [comment, setComment] = useState('');

    const selectedDef = useMemo(() => 
        pendingDefinitions.find(d => d.id === selectedId)
    , [pendingDefinitions, selectedId]);

    const handleAction = (type: 'approve' | 'reject' | 'changes') => {
        if (!selectedId) return;
        if (type === 'approve') onApprove(selectedId);
        else if (type === 'reject') onReject(selectedId, comment);
        else onRequestChanges(selectedId, comment);
        
        setComment('');
        // Auto select next item if available
        const nextIdx = pendingDefinitions.findIndex(d => d.id === selectedId) + 1;
        if (pendingDefinitions[nextIdx]) setSelectedId(pendingDefinitions[nextIdx].id);
        else setSelectedId(null);
    };

    if (pendingDefinitions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                <div className="h-20 w-20 rounded-full bg-white shadow-sm border flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">All caught up!</h2>
                <p className="text-slate-500 max-w-sm mt-2">There are no pending definitions requiring your review at this time.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden bg-slate-50/30">
            {/* Sidebar List */}
            <div className="w-80 border-r bg-white flex flex-col shrink-0">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">Review Queue</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{pendingDefinitions.length} items awaiting review</p>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-1">
                        {pendingDefinitions.map(def => (
                            <button
                                key={def.id}
                                onClick={() => setSelectedId(def.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl transition-all border group",
                                    selectedId === def.id 
                                        ? "bg-indigo-50 border-indigo-100 ring-1 ring-indigo-100" 
                                        : "bg-transparent border-transparent hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className={cn(
                                        "text-[13px] font-bold truncate flex-1",
                                        selectedId === def.id ? "text-indigo-900" : "text-slate-700"
                                    )}>
                                        {def.name}
                                    </span>
                                    <Badge variant="outline" className="shrink-0 h-5 px-1.5 text-[9px] uppercase font-black bg-white">
                                        {def.module}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2.5">
                                    <div className="h-5 w-5 rounded-full bg-slate-100 border flex items-center justify-center shrink-0">
                                        <User className="h-2.5 w-2.5 text-slate-500" />
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-500 truncate">
                                        {def.submittedBy || "System"}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {def.submittedAt ? format(new Date(def.submittedAt), 'MMM dd') : 'Recent'}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Comparison View */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedDef ? (
                    <>
                        {/* Status Banner */}
                        <div className="bg-amber-50 border-b border-amber-100 px-8 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <p className="text-sm font-medium text-amber-900">
                                    Submitted by <span className="font-bold">{selectedDef.submittedBy || 'J. Doe'}</span> on {selectedDef.submittedAt ? format(new Date(selectedDef.submittedAt), 'MMM dd, yyyy') : 'Mar 26, 2026'} at {selectedDef.submittedAt ? format(new Date(selectedDef.submittedAt), 'HH:mm') : '09:14'} · <span className="text-amber-700">3 days pending</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-100 font-bold h-8">
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                </Button>
                                <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-100 font-bold h-8">
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-8 max-w-6xl mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">{selectedDef.name}</h1>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 h-6 gap-1.5 px-2.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            Published v4 live
                                        </Badge>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-sm font-bold text-slate-500">{selectedDef.module}</span>
                                        <span className="text-slate-300">•</span>
                                        <Badge variant="outline" className="h-6 font-bold text-slate-500">v4 &rarr; v5</Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                    {/* Comparison List */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            Changes in this submission
                                            <div className="h-px bg-slate-200 flex-1" />
                                        </h3>
                                        
                                        <ComparisonSection 
                                            title="Technical Details" 
                                            published={selectedDef.publishedSnapshot?.technicalDetails}
                                            submitted={selectedDef.technicalDetails}
                                            isHtml
                                        />

                                        <ComparisonSection 
                                            title="Short Description" 
                                            published={selectedDef.publishedSnapshot?.shortDescription}
                                            submitted={selectedDef.shortDescription}
                                        />

                                        <ComparisonSection 
                                            title="Primary Description" 
                                            published={selectedDef.publishedSnapshot?.description}
                                            submitted={selectedDef.description}
                                            isHtml
                                        />

                                        <div className="space-y-3 pt-4">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Reviewer Comment (Optional)</Label>
                                            <Textarea 
                                                placeholder="Leave a note for the submitter explaining your decision..."
                                                className="min-h-[120px] rounded-2xl bg-white border-slate-200 shadow-sm focus-visible:ring-indigo-500/20"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-4">
                                            <Button 
                                                variant="outline" 
                                                className="rounded-xl px-6 h-11 border-red-200 text-red-600 hover:bg-red-50 font-bold"
                                                onClick={() => handleAction('reject')}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="rounded-xl px-6 h-11 border-amber-200 text-amber-600 hover:bg-amber-50 font-bold"
                                                onClick={() => handleAction('changes')}
                                            >
                                                <RefreshCcw className="h-4 w-4 mr-2" />
                                                Request Changes
                                            </Button>
                                            <Button 
                                                className="rounded-xl px-10 h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200"
                                                onClick={() => handleAction('approve')}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Approve & Publish
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Sidebar Info */}
                                    <div className="space-y-6 sticky top-0">
                                        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                                            <CardHeader className="bg-slate-50/50 border-b p-5">
                                                <CardTitle className="text-sm font-bold text-slate-800">Submission details</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-5 space-y-4">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Submitter</span>
                                                    <span className="text-slate-900 font-bold">{selectedDef.submittedBy || 'J. Doe'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Submitted</span>
                                                    <span className="text-slate-900 font-bold">{selectedDef.submittedAt ? format(new Date(selectedDef.submittedAt), 'MMM dd, HH:mm') : 'Mar 26, 09:14'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Module</span>
                                                    <span className="text-slate-900 font-bold">{selectedDef.module}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Sections changed</span>
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-bold">1 of 3</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                                            <CardHeader className="bg-slate-50/50 border-b p-5">
                                                <CardTitle className="text-sm font-bold text-slate-800">Workflow</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-5">
                                                <div className="relative space-y-8 pl-6 border-l-2 border-slate-100 ml-2 py-2">
                                                    {/* Step 1 */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-emerald-500" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800">Draft saved</p>
                                                            <p className="text-xs text-slate-500">{selectedDef.submittedBy || 'J. Doe'} · Mar 25</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Step 2 */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-emerald-500" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800">Submitted for approval</p>
                                                            <p className="text-xs text-slate-500">{selectedDef.submittedBy || 'J. Doe'} · Mar 26, 09:14</p>
                                                        </div>
                                                    </div>

                                                    {/* Step 3 */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-white border-2 border-amber-600 flex items-center justify-center">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-amber-700">Awaiting review</p>
                                                            <p className="text-xs text-slate-500 font-medium">Approver pool · 3 days</p>
                                                        </div>
                                                    </div>

                                                    {/* Step 4 */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-400">Published</p>
                                                            <p className="text-xs text-slate-400">Pending approval</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                        <History className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Select a request to review</h3>
                        <p className="text-sm text-slate-500 max-w-sm mt-1">
                            Choose a pending definition from the sidebar to begin the side-by-side version comparison.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
