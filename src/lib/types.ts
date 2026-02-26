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
  shortDescription?: string;
  description: string; // Corresponds to DEF_LONG_DESCR
  keywords: string[];
  module: string;
  sourceType?: string;
  sourceDb?: string;
  sourceName?: string;
  sourceServer?: string;
  isArchived: boolean;
  revisions: Revision[];
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

export type ActivityType = 'View' | 'Edit' | 'Create' | 'Download' | 'Delete' | 'Archive' | 'Duplicate' | 'Search';

export interface ActivityLog {
    id: string;
    userName: string;
    definitionName: string;
    activityType: ActivityType;
    occurredDate: string;
    details?: string;
}

export interface DatabaseMetadata {
    id: string;
    name: string;
}

export interface SourceTypeMetadata {
    id: string;
    name: string;
}

export interface SourceObjectMetadata {
    id: string;
    name: string;
    typeId: string;
}
