
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
    ArrowUpRight,
    UserCheck,
    UserX,
    FileCheck,
    AlertCircle
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
  
  const countPublishedDefinitions = (items: Definition[]): number => {
    let count = 0;
    items.forEach(item => {
      if (item.description || item.shortDescription) {
        if (!item.isArchived) count++;
      }
      if (item.children) {
        count += countPublishedDefinitions(item.children);
      }
    });
    return count;
  };

  const metrics = useMemo(() => {
    const published = countPublishedDefinitions(definitions);
    const pending = drafts.filter(d => d.isPendingApproval).length;
    const draft = drafts.filter(d => d.isDraft && !d.isPendingApproval).length;
    const rejected = drafts.filter(d => (d.discussions || []).some(m => m.type === 'rejection')).length;
    
    return {
        // User Metrics
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'Active').length,
        inactiveUsers: users.filter(u => u.status === 'Inactive').length,
        
        // Definition Metrics
        totalDefinitions: published + drafts.length,
        publishedDefinitions: published,
        draftDefinitions: draft,
        pendingApprovals: pending,
        rejectedDefinitions: rejected,

        // Template Metrics
        totalTemplates: templates.length,
        activeTemplates: templates.filter(t => t.isActive).length
    };
  }, [definitions, drafts, users, templates]);

  const definitionChartData = useMemo(() => [
    { name: 'Published Definitions', value: metrics.publishedDefinitions, color: '#10b981' }, 
    { name: 'Pending Approvals', value: metrics.pendingApprovals, color: '#3b82f6' }, 
    { name: 'Draft Definitions', value: metrics.draftDefinitions, color: '#f59e0b' }, 
    { name: 'Rejected Definitions', value: metrics.rejectedDefinitions, color: '#ef4444' }, 
  ].filter(d => d.value > 0), [metrics]);

  const userStatusData = useMemo(() => [
    { name: 'Active Users', count: metrics.activeUsers, color: '#10b981' },
    { name: 'Inactive Users', count: metrics.inactiveUsers, color: '#94a3b8' }
  ], [metrics]);

  const templateStatusData = useMemo(() => [
    { name: 'Active Templates', value: metrics.activeTemplates, color: '#6366f1' },
    { name: 'Inactive Templates', value: metrics.totalTemplates - metrics.activeTemplates, color: '#e2e8f0' }
  ], [metrics]);

  // -- COMPONENTS --

  const MetricGroup = ({ title, icon: Icon, children }: any) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
            <Icon className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">{title}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
  );

  const SummaryCard = ({ label, value, colorClass }: any) => (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 flex flex-col items-center text-center space-y-1">
        <div className={cn("text-2xl font-black tracking-tight", colorClass || "text-slate-900")}>
            {value}
        </div>
        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            {label}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-32">
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-muted-foreground font-medium italic">Operational overview of users, definitions, and templates.</p>
        </div>
        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold gap-1.5 h-8 px-4 rounded-xl">
            <Activity className="h-3.5 w-3.5" />
            System Live
        </Badge>
      </div>

      {/* --- USERS SECTION --- */}
      <div className="space-y-6">
        <MetricGroup title="User Management" icon={Users}>
            <SummaryCard label="Total Users" value={metrics.totalUsers} colorClass="text-indigo-600" />
            <SummaryCard label="Active Users" value={metrics.activeUsers} colorClass="text-emerald-600" />
            <SummaryCard label="Inactive Users" value={metrics.inactiveUsers} colorClass="text-slate-400" />
        </MetricGroup>

        <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b py-4 px-8">
                <CardTitle className="text-sm font-bold text-slate-800">User Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userStatusData} layout="vertical" margin={{ left: 40, right: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                width={120}
                            />
                            <RechartsTooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar 
                                dataKey="count" 
                                radius={[0, 8, 8, 0]} 
                                barSize={32}
                            >
                                {userStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* --- DEFINITIONS SECTION --- */}
      <div className="space-y-6">
        <MetricGroup title="Definition Library" icon={FileText}>
            <SummaryCard label="Total Definitions" value={metrics.totalDefinitions} colorClass="text-slate-900" />
            <SummaryCard label="Published Definitions" value={metrics.publishedDefinitions} colorClass="text-emerald-600" />
            <SummaryCard label="Draft Definitions" value={metrics.draftDefinitions} colorClass="text-amber-500" />
            <SummaryCard label="Pending Approvals" value={metrics.pendingApprovals} colorClass="text-blue-600" />
            <SummaryCard label="Rejected Definitions" value={metrics.rejectedDefinitions} colorClass="text-red-600" />
        </MetricGroup>

        <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b py-4 px-8">
                <CardTitle className="text-sm font-bold text-slate-800">Definition Lifecycle distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={definitionChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {definitionChartData.map((entry, index) => (
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
                                formatter={(value) => <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* --- TEMPLATES SECTION --- */}
      <div className="space-y-6">
        <MetricGroup title="Templates Architecture" icon={LayoutTemplate}>
            <SummaryCard label="Total Templates" value={metrics.totalTemplates} colorClass="text-violet-600" />
            <SummaryCard label="Active Templates" value={metrics.activeTemplates} colorClass="text-indigo-600" />
        </MetricGroup>

        <Card className="rounded-[28px] border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b py-4 px-8">
                <CardTitle className="text-sm font-bold text-slate-800">Active vs Inactive Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-10">
                <div className="h-[120px] w-full max-w-2xl mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={templateStatusData} layout="vertical" barGap={0}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" hide />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" stackId="a" radius={[10, 10, 10, 10]} barSize={40}>
                                {templateStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-10 mt-4">
                        {templateStatusData.map(item => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
