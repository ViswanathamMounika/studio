
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Users, 
    FileText, 
    LayoutTemplate, 
    Activity,
    Users2,
    BarChart3,
    Trophy,
    Target
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

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
};

// Helper moved outside to prevent re-definition on render and add robustness
const countPublishedDefinitions = (items: Definition[]): number => {
  if (!Array.isArray(items)) return 0;
  let count = 0;
  items.forEach(item => {
    if (item && (item.description || item.shortDescription)) {
      if (!item.isArchived) count++;
    }
    if (item && item.children && item.children.length > 0) {
      count += countPublishedDefinitions(item.children);
    }
  });
  return count;
};

export default function Dashboard({ definitions, drafts, users, templates, onNavigate }: DashboardProps) {
  
  // -- DATA PROCESSING --
  
  const metrics = useMemo(() => {
    const safeDefinitions = Array.isArray(definitions) ? definitions : [];
    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeTemplates = Array.isArray(templates) ? templates : [];

    const published = countPublishedDefinitions(safeDefinitions);
    const pending = safeDrafts.filter(d => d?.isPendingApproval).length;
    const draft = safeDrafts.filter(d => d?.isDraft && !d?.isPendingApproval).length;
    const rejected = safeDrafts.filter(d => (d?.discussions || []).some(m => m.type === 'rejection')).length;

    // Calculate usage per template
    const usageData = safeTemplates.map(t => {
        let usage = 0;
        const countUsage = (items: Definition[]) => {
            items.forEach(item => {
                if (item && item.templateId === t.id) usage++;
                if (item && item.children) countUsage(item.children);
            });
        };
        countUsage(safeDefinitions);
        countUsage(safeDrafts);
        return { 
            name: t.name, 
            usage,
            isActive: t.isActive 
        };
    }).sort((a, b) => b.usage - a.usage);
    
    return {
        // User Metrics
        totalUsers: safeUsers.length,
        activeUsers: safeUsers.filter(u => u.status === 'Active').length,
        inactiveUsers: safeUsers.filter(u => u.status === 'Inactive').length,
        
        // Definition Metrics
        totalDefinitions: published + safeDrafts.length,
        publishedDefinitions: published,
        draftDefinitions: draft,
        pendingApprovals: pending,
        rejectedDefinitions: rejected,

        // Template Metrics
        totalTemplates: safeTemplates.length,
        activeTemplates: safeTemplates.filter(t => t.isActive).length,
        templateUsage: usageData
    };
  }, [definitions, drafts, users, templates]);

  // Data for Definition Pie Chart
  const definitionChartData = useMemo(() => [
    { name: 'Published', value: metrics.publishedDefinitions, color: '#10b981' }, 
    { name: 'Pending Approval', value: metrics.pendingApprovals, color: '#3b82f6' }, 
    { name: 'Draft', value: metrics.draftDefinitions, color: '#f59e0b' }, 
    { name: 'Rejected', value: metrics.rejectedDefinitions, color: '#ef4444' }, 
  ].filter(d => d.value > 0), [metrics]);

  // -- COMPONENTS --

  const SummaryCard = ({ label, value, colorClass }: { label: string; value: number; colorClass?: string }) => (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden flex-1 min-w-[200px]">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-1">
        <div className={cn("text-3xl font-black tracking-tighter", colorClass || "text-slate-900")}>
            {value}
        </div>
        <p className="text-[11px] font-black uppercase text-slate-500 tracking-[0.15em]">
            {label}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-32">
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                <BarChart3 className="h-3 w-3" />
                Operational Telemetry
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold gap-1.5 h-8 px-4 rounded-xl">
            <Activity className="h-3.5 w-3.5" />
            System Live
        </Badge>
      </div>

      {/* --- USERS SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
            <Users2 className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">User Management</h3>
        </div>
        <div className="flex flex-wrap gap-4">
            <SummaryCard label="Total Users" value={metrics.totalUsers} colorClass="text-slate-900" />
            <SummaryCard label="Active Users" value={metrics.activeUsers} colorClass="text-emerald-600" />
            <SummaryCard label="Inactive Users" value={metrics.inactiveUsers} colorClass="text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- DEFINITIONS SECTION --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Definition Lifecycle</h3>
            </div>
            <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden h-[500px] flex flex-col">
                <CardHeader className="bg-slate-50/50 border-b py-4 px-8 shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">Total Definitions Authored: {metrics.totalDefinitions}</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={definitionChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {definitionChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`${value} Records`, 'Count']}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* --- TEMPLATES SECTION --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <LayoutTemplate className="h-4 w-4 text-slate-400" />
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Template Adoption Analysis</h3>
            </div>
            <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden h-[500px] flex flex-col">
                <CardHeader className="bg-slate-50/50 border-b py-4 px-8 shrink-0 flex flex-row items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">Total Registered Templates: {metrics.totalTemplates}</span>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[9px] h-5 px-1.5">
                            {metrics.activeTemplates} Active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8 flex-1 flex flex-col">
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={metrics.templateUsage} 
                                layout="vertical" 
                                margin={{ left: 20, right: 30, top: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                    width={140}
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    labelClassName="font-bold text-slate-900 mb-1"
                                    formatter={(value: number) => [`${value} Definitions`, 'Utilization']}
                                />
                                <Bar 
                                    dataKey="usage" 
                                    name="Definitions Created"
                                    radius={[0, 8, 8, 0]} 
                                    barSize={32}
                                    fill="#6366f1"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-indigo-500" />
                                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Top Adoption Score</span>
                            </div>
                            <span className="text-sm font-black text-indigo-600">
                                {metrics.templateUsage[0]?.name || 'N/A'}: {metrics.templateUsage[0]?.usage || 0} Records
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

