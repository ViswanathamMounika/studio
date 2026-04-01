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

const names = ['J. Doe', 'A. Smith', 'T. Johnson', 'S. Lee', 'M. Garcia', 'P. Williams', 'D. Brown', 'K. Nguyen', 'Dhilip Sagadevan'];

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
        isRequired: false
      },
      {
        id: '2',
        templateId: '1',
        name: 'Description',
        fieldType: 'RichText',
        isMulti: false,
        isRequired: false
      },
      {
        id: '3',
        templateId: '1',
        name: 'Technical Details',
        fieldType: 'RichText',
        isMulti: false,
        isRequired: false
      },
      {
        id: '4',
        templateId: '1',
        name: 'Usage Examples',
        fieldType: 'RichText',
        isMulti: false,
        isRequired: false
      },
      {
        id: '5',
        templateId: '1',
        name: 'Output Type',
        group: 'SQL Function Specifications',
        fieldType: 'PlainText',
        isMulti: false,
        maxLength: 50,
        isRequired: false
      },
      {
        id: '6',
        templateId: '1',
        name: 'Output Example',
        group: 'SQL Function Specifications',
        fieldType: 'PlainText',
        isMulti: false,
        maxLength: 2000,
        isRequired: false
      },
      {
        id: '7',
        templateId: '1',
        name: 'Input Parameters',
        group: 'SQL Function Specifications',
        fieldType: 'KeyValue',
        isMulti: false,
        isRequired: false,
        columns: [
          {
            id: 'c1',
            templateSectionId: '7',
            name: 'Parameter Name',
            inputType: 'TextBox',
            isMulti: false,
            sortOrder: 1,
            isRequired: true
          },
          {
            id: 'c2',
            templateSectionId: '7',
            name: 'Type',
            inputType: 'Dropdown',
            isMulti: false,
            sortOrder: 2,
            isRequired: true,
            options: [
              { id: 'o1', templateSectionId: '7', columnId: 'c2', label: 'varchar', value: 'varchar', sortOrder: 1, isDefault: true },
              { id: 'o2', templateSectionId: '7', columnId: 'c2', label: 'int', value: 'int', sortOrder: 2, isDefault: false },
              { id: 'o3', templateSectionId: '7', columnId: 'c2', label: 'date', value: 'date', sortOrder: 3, isDefault: false },
              { id: 'o4', templateSectionId: '7', columnId: 'c2', label: 'datetime', value: 'datetime', sortOrder: 4, isDefault: false },
            ]
          }
        ]
      },
      {
        id: '8',
        templateId: '1',
        name: 'Source of Truth',
        fieldType: 'Dropdown',
        isMulti: true,
        isRequired: false,
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
        description: '<p>The final date of adjudication.</p>',
        shortDescription: 'Final decision date for auths.',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Auth Decision Date', 'Baseline definition.')],
        supportingTables: [],
        attachments: [],
        sectionValues: [
          { sectionId: '1', raw: 'Final decision date for auths.' },
          { sectionId: '2', raw: '<p>The date on which a final decision is made for an authorization request.</p>', html: '<p>The date on which a final decision is made for an authorization request.</p>' },
          { sectionId: '8', raw: 'EzCAP', multiValues: ['EzCAP'] }
        ]
      },
      {
        id: '1.1.2',
        name: 'Service Type Mapping',
        module: 'Authorizations',
        templateId: '1',
        keywords: ['mapping', 'codes'],
        description: '<p>Maps procedure codes to internal types.</p>',
        isArchived: false,
        isDraft: false,
        revisions: [baselineRevision('Service Type Mapping', 'Baseline mapping logic.')],
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
