
import type { Definition, SupportingTable, ActivityLog, DatabaseMetadata, SourceTypeMetadata, SourceObjectMetadata, ActivityType, Template, Revision } from './types';

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

export const cmsComplianceMatrix: SupportingTable = {
    id: 'cms-compliance',
    name: 'CMS Compliance Matrix',
    description: 'Turnaround time requirements for authorizations based on state regulations.',
    headers: ['State', 'Requirement ID', 'Turnaround Time (Days)', 'Applies To'],
    rows: [
        ['CA', 'CA-UM-01', '5', 'Standard (Non-Urgent)'],
        ['CA', 'CA-UM-02', '72 hours', 'Urgent'],
        ['NY', 'NY-UM-A', '7', 'Standard (Non-Urgent)'],
        ['NY', 'NY-UM-B', '3', 'Urgent'],
        ['TX', 'TX-MCR-112', '14', 'Standard (Non-Urgent)'],
        ['TX', 'TX-MCR-113', '24 hours', 'Urgent'],
        ['FL', 'FL-MED-004', '7', 'Standard (Non-Urgent)'],
        ['FL', 'FL-MED-005', '48 hours', 'Urgent'],
    ]
};

export const timestampChangedTable: SupportingTable = {
    id: 'timestamp-changed',
    name: 'timestamp_changed table',
    description: 'Tracks when a specific column was last changed for a given record.',
    headers: ['timestamp_changed', 'table_name', 'record_id'],
    rows: [
        ['2023-10-26 10:00:15.123', 'AUTHORIZATION_MASTER', 'AUTH-55432'],
        ['2023-10-25 14:32:05.456', 'AUTHORIZATION_EVENTS', 'EVT-98765'],
        ['2023-10-24 09:15:45.789', 'PROVIDER_MASTER', 'PROV-1001-A'],
        ['2023-10-23 18:05:12.321', 'MEMBER_MASTER', 'MEM-5005-B'],
        ['2023-10-22 11:46:30.654', 'CLAIMS_MASTER', 'CLM-9876-C'],
    ]
}

export const vwAuthActionTimeTable: SupportingTable = {
    id: 'vw-authactiontime',
    name: 'vw_authactiontime view',
    description: 'A view that consolidates various action dates for an authorization.',
    headers: ['AuthID', 'Modifdate', 'DeniedDate', 'Apprvdate', 'CancelDate', 'CarvoutDate'],
    rows: [
        ['AUTH-55432', '2023-07-01 15:43:05.063', null, null, null, null],
        ['AUTH-55433', null, null, '2023-06-29 14:54:20.710', null, null],
        ['AUTH-55434', null, null, '2023-07-05 16:16:40.180', null, null],
        ['AUTH-55435', null, null, null, '2023-06-30 15:27:54.127', null],
        ['AUTH-55436', null, null, null, null, '2023-07-01 15:48:22.693'],
    ]
}

const names = ['J. Doe', 'A. Smith', 'T. Johnson', 'S. Lee', 'M. Garcia', 'P. Williams', 'D. Brown', 'K. Nguyen', 'Dhilip Sagadevan'];

const getRandomName = () => {
    return names[Math.floor(Math.random() * names.length)];
}

const generateRandomDate = () => {
    const now = new Date();
    if (Math.random() > 0.3) {
        const start = new Date();
        start.setDate(now.getDate() - 30);
        return new Date(start.getTime() + Math.random() * (now.getTime() - start.getTime())).toISOString();
    }
    const start = new Date(now.getFullYear() - 2, 0, 1);
    const date = new Date(start.getTime() + Math.random() * (now.getTime() - start.getTime()));
    return date.toISOString();
}

const defDataTableHeaders = ['ID', 'OBJECT_TYPE', 'SERVER_NAME', 'DATABASE_NAME', 'QUERY', 'NAME', 'DESCRIPTION', 'CREATEDBY', 'CREATEDDATE', 'LASTCHANGEDBY', 'LASTCHANGEDDATE'];

export const defDataTable = {
    id: 'def-data-table',
    name: 'Definition Data Table',
    description: 'A table to manage data definitions',
    headers: defDataTableHeaders,
    rows: Array.from({length: 15}, (_, i) => ({
        ID: i + 1,
        OBJECT_TYPE: i % 2 + 1,
        SERVER_NAME: 'SQL-SERVER-PROD',
        DATABASE_NAME: ['EzCAp', 'SupportTbls', 'Other', 'NetApps', 'AuditTables'][Math.floor(Math.random()*5)],
        QUERY: `SELECT * FROM table_${i+1}`,
        NAME: `Data Definition ${i+1}`,
        DESCRIPTION: `This is a description for data definition ${i+1}`,
        CREATEDBY: getRandomName(),
        CREATEDDATE: generateRandomDate(),
        LASTCHANGEDBY: getRandomName(),
        LASTCHANGEDDATE: generateRandomDate()
    }))
};

export const allDataTables = [authorizationStatusCodes, cmsComplianceMatrix, timestampChangedTable, vwAuthActionTimeTable, { ...defDataTable, rows: defDataTable.rows.map(Object.values) }];

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

export const mpmSourceObjects: Record<string, SourceObjectMetadata[]> = {
    'EzCAp_Views': [
        { id: 'vw_AuthDecisionDate', name: 'vw_AuthDecisionDate', typeId: 'Views' },
        { id: 'vw_AuthActionTime', name: 'vw_AuthActionTime', typeId: 'Views' },
        { id: 'vw_MemberEligibility', name: 'vw_MemberEligibility', typeId: 'Views' },
    ],
    'EzCAp_Tables': [
        { id: 'AUTHORIZATION_MASTER', name: 'AUTHORIZATION_MASTER', typeId: 'Tables' },
        { id: 'MEMBER_MASTER', name: 'MEMBER_MASTER', typeId: 'Tables' },
        { id: 'PROCEDURE_CODES', name: 'PROCEDURE_CODES', typeId: 'Tables' },
        { id: 'DENIAL_REASONS_MASTER', name: 'DENIAL_REASONS_MASTER', typeId: 'Tables' },
    ],
    'SupportTbls_Tables': [
        { id: 'REF_DATA', name: 'REF_DATA', typeId: 'Tables' },
        { id: 'CONFIG_PARAMS', name: 'CONFIG_PARAMS', typeId: 'Tables' },
        { id: 'SLA_MAPPING', name: 'SLA_MAPPING', typeId: 'Tables' },
    ],
    'SupportTbls_Views': [
        { id: 'vw_AuditTrail', name: 'vw_AuditTrail', typeId: 'Views' },
    ],
    'SupportTbls_SQL Functions': [
        { 
            id: 'fn_GetBusinessDays', 
            name: 'fn_GetBusinessDays', 
            typeId: 'SQL Functions',
            sqlMetadata: {
                inputParameters: [
                    { name: '@StartDate', type: 'datetime' },
                    { name: '@EndDate', type: 'datetime' }
                ],
                outputType: 'int',
                outputExample: '5'
            }
        },
        { 
            id: 'fn_FormatMemberName', 
            name: 'fn_FormatMemberName', 
            typeId: 'SQL Functions',
            sqlMetadata: {
                inputParameters: [
                    { name: '@FirstName', type: 'varchar' },
                    { name: '@LastName', type: 'varchar' },
                    { name: '@FormatType', type: 'int' }
                ],
                outputType: 'varchar',
                outputExample: 'DOE, JOHN'
            }
        },
        { 
            id: 'fn_GetAuthStatusDesc', 
            name: 'fn_GetAuthStatusDesc', 
            typeId: 'SQL Functions',
            sqlMetadata: {
                inputParameters: [
                    { name: '@StatusCode', type: 'varchar' }
                ],
                outputType: 'varchar',
                outputExample: 'Approved'
            }
        }
    ]
};

const activityTypes: ActivityType[] = [
  'Definition Created',
  'Definition Updated',
  'Definition Bookmarked',
  'Definition Archived',
  'Definition Unarchived',
  'Definition Duplicate',
  'Definition Export',
  'Definition Notes Added',
  'Definition Notes Updated',
  'Definition Notes Deleted',
  'Definition Related Added',
  'Definition Related Deleted',
  'Definition Viewed',
  'Definition Shared',
  'Definition Searched',
  'Definition Attachment Downloaded'
];

export const initialActivityLogs: ActivityLog[] = Array.from({ length: 150 }, (_, i) => ({
    id: `log-${i}`,
    userName: names[Math.floor(Math.random() * names.length)],
    definitionName: ['Auth Decision Date', 'Contracted Rates', 'Service Type Mapping', 'Provider Demographics', 'Auth Denial Reasons', 'fn_GetAuthTurnaroundTime', 'Standard Claim Codes', 'Credentialing Status'][Math.floor(Math.random() * 8)],
    activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
    occurredDate: generateRandomDate(),
}));

export const initialTemplates: Template[] = [
  {
    id: 't-1',
    name: 'Clinical Data Definition',
    type: 'Standard',
    description: 'Template for standard clinical data definitions.',
    status: 'Active',
    defaultShortDescription: 'This clinical definition describes...',
    defaultDescription: '<h3>Clinical Overview</h3><p>Provide details here.</p>',
    defaultTechnicalDetails: '<h3>Source Tables</h3><ul><li>MEMBER_MASTER</li></ul>',
    defaultUsageExamples: '<h3>Example Query</h3><pre><code>SELECT * FROM ...</code></pre>',
    defaultAttachments: []
  },
  {
    id: 't-2',
    name: 'Technical Specification',
    type: 'Standard',
    description: 'Template for technical SQL objects and reporting views.',
    status: 'Active',
    defaultShortDescription: 'Technical spec for reporting view...',
    defaultDescription: '<h3>Functional Purpose</h3><p>What does this view do?</p>',
    defaultTechnicalDetails: '<h3>SQL Performance</h3><p>Indexing strategy and execution plans.</p>',
    defaultUsageExamples: '<h3>Implementation</h3><pre><code>CREATE VIEW ...</code></pre>',
    defaultAttachments: []
  }
];

const baselineRevision = (name: string, desc: string): Revision => ({
    ticketId: `MPM-BASE-${name.substring(0, 3).toUpperCase()}`,
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

const definition111_rev1 = {
    id: '1.1.1',
    name: 'Auth Decision Date',
    module: 'Authorizations',
    keywords: ['authorization', 'decision date'],
    description: `<p>The date on which a final decision is made for an authorization request.</p>`,
    technicalDetails: '',
    usageExamples: '',
    isArchived: false,
    isDraft: false,
    supportingTables: [{ id: 'auth-status-codes', name: 'Authorization Status Codes' }],
    attachments: [],
    notes: [],
    sourceDb: 'EzCAp',
    sourceType: 'Views',
    sourceName: 'vw_AuthDecisionDate'
};

const definition111_rev4 = {
    id: '1.1.1',
    name: 'Auth Decision Date',
    module: 'Authorizations',
    keywords: ['authorization', 'decision date', 'approved', 'denied', 'SLA'],
    description: `
      <h4 class="font-bold mt-4 mb-2">Description</h4>
      <p>The date on which a final decision is made for an authorization request. This is a critical field for tracking service level agreements (SLAs) and reporting purposes according to the <a href="#" data-supporting-table-id="cms-compliance">CMS Compliance Matrix</a>.</p>
      
      <h4 class="font-bold mt-4 mb-2">Relevant Term(s)</h4>
      <p><strong style="color: blue;">UMWF (Y/N)</strong> – Was the auth worked in the UM Workflow Utility?</p>
      <ul class="list-disc pl-6">
        <li>Y: If the auth STATUS was changed to or from Wand PRIORITY was NEVER changed to 1W</li>
      </ul>
      
      <h4 class="font-bold mt-4 mb-2">Logic Used by <a href="#" data-supporting-table-id="auth-status-codes">Auth Status</a></h4>

      <h5 class="font-bold mt-3 mb-1" style="color: blue;">Approved – (Auth Status 1)</h5>
      <p>If UMWF = Y</p>
      <ul class="list-disc pl-6">
        <li>If auth has MD NOTE then DECISION DATE = MD NOTE DATE</li>
        <li>If auth has CERTIFICATION ISSUE DATE then DECISION DATE = CERTIFICATION ISSUE DATE</li>
        <li>If auth has AUTH ACTION DATE with valid TIME then DECISION DATE = Auth Action Date</li>
        <li>If AUTH ACTION DATE time is all 0’s then DECISION DATE = Date Auth moved to status 1</li>
      </ul>
    `,
    technicalDetails: `<p>The underlying data is sourced from the <code>vw_AuthDecisionDate</code> view in the <code>EzCAp</code> database.</p>`,
    usageExamples: `<p><strong>Example 1: Calculating Turnaround Time</strong></p><pre><code>DATEDIFF(day, RequestDate, AuthDecisionDate) AS TurnaroundTime</code></pre>`,
    supportingTables: [
        { id: 'auth-status-codes', name: 'Authorization Status Codes' },
        { id: 'cms-compliance', name: 'CMS Compliance Matrix' },
        { id: 'timestamp-changed', name: 'timestamp_changed table'},
        { id: 'vw-authactiontime', name: 'vw_authactiontime view'}
    ],
    attachments: [
        { name: 'Workflow-Diagram-v2.pdf', url: '#', size: '912 KB', type: 'PDF' },
        { name: 'State-Mandate-TX-112.docx', url: '#', size: '1.2 MB', type: 'DOCX' },
        { name: 'SQL-Query-Examples.txt', url: '#', size: '12 KB', type: 'TXT' },
    ],
    notes: [
        {
            id: 'note-1',
            authorId: 'user_123',
            author: 'Dhilip Sagadevan',
            avatar: 'https://picsum.photos/seed/dhilip/40/40',
            date: '2024-03-01T10:00:00Z',
            content: 'Need to verify if the 5:00 PM cutoff applies to all time zones or just Pacific.',
            isShared: true
        },
        {
            id: 'note-2',
            authorId: 'other_user',
            author: 'Jane Smith',
            avatar: 'https://picsum.photos/seed/jane/40/40',
            date: '2024-03-02T14:30:00Z',
            content: 'The cutoff is based on the local time of the health plan headquarters.',
            isShared: true
        }
    ],
    relatedDefinitions: ['1.1.2', '1.1.3']
};

const definition111_rev5 = {
    ...definition111_rev4,
    description: `
      ${definition111_rev4.description}
      <h4 class="font-bold mt-4 mb-2">SLA Calculation Deep Dive</h4>
      <p>The SLA clock starts as soon as the intake department stamps the incoming fax or electronic request. For portal submissions, the timestamp is captured at the moment of the "Submit" action.</p>
      <p>Business hours exclusion logic:</p>
      <ul class="list-disc pl-6">
        <li>Weekends (Saturday, Sunday) are excluded by default using the <code>fn_GetBusinessDays</code> function.</li>
        <li>Corporate holidays are retrieved from the <code>HOLIDAY_CALENDAR</code> master table.</li>
        <li>Requests received after 5:00 PM local time are considered received at 8:00 AM the next business day.</li>
        <li>Urgent requests must be decided within 72 hours of actual receipt.</li>
      </ul>
    `,
    technicalDetails: `
      <p>The underlying data is sourced from the <code>vw_AuthDecisionDate</code> view in the <code>EzCAp</code> database.</p>
      <h4 class="font-bold mt-4 mb-2">Performance Tuning (SQL)</h4>
      <p>The view performs a left join across 5 major tables. To ensure query performance remains under 2 seconds, we have implemented non-clustered indexes on:</p>
      <ul class="list-disc pl-6">
        <li>AUTHORIZATION_MASTER (AUTH_ID, STATUS_DATE)</li>
        <li>MD_NOTES (AUTH_ID, CREATED_DATE)</li>
        <li>CERTIFICATION_MASTER (AUTH_ID, ISSUE_DATE)</li>
      </ul>
    `,
    usageExamples: `
      <p><strong>Example 1: Calculating Turnaround Time</strong></p>
      <pre><code>DATEDIFF(day, RequestDate, AuthDecisionDate) AS TurnaroundTime</code></pre>
    `
};

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
    notes: [],
    children: [
      {
        ...definition111_rev5,
        id: '1.1.1',
        isDraft: false,
        revisions: [
          {
            ticketId: 'MPM-1234',
            date: '2023-01-15',
            developer: 'J. Doe',
            description: 'Initial creation of the definition.',
            snapshot: definition111_rev1,
          },
          {
            ticketId: 'MPM-1401',
            date: '2023-11-10',
            developer: 'A. Smith',
            description: 'Updated logic for CMS compliance matrix links.',
            snapshot: definition111_rev4,
          },
          {
            ticketId: 'MPM-2005',
            date: '2024-02-20',
            developer: 'S. Lee',
            description: 'Expanded SLA logic and added SQL performance tuning details.',
            snapshot: definition111_rev5,
          },
        ],
      },
      {
        id: '1.1.2',
        name: 'Service Type Mapping',
        module: 'Authorizations',
        keywords: ['service type', 'procedure code', 'mapping'],
        description: '<p>Defines how provider-submitted procedure codes are mapped to internal service types.</p>',
        revisions: [baselineRevision('Service Type Mapping', '<p>Standard mapping logic baseline.</p>')],
        isArchived: false,
        isDraft: false,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'EzCAp',
        sourceType: 'Tables',
        sourceName: 'PROCEDURE_CODES'
      },
      {
        id: 'pending-auth-1',
        name: 'Auth Denial Reasons',
        module: 'Authorizations',
        keywords: ['denial', 'reasons', 'standardization'],
        description: '<p>A standardized list of denial reasons mapped to specific clinical criteria and state-mandated language.</p>',
        shortDescription: 'Standardized denial reason mapping.',
        revisions: [baselineRevision('Auth Denial Reasons', '<p>Draft baseline imported.</p>')],
        isArchived: false,
        isDraft: true,
        isPendingApproval: true,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'EzCAp',
        sourceType: 'Tables',
        sourceName: 'DENIAL_REASONS_MASTER'
      },
      {
        id: 'pending-sql-func-2',
        name: 'fn_GetAuthTurnaroundTime',
        module: 'Authorizations',
        keywords: ['TAT', 'SLA', 'turnaround'],
        description: '<p>Calculates the total time in business days between authorization request and decision.</p>',
        shortDescription: 'Calculates Auth TAT in business days.',
        revisions: [baselineRevision('fn_GetAuthTurnaroundTime', '<p>Calculates TAT.</p>')],
        isArchived: false,
        isDraft: true,
        isPendingApproval: true,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'EzCAp',
        sourceType: 'SQL Functions',
        sourceName: 'fn_GetAuthTurnaroundTime',
        sqlFunctionDetails: {
          inputParameters: [
            { name: '@RequestDate', type: 'datetime' },
            { name: '@DecisionDate', type: 'datetime' }
          ],
          outputType: 'int',
          outputExample: '3'
        }
      }
    ],
  },
  {
    id: 'claims-root',
    name: 'Claims',
    module: 'Claims',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: false,
    supportingTables: [],
    attachments: [],
    notes: [],
    children: [
      {
        id: 'pending-claims-1',
        name: 'Standard Claim Codes',
        module: 'Claims',
        keywords: ['HCPCS', 'CPT', 'billing'],
        description: '<p>The primary reference for claim adjudication codes used in the EZ-CAP finance module.</p>',
        shortDescription: 'Primary billing code reference.',
        revisions: [baselineRevision('Standard Claim Codes', '<p>Baseline import.</p>')],
        isArchived: false,
        isDraft: true,
        isPendingApproval: true,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'EzCAp',
        sourceType: 'Tables',
        sourceName: 'CLAIM_ADJUDICATION_LOG'
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
    notes: [],
    children: [
        {
            id: '2.1.1',
            name: 'Contracted Rates',
            module: 'Provider',
            keywords: ['provider', 'contract', 'rates'],
            description: '<p>The negotiated payment rates for services rendered by in-network providers.</p>',
            revisions: [baselineRevision('Contracted Rates', '<p>Initial baseline payment logic.</p>')],
            isArchived: false,
            isDraft: false,
            supportingTables: [],
            attachments: [],
            notes: [],
            sourceDb: 'Other',
            sourceType: 'Tables',
            sourceName: 'FEE_SCHEDULES'
        }
    ]
  }
];

export function findDefinition(definitions: Definition[], id: string): Definition | null {
  if (!Array.isArray(definitions)) return null;
  for (const definition of definitions) {
    if (!definition) continue;
    if (definition.id === id) {
      return definition;
    }
    if (definition.children) {
      const found = findDefinition(definition.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
