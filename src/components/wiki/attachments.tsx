
"use client";

import { Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { File, Download, Trash2, FileText, FileJson, FileQuestion } from "lucide-react";

const getFileIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case "PDF":
      return <FileText className="h-6 w-6 text-red-500" />;
    case "DOCX":
      return <FileText className="h-6 w-6 text-blue-500" />;
    case "TXT":
      return <FileText className="h-6 w-6 text-gray-500" />;
    case "JSON":
      return <FileJson className="h-6 w-6 text-yellow-500" />;
    default:
      return <FileQuestion className="h-6 w-6 text-muted-foreground" />;
  }
};

type AttachmentListProps = {
  attachments?: Attachment[];
  isEditing?: boolean;
  onRemove?: (name: string) => void;
};

export default function AttachmentList({ attachments = [], isEditing = false, onRemove }: AttachmentListProps) {
  if (attachments.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No attachments found.</p>;
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div key={attachment.name} className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-3">
            {getFileIcon(attachment.type)}
            <div>
              <p className="font-medium">{attachment.name}</p>
              <p className="text-sm text-muted-foreground">{attachment.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button asChild variant="outline" size="sm">
                <a href={attachment.url} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            {isEditing && onRemove && (
              <Button variant="destructive" size="icon" onClick={() => onRemove(attachment.name)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
