
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    AlertTriangle, 
    CheckCircle2, 
    ChevronRight, 
    FileText, 
    Users, 
    Clock, 
    ShieldCheck,
    ArrowUpRight,
    Play
} from 'lucide-react';
import type { Definition, UserAccount, Template, View, ApprovalHistoryEntry, ActivityLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { parseISO, subDays } from 'date-fns';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
  approvalHistory?: ApprovalHistoryEntry[];
  activityLogs?: ActivityLog[];
};

export default function Dashboard({ definitions, drafts, users, templates, onNavigate, approvalHistory = [] }: DashboardProps) {
  const metrics = useMemo(() => {
    const allPublished = definitions.flatMap(d => [d, ...(d.children || [])]).filter(d => !d.isDraft && !d.isPendingApproval && !d.isArchived);
    const allArchived = definitions.flatMap(d => [d, ...(d.children || [])]).filter(d => d.isArchived);
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    
    const pending = safeDrafts.filter(d => d.isPendingApproval);
    const draftOnly = safeDrafts.filter(d => d.isDraft && !d.isPendingApproval);
    const feedback = safeDrafts.filter(d => (d.discussions || []).some(m => m.type === 'change-request' || m.type === 'rejection'));

    // Needs Attention List (Mocked logic based on drafts/pending)
    const needsAttentionItems = safeDrafts.filter(d => d.isPendingApproval || (d.discussions || []).length > 0).slice(0, 4).map(d => ({
        id: d.id,
        name: d.name,
        code: `DEF-${Math.floor(2000 + Math.random() * 500)}`,
        status: d.isPendingApproval ? 'Pending Approval' : 'Changes Requested',
        submittedBy: d.submittedBy || 'Unknown',
        waiting: `${Math.floor(Math.random() * 5) + 1} days`,
        stage: d.isPendingApproval ? 'Sent for Approval' : 'Awaiting resubmission',
        avatar: `https://picsum.photos/seed/${d.id}/40/40`
    }));

    return {
      total: allPublished.length + allArchived.length + safeDrafts.length,
      published: allPublished.length,
      pending: pending.length,
      drafts: draftOnly.length,
      archived: allArchived.length,
      rejected: feedback.filter(d => (d.discussions || []).some(m => m.type === 'rejection')).length,
      changesRequested: feedback.filter(d => (d.discussions || []).some(m => m.type === 'change-request')).length,
      needsAttention: needsAttentionItems,
      awaitingAction: 6, // Hardcoded for demo/UI match
    };
  }, [definitions, drafts]);

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto pb-32">
      {/* TOP HEADER */}
      <div className="flex justify-between items-center px-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold gap-1.5 h-8 px-4 rounded-full shadow-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Live
          </Badge>
          <div className="h-9 w-9 rounded-xl bg-[#3F51B5] text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-100">
            SA
          </div>
        </div>
      </div>

      {/* NEEDS ATTENTION SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <AlertTriangle className="h-3 w-3" />
                Needs Attention
            </div>
            <span className="text-[11px] font-bold text-slate-400">6 items • oldest waiting 5 days</span>
        </div>
        <Card className="rounded-[24px] border-slate-100 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 h-12">
                            <th className="pl-8 font-black uppercase text-[10px] tracking-widest text-slate-400">Definition</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Submitted By</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Waiting</th>
                            <th className="px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Stage</th>
                            <th className="pr-8 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {metrics.needsAttention.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="pl-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.code}</span>
                                    </div>
                                </td>
                                <td className="px-6">
                                    <Badge className={cn(
                                        "h-7 rounded-lg text-[10px] font-black uppercase gap-1.5 border shadow-sm",
                                        item.status === 'Pending Approval' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100"
                                    )}>
                                        <div className={cn("h-1 w-1 rounded-full", item.status === 'Pending Approval' ? "bg-blue-600" : "bg-pink-600")} />
                                        {item.status}
                                    </Badge>
                                </td>
                                <td className="px-6">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                            <AvatarImage src={item.avatar} />
                                            <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{item.submittedBy[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-bold text-slate-700">{item.submittedBy}</span>
                                    </div>
                                </td>
                                <td className="px-6">
                                    <span className={cn("text-xs font-black", item.waiting === '5 days' ? "text-red-500" : "text-slate-900")}>
                                        {item.waiting}
                                    </span>
                                </td>
                                <td className="px-6">
                                    <span className="text-xs font-medium text-slate-400">{item.stage}</span>
                                </td>
                                <td className="pr-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 text-[11px]">Approve</Button>
                                        <Button variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 text-slate-700 font-bold px-4 text-[11px] bg-white" onClick={() => onNavigate('definitions')}>View</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>

      {/* DEFINITIONS OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <FileText className="h-3 w-3" />
            Definitions Overview
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard title="Total Definitions" value={metrics.total} badge="+3 this week" />
            <KPICard title="Published" value={metrics.published} badge={`${Math.round((metrics.published / metrics.total) * 100)}% of total`} />
            <KPICard title="Pending Approval" value={metrics.pending} badge="Avg wait 3.2d" badgeColor="bg-amber-50 text-amber-600" />
            <Card className="rounded-[24px] bg-[#6366F1] p-6 shadow-lg shadow-indigo-200 text-white flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-16 w-16" />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Awaiting Your Action</h4>
                    <p className="text-4xl font-black mt-1">{metrics.awaitingAction}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Live</span>
                    <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px]">Jump to Queue</Button>
                </div>
            </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DEFINITION LIFECYCLE */}
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-900">Definition Lifecycle</h3>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total <span className="text-slate-900">{metrics.total}</span> definitions</span>
            </div>

            <div className="flex items-center gap-1.5 w-full mb-10 overflow-hidden">
                <LifecycleStep count={6} label="Draft" color="text-amber-500 bg-amber-50/50" />
                <StepArrow />
                <LifecycleStep count={3} label="Sent for Approval" color="text-indigo-500 bg-indigo-50/50" />
                <StepArrow />
                <LifecycleStep count={4} label="Pending Approval" color="text-blue-500 bg-blue-50/50" />
                <StepArrow />
                <LifecycleStep count={2} label="Changes Requested" color="text-pink-500 bg-pink-50/50" />
                <StepArrow />
                <LifecycleStep count={1} label="Rejected" color="text-red-500 bg-red-50/50" />
                <StepArrow />
                <LifecycleStep count={10} label="Published" color="text-emerald-500 bg-emerald-50/50" />
                <div className="w-8 shrink-0" />
                <LifecycleStep count={4} label="Archived" color="text-slate-400 bg-slate-100/50" />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">3 duplicated from published</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1"><span className="text-slate-900">33%</span> draft → published conversion (30d)</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight"><span className="text-slate-900">1.8 days</span> avg approval time</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
                <LifecycleLegend label="Draft" color="bg-amber-500" />
                <LifecycleLegend label="Sent for Approval" color="bg-indigo-500" />
                <LifecycleLegend label="Pending Approval" color="bg-blue-600" />
                <LifecycleLegend label="Changes Requested" color="bg-pink-500" />
                <LifecycleLegend label="Rejected" color="bg-red-500" />
                <LifecycleLegend label="Published" color="bg-emerald-500" />
                <LifecycleLegend label="Archived" color="bg-slate-400" />
            </div>
          </Card>

          {/* TEMPLATE ARCHITECTURE */}
          <Card className="rounded-[28px] border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-900">Template Architecture</h3>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total <span className="text-slate-900">7</span> templates</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <p className="text-2xl font-black text-slate-900 leading-none">5</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Active</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <p className="text-2xl font-black text-slate-300 leading-none">2</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Inactive</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
                <ModuleBadge label="Authorization" count={1} color="bg-indigo-600" />
                <ModuleBadge label="Claims" count={2} color="bg-blue-500" />
                <ModuleBadge label="Provider" count={1} color="bg-emerald-500" />
                <ModuleBadge label="Member" count={1} color="bg-orange-400" />
                <ModuleBadge label="Other" count={2} color="bg-slate-500" />
            </div>

            <div className="space-y-6">
                <TemplateUsageRow label="Standard Approval Flow" module="Authorization" usage={18} max={25} />
                <TemplateUsageRow label="Two-Stage Sign-off" module="Claims" usage={11} max={25} />
                <TemplateUsageRow label="Risk Definition Base" module="Provider" usage={7} max={25} />
            </div>
          </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, badge, badgeColor = "bg-slate-50 text-slate-500" }: { title: string, value: any, badge: string, badgeColor?: string }) {
    return (
        <Card className="rounded-[24px] border-slate-100 bg-white p-6 shadow-sm">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</h4>
                <p className="text-4xl font-black text-slate-900">{value}</p>
                <div className={cn("inline-flex h-6 px-3 rounded-full text-[9px] font-black uppercase items-center border border-transparent shadow-sm", badgeColor)}>
                    {badge}
                </div>
            </div>
        </Card>
    );
}

function LifecycleStep({ count, label, color }: { count: number, label: string, color: string }) {
    return (
        <div className={cn("h-20 flex-1 min-w-[70px] rounded-xl p-3 flex flex-col justify-center border border-slate-100/50 shadow-sm", color)}>
            <span className="text-xl font-black tabular-nums leading-none">{count}</span>
            <span className="text-[9px] font-black uppercase leading-tight mt-2 opacity-80">{label}</span>
        </div>
    );
}

function StepArrow() {
    return (
        <div className="h-6 w-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mx-[-4px] relative z-10">
            <ChevronRight className="h-3 w-3 text-slate-300" />
        </div>
    );
}

function LifecycleLegend({ label, color }: { label: string, color: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-[2px]", color)} />
            <span className="text-[10px] font-bold text-slate-500">{label}</span>
        </div>
    );
}

function ModuleBadge({ label, count, color }: { label: string, count: number, color: string }) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-100 bg-white shadow-sm">
            <div className={cn("h-1.5 w-1.5 rounded-full", color)} />
            <span className="text-[10px] font-bold text-slate-600">{label}</span>
            <span className="text-[10px] font-black text-slate-300 ml-1">{count}</span>
        </div>
    );
}

function TemplateUsageRow({ label, module, usage, max }: { label: string, module: string, usage: number, max: number }) {
    const percentage = (usage / max) * 100;
    const colors: Record<string, string> = {
        'Authorization': 'bg-indigo-600',
        'Claims': 'bg-blue-500',
        'Provider': 'bg-emerald-500'
    };
    
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-slate-900">{label}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", colors[module].replace('bg-', 'text-'))}>{module}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{usage} uses</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", colors[module])} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}
