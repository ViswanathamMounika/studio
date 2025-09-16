import type { Definition, SupportingTable } from './types';

export const authorizationStatusCodes: SupportingTable = {
    id: 'auth-status-codes',
    name: 'Authorization Status Codes',
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


export const initialDefinitions: Definition[] = [
  {
    id: '1',
    name: 'Member Management',
    module: 'Core',
    keywords: [],
    description: '',
    technicalDetails: '',
    examples: '',
    usage: '',
    revisions: [],
    isArchived: false,
    supportingTables: [],
    children: [
      {
        id: '1.1',
        name: 'Authorizations',
        module: 'Member Management',
        keywords: [],
        description: '',
        technicalDetails: '',
        examples: '',
        usage: '',
        revisions: [],
        isArchived: false,
        supportingTables: [],
        children: [
          {
            id: '1.1.1',
            name: 'Auth Decision Date',
            module: 'Authorizations',
            keywords: ['authorization', 'decision date', 'approved', 'denied'],
            description: `
              <p>The date on which a final decision is made for an authorization request. This is a critical field for tracking service level agreements (SLAs) and reporting purposes.</p>
              <h4 class="font-bold mt-4 mb-2">Relevant Terms</h4>
              <ul>
                <li><strong>Approval:</strong> The authorization request is approved as submitted.</li>
                <li><strong>Modification:</strong> The request is approved, but with changes to the service, quantity, or duration.</li>
                <li><strong>Denial:</strong> The request is not approved.</li>
                <li><strong>Canceled/Carve-Out:</strong> The request is withdrawn or determined to be the responsibility of another entity.</li>
              </ul>
              <h4 class="font-bold mt-4 mb-2">Logic Used</h4>
              <p>The decision date is captured from the final status update event in the authorization workflow. The logic considers the following final states:</p>
              <ol>
                  <li>Approved</li>
                  <li>Modified</li>
                  <li>Denied</li>
                  <li>Canceled/Carve Outs</li>
              </ol>
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
            revisions: [
              {
                ticketId: 'MPM-1234',
                date: '2023-01-15',
                developer: 'J. Doe',
                description: 'Initial creation of the definition.',
              },
              {
                ticketId: 'MPM-1290',
                date: '2023-05-20',
                developer: 'A. Smith',
                description: 'Added details about Canceled/Carve-Outs logic.',
              },
            ],
            isArchived: false,
            supportingTables: [
                { id: 'auth-status-codes', name: 'Authorization Status Codes' },
                { id: 'cms-compliance', name: 'CMS Compliance Matrix' },
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
          },
        ],
      },
      {
        id: '1.2',
        name: 'Claims',
        module: 'Member Management',
        keywords: [],
        description: '',
        technicalDetails: '',
        examples: '',
        usage: '',
        revisions: [],
        isArchived: false,
        supportingTables: [],
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
            }
        ]
      }
    ],
  },
  {
    id: '2',
    name: 'Provider Network',
    module: 'Core',
    keywords: [],
    description: '',
    technicalDetails: '',
    examples: '',
    usage: '',
    revisions: [],
    isArchived: false,
    supportingTables: [],
    children: [
      {
        id: '2.1',
        name: 'Contracted Rates',
        module: 'Provider Network',
        keywords: ['provider', 'contract', 'rates', 'fee schedule'],
        description: '<p>The negotiated payment rates for services rendered by in-network providers, as defined in their contract.</p>',
        technicalDetails: '<p>Rates are stored in the <code class="font-code text-primary">FEE_SCHEDULES</code> table, linked to a provider contract ID.</p>',
        examples: '<p>Dr. Smith\'s contract specifies a rate of $85 for a standard office visit (CPT 99213).</p>',
        usage: '<p>This is the primary data source for pricing claims from contracted providers.</p>',
        revisions: [],
        isArchived: false,
        supportingTables: [],
      },
    ],
  },
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
