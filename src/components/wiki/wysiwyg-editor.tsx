"use client"

import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Image, Table, Pilcrow } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { Textarea } from "../ui/textarea"

type WysiwygEditorProps = {
    content: string;
    onChange: (content: string) => void;
}

const ToolbarButton = ({ children }: { children: React.ReactNode }) => (
    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        {children}
    </Button>
)

export default function WysiwygEditor({ content, onChange }: WysiwygEditorProps) {
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
            <Textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                className="w-full min-h-[300px] rounded-t-none border-0 focus-visible:ring-0 resize-y"
                placeholder="Enter the definition description..."
            />
        </div>
    )
}
