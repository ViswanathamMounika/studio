export interface Revision {
  ticketId: string;
  date: string;
  developer: string;
  description: string;
  snapshot: Omit<Definition, 'revisions' | 'children' | 'notes' | 'discussions'>;
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

export interface DiscussionMessage {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
  type: 'comment' | 'change-request' | 'rejection';
  priority?: 'Low' | 'Medium' | 'High';
  round?: number;
}

// NEW SCHEMA TYPES
export type FieldType = 'RichText' | 'PlainText' | 'Dropdown' | 'KeyValue';

export interface TemplateOption {
  id: string;
  templateSectionId: string;
  columnId?: string; // Links to a specific column if it's a KeyValue dropdown
  label: string;
  value: string;
  sortOrder: number;
  isDefault: boolean;
}

export interface TemplateColumn {
  id: string;
  templateSectionId: string;
  name: string;
  inputType: 'TextBox' | 'Dropdown';
  isMulti: boolean;
  sortOrder: number;
  isRequired: boolean;
  maxLength?: number;
  options?: TemplateOption[];
}

export interface TemplateSection {
  id: string;
  templateId: string;
  name: string;
  description?: string; // Optional description field
  group?: string; // This is the Section_Group name
  groupOrder?: number; // Sorting order for the group itself
  order: number; // Sorting order within the document/group
  fieldType: FieldType;
  isMulti: boolean;
  maxLength?: number;
  isRequired: boolean;
  options?: TemplateOption[];
  columns?: TemplateColumn[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  module: string; // Added mandatory module string
  isDefault: boolean;
  isActive: boolean;
  sections: TemplateSection[];
}

// STORAGE TYPES FOR DEFINITION VALUES
export interface SectionValue {
  sectionId: string;
  raw: string;
  html?: string;
  multiValues?: string[]; // For Dropdown IsMulti=1
  structuredRows?: Array<Record<string, string>>; // For KeyValue
}

export interface LockInfo {
  userId: string;
  userName: string;
  expireAt: string;
}

export interface Definition {
  id: string;
  originalId?: string; // Links draft to live version
  baseVersionId?: string; // The revision ID this draft was branched from
  authorId?: string; // User ID who owns this draft/submission
  name: string;
  module: string;
  templateId?: string;
  sectionValues?: SectionValue[];
  keywords: string[];
  isArchived: boolean;
  isDraft?: boolean;
  isPendingApproval?: boolean;
  submittedAt?: string;
  submittedBy?: string;
  revisions: Revision[];
  isBookmarked?: boolean;
  supportingTables: SupportingTableRef[];
  attachments: Attachment[];
  children?: Definition[];
  notes?: Note[];
  discussions?: DiscussionMessage[];
  relatedDefinitions?: string[];
  publishedSnapshot?: Partial<Omit<Definition, 'revisions' | 'children' | 'notes' | 'discussions'>>;
  lock?: LockInfo;
  
  // Backward compatibility fields
  description: string; 
  shortDescription?: string;
  technicalDetails?: string;
  usageExamples?: string;
  sourceType?: string;
  sourceDb?: string;
  sourceName?: string;
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

export type View = 'definitions' | 'activity-logs' | 'template-management' | 'approval-workflow';

export type ActivityType = 
  | 'Definition Created'
  | 'Definition Updated'
  | 'Definition Bookmarked'
  | 'Definition Archived'
  | 'Definition Unarchived'
  | 'Definition Duplicate'
  | 'Definition Export'
  | 'Definition Notes Added'
  | 'Definition Notes Updated'
  | 'Definition Notes Deleted'
  | 'Definition Related Added'
  | 'Definition Related Deleted'
  | 'Definition Viewed'
  | 'Definition Shared'
  | 'Definition Searched'
  | 'Definition Attachment Downloaded';

export interface ActivityLog {
    id: string;
    userName: string;
    definitionName: string;
    activityType: ActivityType;
    occurredDate: string;
    details?: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  definitionId: string;
  definitionName: string;
  action: 'Submitted' | 'Approved' | 'Rejected' | 'Changes Requested';
  userName: string;
  date: string;
  comment?: string;
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