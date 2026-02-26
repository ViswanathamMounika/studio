import type { Definition, SupportingTable, ActivityLog, DatabaseMetadata, SourceTypeMetadata, SourceObjectMetadata, ActivityType } from './types';

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

const names = ['J. Doe', 'A. Smith', 'T. Johnson', 'S. Lee', 'M. Garcia', 'P. Williams', 'D. Brown', 'K. Nguyen'];

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

export const mpmSourceTypes: Record<string, SourceTypeMetadata[]> = {
    'DW_Reporting': [
        { id: 'Views', name: 'Views' },
        { id: 'Tables', name: 'Tables' },
        { id: 'SQL Functions', name: 'SQL Functions' },
    ],
    'Finance': [
        { id: 'Tables', name: 'Tables' },
        { id: 'Stored Procedures', name: 'Stored Procedures' },
    ],
    'Provider_Data': [
        { id: 'Views', name: 'Views' },
        { id: 'Tables', name: 'Tables' },
    ],
    'Claims': [
        { id: 'Views', name: 'Views' },
        { id: 'Tables', name: 'Tables' },
        { id: 'Stored Procedures', name: 'Stored Procedures' },
    ],
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

const activityTypes: ActivityType[] = ['View', 'Edit', 'Create', 'Download', 'Delete', 'Archive', 'Duplicate', 'Search'];

export const initialActivityLogs: ActivityLog[] = Array.from({ length: 50 }, (_, i) => ({
    id: `log-${i}`,
    userName: names[Math.floor(Math.random() * names.length)],
    definitionName: ['Auth Decision Date', 'Contracted Rates', 'Service Type Mapping', 'Provider Demographics'][Math.floor(Math.random() * 4)],
    activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
    occurredDate: generateRandomDate(),
}));

const definition111_rev1 = {
    id: '1.1.1',
    name: 'Auth Decision Date',
    module: 'Authorizations',
    keywords: ['authorization', 'decision date'],
    description: `<p>The date on which a final decision is made for an authorization request.</p>`,
    technicalDetails: '',
    usageExamples: '',
    isArchived: false,
    supportingTables: [{ id: 'auth-status-codes', name: 'Authorization Status Codes' }],
    attachments: [],
    notes: [],
    sourceDb: 'DW_Reporting',
    sourceType: 'Views',
    sourceName: 'vw_AuthDecisionDate'
};

const definition111_rev2 = {
    ...definition111_rev1,
    description: `
      <h4 class="font-bold mt-4 mb-2">Description</h4>
      <p>The date on which a final decision is made for an authorization request. This is a critical field for tracking service level agreements (SLAs) and reporting purposes.</p>
    `,
};

const definition111_rev3 = {
    ...definition111_rev2,
    keywords: ['authorization', 'decision date', 'approved', 'denied', 'SLA'],
    attachments: [
        { name: 'Workflow-Diagram-v1.pdf', url: '#', size: '845 KB', type: 'PDF' },
        { name: 'State-Mandate-TX-112.docx', url: '#', size: '1.2 MB', type: 'DOCX' },
    ],
};

const definition111_rev4 = {
    ...definition111_rev3,
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
    notes: [
      {
        id: "note-1",
        authorId: "user_456",
        author: "Alex Smith",
        avatar: "https://picsum.photos/seed/alex/40/40",
        date: "2023-10-26T10:00:00Z",
        content: "Can we get clarification on how 'Canceled/Carve-Outs' impacts the SLA calculation?",
        isShared: true,
      }
    ],
    relatedDefinitions: ['1.1.2', '1.1.3']
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
    supportingTables: [],
    attachments: [],
    notes: [],
    children: [
      {
        ...definition111_rev4,
        id: '1.1.1',
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
            description: 'Updated technical details to reference vw_authactiontime view.',
            snapshot: definition111_rev4,
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
        supportingTables: [],
        attachments: [],
        notes: [],
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
            supportingTables: [],
            attachments: [],
            notes: [],
            sourceDb: 'Finance',
            sourceType: 'Tables',
            sourceName: 'FEE_SCHEDULES'
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
