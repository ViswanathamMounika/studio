"use client"

import React, { useRef } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Image, Table, Pilcrow } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { cn } from "@/lib/utils";

type WysiwygEditorProps = {
    value: string;
    onChange: (content: string) => void;
    className?: string;
    placeholder?: string;
}

const ToolbarButton = ({ children }: { children: React.ReactNode }) => (
    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        {children}
    </Button>
)

export default function WysiwygEditor({ value, onChange, className, placeholder }: WysiwygEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
        onChange(event.currentTarget.innerHTML);
    };

    return (
        <div className="border rounded-md">
            <div className="p-2 border-b flex flex-wrap items-center gap-1">
                <ToolbarButton><Bold className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton><Italic className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton><Underline className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton><Strikethrough className="h-4 w-4" /></ToolbarButton>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <ToolbarButton><Pilcrow className="h-4 w-4" /></ToolbarButton>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <ToolbarButton><List className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton><ListOrdered className="h-4 w-4" /></ToolbarButton>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <ToolbarButton><Link className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton><Image className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton><Table className="h-4 w-4" /></ToolbarButton>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: value }}
                className={cn(
                    "prose prose-sm max-w-none w-full min-h-[300px] p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-b-md",
                    className
                )}
                placeholder={placeholder || "Enter content..."}
            />
        </div>
    )
}