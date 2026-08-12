import type { Definition, SupportingTable, ActivityLog, DatabaseMetadata, SourceTypeMetadata, SourceObjectMetadata, ActivityType, Template, Revision, TemplateSection, ApprovalHistoryEntry, UserAccount, Role, Permission, MasterDataState, SystemConfigurationState } from './types';

export const initialDrafts: Definition[] = [
  {
    id: 'draft_pending_1',
    originalId: '1.1.2',
    name: 'Service Type Mapping (v2 Updates)',
    module: 'Authorizations',
    templateId: '1',
    authorId: 'u2',
    submittedBy: 'Sarah Chen',
    submittedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), // 7 days ago (Bottleneck)
    isDraft: false,
    isPendingApproval: true,
    keywords: ['mapping', 'codes', 'v2'],
    description: '<p>Updated mapping logic for 2024 CPT codes.</p>',
    revisions: [],
    isArchived: false,
    supportingTables: [],
    attachments: [],
    sectionValues: [
      { sectionId: '1', raw: 'Updated mapping for 2024 codes.' },
      { sectionId: '2', raw: '<p>Updated mapping logic for 2024 CPT codes.</p>', html: '<p>Updated mapping logic for 2024 CPT codes.</p>' }
    ]
  },
  {
    id: 'draft_pending_2',
    name: 'New Provider Contract Template',
    module: 'Provider',
    templateId: '1',
    authorId: 'u4',
    submittedBy: 'Elena Rodriguez',
    submittedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
    isDraft: false,
    isPendingApproval: true,
    keywords: ['provider', 'contract', 'legal'],
    description: '<p>New standardized contract language for network providers.</p>',
    revisions: [],
    isArchived: false,
    supportingTables: [],
    attachments: [],
    sectionValues: [
      { sectionId: '1', raw: 'Standard provider contract terms.' },
      { sectionId: '2', raw: '<p>Standard legal language for provider network participation.</p>', html: '<p>Standard legal language for provider network participation.</p>' }
    ]
  },
  {
    id: 'draft_orphan_1',
    name: 'Abandoned Benefit Note',
    module: 'Member',
    templateId: '1',
    authorId: 'u3',
    isDraft: true,
    isPendingApproval: false,
    revisions: [{ ticketId: 'BASE', date: '2023-10-10', developer: 'Mark Wilson', description: 'Draft started', snapshot: {} as any }],
    isArchived: false,
    keywords: [],
    description: 'Empty',
    supportingTables: [],
    attachments: []
  }
];

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
    { id: 'm5', name: 'Other', isActive: true, description: 'General or miscellaneous documentation categories.' },
  ],
  sourcesOfTruth: [
    { id: 's1', name: 'EzCAP', isActive: true },
    { id: 's2', name: 'SupportTbls', isActive: true },
    { id: 's3', name: 'NetApps', isActive: true },
    { id: 's4', name: 'AuditTables', isActive: true },
    { id: 's5', name: 'CloudData', isActive: true },
    { id: 's6', name: 'Other', isActive: true },
  ],
  sourceTypes: [
    { id: 'st1', name: 'View', isActive: true },
    { id: 'st2', name: 'Table', isActive: true },
    { id: 'st3', name: 'SQL Function', isActive: true },
    { id: 'st4', name: 'SQL Stored Procedure', isActive: true },
    { id: 'st5', name: 'External API', isActive: true },
    { id: 'st6', name: 'None', isActive: true },
  ],
  definitionStatuses: [
    { id: 'ds1', name: 'Draft', isActive: true },
    { id: 'ds2', name: 'Pending Approval', isActive: true },
    { id: 'ds3', name: 'Published', isActive: true },
    { id: 'ds4', name: 'Archived', isActive: true },
    { id: 'ds5', name: 'Rejected', isActive: true },
  ],
  versionStatuses: [
    { id: 'vs1', name: 'Draft', isActive: true },
    { id: 'vs2', name: 'Pending Approval', isActive: true },
    { id: 'vs3', name: 'Published', isActive: true },
    { id: 'vs4', name: 'Rejected', isActive: true },
    { id: 'vs5', name: 'Sent back for changes', isActive: true },
    { id: 'vs6', name: 'Deleted', isActive: true },
  ]
};

export const initialSystemConfig: SystemConfigurationState = {
  settings: {
    appName: 'MPM Core Platform',
    appDescription: 'Centralized Healthcare Knowledge Management System',
    environment: 'Production',
    version: 'v2.14.3',
    maxFileUploadSizeMb: 25,
    allowedFileTypes: ['.pdf', '.docx', '.xlsx', '.json', '.sql', '.txt', '.csv', '.png'],
    sessionTimeoutMinutes: 60,
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'America/Los_Angeles',
    language: 'English (US)',
    
    // New fields from reference
    fileStoragePath: '\\\\nas.keysoftwareinc.com\\share\\MPMCore',
    fileStorageUser: 'nas\\KSUser',
    fileStoragePass: '••••••••••••••••••••••••',
    fileStorageEnabled: true,
    
    lockCleanupInterval: 1,
    lockCleanupEnabled: true,
    
    approverRoleId: '1317',
    adminRoleId: '1218',
    approvalRequestLimit: 100,
    approvalHistoryLimit: 100,
    
    searchIndexName: 'mpm-service-wiki-wikis-local',
    searchSyncInterval: 15,
    searchResultSize: 10000,
    searchSyncEnabled: true,

    // Global Security
    globalSecurityApiUrl: 'http://xeon3.keysoftwareinc.com:6062/',
    globalSecurityAppId: '1041'
  },
  emailTemplates: [
    {
      id: 'et1',
      name: 'Approval Requested',
      subject: 'Action Required: Definition Approval Request - {{definitionName}}',
      body: 'Hello {{recipientName}},\n\nA new definition "{{definitionName}}" has been submitted for approval by {{authorName}}.\n\nPlease review it at: {{definitionUrl}}',
      variables: ['{{definitionName}}', '{{recipientName}}', '{{authorName}}', '{{definitionUrl}}']
    }
  ],
  configKeys: [
    { id: '1', key: 'SESSION_TIMEOUT', value: '20', type: 'minutes', effectiveFrom: '2025-12-23T00:00:00Z', active: true, description: 'Session timeout setting for the application' },
    { id: '2', key: 'REVISION_RECORD_COUNT', value: '10', type: 'record count', effectiveFrom: '2025-12-23T00:00:00Z', active: true, description: 'No. of revisions to show for each definition' },
    { id: '3', key: 'DATA_PREVIEW_COUNT', value: '10', type: 'int', effectiveFrom: '2026-01-06T05:03:00Z', active: true, description: 'Support table data preview count' },
    { id: '8', key: 'DEF_RECENT_COUNT', value: '10', type: 'int', effectiveFrom: '2026-01-07T05:21:00Z', active: true, description: 'Recent definitions count' },
    { id: '9', key: 'INITIAL_DEF_COUNT', value: '300', type: 'int', effectiveFrom: '2026-01-21T23:05:00Z', active: true, description: 'Initial definition count' },
    { id: '10', key: 'ACTIVITY_LOGS_GRID_RECORDS_COUNT', value: '500', type: 'int', effectiveFrom: '2026-05-29T09:10:00Z', active: true, description: 'Activity logs search results count' },
    { id: '11', key: 'DASHBOARD_CHART_DAY_THRESHOLD', value: '14', type: 'int', effectiveFrom: '2026-02-15T09:00:00Z', active: true, description: 'Day limit for daily chart view' },
    { id: '12', key: 'DASHBOARD_CHART_WEEK_THRESHOLD', value: '60', type: 'int', effectiveFrom: '2026-02-15T09:00:00Z', active: true, description: 'Day limit for weekly chart view' },
    { id: '13', key: 'DASHBOARD_NEEDS_ATTENTION_DAYS', value: '5', type: 'int', effectiveFrom: '2026-03-01T09:00:00Z', active: true, description: 'Days after which a pending definition appears in Needs Attention' }
  ]
};

export const initialTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Definition',
    description: 'Default MPM Wiki definition structure',
    module: 'Other',
    isDefault: true,
    isActive: true,
    sections: [
      { id: '1', templateId: '1', name: 'Short Description', fieldType: 'PlainText', isMulti: false, maxLength: 500, isRequired: false, order: 2 },
      { id: '2', templateId: '1', name: 'Description', fieldType: 'RichText', isMulti: false, isRequired: false, order: 3 },
      { id: '3', templateId: '1', name: 'Technical Details', fieldType: 'RichText', isMulti: false, isRequired: false, order: 4 },
      { id: '4', templateId: '1', name: 'Usage Examples', fieldType: 'RichText', isMulti: false, isRequired: false, order: 5 },
      { id: '8', templateId: '1', name: 'Source of Truth', fieldType: 'Dropdown', isMulti: true, isRequired: false, order: 1, options: [
          { id: 's1', templateSectionId: '8', label: 'EzCAP', value: 'EzCAP', sortOrder: 1, isDefault: false },
          { id: 's2', templateSectionId: '8', label: 'SupportTbls', value: 'SupportTbls', sortOrder: 2, isDefault: false },
          { id: 's3', templateSectionId: '8', label: 'NetApps', value: 'NetApps', sortOrder: 3, isDefault: false },
          { id: 's4', templateSectionId: '8', label: 'AuditTables', value: 'AuditTables', sortOrder: 4, isDefault: false },
          { id: 's5', templateSectionId: '8', label: 'Other', value: 'Other', sortOrder: 5, isDefault: false },
        ]
      }
    ]
  },
  {
    id: 'unused-1',
    name: 'Obsolete Legacy Blueprint',
    description: 'A template with 0 associated definitions.',
    module: 'Other',
    isDefault: false,
    isActive: true,
    sections: []
  },
  {
    id: '2',
    name: 'Clinical Authorization Protocol',
    description: 'Structured layout for medical necessity and clinical review guidelines.',
    module: 'Authorizations',
    isDefault: false,
    isActive: true,
    sections: [
      { id: 'c1', templateId: '2', name: 'Clinical Criteria', fieldType: 'RichText', isMulti: false, isRequired: true, order: 1 },
      { id: 'c2', templateId: '2', name: 'Medical Necessity Rules', fieldType: 'RichText', isMulti: false, isRequired: true, order: 2 },
      { id: 'c3', templateId: '2', name: 'Authorized CPT Ranges', fieldType: 'PlainText', isMulti: false, isRequired: false, order: 3 },
      { id: 'c4', templateId: '2', name: 'Reviewer Guidelines', fieldType: 'RichText', isMulti: false, isRequired: false, order: 4 }
    ]
  },
  {
    id: '3',
    name: 'Technical API Specification',
    description: 'Documentation blueprint for system integration endpoints and data mapping.',
    module: 'Other',
    isDefault: false,
    isActive: true,
    sections: [
      { id: 't1', templateId: '3', name: 'Endpoint URI', fieldType: 'PlainText', isMulti: false, isRequired: true, order: 1 },
      { id: 't2', templateId: '3', name: 'Request Payload Schema', fieldType: 'RichText', isMulti: false, isRequired: true, order: 2 },
      { id: 't3', templateId: '3', name: 'Response Mapping', fieldType: 'KeyValue', isMulti: false, isRequired: true, order: 3, columns: [
          { id: 'tc1', templateSectionId: 't3', name: 'Field', inputType: 'TextBox', isMulti: false, sortOrder: 1, isRequired: true },
          { id: 'tc2', templateSectionId: 't3', name: 'Internal Data Type', inputType: 'TextBox', isMulti: false, sortOrder: 2, isRequired: true }
      ]},
      { id: 't4', templateId: '3', name: 'Authentication Requirements', fieldType: 'PlainText', isMulti: false, isRequired: false, order: 4 }
    ]
  },
  {
    id: '4',
    name: 'Member Benefit Policy',
    description: 'User-friendly layout for explaining complex healthcare benefits and coverage rules.',
    module: 'Member',
    isDefault: false,
    isActive: true,
    sections: [
      { id: 'b1', templateId: '4', name: 'Coverage Summary', fieldType: 'RichText', isMulti: false, isRequired: true, order: 1 },
      { id: 'b2', templateId: '4', name: 'Exclusions & Limitations', fieldType: 'RichText', isMulti: false, isRequired: true, order: 2 },
      { id: 'b3', templateId: '4', name: 'Member Cost Share', fieldType: 'PlainText', isMulti: false, isRequired: false, order: 3 },
      { id: 'b4', templateId: '4', name: 'Plan Year Accumulators', fieldType: 'PlainText', isMulti: false, isRequired: false, order: 4 }
    ]
  },
  {
    id: '5',
    name: 'Provider Fee Schedule',
    description: 'Documentation for reimbursement models and specialized provider billing rules.',
    module: 'Provider',
    isDefault: false,
    isActive: true,
    sections: [
      { id: 'f1', templateId: '5', name: 'Reimbursement Model', fieldType: 'Dropdown', isMulti: false, isRequired: true, order: 1, options: [
        { id: 'fo1', templateSectionId: 'f1', label: 'Fee-For-Service', value: 'FFS', sortOrder: 1, isDefault: true },
        { id: 'fo2', templateSectionId: 'f1', label: 'Capitation', value: 'CAP', sortOrder: 2, isDefault: false },
        { id: 'fo3', templateSectionId: 'f1', label: 'CASE Rate', value: 'CASE', sortOrder: 3, isDefault: false }
      ]},
      { id: 'f2', templateId: '5', name: 'Base Rate Table', fieldType: 'KeyValue', isMulti: false, isRequired: true, order: 2, columns: [
        { id: 'fc1', templateSectionId: 'f2', name: 'Column Name', inputType: 'TextBox', isMulti: false, sortOrder: 1, isRequired: true },
        { id: 'fc2', templateSectionId: 'f2', name: 'Percent of Medicare', inputType: 'TextBox', isMulti: false, sortOrder: 2, isRequired: true }
      ]},
      { id: 'f3', templateId: '5', name: 'Modifier Adjustments', fieldType: 'RichText', isMulti: false, isRequired: false, order: 3 }
    ]
  },
  {
    id: '7',
    name: 'HEDIS Quality Measure',
    description: 'Documentation for clinical quality reporting and NCQA metrics.',
    module: 'Other',
    isDefault: false,
    isActive: true,
    sections: [
      { id: 'q1', templateId: '7', name: 'Measure Description', fieldType: 'PlainText', isMulti: false, isRequired: true, order: 1 },
      { id: 'q2', templateId: '7', name: 'Denominator Criteria', fieldType: 'RichText', isMulti: false, isRequired: true, order: 2 },
      { id: 'q3', templateId: '7', name: 'Numerator Criteria', fieldType: 'RichText', isMulti: false, isRequired: true, order: 3 },
      { id: 'q4', templateId: '7', name: 'Exclusions', fieldType: 'RichText', isMulti: false, isRequired: false, order: 4 }
    ]
  },
  {
    id: '8',
    name: 'Infrastructure Configuration',
    description: 'Registry for system environments, servers, and technical endpoints.',
    module: 'Other',
    isDefault: false,
    isActive: true,
    sections: [
      { id: 'i1', templateId: '8', name: 'Environment', fieldType: 'Dropdown', isMulti: false, isRequired: true, order: 1, options: [
        { id: 'io1', templateSectionId: 'i1', label: 'Production', value: 'PROD', sortOrder: 1, isDefault: true },
        { id: 'io2', templateSectionId: 'i1', label: 'UAT', value: 'UAT', sortOrder: 2, isDefault: false },
        { id: 'io3', templateSectionId: 'i1', label: 'Development', value: 'DEV', sortOrder: 3, isDefault: false }
      ]},
      { id: 'i2', templateId: '8', name: 'Server Name', fieldType: 'PlainText', isMulti: false, isRequired: true, order: 2 },
      { id: 'i3', templateId: '8', name: 'IP Address', fieldType: 'PlainText', isMulti: false, isRequired: false, order: 3 },
      { id: 'i4', templateId: '8', name: 'Service Registry', fieldType: 'KeyValue', isMulti: false, isRequired: false, order: 4, columns: [
        { id: 'ic1', templateSectionId: 'i4', name: 'Service Name', inputType: 'TextBox', isMulti: false, sortOrder: 1, isRequired: true },
        { id: 'ic2', templateSectionId: 'i4', name: 'Port', inputType: 'TextBox', isMulti: false, sortOrder: 2, isRequired: true }
      ]}
    ]
  }
];

const baselineRevision = (name: string, desc: string, date: string = '2023-01-01'): Revision => ({
    ticketId: `MPM-BASE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    date: date,
    developer: 'System Admin',
    description: 'Baseline documentation imported from master repository.',
    snapshot: {
        id: 'temp',
        name,
        description: desc,
        keywords: [],
        module: 'Other',
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
        revisions: [
            baselineRevision('Auth Decision Date', 'Major update', '2024-02-10'),
            baselineRevision('Auth Decision Date', 'Baseline definition.', '2023-01-01'),
            baselineRevision('Auth Decision Date', 'Historical v1', '2022-01-01'),
            baselineRevision('Auth Decision Date', 'Alpha v0.1', '2021-01-01')
        ],
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
      },
      {
        id: '1.1.4',
        name: 'Prior Auth Turnaround SLA',
        module: 'Authorizations',
        templateId: '1',
        keywords: ['SLA', 'turnaround', 'compliance'],
        description: '<p>Regulatory requirements for authorization decision speed.</p>',
        shortDescription: 'SLA rules for auth decisions.',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Prior Auth Turnaround SLA', 'Compliance baseline.', '2023-05-15')], // 9 months ago
        supportingTables: [],
        attachments: [],
        sectionValues: [
          { sectionId: '1', raw: '72 hours for urgent, 14 days for routine.' },
          { sectionId: '2', html: '<h3>SLA Thresholds</h3><ul><li>Urgent: 72 Hours</li><li>Routine: 14 Calendar Days</li></ul>', raw: 'SLA Thresholds: Urgent 72h, Routine 14d' }
        ]
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
        revisions: [baselineRevision('Contracted Rates', 'Baseline logic.', '2023-01-01')], // Stale
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
          { sectionId: '1', raw: 'Core engine logic for processing professional claims.' },
          { sectionId: '2', raw: 'This framework defines the automated steps taken to validate claim data against provider contracts and member benefits.', html: '<p>This framework defines the automated steps taken to validate claim data against provider contracts and member benefits.</p><h3>Data Retrieval Pattern</h3><p>The following SQL is used to identify claims that are ready for the adjudication batch:</p><pre class="language-sql"><code>SELECT \n  ClaimID, \n  Status, \n  ProviderID, \n  DateOfService \nFROM tbl_Claims \nWHERE AdjudicationDate IS NULL \nAND Status = \'PND\';</code></pre>' },
          { sectionId: '3', raw: 'The engine is built on a C# service layer that implements the IAdjudicationStrategy interface.', html: '<h3>Service Implementation</h3><p>The core logic is encapsulated within the <code>ClaimProcessor</code> service. Below is the simplified C# implementation for the validation strategy:</p><pre class="language-csharp"><code>public class ClaimProcessor : IAdjudicationStrategy {\n  public void ProcessClaim(int claimId) {\n    var claim = _repository.GetById(claimId);\n    if (claim.IsValid()) {\n      ApplyContractRates(claim);\n      claim.Status = "APP";\n    }\n    _repository.Update(claim);\n  }\n}</code></pre>' },
          { sectionId: '8', raw: 'EzCAP', multiValues: ['EzCAP'] }
        ]
      }
    ]
  },
  {
    id: '7',
    name: 'Quality Metrics',
    module: 'Other',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: false,
    supportingTables: [],
    attachments: [],
    children: [
      {
        id: '7.1.1',
        name: 'Breast Cancer Screening (BCS)',
        module: 'Other',
        templateId: '7',
        keywords: ['HEDIS', 'HMO', 'Quality'],
        description: '<p>HEDIS measure for breast cancer screening compliance.</p>',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Breast Cancer Screening (BCS)', 'HEDIS 2024 baseline.')],
        supportingTables: [],
        attachments: [],
        sectionValues: [
          { sectionId: 'q1', raw: 'Percentage of women 50-74 who had a mammogram.' },
          { sectionId: 'q2', html: '<p>Women ages 50-74 as of Dec 31 of the measurement year.</p>', raw: 'Women 50-74.' },
          { sectionId: 'q3', html: '<p>One or more mammograms between Oct 1 two years prior and Dec 31 of measurement year.</p>', raw: '1+ Mammogram in window.' }
        ]
      }
    ]
  },
  {
    id: '8',
    name: 'System Infrastructure',
    module: 'Other',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: false,
    supportingTables: [],
    attachments: [],
    children: [
      {
        id: '8.1.1',
        name: 'SQL Production Cluster',
        module: 'Other',
        templateId: '8',
        keywords: ['DB', 'SQL', 'Server'],
        description: '<p>Core production SQL server environment.</p>',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('SQL Production Cluster', 'Environment baseline.')],
        supportingTables: [],
        attachments: [],
        sectionValues: [
          { sectionId: 'i1', raw: 'PROD' },
          { sectionId: 'i2', raw: 'MPM-SQL-CL01' },
          { sectionId: 'i4', structuredRows: [{ ic1: 'SQL Browser', ic2: '1433' }, { ic1: 'HTTP Gateway', ic2: '8080' }] }
        ]
      }
    ]
  }
];

export const initialActivityLogs: ActivityLog[] = [
  { id: '1', userName: 'Dhilip Sagadevan', definitionName: 'System Configuration', activityType: 'System Configuration Updated', occurredDate: new Date(Date.now() - 3600000 * 1).toISOString(), details: 'Updated maximum file upload size to 25MB.' },
  { id: '2', userName: 'Sarah Chen', definitionName: 'Auth Decision Date', activityType: 'Definition Updated', occurredDate: new Date(Date.now() - 3600000 * 5).toISOString(), details: 'Updated SLA logic for urgent requests.' },
  { id: '3', userName: 'Elena Rodriguez', definitionName: 'Breast Cancer Screening (BCS)', activityType: 'Approval Decision', occurredDate: new Date(Date.now() - 3600000 * 10).toISOString(), details: 'Approved & Published.' },
  { id: '4', userName: 'Dhilip Sagadevan', definitionName: 'User Management', activityType: 'User Profile Updated', occurredDate: new Date(Date.now() - 3600000 * 2).toISOString(), details: 'Activated account for Sarah Chen' }
];

export const initialApprovalHistory: ApprovalHistoryEntry[] = [
  { id: 'h1', definitionId: '1.1.1', definitionName: 'Auth Decision Date', action: 'Approved', userName: 'Dhilip Sagadevan', date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), comment: 'All metadata verified against EzCAP production schema.' },
  { id: 'h2', definitionId: '1.1.1', definitionName: 'Auth Decision Date', action: 'Submitted', userName: 'Sarah Chen', date: new Date(Date.now() - 3600000 * 24 * 6).toISOString() },
  { id: 'h3', definitionId: '1.1.2', definitionName: 'Service Type Mapping', action: 'Changes Requested', userName: 'Dhilip Sagadevan', date: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), comment: 'Duplication identified: This logic overlaps with the Provider Master mapping table.' },
  { id: 'h4', definitionId: '1.1.2', definitionName: 'Service Type Mapping', action: 'Rejected', userName: 'Dhilip Sagadevan', date: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), comment: 'Formatting issues: Technical SQL snippet is missing required JOIN criteria.' },
];

export const initialUsers: UserAccount[] = [
  { id: 'u1', name: 'Dhilip Sagadevan', email: 'dhilip.s@medpoint.com', role: 'Super Admin', status: 'Active', lastLogin: new Date().toISOString(), avatar: 'https://picsum.photos/seed/dhilip/40/40', department: 'Executive' },
  { id: 'u2', name: 'Sarah Chen', email: 's.chen@medpoint.com', role: 'Admin', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(), avatar: 'https://picsum.photos/seed/sarah/40/40', department: 'Clinical IT' },
  { id: 'u3', name: 'Mark Wilson', email: 'm.wilson@medpoint.com', role: 'Standard User', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(), avatar: 'https://picsum.photos/seed/mark/40/40', department: 'Reporting' },
  { id: 'u4', name: 'Elena Rodriguez', email: 'e.rodriguez@medpoint.com', role: 'Approver', status: 'Inactive', lastLogin: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), avatar: 'https://picsum.photos/seed/elena/40/40', department: 'Compliance' },
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
        { ID: 1, OBJECT_TYPE: 1, SERVER_NAME: 'MPM_PROD_SQL', DATABASE_NAME: 'DW_Reporting', QUERY: 'SELECT * FROM vw_AuthDecisionDate', NAME: 'Auth Decision Date View', DESCRIPTION: 'Main view for authorization decision dates.', CREATEDBY: 'Dhilip Sagadevan', CREATEDDATE: '2023-01-01T09:00:00Z', LASTCHANGEDBY: 'Dhilip Sagadevan', LASTCHANGEDDATE: '2023-10-15T14:30:00Z' }
    ]
};

export const allDataTables: SupportingTable[] = [
    { id: 'table-1', name: 'vw_AuthDecisionDate', description: 'Preview of Auth Decision Date', headers: ['AuthID', 'DecisionDate', 'Status'], rows: [['A100', '2023-10-01', 'Approved'], ['A101', '2023-10-02', 'Denied']] }
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
