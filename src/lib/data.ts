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
    submittedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
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
    submittedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), // 7 days ago
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
    { id: 'm5', name: 'Core', isActive: true, description: 'Cross-functional system reference.' },
    { id: 'm6', name: 'Infrastructure', isActive: true },
    { id: 'm7', name: 'Quality', isActive: true },
    { id: 'm8', name: 'Compliance', isActive: true },
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
    searchSyncEnabled: true
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
    { key: 'API_GATEWAY_URL', value: 'https://api.medpoint.cloud/v1', description: 'Primary edge gateway for technical requests.' },
    { key: 'CACHE_TTL_SEC', value: '3600', description: 'Standard object cache duration.' },
    { key: 'ELASTIC_AUTH_KEY', value: '********', description: 'Search provider authorization token.' },
    { key: 'SMTP_HOST', value: 'smtp.office365.com', description: 'Internal mail relay host.' },
    { key: 'LDAP_BASE_DN', value: 'DC=medpoint,DC=org', description: 'Active Directory root path.' },
    { key: 'LOG_LEVEL', value: 'INFO', description: 'System telemetry verbosity.' },
    { key: 'MAX_RETRY_COUNT', value: '3', description: 'Default failure retry limit.' }
  ]
};

export const initialTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Definition',
    description: 'Default MPM Wiki definition structure',
    module: 'Core',
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
    module: 'Core',
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
        { id: 'fo3', templateSectionId: 'f1', label: 'Case Rate', value: 'CASE', sortOrder: 3, isDefault: false }
      ]},
      { id: 'f2', templateId: '5', name: 'Base Rate Table', fieldType: 'KeyValue', isMulti: false, isRequired: true, order: 2, columns: [
        { id: 'fc1', templateSectionId: 'f2', name: 'Code Type', inputType: 'TextBox', isMulti: false, sortOrder: 1, isRequired: true },
        { id: 'fc2', templateSectionId: 'f2', name: 'Percent of Medicare', inputType: 'TextBox', isMulti: false, sortOrder: 2, isRequired: true }
      ]},
      { id: 'f3', templateId: '5', name: 'Modifier Adjustments', fieldType: 'RichText', isMulti: false, isRequired: false, order: 3 }
    ]
  },
  {
    id: '7',
    name: 'HEDIS Quality Measure',
    description: 'Documentation for clinical quality reporting and NCQA metrics.',
    module: 'Quality',
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
    module: 'Infrastructure',
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
        revisions: [baselineRevision('Prior Auth Turnaround SLA', 'Compliance baseline.')],
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
    module: 'Quality',
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
        module: 'Quality',
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
    module: 'Infrastructure',
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
        module: 'Infrastructure',
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
  },
  {
    id: '5',
    name: 'Core System',
    module: 'Core',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: false,
    supportingTables: [],
    attachments: [],
    children: [
      {
        id: '5.1.2',
        name: 'Line of Business (LOB) Registry',
        module: 'Core',
        templateId: '1',
        keywords: ['LOB', 'Commercial', 'Medicare'],
        description: '<p>Registry of authorized business lines.</p>',
        shortDescription: 'Master list of LOB codes.',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Line of Business Registry', 'System baseline.')],
        supportingTables: [],
        attachments: []
      }
    ]
  }
];

export const initialActivityLogs: ActivityLog[] = [
  { id: '1', userName: 'Administrator', definitionName: 'System Configuration', activityType: 'System Configuration Updated', occurredDate: new Date(Date.now() - 3600000 * 1).toISOString(), details: 'Updated maximum file upload size to 25MB and modified authorized file types.' },
  { id: '2', userName: 'Administrator', definitionName: 'Security Administration', activityType: 'User Role Modified', occurredDate: new Date(Date.now() - 3600000 * 5).toISOString(), details: 'Assigned Standard User role to s.chen@medpoint.com.' },
  { id: '6', userName: 'Administrator', definitionName: 'Service Type Mapping', activityType: 'Approval Decision', occurredDate: new Date(Date.now() - 3600000 * 10).toISOString(), details: 'Approved & Published: Service Type Mapping' }
];

export const initialApprovalHistory: ApprovalHistoryEntry[] = [
  { id: 'h1', definitionId: '1.1.1', definitionName: 'Auth Decision Date', action: 'Approved', userName: 'Administrator', date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), comment: 'All metadata verified against EzCAP production schema.' },
  { id: 'h2', definitionId: '1.1.1', definitionName: 'Auth Decision Date', action: 'Submitted', userName: 'Sarah Chen', date: new Date(Date.now() - 3600000 * 24 * 6).toISOString() }
];

export const initialUsers: UserAccount[] = [
  { id: 'u1', name: 'Dhilip Sagadevan', email: 'dhilip.s@medpoint.com', role: 'Super Admin', status: 'Active', lastLogin: new Date().toISOString(), avatar: 'https://picsum.photos/seed/dhilip/40/40' },
  { id: 'u2', name: 'Sarah Chen', email: 's.chen@medpoint.com', role: 'Admin', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(), avatar: 'https://picsum.photos/seed/sarah/40/40' },
  { id: 'u3', name: 'Mark Wilson', email: 'm.wilson@medpoint.com', role: 'Standard User', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(), avatar: 'https://picsum.photos/seed/mark/40/40' },
  { id: 'u4', name: 'Elena Rodriguez', email: 'e.rodriguez@medpoint.com', role: 'Approver', status: 'Inactive', lastLogin: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), avatar: 'https://picsum.photos/seed/elena/40/40' },
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
