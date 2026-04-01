
"use client";

import React, { useState, useMemo } from 'react';
import type { Definition } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    User, 
    ChevronRight,
    ChevronLeft,
    Check,
    FileText,
    History,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ChangeRequestModal from './change-request-modal';

type ApprovalQueueProps = {
    pendingDefinitions: Definition[];
    onApprove: (id: string) => void;
    onReject: (id: string, comment: string, isRejection: boolean) => void;
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
        <Card className="overflow-hidden border-slate-200 shadow-sm">
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Original Version</p>
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

export default function ApprovalQueue({ pendingDefinitions, onApprove, onReject }: ApprovalQueueProps) {
    const [selectedId, setSelectedId] = useState<string | null>(pendingDefinitions[0]?.id || null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackMode, setFeedbackMode] = useState<'request' | 'reject'>('request');

    const selectedDef = useMemo(() => 
        pendingDefinitions.find(d => d.id === selectedId)
    , [pendingDefinitions, selectedId]);

    const handleActionClick = (mode: 'request' | 'reject') => {
        setFeedbackMode(mode);
        setIsFeedbackModalOpen(true);
    };

    const handleFeedbackSubmit = (data: { content: string }) => {
        if (!selectedId) return;
        onReject(selectedId, data.content, feedbackMode === 'reject');
        
        // Auto select next item if available
        const nextIdx = pendingDefinitions.findIndex(d => d.id === selectedId) + 1;
        if (pendingDefinitions[nextIdx]) {
            setSelectedId(pendingDefinitions[nextIdx].id);
        } else {
            setSelectedId(null);
        }
    };

    const handleApprove = () => {
        if (!selectedId) return;
        onApprove(selectedId);
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
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">Approval Queue</h2>
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
                        {/* Status & Action Banner */}
                        <div className="bg-amber-50 border-b border-amber-100 px-8 py-3.5 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <p className="text-sm font-medium text-amber-900">
                                    Submitted by <span className="font-bold">{selectedDef.submittedBy || 'J. Doe'}</span> · <span className="text-amber-700 font-bold">Awaiting Action</span>
                                </p>
                            </div>
                            
                            {/* Action Buttons moved to top */}
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="rounded-xl h-9 border-red-200 text-red-600 hover:bg-red-50 font-bold"
                                    onClick={() => handleActionClick('reject')}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="rounded-xl h-9 border-amber-200 text-amber-600 hover:bg-amber-50 font-bold"
                                    onClick={() => handleActionClick('request')}
                                >
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Request Changes
                                </Button>
                                <Button 
                                    size="sm"
                                    className="rounded-xl h-9 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-sm"
                                    onClick={handleApprove}
                                >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Approve & Publish
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ScrollArea className="flex-1">
                                <div className="p-8 max-w-6xl mx-auto space-y-8">
                                    <div className="space-y-4">
                                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{selectedDef.name}</h1>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 h-6 gap-1.5 px-2.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                Reviewing Version Comparison
                                            </Badge>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-sm font-bold text-slate-500">{selectedDef.module}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-24">
                                        {/* Comparison List */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                Visual Diff Analysis
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
                                        </div>

                                        {/* Sidebar Info */}
                                        <div className="space-y-6 sticky top-4">
                                            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                                                <CardHeader className="bg-slate-50/50 border-b p-5">
                                                    <CardTitle className="text-sm font-bold text-slate-800">Submission Info</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-5 space-y-4">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500 font-medium">Author</span>
                                                        <span className="text-slate-900 font-bold">{selectedDef.submittedBy || 'J. Doe'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-500 font-medium">Date</span>
                                                        <span className="text-slate-900 font-bold">{selectedDef.submittedAt ? format(new Date(selectedDef.submittedAt), 'MMM dd, HH:mm') : 'Mar 26, 09:14'}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                                                <CardHeader className="bg-slate-50/50 border-b p-5">
                                                    <CardTitle className="text-sm font-bold text-slate-800">Workflow Progress</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-5">
                                                    <div className="relative space-y-8 pl-6 border-l-2 border-slate-100 ml-2 py-2">
                                                        <div className="relative">
                                                            <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
                                                                <Check className="h-3 w-3 text-emerald-500" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-sm font-bold text-slate-800">Draft Completed</p>
                                                                <p className="text-xs text-slate-500">{selectedDef.submittedBy || 'J. Doe'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-white border-2 border-amber-600 flex items-center justify-center">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="text-sm font-bold text-amber-700">Awaiting Approval</p>
                                                                <p className="text-xs text-slate-500 font-medium">Ready for review</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                        <History className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Select a request to review</h3>
                        <p className="text-sm text-slate-500 max-w-sm mt-1">
                            Select an item from the approval queue to begin the side-by-side comparison and workflow actions.
                        </p>
                    </div>
                )}
            </div>

            <ChangeRequestModal 
                open={isFeedbackModalOpen} 
                onOpenChange={setIsFeedbackModalOpen} 
                definitionName={selectedDef?.name || ''}
                title={feedbackMode === 'reject' ? "Reject Submission" : "Request Changes"}
                description={feedbackMode === 'reject' 
                    ? "Explain why this submission is being rejected. It will return to the author as a draft." 
                    : "Specify the necessary updates. The author will be notified to make these changes."}
                buttonText={feedbackMode === 'reject' ? "Confirm Rejection" : "Send Request"}
                showPriority={feedbackMode === 'request'}
                isRejection={feedbackMode === 'reject'}
                onSend={handleFeedbackSubmit}
            />
        </div>
    );
}
