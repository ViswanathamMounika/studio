"use client"

import React, { useRef } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Image, Table, Pilcrow, AlignLeft, AlignCenter, AlignRight, AlignJustify, Minus } from "lucide-react"
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

const FONT_COLORS = ['#000000', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#FFA500', '#800080', '#FFFFFF'];
const BACKGROUND_COLORS = ['#FFFFFF', '#F3F4F6', '#FEF2F2', '#EFF6FF', '#F0FDF4', '#FFFBEB', '#FAF5FF', '#D1D5DB'];


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
                        <div className="grid grid-cols-4 gap-1">
                            {FONT_COLORS.map(color => (
                                <button key={color} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('foreColor', color)} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="h-4 w-4 border border-foreground rounded-sm bg-yellow-300"></span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-1">
                            {BACKGROUND_COLORS.map(color => (
                                <button key={color} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('backColor', color)} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>


                <Separator orientation="vertical" className="h-6 mx-1" />
                
                <ToolbarButton onClick={() => execCommand('justifyLeft')}><AlignLeft className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyCenter')}><AlignCenter className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyRight')}><AlignRight className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyFull')}><AlignJustify className="h-4 w-4" /></ToolbarButton>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <ToolbarButton onClick={() => execCommand('insertUnorderedList')}><List className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={() => execCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
                
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
