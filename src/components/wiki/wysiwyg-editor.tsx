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

const ToolbarButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
    <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
        {children}
    </Button>
)

export default function WysiwygEditor({ value, onChange, className, placeholder }: WysiwygEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
        onChange(event.currentTarget.innerHTML);
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };
    
    const handleLink = () => {
        const url = prompt('Enter the URL');
        if (url) {
            execCommand('createLink', url);
        }
    };

    return (
        <div className="border rounded-md">
            <div className="p-2 border-b flex flex-wrap items-center gap-1">
                <ToolbarButton onClick={() => execCommand('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('underline')}><Underline className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('strikethrough')}><Strikethrough className="h-4 w-4" /></ToolbarButton>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <ToolbarButton onClick={() => execCommand('formatBlock', 'p')}><Pilcrow className="h-4 w-4" /></ToolbarButton>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')}><List className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <ToolbarButton onClick={handleLink}><Link className="h-4 w-4" /></ToolbarButton>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled><Image className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled><Table className="h-4 w-4" /></Button>
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
