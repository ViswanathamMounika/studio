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

export interface DynamicSection {
  sectionId: string;
  name: string;
  description?: string;
  content: string;
  isMandatory: boolean;
  contentType: 'plain' | 'rich' | 'dropdown';
  dropdownOptions?: string;
  maxLength?: number;
}

export interface InputParameter {
  name: string;
  type: string;
}

export interface SqlFunctionDetails {
  inputParameters: InputParameter[];
  outputType: 'varchar' | 'int' | 'date' | 'datetime';
  outputExample: string;
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
  isDraft?: boolean;
  isPendingApproval?: boolean;
  revisions: Revision[];
  isBookmarked?: boolean;
  supportingTables: SupportingTableRef[];
  attachments: Attachment[];
  children?: Definition[];
  notes?: Note[];
  discussions?: DiscussionMessage[];
  relatedDefinitions?: string[];
  technicalDetails?: string;
  usageExamples?: string;
  templateId?: string;
  dynamicSections?: DynamicSection[];
  sqlFunctionDetails?: SqlFunctionDetails;
  publishedSnapshot?: Partial<Omit<Definition, 'revisions' | 'children' | 'notes' | 'discussions'>>;
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
    sqlMetadata?: {
        inputParameters: InputParameter[];
        outputType: 'varchar' | 'int' | 'date' | 'datetime';
        outputExample: string;
    };
}

export interface TemplateSection {
  id: string;
  name: string;
  description?: string;
  isMandatory: boolean;
  defaultValue?: string;
  contentType: 'plain' | 'rich' | 'dropdown';
  dropdownOptions?: string;
  maxLength?: number;
}

export type TemplateType = 'Standard' | 'Custom';

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  description?: string;
  status: 'Active' | 'Inactive';
  // Default values for standard fields
  defaultShortDescription?: string;
  defaultDescription?: string;
  defaultTechnicalDetails?: string;
  defaultUsageExamples?: string;
  defaultAttachments?: Attachment[];
  // Dynamic custom sections
  customSections?: TemplateSection[];
}
