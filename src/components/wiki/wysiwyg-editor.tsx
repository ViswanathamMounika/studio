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


const FONT_COLORS = [
    '#000000', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#F9FAFB',
    '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2',
    '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE',
    '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0',
    '#B45309', '#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7',
    '#7E22CE', '#9333EA', '#A855F7', '#C084FC', '#D8B4FE', '#F3E8FF',
    '#DB2777', '#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8', '#FCE7F3'
];

const BACKGROUND_COLORS = [
    '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF',
    '#FEE2E2', '#FFE4E6', '#FFF4ED', '#FEF3C7', '#F7FEE7', '#ECFDF5',
    '#EFF6FF', '#F5F3FF', '#FAFAF9',
    '#FCA5A5', '#F9A8D4', '#FCD34D', '#FBBF24', '#A7F3D0', '#93C5FD',
    '#C4B5FD', '#D1D5DB', '#FED7AA', '#FDE68A', '#A7F3D0', '#BFDBFE'
];

const ColorPalette = ({ colors, onSelect }: { colors: string[], onSelect: (color: string) => void }) => (
    <div className="grid grid-cols-6 gap-2">
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

    const handleImage = () => {
        const url = prompt('Enter the Image URL');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const applyFontSize = (size: string) => {
        execCommand('fontSize', size);
    };

    const handleInsertList = (type: 'insertOrderedList' | 'insertUnorderedList') => {
        execCommand(type);
    }
    
    const handleInsertTable = () => {
        const rows = prompt("Enter number of rows", "2");
        const cols = prompt("Enter number of columns", "2");
        if (rows && cols) {
            let table = '<table style="border-collapse: collapse; width: 100%;">';
            for (let i = 0; i < parseInt(rows); i++) {
                table += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    table += '<td style="border: 1px solid #ccc; padding: 8px;">&nbsp;</td>';
                }
                table += '</tr>';
            }
            table += '</table>';
            execCommand('insertHTML', table);
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
                <ToolbarButton onClick={handleImage}><Image className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton onClick={handleInsertTable}><Table className="h-4 w-4" /></ToolbarButton>
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
