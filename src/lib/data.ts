import type { Definition, SupportingTable, ActivityLog, DatabaseMetadata, SourceTypeMetadata, SourceObjectMetadata, ActivityType, Template } from './types';

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
        ['AUTH-55434', null, '2023-07-05 16:16:40.180', null, null, null],
        ['AUTH-55435', null, null, null, '2023-06-30 15:27:54.127', null],
        ['AUTH-55436', null, null, null, null, '2023-07-01 15:48:22.693'],
    ]
}

const names = ['J. Doe', 'A. Smith', 'T. Johnson', 'S. Lee', 'M. Garcia', 'P. Williams', 'D. Brown', 'K. Nguyen', 'Dhilip Sagadevan'];

const getRandomName = () => {
    return names[Math.floor(Math.random() * names.length)];
}

const generateRandomDate = () => {
    const start = new Date(2022, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
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
        DATABASE_NAME: ['DW_Reporting', 'Finance', 'Provider_Data', 'Claims'][Math.floor(Math.random()*4)],
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
    { id: 'DW_Reporting', name: 'DW_Reporting' },
    { id: 'Finance', name: 'Finance' },
    { id: 'Provider_Data', name: 'Provider_Data' },
    { id: 'Claims', name: 'Claims' },
];

const standardSourceTypes: SourceTypeMetadata[] = [
    { id: 'Tables', name: 'Tables' },
    { id: 'Views', name: 'Views' },
    { id: 'Stored Procedures', name: 'Stored Procedures' },
    { id: 'SQL Functions', name: 'SQL Functions' },
];

export const mpmSourceTypes: Record<string, SourceTypeMetadata[]> = {
    'DW_Reporting': standardSourceTypes,
    'Finance': standardSourceTypes,
    'Provider_Data': standardSourceTypes,
    'Claims': standardSourceTypes,
};

export const mpmSourceObjects: Record<string, SourceObjectMetadata[]> = {
    'DW_Reporting_Views': [
        { id: 'vw_AuthDecisionDate', name: 'vw_AuthDecisionDate', typeId: 'Views' },
        { id: 'vw_AuthActionTime', name: 'vw_AuthActionTime', typeId: 'Views' },
        { id: 'vw_MemberEligibility', name: 'vw_MemberEligibility', typeId: 'Views' },
    ],
    'DW_Reporting_Tables': [
        { id: 'AUTHORIZATION_MASTER', name: 'AUTHORIZATION_MASTER', typeId: 'Tables' },
        { id: 'MEMBER_MASTER', name: 'MEMBER_MASTER', typeId: 'Tables' },
    ],
    'DW_Reporting_Stored Procedures': [
        { id: 'sp_CalculateSLA', name: 'sp_CalculateSLA', typeId: 'Stored Procedures' },
        { id: 'sp_ProcessBatchAuths', name: 'sp_ProcessBatchAuths', typeId: 'Stored Procedures' },
    ],
    'DW_Reporting_SQL Functions': [
        { id: 'fn_GetBusinessDays', name: 'fn_GetBusinessDays', typeId: 'SQL Functions' },
        { id: 'fn_FormatMemberName', name: 'fn_FormatMemberName', typeId: 'SQL Functions' },
    ],
    'Finance_Tables': [
        { id: 'FEE_SCHEDULES', name: 'FEE_SCHEDULES', typeId: 'Tables' },
        { id: 'CLAIM_PAYMENTS', name: 'CLAIM_PAYMENTS', typeId: 'Tables' },
    ],
    'Provider_Data_Views': [
        { id: 'vw_ProviderDirectory', name: 'vw_ProviderDirectory', typeId: 'Views' },
        { id: 'vw_NetworkParticipation', name: 'vw_NetworkParticipation', typeId: 'Views' },
    ],
    'Claims_Tables': [
        { id: 'CLAIMS_MASTER', name: 'CLAIMS_MASTER', typeId: 'Tables' },
        { id: 'CLAIM_ADJUDICATION_LOG', name: 'CLAIM_ADJUDICATION_LOG', typeId: 'Tables' },
    ]
};

const activityTypes: ActivityType[] = ['View', 'Edit', 'Create', 'Download', 'Bookmark', 'Archive', 'Duplicate', 'Search', 'Submit', 'Approve', 'Reject'];

export const initialActivityLogs: ActivityLog[] = Array.from({ length: 50 }, (_, i) => ({
    id: `log-${i}`,
    userName: names[Math.floor(Math.random() * names.length)],
    definitionName: ['Auth Decision Date', 'Contracted Rates', 'Service Type Mapping', 'Provider Demographics'][Math.floor(Math.random() * 4)],
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
    sourceDb: 'DW_Reporting',
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
    technicalDetails: `<p>The underlying data is sourced from the <code>vw_AuthDecisionDate</code> view in the <code>DW_Reporting</code> database.</p>`,
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
    notes: [],
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
      </ul>
      <p>Special cases for "Urgent" requests:</p>
      <ul class="list-disc pl-6">
        <li>Must be decided within 72 hours of actual receipt, regardless of weekends or holidays (per CMS guidelines).</li>
        <li>If the decision window expires on a non-business day, the deadline remains the same.</li>
      </ul>
    `,
    technicalDetails: `
      <p>The underlying data is sourced from the <code>vw_AuthDecisionDate</code> view in the <code>DW_Reporting</code> database.</p>
      <h4 class="font-bold mt-4 mb-2">Performance Tuning (SQL)</h4>
      <p>The view performs a left join across 5 major tables. To ensure query performance remains under 2 seconds, we have implemented non-clustered indexes on:</p>
      <ul class="list-disc pl-6">
        <li>AUTHORIZATION_MASTER (AUTH_ID, STATUS_DATE)</li>
        <li>MD_NOTES (AUTH_ID, CREATED_DATE)</li>
        <li>CERTIFICATION_MASTER (AUTH_ID, ISSUE_DATE)</li>
      </ul>
      <p>Partitioning is applied on <code>CREATED_DATE</code> monthly to facilitate rapid historical reporting without scanning full table heaps.</p>
    `,
    usageExamples: `
      <p><strong>Example 1: Calculating Turnaround Time</strong></p>
      <pre><code>DATEDIFF(day, RequestDate, AuthDecisionDate) AS TurnaroundTime</code></pre>
      <p><strong>Example 2: Weighted SLA Compliance</strong></p>
      <pre><code>
SELECT 
    Module,
    COUNT(*) AS TotalAuths,
    SUM(CASE WHEN TurnaroundTime <= SLALimit THEN 1 ELSE 0 END) AS CompliantCount
FROM 
    vw_AuthDecisionHistory
GROUP BY 
    Module
      </code></pre>
    `
};

export const initialDefinitions: Definition[] = [
  {
    id: '1',
    name: 'Authorizations',
    module: 'Authorizations',
    keywords: [],
    description: '',
    technicalDetails: '',
    usageExamples: '',
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
        revisions: [],
        isArchived: false,
        isDraft: false,
        supportingTables: [],
        attachments: [],
        notes: [
            {
                id: "note-3",
                authorId: "user_456",
                author: "Alex Smith",
                avatar: "https://picsum.photos/seed/alex2/40/40",
                date: "2024-01-05T09:00:00Z",
                content: "Updated the CPT mapping for 2024 compliance.",
                isShared: true,
            }
        ],
        sourceDb: 'DW_Reporting',
        sourceType: 'Tables',
        sourceName: 'PROCEDURE_CODES'
      },
       {
        id: '1.1.3',
        name: 'Authorization Timeliness',
        module: 'Authorizations',
        keywords: ['SLA', 'Timeliness'],
        description: '<p>Measures the time taken from the receipt of an authorization request to the final decision.</p>',
        revisions: [],
        isArchived: false,
        isDraft: false,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'DW_Reporting',
        sourceType: 'Views',
        sourceName: 'vw_AuthActionTime'
      }
    ],
  },
  {
    id: '3',
    name: 'Provider',
    module: 'Provider',
    keywords: [],
    description: '',
    technicalDetails: '',
    usageExamples: '',
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
            revisions: [],
            isArchived: false,
            isDraft: false,
            supportingTables: [],
            attachments: [],
            notes: [],
            sourceDb: 'Finance',
            sourceType: 'Tables',
            sourceName: 'FEE_SCHEDULES'
        }
    ]
  },
  {
    id: 'pending-root',
    name: 'Pending Approval',
    module: 'Core',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: true,
    isPendingApproval: true,
    supportingTables: [],
    attachments: [],
    notes: [],
    children: [
      {
        id: 'pending-sql-func-1',
        name: 'fn_CalculateMemberAge',
        module: 'Member',
        keywords: ['sql function', 'age', 'calculation'],
        description: '<p>Standard SQL function to calculate member age based on date of birth.</p>',
        shortDescription: 'Calculates member age.',
        revisions: [],
        isArchived: false,
        isDraft: true,
        isPendingApproval: true,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'DW_Reporting',
        sourceType: 'SQL Functions',
        sourceName: 'fn_CalculateMemberAge',
        sqlFunctionDetails: {
          inputParameters: ['@DOB DATE', '@AsOfDate DATE'],
          locations: ['All EZ-CAP Databases'],
          outputType: 'int',
          outputExample: '42'
        }
      }
    ]
  },
  {
    id: 'drafts-root',
    name: 'Draft Definitions',
    module: 'Core',
    keywords: [],
    description: '',
    revisions: [],
    isArchived: false,
    isDraft: true,
    supportingTables: [],
    attachments: [],
    notes: [],
    children: [
      {
        id: 'draft-1',
        name: 'Member Eligibility Check',
        module: 'Member',
        keywords: ['eligibility', 'check', 'validation'],
        description: '<p><strong>[Draft]</strong> Logic for validating member eligibility during intake.</p>',
        shortDescription: 'Validates member status.',
        revisions: [],
        isArchived: false,
        isDraft: true,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'DW_Reporting',
        sourceType: 'Tables',
        sourceName: 'MEMBER_MASTER'
      },
      {
        id: 'draft-2',
        name: 'Provider Specialty Mapping',
        module: 'Provider Network',
        keywords: ['specialty', 'mapping', 'taxonomy'],
        description: '<p><strong>[Draft]</strong> Mapping of provider taxonomy codes to internal specialty groups.</p>',
        shortDescription: 'Mapping for provider specialties.',
        revisions: [],
        isArchived: false,
        isDraft: true,
        supportingTables: [],
        attachments: [],
        notes: [],
        sourceDb: 'Provider_Data',
        sourceType: 'Views',
        sourceName: 'vw_ProviderDirectory'
      }
    ]
  }
];

export function findDefinition(definitions: Definition[], id: string): Definition | null {
  for (const definition of definitions) {
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
