
import type { Definition, SupportingTable, ActivityLog, DatabaseMetadata, SourceTypeMetadata, SourceObjectMetadata, ActivityType, Template, Revision, TemplateSection } from './types';

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
      },
      {
        id: '1.1.3',
        name: 'Authorization Timeliness SLA',
        module: 'Authorizations',
        templateId: '1',
        keywords: ['SLA', 'timeliness', 'regulatory'],
        description: '<p>Updated regulatory requirements for turnaround time. Now includes Saturday as a business day for urgent requests.</p>',
        shortDescription: 'Regulatory SLA requirements for turnaround times.',
        technicalDetails: '<h3>Calculation Logic</h3><ul><li>Urgent: 72 hours</li><li>Standard: 5 business days</li></ul>',
        isArchived: false,
        isDraft: true,
        isPendingApproval: true,
        submittedBy: 'Alex Smith',
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        revisions: [baselineRevision('Auth Timeliness SLA', 'Initial SLA guidelines.')],
        publishedSnapshot: {
            name: 'Authorization Timeliness SLA',
            description: '<p>Regulatory requirements for turnaround time. Business days are Mon-Fri.</p>',
            shortDescription: 'SLA requirements for turnaround times.',
            technicalDetails: '<h3>Calculation Logic</h3><ul><li>Urgent: 72 hours</li><li>Standard: 14 days</li></ul>'
        },
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
        name: 'Claim Denial Codes Mapping',
        module: 'Claims',
        templateId: '1',
        keywords: ['denials', 'codes', 'mapping'],
        description: '<p>This definition maps HIPAA standard reason codes to internal MedPoint operational denial categories.</p>',
        shortDescription: 'Denial code crosswalk documentation.',
        isArchived: false,
        isDraft: true,
        isPendingApproval: true,
        submittedBy: 'Dhilip Sagadevan',
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        revisions: [baselineRevision('Claim Denial Mapping', 'Initial crosswalk.')],
        publishedSnapshot: {
            name: 'Claim Denial Codes Mapping',
            description: '<p>Mapping of reason codes to internal categories.</p>',
            shortDescription: 'Internal denial code mapping.'
        },
        supportingTables: [],
        attachments: []
      }
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
