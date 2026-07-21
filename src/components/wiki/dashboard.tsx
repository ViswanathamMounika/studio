
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
    ShieldCheck, 
    UserCheck,
    UserX,
    FileEdit,
    Activity,
    Users2,
    ShieldAlert,
    BarChart3
} from 'lucide-react';
import type { Definition, UserAccount, Template, View } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    const counts: Record<string, number> = {
        'Super Admin': 0,
        'Admin': 0,
        'Approver': 0,
        'Standard User': 0,
        'Editor': 0,
        'Viewer': 0
    };
    users.forEach(u => {
        if (counts[u.role] !== undefined) counts[u.role]++;
        else counts['Standard User']++;
    });
    return counts;
  }, [users]);

  // -- TEMPLATE METRICS --
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.isActive).length;

  const MetricCard = ({ title, value, subValue, icon: Icon, color, onClick }: any) => (
    <Card 
        className="rounded-[24px] border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group bg-white"
        onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-xl bg-slate-50 group-hover:bg-white transition-colors", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        {subValue && (
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                {subValue}
            </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-32">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Overview</h1>
            <p className="text-muted-foreground font-medium">Administrative command center for MedPoint Wiki governance.</p>
        </div>
        <Badge variant="outline" className="h-8 rounded-xl px-4 bg-indigo-50 border-indigo-100 text-indigo-700 font-bold gap-2">
            <Activity className="h-3.5 w-3.5" />
            System Live & Healthy
        </Badge>
      </div>

      {/* --- IDENTITY & ACCESS SECTION --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Identity & Global Access</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <MetricCard 
                    title="Total Population" 
                    value={totalUsers} 
                    subValue="Provisioned User Accounts"
                    icon={Users} 
                    color="text-indigo-600 bg-indigo-50"
                    onClick={() => onNavigate('user-management')}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-[20px] p-4 bg-emerald-50/30 border-emerald-100 shadow-none">
                        <div className="flex items-center justify-between mb-2">
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{activeUsers}</div>
                    </Card>
                    <Card className="rounded-[20px] p-4 bg-slate-50 border-slate-200 shadow-none">
                        <div className="flex items-center justify-between mb-2">
                            <UserX className="h-4 w-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase">Locked</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{inactiveUsers}</div>
                    </Card>
                </div>
            </div>

            <Card className="lg:col-span-2 rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Users2 className="h-3.5 w-3.5" />
                        Role Authority Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        {Object.entries(roleBreakdown).filter(([_, count]) => count > 0 || _ === 'Super Admin').map(([role, count]) => (
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
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl"
                            onClick={() => onNavigate('user-management')}
                        >
                            Manage Security Roles
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* --- CONTENT & LIBRARY SECTION --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Knowledge Assets</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard 
            title="Published" 
            value={publishedCount} 
            icon={CheckCircle2} 
            color="text-emerald-600 bg-emerald-50"
            onClick={() => onNavigate('definitions')}
          />
          <MetricCard 
            title="Pending Review" 
            value={pendingCount} 
            icon={Clock} 
            color="text-blue-600 bg-blue-50"
            onClick={() => onNavigate('approval-workflow')}
          />
          <MetricCard 
            title="Private Drafts" 
            value={draftCount} 
            icon={FileEdit} 
            color="text-amber-600 bg-amber-50"
            onClick={() => onNavigate('definitions')}
          />
          <MetricCard 
            title="Rejected" 
            value={rejectedCount} 
            icon={XCircle} 
            color="text-red-600 bg-red-50"
            onClick={() => onNavigate('definitions')}
          />
          <MetricCard 
            title="Total Assets" 
            value={totalDefinitions} 
            icon={Activity} 
            color="text-slate-900 bg-slate-100"
            onClick={() => onNavigate('definitions')}
          />
        </div>
      </div>

      {/* --- BLUEPRINTS & SYSTEM SECTION --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Operational Health</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="rounded-[24px] border-slate-200 bg-white shadow-sm flex items-center p-6 gap-6 hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigate('template-management')}>
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <LayoutTemplate className="h-7 w-7 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Blueprints</p>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalTemplates} Patterns</div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[11px] text-slate-500 font-medium">{activeTemplates} Currently Active</p>
                    </div>
                </div>
            </Card>

            <Card className="lg:col-span-2 rounded-[32px] border-none bg-slate-900 p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="h-16 w-16 rounded-[20px] bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                        <ShieldAlert className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold tracking-tight">System Configuration Access</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mt-1">
                            You have Super Admin authority to modify operational settings, security policies, and global constants.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => onNavigate('system-configuration')} className="bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl px-6 h-10 shadow-lg transition-all active:scale-95">
                            Settings
                        </Button>
                        <Button onClick={() => onNavigate('reports')} variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl px-6 h-10 transition-all active:scale-95">
                            Reports
                        </Button>
                    </div>
                </div>
                {/* Visual Flair */}
                <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-500" />
                <div className="absolute bottom-[-20%] left-[-5%] w-[200px] h-[200px] bg-white/5 rounded-full blur-2xl pointer-events-none" />
            </Card>
        </div>
      </div>
    </div>
  );
}

import { ChevronRight } from 'lucide-react';
