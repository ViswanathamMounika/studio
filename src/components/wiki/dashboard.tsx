
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Users, 
    FileText, 
    LayoutTemplate, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    FileEdit,
    Users2,
    ShieldCheck,
    UserCheck,
    UserX,
    Activity
} from 'lucide-react';
import type { Definition, UserAccount, Template, View } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
};

export default function Dashboard({ definitions, drafts, users, templates, onNavigate }: DashboardProps) {
  
  // -- CONTENT METRICS --
  const countDefinitions = (items: Definition[]): number => {
    let count = 0;
    items.forEach(item => {
      if (item.description || item.shortDescription) {
        count++;
      }
      if (item.children) {
        count += countDefinitions(item.children);
      }
    });
    return count;
  };

  const publishedCount = useMemo(() => countDefinitions(definitions), [definitions]);
  const pendingCount = useMemo(() => drafts.filter(d => d.isPendingApproval).length, [drafts]);
  const draftCount = useMemo(() => drafts.filter(d => d.isDraft && !d.isPendingApproval).length, [drafts]);
  const rejectedCount = useMemo(() => drafts.filter(d => d.discussions?.some(m => m.type === 'rejection')).length, [drafts]);
  const totalDefinitions = publishedCount + drafts.length;

  // -- USER METRICS --
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const inactiveUsers = users.filter(u => u.status === 'Inactive').length;

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
        counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  // -- TEMPLATE METRICS --
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.isActive).length;

  const SummaryCard = ({ title, value, label, icon: Icon, color, onClick }: any) => (
    <Card 
        className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer bg-white group"
        onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-xl transition-colors", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
            {label}
        </p>
      </CardContent>
    </Card>
  );

  const SubMetricCard = ({ label, value, icon: Icon, colorClass, status }: any) => (
    <Card className="rounded-xl p-4 bg-slate-50/50 border-slate-200 shadow-none flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-white border", colorClass)}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-lg font-bold text-slate-900 leading-none">{value}</p>
            </div>
        </div>
        {status && <Badge variant="outline" className="bg-white text-[9px] font-black uppercase border-slate-200">{status}</Badge>}
    </Card>
  );

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-32">
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-muted-foreground font-medium italic">High-level operational overview of MedPoint Wiki assets and activity.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold gap-1.5 h-8 px-4 rounded-xl">
            <Activity className="h-3.5 w-3.5" />
            System Live
        </Badge>
      </div>

      {/* --- USER ANALYTICS --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Identity & Access Management</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
                <SummaryCard 
                    title="User Directory" 
                    value={totalUsers} 
                    label="Total Registered Accounts"
                    icon={Users} 
                    color="text-indigo-600 bg-indigo-50"
                    onClick={() => onNavigate('user-management')}
                />
                <div className="grid grid-cols-2 gap-4">
                    <SubMetricCard label="Active" value={activeUsers} icon={UserCheck} colorClass="text-emerald-600 border-emerald-100" />
                    <SubMetricCard label="Inactive" value={inactiveUsers} icon={UserX} colorClass="text-slate-400 border-slate-200" />
                </div>
            </div>

            <Card className="lg:col-span-2 rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Users2 className="h-3.5 w-3.5" />
                        Role Population Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-6">
                        {Object.entries(roleBreakdown).map(([role, count]) => (
                            <div key={role} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-bold text-slate-600">{role}</span>
                                    <span className="text-sm font-black text-primary">{count}</span>
                                </div>
                                <Progress 
                                    value={(count / totalUsers) * 100} 
                                    className="h-1.5 bg-slate-100" 
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* --- DOCUMENTATION ASSETS --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Knowledge Assets & Library</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard 
            title="Total Assets" 
            value={totalDefinitions} 
            label="Library Size"
            icon={Activity} 
            color="text-slate-900 bg-slate-100"
            onClick={() => onNavigate('definitions')}
          />
          <SummaryCard 
            title="Published" 
            value={publishedCount} 
            label="Live Definitions"
            icon={CheckCircle2} 
            color="text-emerald-600 bg-emerald-50"
            onClick={() => onNavigate('definitions')}
          />
          <SummaryCard 
            title="Under Review" 
            value={pendingCount} 
            label="Pending Approvals"
            icon={Clock} 
            color="text-blue-600 bg-blue-50"
            onClick={() => onNavigate('approval-workflow')}
          />
          <SummaryCard 
            title="Drafts" 
            value={draftCount} 
            label="In-Progress Items"
            icon={FileEdit} 
            color="text-amber-600 bg-amber-50"
            onClick={() => onNavigate('definitions')}
          />
          <SummaryCard 
            title="Rejected" 
            value={rejectedCount} 
            label="Awaiting Revision"
            icon={XCircle} 
            color="text-red-600 bg-red-50"
            onClick={() => onNavigate('definitions')}
          />
        </div>
      </div>

      {/* --- TEMPLATE GOVERNANCE --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <LayoutTemplate className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Documentation Standards</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
                <SummaryCard 
                    title="Blueprints" 
                    value={totalTemplates} 
                    label="Managed Templates"
                    icon={LayoutTemplate} 
                    color="text-indigo-600 bg-indigo-50"
                    onClick={() => onNavigate('template-management')}
                />
            </div>
            <div className="flex items-center">
                <Card className="rounded-[24px] border-slate-200 bg-white shadow-sm flex items-center p-6 gap-6 w-full">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Blueprint Health</p>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{activeTemplates} Active Patterns</div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">Available for new definitions</p>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
