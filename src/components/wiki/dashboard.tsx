
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Activity,
    PieChart as PieChartIcon,
    BarChart3,
    ArrowUpRight
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import type { Definition, UserAccount, Template, View } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
};

export default function Dashboard({ definitions, drafts, users, templates, onNavigate }: DashboardProps) {
  
  // -- DATA PROCESSING --
  
  const countDefinitions = (items: Definition[]): { published: number, archived: number } => {
    let published = 0;
    let archived = 0;
    items.forEach(item => {
      if (item.description || item.shortDescription) {
        if (item.isArchived) archived++;
        else published++;
      }
      if (item.children) {
        const childCounts = countDefinitions(item.children);
        published += childCounts.published;
        archived += childCounts.archived;
      }
    });
    return { published, archived };
  };

  const stats = useMemo(() => {
    const pubStats = countDefinitions(definitions);
    const pending = drafts.filter(d => d.isPendingApproval).length;
    const draftOnly = drafts.filter(d => d.isDraft && !d.isPendingApproval).length;
    const rejected = drafts.filter(d => (d.discussions || []).some(m => m.type === 'rejection')).length;
    
    return {
        published: pubStats.published,
        archived: pubStats.archived,
        pending,
        draft: draftOnly,
        rejected,
        total: pubStats.published + pubStats.archived + drafts.length
    };
  }, [definitions, drafts]);

  const definitionStatusData = useMemo(() => [
    { name: 'Published', value: stats.published, color: '#10b981' }, // emerald-500
    { name: 'Pending Review', value: stats.pending, color: '#3b82f6' }, // blue-500
    { name: 'Drafts', value: stats.draft, color: '#f59e0b' }, // amber-500
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' }, // red-500
    { name: 'Archived', value: stats.archived, color: '#94a3b8' }, // slate-400
  ].filter(d => d.value > 0), [stats]);

  const userRoleData = useMemo(() => {
    const roles = ['Super Admin', 'Admin', 'Approver', 'Standard User'];
    return roles.map(role => ({
        name: role,
        count: users.filter(u => u.role === role).length
    }));
  }, [users]);

  const templateUsageData = useMemo(() => {
    const usageMap: Record<string, number> = {};
    const countUsage = (items: Definition[]) => {
        items.forEach(item => {
            if (item.templateId) usageMap[item.templateId] = (usageMap[item.templateId] || 0) + 1;
            if (item.children) countUsage(item.children);
        });
    };
    countUsage(definitions);
    countUsage(drafts);

    return templates.map(t => ({
        name: t.name,
        usage: usageMap[t.id] || 0
    })).sort((a, b) => b.usage - a.usage).slice(0, 5);
  }, [definitions, drafts, templates]);

  // -- COMPONENTS --

  const SummaryCard = ({ title, value, icon: Icon, colorClass, onClick }: any) => (
    <Card 
        className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer bg-white group overflow-hidden"
        onClick={onClick}
    >
      <div className={cn("h-1.5 w-full", colorClass)} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-2.5 rounded-xl transition-colors bg-slate-50 border border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/5")}>
                <Icon className={cn("h-5 w-5", colorClass.replace('bg-', 'text-'))} />
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </Button>
        </div>
        <div className="space-y-1">
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest leading-none">
                {title}
            </p>
            <div className="text-3xl font-black tracking-tight text-slate-900">{value}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-32">
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-muted-foreground font-medium italic">High-level operational overview of application health and library metrics.</p>
        </div>
        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold gap-1.5 h-8 px-4 rounded-xl">
            <Activity className="h-3.5 w-3.5" />
            System Live
        </Badge>
      </div>

      {/* --- TOP SUMMARY ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="User Directory" 
            value={users.length} 
            icon={Users} 
            colorClass="bg-indigo-500"
            onClick={() => onNavigate('user-management')}
          />
          <SummaryCard 
            title="Live Definitions" 
            value={stats.published} 
            icon={CheckCircle2} 
            colorClass="bg-emerald-500"
            onClick={() => onNavigate('definitions')}
          />
          <SummaryCard 
            title="Pending Review" 
            value={stats.pending} 
            icon={Clock} 
            colorClass="bg-blue-500"
            onClick={() => onNavigate('approval-workflow')}
          />
          <SummaryCard 
            title="Total Blueprints" 
            value={templates.length} 
            icon={LayoutTemplate} 
            colorClass="bg-violet-500"
            onClick={() => onNavigate('template-management')}
          />
      </div>

      {/* --- CHARTS ROW 1: CONTENT & ROLES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Definition Status Breakdown (Pie) */}
          <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50/50 border-b py-5 px-8 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <PieChartIcon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Library Lifecycle</CardTitle>
                        <CardDescription className="text-xs">Definition status distribution</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex-1">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={definitionStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {definitionStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                formatter={(value) => <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
              </CardContent>
          </Card>

          {/* User Role Breakdown (Bar) */}
          <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50/50 border-b py-5 px-8 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Users2 className="h-4.5 w-4.5 text-indigo-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">User Population</CardTitle>
                        <CardDescription className="text-xs">Active accounts by system role</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex-1">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userRoleData} layout="vertical" margin={{ left: 20, right: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                width={100}
                            />
                            <RechartsTooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar 
                                dataKey="count" 
                                fill="#6366f1" 
                                radius={[0, 8, 8, 0]} 
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </CardContent>
          </Card>
      </div>

      {/* --- CHARTS ROW 2: TEMPLATE ADOPTION --- */}
      <div className="grid grid-cols-1 gap-8">
          <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
                <CardHeader className="bg-white border-b py-5 px-8 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center">
                            <BarChart3 className="h-4.5 w-4.5 text-violet-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">Blueprint Adoption</CardTitle>
                            <CardDescription className="text-xs">Top 5 templates by documentation volume</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10 flex-1">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={templateUsageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar 
                                    dataKey="usage" 
                                    fill="#8b5cf6" 
                                    radius={[8, 8, 0, 0]} 
                                    barSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
          </Card>
      </div>

      {/* --- QUICK ACTION SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[28px] border-slate-200 bg-white p-8 group hover:border-primary/20 transition-all border-dashed border-2">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:scale-110 transition-all duration-300 shadow-inner">
                        <ShieldCheck className="h-7 w-7 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">Security Audit</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Review and refine functional system permissions and role mappings.</p>
                        <Button variant="link" className="p-0 h-auto mt-3 text-indigo-600 font-bold" onClick={() => onNavigate('user-management')}>
                            Manage Access Control <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-white p-8 group hover:border-primary/20 transition-all border-dashed border-2">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:scale-110 transition-all duration-300 shadow-inner">
                        <FileText className="h-7 w-7 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">Master Data Registry</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Govern global system constants, modules, and reference categories.</p>
                        <Button variant="link" className="p-0 h-auto mt-3 text-emerald-600 font-bold" onClick={() => onNavigate('master-data-management')}>
                            Configure Master Data <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>
      </div>
    </div>
  );
}
