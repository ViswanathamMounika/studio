"use client";

import React, { useState, useMemo } from 'react';
import type { Definition, DiscussionMessage } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    User, 
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    History,
    MessageSquare,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import ChangeRequestModal from './change-request-modal';
import diff_match_patch, { type Diff } from 'diff-match-patch';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const dmp = new diff_match_patch();

type ApprovalQueueProps = {
    pendingDefinitions: Definition[];
    onApprove: (id: string) => void;
    onReject: (id: string, comment: string, isRejection: boolean) => void;
};

const ComparisonSection = ({ 
    title, 
    published = '', 
    submitted = '', 
    isHtml = false 
}: { 
    title: string; 
    published?: string; 
    submitted?: string; 
    isHtml?: boolean 
}) => {
    const isModified = (published || '').trim() !== (submitted || '').trim();

    // Prepare diffs
    // If it's HTML, we treat it as text for the diff logic to ensure tags don't break
    const diffs = dmp.diff_main(published || '', submitted || '');
    dmp.diff_cleanupSemantic(diffs);

    const renderDiff = (type: 'deletion' | 'insertion') => {
        let html = '';
        for (const [op, text] of diffs) {
            switch (op) {
                case 0: // Unchanged
                    html += text;
                    break;
                case -1: // Deletion
                    if (type === 'deletion') {
                        html += `<del class="bg-red-100 text-red-900 border-b border-red-200 no-underline">${text}</del>`;
                    }
                    break;
                case 1: // Insertion
                    if (type === 'insertion') {
                        html += `<ins class="bg-green-100 text-green-900 border-b border-green-200 no-underline font-bold">${text}</ins>`;
                    }
                    break;
            }
        }
        return html;
    };

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
                <div className="grid grid-cols-2 divide-x border-slate-100 min-h-[100px]">
                    {/* Left Side: Original Version (Deletions Highlighted) */}
                    <div className="p-6 bg-slate-50/30">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Original Version</p>
                        <div className="text-sm text-slate-600 leading-relaxed font-medium">
                            {isHtml ? (
                                <div 
                                    className="prose prose-sm max-w-none opacity-80" 
                                    dangerouslySetInnerHTML={{ __html: renderDiff('deletion') || '<p class="italic">No content provided.</p>' }} 
                                />
                            ) : (
                                <div 
                                    className="whitespace-pre-wrap opacity-80" 
                                    dangerouslySetInnerHTML={{ __html: renderDiff('deletion') || 'No content provided.' }} 
                                />
                            )}
                        </div>
                    </div>
                    {/* Right Side: Submitted Version (Insertions Highlighted) */}
                    <div className={cn("p-6 transition-colors", isModified ? "bg-green-50/10" : "bg-slate-50/10")}>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Submitted Changes</p>
                        <div className="text-sm text-slate-800 leading-relaxed font-medium">
                            {isHtml ? (
                                <div 
                                    className="prose prose-sm max-w-none" 
                                    dangerouslySetInnerHTML={{ __html: renderDiff('insertion') || '<p class="italic">No content provided.</p>' }} 
                                />
                            ) : (
                                <div 
                                    className="whitespace-pre-wrap" 
                                    dangerouslySetInnerHTML={{ __html: renderDiff('insertion') || 'No content provided.' }} 
                                />
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
            <div className="w-80 border-r bg-white flex flex-col shrink-0 shadow-sm z-10">
                <div className="p-6 border-b bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-bold tracking-tight text-slate-900">Approval Queue</h2>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold">{pendingDefinitions.length}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Items awaiting your decision</p>
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
                        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-slate-900">
                                        Reviewing <span className="text-primary">{selectedDef.name}</span>
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-500">
                                        Submitted by <span className="font-bold">{selectedDef.submittedBy}</span> • {selectedDef.submittedAt ? formatDistanceToNow(new Date(selectedDef.submittedAt), { addSuffix: true }) : 'Recently'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="rounded-xl h-9 border-red-200 text-red-600 hover:bg-red-50 font-bold bg-white"
                                    onClick={() => handleActionClick('reject')}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="rounded-xl h-9 border-amber-200 text-amber-600 hover:bg-amber-50 font-bold bg-white"
                                    onClick={() => handleActionClick('request')}
                                >
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Request Changes
                                </Button>
                                <Button 
                                    size="sm"
                                    className="rounded-xl h-9 bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white font-bold shadow-sm px-6"
                                    onClick={handleApprove}
                                >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Approve & Publish
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ScrollArea className="flex-1">
                                <div className="p-8 max-w-7xl mx-auto space-y-10 pb-32">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Governance Review</span>
                                            <ChevronRight className="h-3 w-3" />
                                            <span className="text-primary">{selectedDef.module}</span>
                                        </div>
                                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{selectedDef.name}</h1>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 h-6 gap-1.5 px-2.5 font-bold">
                                                <AlertCircle className="h-3 w-3" />
                                                Reviewing visual differences between versions
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Review History Audit Trail */}
                                    {selectedDef.discussions && selectedDef.discussions.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                    Review History
                                                </h3>
                                                <div className="h-px bg-slate-200 flex-1" />
                                            </div>
                                            <div className="space-y-4">
                                                {selectedDef.discussions.map((msg) => (
                                                    <Card key={msg.id} className={cn(
                                                        "p-4 rounded-xl border-slate-200 shadow-sm",
                                                        msg.type === 'change-request' ? "bg-amber-50/30 border-amber-100" :
                                                        msg.type === 'rejection' ? "bg-red-50/30 border-red-100" : "bg-white"
                                                    )}>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={msg.avatar} />
                                                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 text-xs">{msg.author}</span>
                                                                <span className="text-[10px] text-slate-400 uppercase font-black">{new Date(msg.date).toLocaleDateString()}</span>
                                                            </div>
                                                            {msg.type !== 'comment' && (
                                                              <Badge className={cn(
                                                                "ml-auto text-[9px] uppercase font-black",
                                                                msg.type === 'rejection' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                                              )}>
                                                                {msg.type === 'rejection' ? 'Rejected' : 'Changes Requested'}
                                                              </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-700 m-0 leading-relaxed font-medium">"{msg.content}"</p>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Full Width Comparison List */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                Visual Field Analysis
                                            </h3>
                                            <div className="h-px bg-slate-200 flex-1" />
                                        </div>
                                        
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

                                        <ComparisonSection 
                                            title="Technical Details" 
                                            published={selectedDef.publishedSnapshot?.technicalDetails}
                                            submitted={selectedDef.technicalDetails}
                                            isHtml
                                        />

                                        <ComparisonSection 
                                            title="Usage Examples" 
                                            published={selectedDef.publishedSnapshot?.usageExamples}
                                            submitted={selectedDef.usageExamples}
                                            isHtml
                                        />
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