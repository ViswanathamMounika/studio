
"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { type Revision, type Definition, type Template, type TemplateSection, type SectionValue } from "@/lib/types";
import { diff_match_patch, type Diff } from 'diff-match-patch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { History, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { initialTemplates } from "@/lib/data";

const dmp = new diff_match_patch();

type RevisionComparisonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision1: Revision;
  revision2: Revision;
  definition: Definition;
  templates?: Template[];
};

function createDiffHtml(diffs: Diff[], type: 'insertion' | 'deletion'): string {
    let html = '';
    for (const [op, text] of diffs) {
        if (op === 0) {
            html += text;
        } else if (op === 1 && type === 'insertion') {
            html += `<ins class="bg-green-100 text-green-900 border-b border-green-200 no-underline font-bold">${text}</ins>`;
        } else if (op === -1 && type === 'deletion') {
            html += `<del class="bg-red-100 text-red-900 border-b border-red-200 no-underline">${text}</del>`;
        }
    }
    return html;
}

function getSectionDisplayValue(section: TemplateSection, value?: SectionValue): string {
    if (!value) return '';
    if (section.fieldType === 'KeyValue') {
        if (!value.structuredRows?.length) return '';
        return value.structuredRows.map(row => 
            Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | ')
        ).join('\n');
    }
    if (section.fieldType === 'Dropdown' && section.isMulti) {
        return (value.multiValues || []).join(', ');
    }
    return value.raw || '';
}

export default function RevisionComparisonDialog({
  open,
  onOpenChange,
  revision1,
  revision2,
  definition,
  templates
}: RevisionComparisonDialogProps) {
    const isConflictMode = revision1.ticketId === 'LIVE' || revision2.ticketId === 'DRAFT';
    
    const [revA, revB] = useMemo(() => {
        if (isConflictMode) return [revision1, revision2];
        return [revision1, revision2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [revision1, revision2, isConflictMode]);
    
    const [scrollMode, setScrollMode] = useState<'sync' | 'independent'>('sync');
    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const isSyncingRef = useRef(false);

    const handleScroll = (source: 'left' | 'right') => {
        if (scrollMode !== 'sync' || isSyncingRef.current) return;
        const sourceEl = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
        const targetEl = source === 'left' ? rightScrollRef.current : leftScrollRef.current;
        if (sourceEl && targetEl) {
            isSyncingRef.current = true;
            targetEl.scrollTop = sourceEl.scrollTop;
            setTimeout(() => { isSyncingRef.current = false; }, 50);
        }
    };

    const comparisonGroups = useMemo(() => {
        const groups: { label: string; diffs: Diff[] }[] = [];
        
        // 1. Categorization Metadata
        const nameDiff = dmp.diff_main(revA.snapshot.name || '', revB.snapshot.name || '');
        dmp.diff_cleanupSemantic(nameDiff);
        groups.push({ label: 'Definition Name', diffs: nameDiff });

        const moduleDiff = dmp.diff_main(revA.snapshot.module || '', revB.snapshot.module || '');
        dmp.diff_cleanupSemantic(moduleDiff);
        groups.push({ label: 'Module', diffs: moduleDiff });

        const keywordsDiff = dmp.diff_main((revA.snapshot.keywords || []).join(', '), (revB.snapshot.keywords || []).join(', '));
        dmp.diff_cleanupSemantic(keywordsDiff);
        groups.push({ label: 'Keywords', diffs: keywordsDiff });

        // 2. Template-defined sections
        const activeTemplate = (templates || initialTemplates).find(t => t.id === definition.templateId) || (templates || initialTemplates)[0];
        if (activeTemplate) {
            const sortedSections = [...activeTemplate.sections].sort((a, b) => a.order - b.order);
            sortedSections.forEach(section => {
                const valA = getSectionDisplayValue(section, (revA.snapshot.sectionValues || []).find(v => v.sectionId === section.id));
                const valB = getSectionDisplayValue(section, (revB.snapshot.sectionValues || []).find(v => v.sectionId === section.id));
                const diff = dmp.diff_main(valA, valB);
                dmp.diff_cleanupSemantic(diff);
                groups.push({ label: section.name, diffs: diff });
            });
        }

        // 3. Fallback for legacy text fields
        const legacyFields = [
            { key: 'description', label: 'Root Description' },
            { key: 'shortDescription', label: 'Short Summary' },
            { key: 'technicalDetails', label: 'Logic Specification' }
        ];

        legacyFields.forEach(field => {
            const valA = (revA.snapshot as any)[field.key] || '';
            const valB = (revB.snapshot as any)[field.key] || '';
            if (valA !== valB) {
                const diff = dmp.diff_main(valA, valB);
                dmp.diff_cleanupSemantic(diff);
                groups.push({ label: field.label, diffs: diff });
            }
        });

        return groups;
    }, [revA, revB, definition.templateId, templates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden gap-0 border-none rounded-[24px]">
        <DialogHeader className="p-6 border-b bg-white sticky top-0 z-20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <History className="h-5 w-5 text-slate-600" />
            </div>
            <div>
                <DialogTitle className="text-xl font-bold">
                    {isConflictMode ? `Merge Review: ${definition.name}` : `Version Comparison: ${definition.name}`}
                </DialogTitle>
                <p className="text-xs text-slate-500 font-medium">Auditing all metadata and section improvements between selected versions.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync Scrolling</span>
                    <RadioGroup 
                        value={scrollMode} 
                        onValueChange={(val) => setScrollMode(val as 'sync' | 'independent')}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sync" id="sync" className="h-3.5 w-3.5 border-slate-300" />
                            <Label htmlFor="sync" className="text-xs font-bold cursor-pointer text-slate-600">On</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="independent" id="independent" className="h-3.5 w-3.5 border-slate-300" />
                            <Label htmlFor="independent" className="text-xs font-bold cursor-pointer text-slate-600">Off</Label>
                        </div>
                    </RadioGroup>
                </div>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-400" />
                    </Button>
                </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 grid grid-cols-2">
            {/* Left Panel - Source/Old */}
            <div className="flex flex-col border-r bg-slate-50/30 overflow-hidden">
                <div className="px-8 py-4 border-b bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">{revA.description}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">By {revA.developer} • {revA.date}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-black text-red-600 bg-red-50 border-red-100 h-6">Original</Badge>
                </div>
                <div ref={leftScrollRef} onScroll={() => handleScroll('left')} className="flex-1 overflow-y-auto p-10 space-y-12">
                    {comparisonGroups.map((group, gIdx) => (
                        <section key={`left-group-${gIdx}`}>
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">{group.label}</h4>
                            <div 
                                className="prose prose-sm max-w-none bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium" 
                                dangerouslySetInnerHTML={{ __html: createDiffHtml(group.diffs, 'deletion') || '<p class="italic text-slate-400">Not specified.</p>' }} 
                            />
                        </section>
                    ))}
                </div>
            </div>

            {/* Right Panel - Target/New */}
            <div className="flex flex-col bg-slate-50/30 overflow-hidden">
                <div className="px-8 py-4 border-b bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">{revB.description}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">By {revB.developer} • {revB.date}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-black text-emerald-600 bg-emerald-50 border-emerald-100 h-6">Comparison</Badge>
                </div>
                <div ref={rightScrollRef} onScroll={() => handleScroll('right')} className="flex-1 overflow-y-auto p-10 space-y-12">
                    {comparisonGroups.map((group, gIdx) => (
                        <section key={`right-group-${gIdx}`}>
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">{group.label}</h4>
                            <div 
                                className="prose prose-sm max-w-none bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium" 
                                dangerouslySetInnerHTML={{ __html: createDiffHtml(group.diffs, 'insertion') || '<p class="italic text-slate-400">Not specified.</p>' }} 
                            />
                        </section>
                    ))}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
