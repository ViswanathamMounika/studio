"use client"

import React, { useRef } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Image, Table, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react"
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

const ToolbarButton = ({ children, onClick, active }: { children: React.ReactNode, onClick: () => void, active?: boolean }) => (
    <Button 
        variant={active ? "secondary" : "ghost"} 
        size="icon" 
        className="h-8 w-8" 
        onMouseDown={(e) => e.preventDefault()} 
        onClick={onClick}>
        {children}
    </Button>
)

// More distinct colors
const FONT_COLORS = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#6366F1', '#EC4899'];
const BACKGROUND_COLORS = ['#FBBF24', '#F87171', '#60A5FA', '#4ADE80', '#A78BFA', '#F472B6', '#34D399', '#93C5FD'];

const ColorPalette = ({ colors, onSelect }: { colors: string[], onSelect: (color: string) => void }) => (
    <div className="grid grid-cols-4 gap-2">
        {colors.map(color => (
            <button
                key={color}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(color)}
                className="h-6 w-6 rounded-full border cursor-pointer hover:ring-2 hover:ring-ring"
                style={{ backgroundColor: color }}
            />
        ))}
    </div>
);


export default function WysiwygEditor({ value, onChange, className, placeholder }: WysiwygEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
        onChange(event.currentTarget.innerHTML);
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput({ currentTarget: editorRef.current! } as React.FormEvent<HTMLDivElement>);
    };
    
    const handleLink = () => {
        const url = prompt('Enter the URL');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const applyFontSize = (size: string) => {
        execCommand('fontSize', size);
    };

    const handleInsertList = (type: 'insertOrderedList' | 'insertUnorderedList') => {
        execCommand(type);
    }

    return (
        <div className="border rounded-md">
            <div className="p-2 border-b flex flex-wrap items-center gap-1">
                <ToolbarButton onClick={() => execCommand('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('underline')}><Underline className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('strikethrough')}><Strikethrough className="h-4 w-4" /></ToolbarButton>
                
                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8">Font Size</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyFontSize('1'); }}>10px</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyFontSize('2'); }}>13px</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyFontSize('3'); }}>16px</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyFontSize('4'); }}>18px</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyFontSize('5'); }}>24px</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyFontSize('6'); }}>32px</DropdownMenuItem>
                        <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); applyFontSize('7'); }}>48px</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">A</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <ColorPalette colors={FONT_COLORS} onSelect={(color) => execCommand('foreColor', color)} />
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="h-4 w-4 border border-foreground rounded-sm bg-yellow-300"></span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <ColorPalette colors={BACKGROUND_COLORS} onSelect={(color) => execCommand('backColor', color)} />
                    </PopoverContent>
                </Popover>


                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={() => execCommand('justifyLeft')}><AlignLeft className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyCenter')}><AlignCenter className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyRight')}><AlignRight className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyFull')}><AlignJustify className="h-4 w-4" /></ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <ToolbarButton onClick={() => handleInsertList('insertUnorderedList')}><List className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => handleInsertList('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
                
                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={handleLink}><Link className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => {}}><Image className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => {}}><Table className="h-4 w-4" /></ToolbarButton>
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
