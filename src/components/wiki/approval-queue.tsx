
"use client";

import React, { useState, useMemo } from 'react';
import type { Definition } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle2, XCircle, RefreshCcw, User, ChevronRight, ShieldCheck, AlertCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import ChangeRequestModal from './change-request-modal';
import diff_match_patch from 'diff-match-patch';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const dmp = new diff_match_patch();

type ApprovalQueueProps = {
    pendingDefinitions: Definition[];
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

export default function ApprovalQueue({ pendingDefinitions, onApprove, onReject }: ApprovalQueueProps) {
    const [selectedId, setSelectedId] = useState<string | null>(pendingDefinitions[0]?.id || null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackMode, setFeedbackMode] = useState<'request' | 'reject'>('request');

    const selectedDef = useMemo(() => pendingDefinitions.find(d => d.id === selectedId), [pendingDefinitions, selectedId]);

    const handleActionClick = (mode: 'request' | 'reject') => {
        setFeedbackMode(mode);
        setIsFeedbackModalOpen(true);
    };

    const handleFeedbackSubmit = (data: { content: string }) => {
        if (!selectedId) return;
        onReject(selectedId, data.content, feedbackMode === 'reject');
        const nextIdx = pendingDefinitions.findIndex(d => d.id === selectedId) + 1;
        setSelectedId(pendingDefinitions[nextIdx]?.id || null);
    };

    const handleApprove = () => {
        if (!selectedId) return;
        onApprove(selectedId);
        const nextIdx = pendingDefinitions.findIndex(d => d.id === selectedId) + 1;
        setSelectedId(pendingDefinitions[nextIdx]?.id || null);
    };

    if (pendingDefinitions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                <div className="h-20 w-20 rounded-full bg-white shadow-sm border flex items-center justify-center mb-6"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
                <h2 className="text-2xl font-bold text-slate-900">All caught up!</h2>
                <p className="text-slate-500 max-w-sm mt-2">There are no pending definitions requiring your review at this time.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden bg-slate-50/30">
            <div className="w-80 border-r bg-white flex flex-col shrink-0 shadow-sm z-10">
                <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
                    <div><h2 className="text-lg font-bold tracking-tight text-slate-900">Queue</h2><p className="text-xs text-slate-500">Items for review</p></div>
                    <Badge className="bg-primary/10 text-primary font-bold">{pendingDefinitions.length}</Badge>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-1">
                        {pendingDefinitions.map(def => (
                            <button key={def.id} onClick={() => setSelectedId(def.id)} className={cn("w-full text-left p-4 rounded-xl transition-all border", selectedId === def.id ? "bg-indigo-50 border-indigo-100 ring-1 ring-indigo-100" : "bg-transparent border-transparent hover:bg-slate-50")}>
                                <div className="flex items-start justify-between gap-2"><span className={cn("text-[13px] font-bold truncate flex-1", selectedId === def.id ? "text-indigo-900" : "text-slate-700")}>{def.name}</span><Badge variant="outline" className="h-5 px-1.5 text-[9px] uppercase font-black bg-white">{def.module}</Badge></div>
                                <div className="flex items-center gap-2 mt-2.5"><span className="text-[11px] font-medium text-slate-500 truncate">{def.submittedBy || "System"}</span><span className="text-slate-300">•</span><span className="text-[10px] font-bold text-slate-400 uppercase">{def.submittedAt ? format(new Date(def.submittedAt), 'MMM dd') : 'Recent'}</span></div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {selectedDef ? (
                    <>
                        <div className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div>
                                <div><p className="text-sm font-bold">Reviewing <span className="text-primary">{selectedDef.name}</span></p><p className="text-[11px] text-slate-500">Submitted by <span className="font-bold">{selectedDef.submittedBy}</span> • {selectedDef.submittedAt ? formatDistanceToNow(new Date(selectedDef.submittedAt), { addSuffix: true }) : 'Recently'}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" className="rounded-xl text-red-600 font-bold bg-white" onClick={() => handleActionClick('reject')}>Reject</Button>
                                <Button variant="outline" size="sm" className="rounded-xl text-amber-600 font-bold bg-white" onClick={() => handleActionClick('request')}>Request Changes</Button>
                                <Button size="sm" className="rounded-xl bg-[#3F51B5] text-white font-bold px-6" onClick={handleApprove}><ShieldCheck className="h-4 w-4 mr-2" />Approve & Publish</Button>
                            </div>
                        </div>
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
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20"><History className="h-12 w-12 text-slate-300 mb-4" /><h3 className="text-lg font-bold">Select a request to review</h3></div>
                )}
            </div>

            <ChangeRequestModal open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen} definitionName={selectedDef?.name || ''} title={feedbackMode === 'reject' ? "Reject Submission" : "Request Changes"} description={feedbackMode === 'reject' ? "Explain why this submission is being rejected. It will return to the author as a draft." : "Specify necessary updates."} buttonText={feedbackMode === 'reject' ? "Confirm Rejection" : "Send Request"} showPriority={feedbackMode === 'request'} isRejection={feedbackMode === 'reject'} onSend={handleFeedbackSubmit} />
        </div>
    );
}
