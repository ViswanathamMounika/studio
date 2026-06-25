
"use client"

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, AlignLeft, AlignCenter, AlignRight, Code, Baseline, Highlighter, ChevronDown } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Prism from 'prismjs';

// Import Prism components for editor preview
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup'; // This handles HTML/XML
import 'prismjs/themes/prism.css'; 

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
        className={cn("h-8 w-8 transition-colors", active && "bg-primary/10 text-primary hover:bg-primary/20")}
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
    const [activeStyles, setActiveStyles] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        justifyLeft: false,
        justifyCenter: false,
        justifyRight: false,
        insertUnorderedList: false,
        insertOrderedList: false,
    });

    const updateActiveStyles = useCallback(() => {
        if (typeof document === 'undefined') return;
        setActiveStyles({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough'),
            justifyLeft: document.queryCommandState('justifyLeft'),
            justifyCenter: document.queryCommandState('justifyCenter'),
            justifyRight: document.queryCommandState('justifyRight'),
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            insertOrderedList: document.queryCommandState('insertOrderedList'),
        });
    }, []);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
            Prism.highlightAllUnder(editorRef.current);
        }
    }, [value]);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;

        const handler = () => updateActiveStyles();
        
        el.addEventListener('mouseup', handler);
        el.addEventListener('keyup', handler);
        el.addEventListener('focus', handler);
        
        return () => {
            el.removeEventListener('mouseup', handler);
            el.removeEventListener('keyup', handler);
            el.removeEventListener('focus', handler);
        };
    }, [updateActiveStyles]);

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
        const content = event.currentTarget.innerHTML;
        onChange(content);
        updateActiveStyles();
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        if (editorRef.current) {
            handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        }
        updateActiveStyles();
    };
    
    const handleInsertCode = (lang: string = 'sql') => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        // Clear selection content to replace it with the new block
        range.deleteContents();
        
        const pre = document.createElement('pre');
        pre.className = `language-${lang}`;
        // Ensure white-space style is inline if needed, but globals.css handles it
        
        const code = document.createElement('code');
        code.className = `language-${lang}`;
        code.style.fontWeight = '400';
        
        let codePlaceholder = 'SELECT * FROM table_name;';
        if (lang === 'csharp') codePlaceholder = '// C# Snippet\npublic class Program {\n  public static void Main() {\n    // Code here\n  }\n}';
        if (lang === 'javascript') codePlaceholder = '// JS Snippet\nfunction init() {\n  console.log("System Ready");\n}';
        if (lang === 'json') codePlaceholder = '{\n  "status": "success",\n  "data": [1, 2, 3]\n}';
        if (lang === 'markup') codePlaceholder = '<!-- HTML/XML Snippet -->\n<div class="container">\n  <h1>Documentation</h1>\n</div>';

        // Set plain text content to avoid nested HTML from selection breaking Prism
        code.textContent = selectedText || codePlaceholder;
        pre.appendChild(code);
        
        // Insert the code block
        range.insertNode(pre);
        
        // CRITICAL: Always create a trailing paragraph to allow the user to "break out" of the code block
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        pre.after(p);
        
        // Move selection to the start of the new paragraph
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        editorRef.current?.focus();
        
        // Trigger Prism highlighting on the new element specifically
        if (editorRef.current) {
            // Tiny timeout to ensure DOM reconciliation before Prism pass
            setTimeout(() => {
                Prism.highlightElement(code);
                if (editorRef.current) {
                    handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
                }
            }, 0);
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
        <div className="flex flex-col border rounded-xl bg-background overflow-hidden shadow-sm h-[600px]">
            {/* STATIC TOOLBAR */}
            <div className="p-2 border-b flex flex-wrap items-center gap-1 bg-white shrink-0 z-20">
                <ToolbarButton onClick={() => execCommand('bold')} active={activeStyles.bold} title="Bold"><Bold className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')} active={activeStyles.italic} title="Italic"><Italic className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('underline')} active={activeStyles.underline} title="Underline"><Underline className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('strikeThrough')} active={activeStyles.strikethrough} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarButton>
                
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
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 gap-1 text-xs px-2 rounded-lg hover:bg-accent font-bold">
                            <Code className="h-4 w-4" />
                            Code
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); handleInsertCode('sql'); }}>SQL Snippet</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); handleInsertCode('csharp'); }}>C# Snippet</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); handleInsertCode('javascript'); }}>JavaScript Snippet</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); handleInsertCode('json'); }}>JSON Block</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); handleInsertCode('markup'); }}>HTML/XML Snippet</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
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
                
                <ToolbarButton onClick={() => execCommand('justifyLeft')} active={activeStyles.justifyLeft} title="Align Left"><AlignLeft className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyCenter')} active={activeStyles.justifyCenter} title="Align Center"><AlignCenter className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyRight')} active={activeStyles.justifyRight} title="Align Right"><AlignRight className="h-4 w-4" /></ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} active={activeStyles.insertUnorderedList} title="Bullet List"><List className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('insertOrderedList')} active={activeStyles.insertOrderedList} title="Numbered List"><ListOrdered className="h-4 w-4" /></ToolbarButton>
                
                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={handleLink} title="Insert Link"><Link className="h-4 w-4" /></ToolbarButton>
            </div>
            
            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto bg-background">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    dir="ltr"
                    className={cn(
                        "prose prose-sm max-w-none w-full min-h-full p-8 focus:outline-none focus-visible:ring-0 text-left font-normal",
                        className
                    )}
                    placeholder={placeholder || "Enter technical documentation..."}
                    style={{ textAlign: 'left', direction: 'ltr', fontWeight: '400' }}
                />
            </div>
        </div>
    )
}
