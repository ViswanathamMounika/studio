"use client";

import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserCircle, ShieldAlert, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { UserAccount, View } from "@/lib/types";

type TopNavbarProps = {
  currentUser: Partial<UserAccount>;
  onImpersonate: (user: any) => void;
  isImpersonating: boolean;
  isAdmin: boolean;
  onNavigate: (view: View) => void;
}

export default function TopNavbar({ currentUser, onImpersonate, isImpersonating, isAdmin, onNavigate }: TopNavbarProps) {
    return (
        <nav className="h-14 bg-[#3F51B5] text-white flex items-center px-6 shrink-0 z-[100] shadow-lg border-b border-white/10">
            <div className="flex items-center gap-6">
                <SidebarTrigger className="text-white hover:bg-white/10 h-9 w-9 rounded-xl transition-all" />
                <div className="flex flex-col cursor-pointer" onClick={() => onNavigate('definitions')}>
                    <h1 className="text-lg font-black tracking-tighter leading-none">MedPOINT</h1>
                    <p className='text-[9px] font-black tracking-[0.25em] text-white/80 mt-0.5 uppercase'>MANAGEMENT</p>
                </div>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 hover:bg-white/10 px-4 py-1.5 rounded-xl transition-all outline-none group border border-transparent hover:border-white/20">
                            <div className="flex flex-col items-end">
                                <span className="text-[13px] font-bold tracking-tight">{currentUser.name || 'Venkatesan Natarajan'}</span>
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none">{currentUser.role}</span>
                            </div>
                            <div className="relative">
                                <UserCircle className="h-6 w-6 text-white/90 group-hover:text-white transition-colors" />
                                {isImpersonating && (
                                    <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#3F51B5]" />
                                )}
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-white/50 group-hover:text-white transition-all group-data-[state=open]:rotate-180" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-2xl p-2 border-none mt-1 animate-in fade-in slide-in-from-top-2">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 py-2">Security Identity</DropdownMenuLabel>
                        <div className="px-3 py-3 mb-2 bg-slate-50 rounded-xl">
                            <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{currentUser.role}</p>
                            </div>
                        </div>
                        
                        <DropdownMenuSeparator className="mx-1 my-1.5" />
                        
                        <DropdownMenuItem className="py-2.5 rounded-xl font-bold text-xs gap-3 cursor-pointer">
                             <UserCircle className="h-4 w-4 text-slate-400" />
                             My Profile Settings
                        </DropdownMenuItem>

                        {isAdmin && (
                            <DropdownMenuItem 
                                className="py-2.5 rounded-xl font-bold text-xs gap-3 text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer"
                                onClick={() => onNavigate('user-management')}
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Work as (Impersonate)
                            </DropdownMenuItem>
                        )}
                        
                        {isImpersonating && (
                             <>
                                <DropdownMenuSeparator className="mx-1 my-1.5" />
                                <DropdownMenuItem 
                                    className="py-2.5 rounded-xl font-bold text-xs gap-3 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                    onClick={() => onImpersonate('')}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Terminate Proxy Session
                                </DropdownMenuItem>
                             </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
}