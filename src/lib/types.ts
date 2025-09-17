export interface Revision {
  ticketId: string;
  date: string;
  developer: string;
  description: string;
  snapshot: Omit<Definition, 'revisions' | 'children'>;
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

export interface Definition {
  id: string;
  name: string;
  module: string;
  keywords: string[];
  description: string;
  technicalDetails: string;
  examples: string;
  usage: string;
  revisions: Revision[];
  isArchived: boolean;
  isBookmarked?: boolean;
  supportingTables: SupportingTableRef[];
  attachments: Attachment[];
  children?: Definition[];
}

export interface SupportingTable {
    id: string;
    name:string;
    description: string;
    headers: string[];
    rows: string[][];
}
