"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Archive, Bookmark, Copy, Download, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Definition } from "@/lib/types";

type DefinitionActionsProps = {
  definition: Definition;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onToggleBookmark: (id: string) => void;
};

export default function DefinitionActions({ definition, onEdit, onDuplicate, onArchive, onToggleBookmark }: DefinitionActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(definition.id)}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleBookmark(definition.id)}>
            <Bookmark className="mr-2 h-4 w-4" />
            <span>{definition.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(definition.id, !definition.isArchived)}>
          <Archive className="mr-2 h-4 w-4" />
          <span>{definition.isArchived ? 'Unarchive' : 'Archive'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          <span>Export</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
