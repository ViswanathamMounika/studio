
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
import { Button } from "@/components/ui/button";
import { Archive, Bookmark, Copy, Download, MoreVertical, Pencil, Undo2 } from "lucide-react";
import type { Definition } from "@/lib/types";

type DefinitionActionsProps = {
  definition: Definition;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onToggleBookmark: (id: string) => void;
  isAdmin: boolean;
};

export default function DefinitionActions({ definition, onEdit, onDuplicate, onArchive, onToggleBookmark, isAdmin }: DefinitionActionsProps) {
  
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

  const isEditable = isAdmin || (definition.isDraft && !definition.isPendingApproval);

  return (
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
            {definition.isArchived ? (
              <>
                <Undo2 className="mr-2 h-4 w-4" />
                <span>Restore</span>
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive</span>
              </>
            )}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
