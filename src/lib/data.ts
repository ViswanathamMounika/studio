

import type { Definition, SupportingTable } from './types';

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
        ['CA', 'CA-UM-02', '2', 'Urgent'],
        ['NY', 'NY-UM-A', '7', 'Standard (Non-Urgent)'],
        ['NY', 'NY-UM-B', '3', 'Urgent'],
        ['TX', 'TX-MCR-112', '14', 'Standard (Non-Urgent)'],
        ['TX', 'TX-MCR-113', '1', 'Urgent'],
    ]
};

export const timestampChangedTable: SupportingTable = {
    id: 'timestamp-changed',
    name: 'timestamp_changed table',
    description: 'Tracks when a specific column was last changed for a given record.',
    headers: ['timestamp_changed'],
    rows: [
        ['2023-10-26 10:00:00.000'],
        ['2023-10-25 14:30:00.000'],
        ['2023-10-24 09:15:00.000'],
        ['2023-10-23 18:00:00.000'],
        ['2023-10-22 11:45:00.000'],
    ]
}

export const vwAuthActionTimeTable: SupportingTable = {
    id: 'vw-authactiontime',
    name: 'vw_authactiontime view',
    description: 'A view that consolidates various action dates for an authorization.',
    headers: ['Modifdate', 'DeniedDate', 'Apprvdate', 'CancelDate', 'CarvoutDate'],
    rows: [
        ['2022-07-01 15:43:05.063', 'NULL', 'NULL', 'NULL', 'NULL'],
        ['2022-06-29 14:54:20.710', 'NULL', 'NULL', 'NULL', 'NULL'],
        ['2022-07-05 16:16:40.180', 'NULL', 'NULL', 'NULL', 'NULL'],
        ['2022-06-30 15:27:54.127', 'NULL', 'NULL', 'NULL', 'NULL'],
        ['2022-07-01 15:48:22.693', 'NULL', 'NULL', 'NULL', 'NULL'],
        ['2022-07-01 12:35:14.327', 'NULL', 'NULL', 'NULL', 'NULL'],
    ]
}


const definition111_rev1 = {
    id: '1.1.1',
    name: 'Auth Decision Date',
    module: 'Authorizations',
    keywords: ['authorization', 'decision date'],
    description: `<p>The date on which a final decision is made for an authorization request.</p>`,
    technicalDetails: `<p>The decision date is stored in the <code class="font-code text-primary">AUTHORIZATION_EVENTS</code> table.</p>`,
    examples: `<p>An auth is approved on 2023-10-05. The Auth Decision Date is 2023-10-05.</p>`,
    usage: `<p>Used in regulatory reports.</p>`,
    isArchived: false,
    supportingTables: [{ id: 'auth-status-codes', name: 'Authorization Status Codes' }],
    attachments: [],
    notes: [],
};

const definition111_rev2 = {
    id: '1.1.1',
    name: 'Auth Decision Date',
    module: 'Authorizations',
    keywords: ['authorization', 'decision date', 'approved', 'denied'],
    description: `
      <h4 class="font-bold mt-4 mb-2">Description</h4>
      <p>The date on which a final decision is made for an authorization request. This is a critical field for tracking service level agreements (SLAs) and reporting purposes.</p>
      
      <h4 class="font-bold mt-4 mb-2">Relevant Term(s)</h4>
      <p><strong style="color: blue;">UMWF (Y/N)</strong> – Was the auth worked in the UM Workflow Utility?</p>
      <ul class="list-disc pl-6">
        <li>Y: If the auth STATUS was changed to or from Wand PRIORITY was NEVER changed to 1W</li>
      </ul>
      
      <h4 class="font-bold mt-4 mb-2">Logic Used</h4>

      <h5 class="font-bold mt-3 mb-1" style="color: blue;">Approved – (Auth Status 1)</h5>
      <p>If UMWF = Y</p>
      <ul class="list-disc pl-6">
        <li>If auth has MD NOTE then DECISION DATE = MD NOTE DATE</li>
        <li>If auth has CERTIFICATION ISSUE DATE then DECISION DATE = CERTIFICATION ISSUE DATE</li>
        <li>If auth has AUTH ACTION DATE with valid TIME then DECISION DATE = Auth Action Date</li>
        <li>If AUTH ACTION DATE time is all 0’s then DECISION DATE = Date Auth moved to status 1</li>
      </ul>
      <p>If UMWF = N</p>
      <ul class="list-disc pl-6">
        <li>If auth has MD NOTE then DECISION DATE = MD NOTE DATE</li>
        <li>If LOB Code = 2 and AUTH TYPE = URGENT and has OPN or OPC REVIEW note then DECISION DATE = OPN/OPC Note Create Date</li>
        <li>If HPCODE = LCMC, MCMC, HCMC, ABCDSNP, BSDSNP, CHDSNP, IEDSNP, HNDSNP, LACDSNP, MOLDSNP, SCANFSNP, WCDSNP) and AUTH TYPE = URGENT and has OPN/OPC REVIEW note then DECISION DATE = OPN/OPC Note Create Date</li>
        <li>If none of the above are true then DECISION DATE = Date Auth moved to status 1</li>
      </ul>
      
      <h5 class="font-bold mt-3 mb-1" style="color: red;">Modified – (Auth Status 2)</h5>
      <ul class="list-disc pl-6">
        <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
        <li>If no MD Note then DECISION DATE = Date auth moved to status 2</li>
      </ul>
      
      <h5 class="font-bold mt-3 mb-1" style="color: red;">Denied – (Auth Status 3)</h5>
      <ul class="list-disc pl-6">
          <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
          <li>If no MD Note then DECISION DATE = Date auth moved to status 3</li>
      </ul>

      <h5 class="font-bold mt-3 mb-1" style="color: red;">Canceled – (Auth Status 6)</h5>
      <ul class="list-disc pl-6">
          <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
          <li>If no MD Note then DECISION DATE = Date auth moved to status 6</li>
      </ul>

      <h5 class="font-bold mt-3 mb-1" style="color: red;">Carve Outs – (Auth Status C)</h5>
      <ul class="list-disc pl-6">
          <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
          <li>If Auth went to status V or X then DECISION DATE = date the auth first moved to status V or X</li>
          <li>If no MD Note or V or X status then DECISION DATE = Date auth moved to status C</li>
      </ul>
    `,
    technicalDetails: `
      <p>The decision date is stored in the <code class="font-code text-primary">AUTHORIZATION_EVENTS</code> table.</p>
      <pre class="bg-muted p-2 rounded-md font-code text-sm overflow-x-auto"><code class="language-sql">SELECT decision_date 
FROM authorization_master 
WHERE auth_id = :authId;</code></pre>
      <p>The field is of type <code class="font-code text-primary">DATETIME</code> and is indexed for performance.</p>
    `,
    examples: `
      <p>An authorization for a 3-month physical therapy course is submitted on 2023-10-01. The health plan reviews it and approves it on 2023-10-05. The Auth Decision Date is 2023-10-05.</p>
    `,
    usage: `
      <p>This field is used in regulatory reports to demonstrate compliance with turnaround time requirements. It's also a key metric in operational dashboards to monitor team efficiency.</p>
    `,
    isArchived: false,
    supportingTables: [
        { id: 'auth-status-codes', name: 'Authorization Status Codes' },
        { id: 'cms-compliance', name: 'CMS Compliance Matrix' },
    ],
    attachments: [
        { name: 'Workflow-Diagram-v1.pdf', url: '#', size: '845 KB', type: 'PDF' },
    ],
    notes: [],
};

const definition111_rev3 = {
    ...definition111_rev2,
    keywords: ['authorization', 'decision date', 'approved', 'denied', 'SLA'],
    usage: `
      <p>This field is used in regulatory reports to demonstrate compliance with turnaround time requirements. It is also a key metric in operational dashboards to monitor team efficiency and SLA performance.</p>
    `,
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
      <p>If UMWF = N</p>
      <ul class="list-disc pl-6">
        <li>If auth has MD NOTE then DECISION DATE = MD NOTE DATE</li>
        <li>If LOB Code = 2 and AUTH TYPE = URGENT and has OPN or OPC REVIEW note then DECISION DATE = OPN/OPC Note Create Date</li>
        <li>If HPCODE = LCMC, MCMC, HCMC, ABCDSNP, BSDSNP, CHDSNP, IEDSNP, HNDSNP, LACDSNP, MOLDSNP, SCANFSNP, WCDSNP) and AUTH TYPE = URGENT and has OPN/OPC REVIEW note then DECISION DATE = OPN/OPC Note Create Date</li>
        <li>If none of the above are true then DECISION DATE = Date Auth moved to status 1</li>
      </ul>
      
      <h5 class="font-bold mt-3 mb-1" style="color: red;">Modified – (Auth Status 2)</h5>
      <ul class="list-disc pl-6">
        <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
        <li>If no MD Note then DECISION DATE = Date auth moved to status 2</li>
      </ul>
      
      <h5 class="font-bold mt-3 mb-1" style="color: red;">Denied – (Auth Status 3)</h5>
      <ul class="list-disc pl-6">
          <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
          <li>If no MD Note then DECISION DATE = Date auth moved to status 3</li>
      </ul>

      <h5 class="font-bold mt-3 mb-1" style="color: red;">Canceled – (Auth Status 6)</h5>
      <ul class="list-disc pl-6">
          <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
          <li>If no MD Note then DECISION DATE = Date auth moved to status 6</li>
      </ul>

      <h5 class="font-bold mt-3 mb-1" style="color: red;">Carve Outs – (Auth Status C)</h5>
      <ul class="list-disc pl-6">
          <li>If Auth has MD NOTE then DECISION DATE = 1st MD NOTE Create Date</li>
          <li>If Auth went to status V or X then DECISION DATE = date the auth first moved to status V or X</li>
          <li>If no MD Note or V or X status then DECISION DATE = Date auth moved to status C</li>
      </ul>
    `,
    technicalDetails: `
      <p>The decision date is primarily derived from the <a href="#" data-supporting-table-id="vw-authactiontime">vw_authactiontime</a> view.</p>
      <pre class="bg-muted p-2 rounded-md font-code text-sm overflow-x-auto"><code class="language-sql">SELECT COALESCE(modifdate, denieddate, apprvdate, canceldate, carvoutdate) as decision_date 
FROM vw_authactiontime 
WHERE auth_id = :authId;</code></pre>
      <p>Logic falls back to <code class="font-code text-primary">AUTHORIZATION_EVENTS</code> if the view returns null. In some cases, the <a href="#" data-supporting-table-id="timestamp-changed">timestamp_changed</a> table is consulted.</p>
    `,
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
};


export const initialDefinitions: Definition[] = [
  {
    id: '1',
    name: 'Authorizations',
    module: 'Authorizations',
    keywords: [],
    description: '',
    technicalDetails: '',
    examples: '',
    usage: '',
    revisions: [],
    isArchived: false,
    supportingTables: [],
    attachments: [],
    notes: [],
    children: [
      {
        ...definition111_rev4, // The current version is the latest revision
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
            ticketId: 'MPM-1290',
            date: '2023-05-20',
            developer: 'A. Smith',
            description: 'Added details about Canceled/Carve-Outs logic.',
            snapshot: definition111_rev2,
          },
          {
            ticketId: 'MPM-1355',
            date: '2023-08-01',
            developer: 'T. Johnson',
            description: 'Added SLA keyword and updated usage description.',
            snapshot: definition111_rev3,
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
        description: '<p>Defines how provider-submitted procedure codes (e.g., CPT, HCPCS) are mapped to internal service type categories for routing and adjudication.</p>',
        technicalDetails: '<p>Mapping is managed in the <code class="font-code text-primary">SERVICE_TYPE_MAP</code> table, which joins procedure codes to service category IDs.</p>',
        examples: '<p>CPT code 99213 (Office Visit) maps to the "Outpatient Visit" service category.</p>',
        usage: '<p>Ensures consistent application of benefits and rules based on service categories rather than individual procedure codes.</p>',
        revisions: [],
        isArchived: false,
        supportingTables: [],
        attachments: [],
        notes: [],
      },
    ],
  },
  {
    id: '2',
    name: 'Claims',
    module: 'Claims',
    keywords: [],
    description: '',
    technicalDetails: '',
    examples: '',
    usage: '',
    revisions: [],
    isArchived: false,
    supportingTables: [],
    attachments: [],
    notes: [],
    children: [
        {
            id: '1.2.1',
            name: 'Claim Adjudication Status',
            module: 'Claims',
            keywords: ['claim', 'adjudication', 'paid', 'denied'],
            description: '<p>The final status of a claim after it has been processed by the adjudication system.</p>',
            technicalDetails: '<p>Status is stored in the <code class="font-code text-primary">CLAIMS_MASTER</code> table in the `adjudication_status` column.</p>',
            examples: '<p>A claim is submitted and passes all edits. Its status becomes "Paid". If it fails a medical necessity review, its status becomes "Denied".</p>',
            usage: '<p>Used for payment processing, generating Explanations of Payment (EOPs), and financial reporting.</p>',
            revisions: [],
            isArchived: true,
            supportingTables: [],
            attachments: [],
            notes: [],
        }
    ]
  },
  {
    id: '3',
    name: 'Provider',
    module: 'Provider',
    keywords: [],
    description: '',
    technicalDetails: '',
    examples: '',
    usage: '',
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
            keywords: ['provider', 'contract', 'rates', 'fee schedule'],
            description: '<p>The negotiated payment rates for services rendered by in-network providers, as defined in their contract.</p>',
            technicalDetails: '<p>Rates are stored in the <code class="font-code text-primary">FEE_SCHEDULES</code> table, linked to a provider contract ID.</p>',
            examples: '<p>Dr. Smith\'s contract specifies a rate of $85 for a standard office visit (CPT 99213).</p>',
            usage: '<p>This is the primary data source for pricing claims from contracted providers.</p>',
            revisions: [],
            isArchived: false,
            isBookmarked: false,
            supportingTables: [],
attachments: [],
            notes: [],
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
