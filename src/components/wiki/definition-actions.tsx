"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Archive, Bookmark, Copy, Download, MoreVertical, Pencil, Trash2, Undo2 } from "lucide-react";
import type { Definition } from "@/lib/types";

type DefinitionActionsProps = {
  definition: Definition;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  isAdmin: boolean;
};

export default function DefinitionActions({ definition, onEdit, onDuplicate, onArchive, onDelete, onToggleBookmark, isAdmin }: DefinitionActionsProps) {
  
  const handleJsonExport = () => {
    const exportData = {
        disclaimer: `This is a copy of this definition as of ${new Date().toLocaleDateString()}. Please go to ${window.location.origin} to view the updated definition.`,
        data: definition
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${definition.name.replace(/\s+/g, '_')}-export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handlePdfExport = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.text(definition.name, 20, 20);
    doc.setFont('helvetica', 'normal');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = definition.description;
    
    // Simple conversion for demo. A real implementation would be more robust.
    const text = doc.splitTextToSize(tempDiv.innerText, 170);
    doc.text(text, 20, 30);
    doc.save(`${definition.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleExcelExport = async () => {
    const XLSX = await import('xlsx');
    const data = [
      {
        ID: definition.id,
        Name: definition.name,
        Module: definition.module,
        Keywords: definition.keywords.join(', '),
        Description: definition.description.replace(/<[^>]+>/g, ''), // strip html
        Archived: definition.isArchived,
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Definition');
    XLSX.writeFile(workbook, `${definition.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleHtmlExport = () => {
    const htmlContent = `
      <html>
        <head>
          <title>${definition.name}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 2rem; }
            h1 { color: #333; }
            p { color: #555; }
            .keywords { font-style: italic; color: #777; }
          </style>
        </head>
        <body>
          <h1>${definition.name}</h1>
          <p><strong>Module:</strong> ${definition.module}</p>
          <div class="keywords"><strong>Keywords:</strong> ${definition.keywords.join(', ')}</div>
          <hr/>
          ${definition.description}
        </body>
      </html>
    `;
    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${definition.name.replace(/\s+/g, '_')}.html`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Lock editing if pending review
  const isEditable = !definition.isPendingApproval && (isAdmin || definition.isDraft);

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isEditable && (
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
          )}
          
          {isAdmin && (
            <DropdownMenuItem 
              onClick={() => onDuplicate(definition.id)} 
              className="cursor-pointer"
              disabled={definition.isDraft}
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => onToggleBookmark(definition.id)} 
            className="cursor-pointer"
            disabled={definition.isDraft}
          >
              <Bookmark className="mr-2 h-4 w-4" />
              <span>{definition.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
          </DropdownMenuItem>
          
          {isAdmin && (
            <DropdownMenuItem 
              onClick={() => onArchive(definition.id, !definition.isArchived)} 
              className="cursor-pointer"
              disabled={definition.isDraft}
            >
              <Archive className="mr-2 h-4 w-4" />
              <span>{definition.isArchived ? 'Unarchive' : 'Archive'}</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              <span>Export As</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleJsonExport} className="cursor-pointer">JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handlePdfExport} className="cursor-pointer">PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExcelExport} className="cursor-pointer">Excel (XLSX)</DropdownMenuItem>
                <DropdownMenuItem onClick={handleHtmlExport} className="cursor-pointer">HTML</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {isAdmin && !definition.isDraft && (
              <>
                <DropdownMenuSeparator />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Permanently</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[24px] border-none p-8">
                        <AlertDialogHeader>
                            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <AlertDialogTitle className="text-2xl font-bold">Delete Permanently?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
                                You are about to permanently delete <strong>{definition.name}</strong> and all of its associated version snapshots. 
                                This action cannot be reversed and the definition will be removed for all users.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-3">
                            <AlertDialogCancel className="rounded-xl font-bold">Keep Definition</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => onDelete(definition.id)} 
                                className="rounded-xl bg-red-600 hover:bg-red-700 font-bold px-6"
                            >
                                Delete Everything
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}