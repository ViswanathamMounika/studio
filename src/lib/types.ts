

export interface Revision {
  ticketId: string;
  date: string;
  developer: string;
  description: string;
  snapshot: Omit<Definition, 'revisions' | 'children' | 'notes'>;
}

export interface SupportingTableRef {
    id: string;
    name: string;
}

export interface Attachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Note {
    id: string;
    authorId: string;
    author: string;
    avatar: string;
    date: string;
    content: string;
    isShared: boolean;
}

export interface Definition {
  id: string;
  name: string;
  module: string;
  keywords: string[];
  description: string;
  revisions: Revision[];
  isArchived: boolean;
  isBookmarked?: boolean;
  supportingTables: SupportingTableRef[];
  attachments: Attachment[];
  children?: Definition[];
  notes?: Note[];
  relatedDefinitions?: string[];
  technicalDetails?: string;
  usageExamples?: string;
}

export interface SupportingTable {
    id: string;
    name:string;
    description: string;
    headers: string[];
    rows: (string|number|null)[][];
}

export interface Notification {
    id: string;
    definitionId: string;
    definitionName: string;
    message: string;
    date: string;
    read: boolean;
}
