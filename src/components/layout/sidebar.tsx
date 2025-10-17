
"use client";

import {
    BookCopy,
    Database,
    Bell,
} from "lucide-react";
import { Button } from "../ui/button";

type AppSidebarProps = {
    activeView: 'definitions' | 'notifications' | 'data-tables';
    onNavigate: (view: 'definitions' | 'notifications' | 'data-tables') => void;
};

export default function AppSidebar({ activeView, onNavigate }: AppSidebarProps) {
    const navItems = [
        { id: 'definitions', label: 'MPM Definitions', icon: BookCopy },
        { id: 'data-tables', label: 'Data Tables', icon: Database },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="flex flex-col h-full w-64 bg-slate-50 border-r">
            <div className="p-4 border-b">
                <h1 className="text-lg font-bold tracking-tight">MPM Core</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => (
                    <Button
                        key={item.id}
                        variant={activeView === item.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => onNavigate(item.id as any)}
                    >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                    </Button>
                ))}
            </nav>
        </div>
    );
}
