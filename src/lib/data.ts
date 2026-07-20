import type { Definition, SupportingTable, ActivityLog, DatabaseMetadata, SourceTypeMetadata, SourceObjectMetadata, ActivityType, Template, Revision, TemplateSection, ApprovalHistoryEntry, UserAccount, Role, Permission, MasterDataState, SystemConfigurationState } from './types';

export const authorizationStatusCodes: SupportingTable = {
    id: 'auth-status-codes',
    name: 'Authorization Status Codes',
    description: 'Codes representing the status of a service authorization.',
    headers: ['Code', 'Description', 'Is Final Status?'],
    rows: [
        ['APP', 'Approved', 'Yes'],
        ['MOD', 'Modified', 'Yes'],
        ['DEN', 'Denied', 'Yes'],
        ['CAN', 'Canceled', 'Yes'],
        ['PND', 'Pending', 'No'],
        ['REV', 'In Review', 'No'],
    ]
};

export const mpmDatabases: DatabaseMetadata[] = [
    { id: 'EzCAp', name: 'EzCAp' },
    { id: 'SupportTbls', name: 'SupportTbls' },
    { id: 'Other', name: 'Other' },
    { id: 'NetApps', name: 'NetApps' },
    { id: 'AuditTables', name: 'AuditTables' },
];

const standardSourceTypes: SourceTypeMetadata[] = [
    { id: 'Tables', name: 'Tables' },
    { id: 'Views', name: 'Views' },
    { id: 'Stored Procedures', name: 'Stored Procedures' },
    { id: 'SQL Functions', name: 'SQL Functions' },
];

export const mpmSourceTypes: Record<string, SourceTypeMetadata[]> = {
    'EzCAp': standardSourceTypes,
    'SupportTbls': standardSourceTypes,
    'Other': standardSourceTypes,
    'NetApps': standardSourceTypes,
    'AuditTables': standardSourceTypes,
};

export const initialMasterData: MasterDataState = {
  modules: [
    { id: 'm1', name: 'Authorizations', isActive: true, description: 'Core utilization management module.' },
    { id: 'm2', name: 'Claims', isActive: true, description: 'Financial adjudication and processing.' },
    { id: 'm3', name: 'Provider', isActive: true, description: 'Network and contract management.' },
    { id: 'm4', name: 'Member', isActive: true, description: 'Eligibility and benefits.' },
    { id: 'm5', name: 'Core', isActive: true, description: 'Cross-functional system reference.' },
    { id: 'm6', name: 'Other', isActive: true },
  ],
  sourcesOfTruth: [
    { id: 's1', name: 'EzCAP', isActive: true },
    { id: 's2', name: 'SupportTbls', isActive: true },
    { id: 's3', name: 'NetApps', isActive: true },
    { id: 's4', name: 'AuditTables', isActive: true },
    { id: 's5', name: 'Other', isActive: true },
  ],
  sourceTypes: [
    { id: 'st1', name: 'View', isActive: true },
    { id: 'st2', name: 'Table', isActive: true },
    { id: 'st3', name: 'SQL Function', isActive: true },
    { id: 'st4', name: 'SQL Stored Procedure', isActive: true },
    { id: 'st5', name: 'None', isActive: true },
  ],
  definitionStatuses: [
    { id: 'ds1', name: 'Draft', isActive: true },
    { id: 'ds2', name: 'Pending Review', isActive: true },
    { id: 'ds3', name: 'Published', isActive: true },
    { id: 'ds4', name: 'Archived', isActive: true },
    { id: 'ds5', name: 'Rejected', isActive: true },
  ],
  versionStatuses: [
    { id: 'vs1', name: 'Current', isActive: true },
    { id: 'vs2', name: 'Superseded', isActive: true },
    { id: 'vs3', name: 'Deprecated', isActive: true },
  ]
};

export const initialSystemConfig: SystemConfigurationState = {
  settings: {
    appName: 'MedPOINT Wiki',
    appDescription: 'Centralized Healthcare Knowledge Management System',
    maxFileUploadSizeMb: 10,
    allowedFileTypes: ['.pdf', '.docx', '.xlsx', '.json', '.sql', '.txt'],
    sessionTimeoutMinutes: 60,
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'America/Los_Angeles',
    language: 'English (US)'
  },
  emailTemplates: [
    {
      id: 'et1',
      name: 'Approval Requested',
      subject: 'Action Required: Definition Approval Request - {{definitionName}}',
      body: 'Hello {{recipientName}},\n\nA new definition "{{definitionName}}" has been submitted for approval by {{authorName}}.\n\nPlease review it at: {{definitionUrl}}',
      variables: ['{{definitionName}}', '{{recipientName}}', '{{authorName}}', '{{definitionUrl}}']
    },
    {
      id: 'et2',
      name: 'Revision Requested',
      subject: 'Changes Requested: {{definitionName}}',
      body: 'Hello {{authorName}},\n\nThe governance team has requested changes for "{{definitionName}}".\n\nFeedback: {{feedback}}\n\nYou can update your draft here: {{draftUrl}}',
      variables: ['{{definitionName}}', '{{authorName}}', '{{feedback}}', '{{draftUrl}}']
    }
  ]
};

export const initialTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Definition',
    description: 'Default MPM Wiki definition structure',
    isDefault: true,
    isActive: true,
    sections: [
      {
        id: '1',
        templateId: '1',
        name: 'Short Description',
        fieldType: 'PlainText',
        isMulti: false,
        maxLength: 500,
        isRequired: false,
        order: 2
      },
      {
        id: '2',
        templateId: '1',
        name: 'Description',
        fieldType: 'RichText',
        isMulti: false,
        isRequired: false,
        order: 3
      },
      {
        id: '3',
        templateId: '1',
        name: 'Technical Details',
        fieldType: 'RichText',
        isMulti: false,
        isRequired: false,
        order: 4
      },
      {
        id: '4',
        templateId: '1',
        name: 'Usage Examples',
        fieldType: 'RichText',
        isMulti: false,
        isRequired: false,
        order: 5
      },
      {
        id: '8',
        templateId: '1',
        name: 'Source of Truth',
        fieldType: 'Dropdown',
        isMulti: true,
        isRequired: false,
        order: 1,
        options: [
          { id: 's1', templateSectionId: '8', label: 'EzCAP', value: 'EzCAP', sortOrder: 1, isDefault: false },
          { id: 's2', templateSectionId: '8', label: 'SupportTbls', value: 'SupportTbls', sortOrder: 2, isDefault: false },
          { id: 's3', templateSectionId: '8', label: 'NetApps', value: 'NetApps', sortOrder: 3, isDefault: false },
          { id: 's4', templateSectionId: '8', label: 'AuditTables', value: 'AuditTables', sortOrder: 4, isDefault: false },
          { id: 's5', templateSectionId: '8', label: 'Other', value: 'Other', sortOrder: 5, isDefault: false },
        ]
      }
    ]
  }
];

const baselineRevision = (name: string, desc: string): Revision => ({
    ticketId: `MPM-BASE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    date: '2023-01-01',
    developer: 'System Admin',
    description: 'Baseline documentation imported from master repository.',
    snapshot: {
        id: 'temp',
        name,
        description: desc,
        keywords: [],
        module: 'System',
        isArchived: false,
        supportingTables: [],
        attachments: [],
    }
});

export const initialDefinitions: Definition[] = [
  {
    id: '1',
    name: 'Authorizations',
    module: 'Authorizations',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: false,
    supportingTables: [],
    attachments: [],
    children: [
      {
        id: '1.1.1',
        name: 'Auth Decision Date',
        module: 'Authorizations',
        templateId: '1',
        keywords: ['authorization', 'decision date', 'SLA'],
        description: '<p>The date on which a final adjudication decision was reached for an authorization request.</p>',
        shortDescription: 'Final decision date for authorizations.',
        sourceType: 'Views',
        sourceName: 'vw_AuthDecisionDate',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Auth Decision Date', 'Baseline definition.')],
        supportingTables: [],
        attachments: [],
        sectionValues: [
          { sectionId: '1', raw: 'Final decision date for authorizations.' },
          { sectionId: '2', raw: '<p>The date on which a final adjudication decision was reached for an authorization request.</p>', html: '<p>The date on which a final adjudication decision was reached for an authorization request.</p>' },
          { sectionId: '8', raw: 'EzCAP', multiValues: ['EzCAP'] }
        ]
      },
      {
        id: '1.1.2',
        name: 'Service Type Mapping',
        module: 'Authorizations',
        templateId: '1',
        keywords: ['mapping', 'codes'],
        description: '<p>Maps procedure codes to internal service types for utilization management reporting.</p>',
        shortDescription: 'Internal service type code mapping.',
        sourceType: 'Tables',
        sourceName: 'tbl_ServiceTypeMap',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Service Type Mapping', 'Baseline mapping logic.')],
        supportingTables: [],
        attachments: []
      }
    ]
  },
  {
    id: '2',
    name: 'Claims',
    module: 'Claims',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: false,
    supportingTables: [],
    attachments: [],
    children: [
      {
        id: '2.1.1',
        name: 'Contracted Rates',
        module: 'Claims',
        templateId: '1',
        keywords: ['claims', 'billing', 'rates'],
        description: '<p>Lookup logic for contracted provider rates based on plan ID and network tier.</p>',
        shortDescription: 'Rate calculation rules for providers.',
        sourceType: 'Stored Procedures',
        sourceName: 'usp_GetContractedRates',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Contracted Rates', 'Baseline logic.')],
        supportingTables: [],
        attachments: []
      },
      {
        id: '2.1.2',
        name: 'Adjudication Logic Framework',
        module: 'Claims',
        templateId: '1',
        keywords: ['engine', 'logic', 'C#', 'SQL', 'automation'],
        description: '<p>Standardized framework for professional claim adjudication.</p>',
        shortDescription: 'Core engine logic for processing professional claims.',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Adjudication Logic Framework', 'Baseline processing architecture.')],
        supportingTables: [],
        attachments: [],
        sectionValues: [
          { 
            sectionId: '1', 
            raw: 'Core engine logic for processing professional claims.' 
          },
          { 
            sectionId: '2', 
            raw: 'This framework defines the automated steps taken to validate claim data against provider contracts and member benefits.', 
            html: '<p>This framework defines the automated steps taken to validate claim data against provider contracts and member benefits.</p><h3>Data Retrieval Pattern</h3><p>The following SQL is used to identify claims that are ready for the adjudication batch:</p><pre class="language-sql"><code>SELECT \n  ClaimID, \n  Status, \n  ProviderID, \n  DateOfService \nFROM tbl_Claims \nWHERE AdjudicationDate IS NULL \nAND Status = \'PND\';</code></pre>' 
          },
          { 
            sectionId: '3', 
            raw: 'The engine is built on a C# service layer that implements the IAdjudicationStrategy interface.',
            html: '<h3>Service Implementation</h3><p>The core logic is encapsulated within the <code>ClaimProcessor</code> service. Below is the simplified C# implementation for the validation strategy:</p><pre class="language-csharp"><code>public class ClaimProcessor : IAdjudicationStrategy {\n  public void ProcessClaim(int claimId) {\n    var claim = _repository.GetById(claimId);\n    if (claim.IsValid()) {\n      ApplyContractRates(claim);\n      claim.Status = "APP";\n    }\n    _repository.Update(claim);\n  }\n}</code></pre>'
          },
          {
            sectionId: '8',
            raw: 'EzCAP',
            multiValues: ['EzCAP']
          }
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Provider',
    module: 'Provider',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: false,
    supportingTables: [],
    attachments: [],
    children: []
  }
];

export const initialDrafts: Definition[] = [
  {
    id: 'draft_101',
    originalId: '3', // Links to Provider module or item
    authorId: 'user_123',
    name: 'Provider Master Verification',
    module: 'Provider',
    templateId: '1',
    keywords: ['master', 'verification', 'credentialing'],
    description: '<p>Standard operating procedure for verifying provider master data against the CAQH portal.</p>',
    shortDescription: 'SOP for provider data verification.',
    isArchived: false,
    isDraft: true,
    isPendingApproval: true,
    submittedBy: 'Dhilip Sagadevan',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    revisions: [],
    discussions: [
      {
        id: 'd101',
        authorId: 'admin_1',
        author: 'Governance Admin',
        avatar: 'https://picsum.photos/seed/admin/40/40',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        content: 'Please ensure the step-by-step screenshots are updated to the 2024 UI version.',
        type: 'comment'
      }
    ],
    supportingTables: [],
    attachments: [],
    sectionValues: [
      { sectionId: '1', raw: 'SOP for provider data verification.' },
      { sectionId: '2', raw: '<p>Standard operating procedure for verifying provider master data against the CAQH portal.</p>', html: '<p>Standard operating procedure for verifying provider master data against the CAQH portal.</p>' }
    ]
  },
  {
    id: 'draft_102',
    originalId: '1.1.1',
    authorId: 'user_123',
    name: 'Urgent Care TAT Rules',
    module: 'Authorizations',
    templateId: '1',
    keywords: ['TAT', 'urgent', 'SLA'],
    description: '<p>Updated turnaround time rules for Urgent Care centers in the Southern California region.</p>',
    shortDescription: 'Regional TAT rules for Urgent Care.',
    isArchived: false,
    isDraft: true,
    isPendingApproval: true,
    submittedBy: 'Dhilip Sagadevan',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    revisions: [],
    discussions: [
      {
        id: 'd102',
        authorId: 'admin_1',
        author: 'Compliance Lead',
        avatar: 'https://picsum.photos/seed/lead/40/40',
        date: new Date(Date.now() - 3600000 * 12).toISOString(),
        content: 'Does this include the new Saturday provision for San Diego clinics?',
        type: 'change-request',
        priority: 'High'
      }
    ],
    supportingTables: [],
    attachments: [],
    sectionValues: [
      { sectionId: '1', raw: 'Regional TAT rules for Urgent Care.' },
      { sectionId: '2', raw: '<p>Updated turnaround time rules for Urgent Care centers in the Southern California region.</p>', html: '<p>Updated turnaround time rules for Urgent Care centers in the Southern California region.</p>' }
    ]
  },
  {
    id: 'draft_103',
    authorId: 'user_123',
    name: 'Claims Adjudication Logic v2',
    module: 'Claims',
    templateId: '1',
    keywords: ['adjudication', 'v2', 'logic'],
    description: '<p>Work-in-progress update for the adjudication engine logic. Focus on professional claims.</p>',
    shortDescription: 'V2 update for claim adjudication.',
    isArchived: false,
    isDraft: true,
    isPendingApproval: false,
    revisions: [],
    supportingTables: [],
    attachments: [],
    sectionValues: [
      { sectionId: '1', raw: 'V2 update for claim adjudication.' },
      { sectionId: '2', raw: '<p>Work-in-progress update for the adjudication engine logic. Focus on professional claims.</p>', html: '<p>Work-in-progress update for the adjudication engine logic. Focus on professional claims.</p>' }
    ]
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: '1',
    userName: 'Dhilip Sagadevan',
    definitionName: 'Auth Decision Date',
    activityType: 'Definition Updated',
    occurredDate: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '2',
    userName: 'Jane Smith',
    definitionName: 'Contracted Rates',
    activityType: 'Definition Viewed',
    occurredDate: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

export const initialApprovalHistory: ApprovalHistoryEntry[] = [
  {
    id: 'h1',
    definitionId: '1.1.1',
    definitionName: 'Auth Decision Date',
    action: 'Approved',
    userName: 'Dhilip Sagadevan',
    date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    comment: 'All metadata verified against EzCAP production schema.'
  }
];

export const initialUsers: UserAccount[] = [
  { id: 'u1', name: 'Dhilip Sagadevan', email: 'dhilip.s@medpoint.com', role: 'Super Admin', status: 'Active', lastLogin: new Date().toISOString(), avatar: 'https://picsum.photos/seed/dhilip/40/40' },
  { id: 'u2', name: 'Sarah Chen', email: 's.chen@medpoint.com', role: 'Editor', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(), avatar: 'https://picsum.photos/seed/sarah/40/40' },
  { id: 'u3', name: 'Mark Wilson', email: 'm.wilson@medpoint.com', role: 'Viewer', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(), avatar: 'https://picsum.photos/seed/mark/40/40' },
  { id: 'u4', name: 'Elena Rodriguez', email: 'e.rodriguez@medpoint.com', role: 'Editor', status: 'Inactive', lastLogin: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), avatar: 'https://picsum.photos/seed/elena/40/40' },
  { id: 'u5', name: 'James T. Kirk', email: 'j.kirk@medpoint.com', role: 'Viewer', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(), avatar: 'https://picsum.photos/seed/kirk/40/40' },
];

export const initialPermissions: Permission[] = [
  { id: 'p1', name: 'View Definitions', description: 'Can read published definitions.' },
  { id: 'p2', name: 'Create Drafts', description: 'Can create and save private drafts.' },
  { id: 'p3', name: 'Submit for Approval', description: 'Can submit definitions for governance review.' },
  { id: 'p4', name: 'Approve Definitions', description: 'Can publish definitions to the live library.' },
  { id: 'p5', name: 'Manage Users', description: 'Can edit accounts and assign roles.' },
  { id: 'p6', name: 'Manage Security', description: 'Can create and edit roles/permissions.' },
  { id: 'p7', name: 'Manage Templates', description: 'Can define documentation blueprints.' },
];

export const initialRoles: Role[] = [
  { id: 'r1', name: 'Super Admin', description: 'Full system access.', status: 'Active', permissions: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] },
  { id: 'r2', name: 'Admin', description: 'Administrative access for library management.', status: 'Active', permissions: ['p1', 'p2', 'p3', 'p4', 'p7'] },
  { id: 'r3', name: 'Approver', description: 'Governance focused role for reviews.', status: 'Active', permissions: ['p1', 'p4'] },
  { id: 'r4', name: 'Standard User', description: 'Standard viewer and contributor access.', status: 'Active', permissions: ['p1', 'p2', 'p3'] },
];

export const defDataTable = {
    headers: ['ID', 'OBJECT_TYPE', 'SERVER_NAME', 'DATABASE_NAME', 'QUERY', 'NAME', 'DESCRIPTION', 'CREATEDBY', 'CREATEDDATE', 'LASTCHANGEDBY', 'LASTCHANGEDDATE'],
    rows: [
        {
            ID: 1,
            OBJECT_TYPE: 1,
            SERVER_NAME: 'MPM_PROD_SQL',
            DATABASE_NAME: 'DW_Reporting',
            QUERY: 'SELECT * FROM vw_AuthDecisionDate',
            NAME: 'Auth Decision Date View',
            DESCRIPTION: 'Main view for authorization decision dates.',
            CREATEDBY: 'Dhilip Sagadevan',
            CREATEDDATE: '2023-01-01T09:00:00Z',
            LASTCHANGEDBY: 'Dhilip Sagadevan',
            LASTCHANGEDDATE: '2023-10-15T14:30:00Z'
        },
        {
            ID: 2,
            OBJECT_TYPE: 2,
            SERVER_NAME: 'MPM_PROD_SQL',
            DATABASE_NAME: 'EzCAp',
            QUERY: 'SELECT * FROM tbl_ServiceTypeMap',
            NAME: 'Service Type Map Table',
            DESCRIPTION: 'Mapping table for service categories.',
            CREATEDBY: 'Admin',
            CREATEDDATE: '2023-02-15T10:00:00Z',
            LASTCHANGEDBY: 'Jane Smith',
            LASTCHANGEDDATE: '2023-11-01T11:20:00Z'
        }
    ]
};

export const allDataTables: SupportingTable[] = [
    {
        id: 'table-1',
        name: 'vw_AuthDecisionDate',
        description: 'Preview of Auth Decision Date',
        headers: ['AuthID', 'DecisionDate', 'Status'],
        rows: [
            ['A100', '2023-10-01', 'Approved'],
            ['A101', '2023-10-02', 'Denied'],
            ['A102', '2023-10-03', 'Approved'],
            ['A103', '2023-10-04', 'Canceled'],
            ['A104', '2023-10-05', 'Pending'],
        ]
    }
];

export function findDefinition(definitions: Definition[], id: string): Definition | null {
  if (!Array.isArray(definitions)) return null;
  for (const definition of definitions) {
    if (!definition) continue;
    if (definition.id === id) return definition;
    if (definition.children) {
      const found = findDefinition(definition.children, id);
      if (found) return found;
    }
  }
  return null;
}