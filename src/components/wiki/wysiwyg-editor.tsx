"use client"

import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, AlignLeft, AlignCenter, AlignRight, Code, Baseline, Highlighter } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

type WysiwygEditorProps = {
    value: string;
    onChange: (content: string) => void;
    className?: string;
    placeholder?: string;
}

const ToolbarButton = ({ children, onClick, active, title }: { children: React.ReactNode, onClick: () => void, active?: boolean, title?: string }) => (
    <Button 
        variant={active ? "secondary" : "ghost"} 
        size="icon" 
        className="h-8 w-8" 
        onMouseDown={(e) => e.preventDefault()} 
        onClick={onClick}
        title={title}
    >
        {children}
    </Button>
)

const FONT_COLORS = [
    '#000000', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#F9FAFB',
    '#0000FF', '#008000', '#A31515', '#795E26', '#AF00DB', '#001080', 
    '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2',
    '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE',
    '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0',
    '#B45309', '#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7',
    '#7E22CE', '#9333EA', '#A855F7', '#C084FC', '#D8B4FE', '#F3E8FF'
];

const BACKGROUND_COLORS = [
    '#FFFFFF', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B',
    '#FEF9C3', '#FFEDD5', '#FEE2E2', '#DCFCE7', '#DBEAFE', '#F3E8FF',
    '#FDE047', '#FB923C', '#F87171', '#4ADE80', '#60A5FA', '#C084FC',
    '#EAB308', '#EA580C', '#DC2626', '#16A34A', '#2563EB', '#9333EA'
];

const ColorPalette = ({ colors, onSelect }: { colors: string[], onSelect: (color: string) => void }) => (
    <div className="grid grid-cols-6 gap-1 p-1">
        {colors.map(color => (
            <button
                key={color}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(color)}
                className="h-6 w-6 rounded-sm border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
            />
        ))}
    </div>
);

export default function WysiwygEditor({ value, onChange, className, placeholder }: WysiwygEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
        const content = event.currentTarget.innerHTML;
        onChange(content);
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        if (editorRef.current) {
            handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        }
    };
    
    const handleInsertCode = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            execCommand('formatBlock', 'pre');
            return;
        }
        
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = 'language-sql';
        code.textContent = selectedText || 'SELECT * FROM table_name WHERE condition = 1;';
        pre.appendChild(code);
        
        range.deleteContents();
        range.insertNode(pre);
        
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        pre.after(p);
        
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        editorRef.current?.focus();
        if (editorRef.current) {
            handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        }
    };

    const handleLink = () => {
        const url = prompt('Enter the URL');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const applyHeader = (tag: string) => {
        execCommand('formatBlock', tag);
    };

    return (
        <div className="border rounded-xl bg-background overflow-hidden shadow-sm">
            <div className="p-2 border-b flex flex-wrap items-center gap-1 sticky top-0 bg-muted/10 z-10 backdrop-blur-sm">
                <ToolbarButton onClick={() => execCommand('bold')} title="Bold"><Bold className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')} title="Italic"><Italic className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('underline')} title="Underline"><Underline className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('strikethrough')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarButton>
                
                <Separator orientation="vertical" className="h-6 mx-1" />

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Color">
                            <div className="flex flex-col items-center">
                                <Baseline className="h-4 w-4" />
                                <div className="h-0.5 w-3 bg-primary mt-[-2px]" />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2 px-1">Text Color</p>
                        <ColorPalette colors={FONT_COLORS} onSelect={(color) => execCommand('foreColor', color)} />
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Highlight Color">
                            <Highlighter className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2 px-1">Highlight Color</p>
                        <ColorPalette colors={BACKGROUND_COLORS} onSelect={(color) => execCommand('backColor', color)} />
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={handleInsertCode} title="SQL Code Block"><Code className="h-4 w-4" /></ToolbarButton>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 text-xs px-2 rounded-lg hover:bg-accent font-bold">Headers</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyHeader('H1'); }}>Heading 1</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyHeader('H2'); }}>Heading 2</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyHeader('H3'); }}>Heading 3</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyHeader('P'); }}>Paragraph</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Align Left"><AlignLeft className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Align Center"><AlignCenter className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyRight')} title="Align Right"><AlignRight className="h-4 w-4" /></ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List"><List className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List"><ListOrdered className="h-4 w-4" /></ToolbarButton>
                
                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={handleLink} title="Insert Link"><Link className="h-4 w-4" /></ToolbarButton>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                dir="ltr"
                className={cn(
                    "prose prose-sm max-w-none w-full min-h-[300px] p-6 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring text-left bg-background",
                    className
                )}
                placeholder={placeholder || "Enter content..."}
                style={{ textAlign: 'left', direction: 'ltr', whiteSpace: 'pre-wrap' }}
            />
        </div>
    )
}
