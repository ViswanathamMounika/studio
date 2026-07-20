"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Users, 
    FileText, 
    LayoutTemplate, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    AlertCircle, 
    Activity,
    UserCheck,
    UserX,
    FileEdit,
    ShieldAlert
} from 'lucide-react';
import type { Definition, UserAccount, Template, View } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type DashboardProps = {
  definitions: Definition[];
  drafts: Definition[];
  users: UserAccount[];
  templates: Template[];
  onNavigate: (view: View) => void;
};

export default function Dashboard({ definitions, drafts, users, templates, onNavigate }: DashboardProps) {
  
  // Recursively count published definitions
  const countDefinitions = (items: Definition[]): number => {
    let count = 0;
    items.forEach(item => {
      // If it's a documentation leaf (has description or short description), count it
      if (item.description || item.shortDescription) {
        count++;
      }
      if (item.children) {
        count += countDefinitions(item.children);
      }
    });
    return count;
  };

  const publishedCount = countDefinitions(definitions);
  const draftCount = drafts.filter(d => d.isDraft && !d.isPendingApproval).length;
  const pendingCount = drafts.filter(d => d.isPendingApproval).length;
  const rejectedCount = drafts.filter(d => d.discussions?.some(m => m.type === 'rejection')).length;
  const totalDefinitions = publishedCount + drafts.length;

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const inactiveUsers = users.filter(u => u.status === 'Inactive').length;

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.isActive).length;

  const MetricCard = ({ title, value, subValue, icon: Icon, color, onClick }: any) => (
    <Card 
        className="rounded-[24px] border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
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
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Governance Console</h1>
        <p className="text-muted-foreground font-medium">Real-time system health and documentation velocity overview.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Identity & Access</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Total Users" 
            value={totalUsers} 
            subValue="Provisioned Accounts"
            icon={Users} 
            color="text-indigo-600 bg-indigo-50"
            onClick={() => onNavigate('user-management')}
          />
          <MetricCard 
            title="Active Access" 
            value={activeUsers} 
            subValue="Authorized Sessions"
            icon={UserCheck} 
            color="text-emerald-600 bg-emerald-50"
            onClick={() => onNavigate('user-management')}
          />
          <MetricCard 
            title="Inactive Accounts" 
            value={inactiveUsers} 
            subValue="Restricted / Locked"
            icon={UserX} 
            color="text-slate-400 bg-slate-50"
            onClick={() => onNavigate('user-management')}
          />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Library Metadata</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            title="Library Size" 
            value={totalDefinitions} 
            icon={Activity} 
            color="text-slate-900 bg-slate-100"
            onClick={() => onNavigate('definitions')}
          />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
            <LayoutTemplate className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Blueprint Architecture</h2>
            <div className="h-px bg-slate-200 flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm flex items-center p-6 gap-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('template-management')}>
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <LayoutTemplate className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="flex-1">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Global Blueprints</p>
                <div className="text-3xl font-bold text-slate-900 mt-0.5">{totalTemplates}</div>
                <p className="text-xs text-slate-500 font-medium mt-1">Documentation structures defined in the catalog.</p>
            </div>
          </Card>

          <Card className="rounded-[24px] border-slate-200 overflow-hidden bg-white shadow-sm flex items-center p-6 gap-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('template-management')}>
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex-1">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Active Standard</p>
                <div className="text-3xl font-bold text-slate-900 mt-0.5">{activeTemplates}</div>
                <p className="text-xs text-slate-500 font-medium mt-1">Ready for use in new definition authoring.</p>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="pt-8">
        <Card className="rounded-[32px] border-none bg-indigo-600 p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-4 max-w-2xl">
                <h3 className="text-3xl font-bold tracking-tight">System Configuration Access</h3>
                <p className="text-indigo-100 text-lg font-medium leading-relaxed">
                    As a Super Admin, you have unrestricted access to modify operational settings, 
                    email templates, and security policies globally.
                </p>
                <div className="flex gap-4 pt-4">
                    <Button onClick={() => onNavigate('system-configuration')} className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl px-8 h-12 shadow-lg">
                        Go to System Settings
                    </Button>
                    <Button onClick={() => onNavigate('activity-logs')} variant="outline" className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl px-8 h-12">
                        Audit Logs
                    </Button>
                </div>
            </div>
            {/* Abstract Background Decoration */}
            <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <ShieldAlert className="absolute right-12 bottom-12 h-64 w-64 text-white/5 pointer-events-none" />
        </Card>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
