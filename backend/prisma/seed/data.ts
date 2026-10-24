export const SEED_PASSWORD = 'Password123!';
export const ADMIN_EMAIL = 'admin@docrepo.local';
export const USER_EMAIL = 'user@docrepo.local';

export const departments = [
  { name: 'Finance', description: 'Accounting, budgeting and financial reporting' },
  { name: 'Legal', description: 'Contracts, compliance and corporate governance' },
  { name: 'Human Resources', description: 'People operations, hiring and benefits' },
  { name: 'Engineering', description: 'Product development and infrastructure' },
  { name: 'Operations', description: 'Facilities, procurement and business operations' },
  { name: 'Marketing', description: 'Brand, campaigns and communications' },
] as const;

export type DepartmentName = (typeof departments)[number]['name'];

export const predefinedTags = [
  'Finance',
  'Legal',
  'HR',
  'Policy',
  'Report',
  'Contract',
  'Compliance',
  'Security',
  'Onboarding',
  'Budget',
  'Strategy',
  'Technical',
  'Template',
  'Confidential',
  'Marketing',
];

export const deactivatedTags = ['Template'];

export const firstNames = [
  'Ahmed',
  'Sara',
  'Omar',
  'Layla',
  'Youssef',
  'Mona',
  'Karim',
  'Nour',
  'Hassan',
  'Dina',
  'James',
  'Emily',
  'Daniel',
  'Sophia',
  'Michael',
  'Olivia',
  'David',
  'Hannah',
  'Lucas',
  'Grace',
];

export const lastNames = [
  'Hassan',
  'Mostafa',
  'Ibrahim',
  'Saleh',
  'Fahmy',
  'Nasser',
  'Smith',
  'Johnson',
  'Brown',
  'Taylor',
  'Wilson',
  'Clarke',
];

export type FileKind = 'pdf' | 'docx' | 'xlsx' | 'png' | 'txt' | 'csv';

export interface DocumentTemplate {
  title: string;
  description: string;
  tags: string[];
  kind: FileKind;
  department: DepartmentName;
}

const unique: DocumentTemplate[] = [
  {
    title: 'Employee Handbook',
    description: 'Company values, conduct expectations and core HR policies for all staff.',
    tags: ['HR', 'Policy', 'Onboarding'],
    kind: 'pdf',
    department: 'Human Resources',
  },
  {
    title: 'Travel and Expense Policy',
    description: 'Rules for booking travel, per diems and submitting expense claims.',
    tags: ['Finance', 'Policy'],
    kind: 'pdf',
    department: 'Finance',
  },
  {
    title: 'Information Security Policy',
    description: 'Baseline security controls, password rules and incident reporting.',
    tags: ['Security', 'Policy', 'Compliance'],
    kind: 'pdf',
    department: 'Engineering',
  },
  {
    title: 'Remote Work Guidelines',
    description: 'Eligibility, equipment and communication norms for remote employees.',
    tags: ['HR', 'Policy', 'Remote Work'],
    kind: 'docx',
    department: 'Human Resources',
  },
  {
    title: 'Annual Budget 2026',
    description: 'Approved departmental budgets and headcount plan for 2026.',
    tags: ['Finance', 'Budget', 'Confidential'],
    kind: 'xlsx',
    department: 'Finance',
  },
  {
    title: 'Master Services Agreement Template',
    description: 'Standard MSA template for new vendor and client engagements.',
    tags: ['Legal', 'Contract', 'Template'],
    kind: 'docx',
    department: 'Legal',
  },
  {
    title: 'Non-Disclosure Agreement Template',
    description: 'Mutual NDA template approved by the legal team.',
    tags: ['Legal', 'Contract', 'Template'],
    kind: 'docx',
    department: 'Legal',
  },
  {
    title: 'System Architecture Overview',
    description: 'High-level diagram of services, data stores and integrations.',
    tags: ['Technical'],
    kind: 'png',
    department: 'Engineering',
  },
  {
    title: 'API Design Guidelines',
    description: 'Conventions for REST endpoints, error formats and versioning.',
    tags: ['Technical', 'Policy'],
    kind: 'pdf',
    department: 'Engineering',
  },
  {
    title: 'Incident Response Runbook',
    description: 'Step-by-step procedure for handling production incidents.',
    tags: ['Technical', 'Security'],
    kind: 'txt',
    department: 'Engineering',
  },
  {
    title: 'Brand Guidelines',
    description: 'Logo usage, colour palette and typography for all materials.',
    tags: ['Marketing', 'Policy'],
    kind: 'pdf',
    department: 'Marketing',
  },
  {
    title: 'Campaign Performance Dashboard',
    description: 'Chart of channel performance for the spring campaign.',
    tags: ['Marketing', 'Report'],
    kind: 'png',
    department: 'Marketing',
  },
  {
    title: 'Social Media Content Calendar',
    description: 'Planned posts per channel for the next two quarters.',
    tags: ['Marketing', 'Strategy'],
    kind: 'csv',
    department: 'Marketing',
  },
  {
    title: 'Vendor Onboarding Checklist',
    description: 'Documents and approvals required before engaging a new vendor.',
    tags: ['Vendor', 'Compliance'],
    kind: 'docx',
    department: 'Operations',
  },
  {
    title: 'Procurement Policy',
    description: 'Purchase approval thresholds and preferred supplier rules.',
    tags: ['Policy', 'Finance', 'Vendor'],
    kind: 'pdf',
    department: 'Operations',
  },
  {
    title: 'Office Safety Procedures',
    description: 'Fire evacuation routes, first aid and emergency contacts.',
    tags: ['Policy', 'Compliance'],
    kind: 'pdf',
    department: 'Operations',
  },
  {
    title: 'Data Retention Policy',
    description: 'How long each category of business data must be retained.',
    tags: ['Legal', 'Compliance', 'Policy'],
    kind: 'pdf',
    department: 'Legal',
  },
  {
    title: 'GDPR Compliance Checklist',
    description: 'Controls and evidence required for GDPR readiness.',
    tags: ['Legal', 'Compliance'],
    kind: 'xlsx',
    department: 'Legal',
  },
  {
    title: 'New Hire Onboarding Plan',
    description: 'First 30, 60 and 90 day goals for new employees.',
    tags: ['HR', 'Onboarding'],
    kind: 'docx',
    department: 'Human Resources',
  },
  {
    title: 'Performance Review Template',
    description: 'Template for the semi-annual performance review cycle.',
    tags: ['HR', 'Template'],
    kind: 'docx',
    department: 'Human Resources',
  },
  {
    title: 'Salary Bands 2026',
    description: 'Compensation ranges per role level.',
    tags: ['HR', 'Finance', 'Confidential'],
    kind: 'xlsx',
    department: 'Human Resources',
  },
  {
    title: 'Benefits Overview',
    description: 'Health insurance, pension and leave entitlements.',
    tags: ['HR'],
    kind: 'pdf',
    department: 'Human Resources',
  },
  {
    title: 'Cloud Cost Report',
    description: 'Monthly cloud spend by service and environment.',
    tags: ['Technical', 'Finance', 'Report'],
    kind: 'csv',
    department: 'Engineering',
  },
  {
    title: 'Deployment Process',
    description: 'How code moves from pull request to production.',
    tags: ['Technical'],
    kind: 'txt',
    department: 'Engineering',
  },
  {
    title: 'Database Backup Strategy',
    description: 'Backup schedule, retention and restore testing procedure.',
    tags: ['Technical', 'Security'],
    kind: 'pdf',
    department: 'Engineering',
  },
  {
    title: 'Five Year Strategic Plan',
    description: 'Company objectives, key bets and investment priorities.',
    tags: ['Strategy', 'Confidential'],
    kind: 'pdf',
    department: 'Operations',
  },
  {
    title: 'Market Research Summary',
    description: 'Findings from customer interviews and competitor analysis.',
    tags: ['Marketing', 'Strategy', 'Report'],
    kind: 'pdf',
    department: 'Marketing',
  },
  {
    title: 'Press Release Template',
    description: 'Standard structure and boilerplate for press releases.',
    tags: ['Marketing', 'Template'],
    kind: 'docx',
    department: 'Marketing',
  },
  {
    title: 'Accounts Payable Process',
    description: 'Invoice approval and payment run procedure.',
    tags: ['Finance', 'Policy'],
    kind: 'pdf',
    department: 'Finance',
  },
  {
    title: 'Expense Claims Export',
    description: 'Approved expense claims for the last quarter.',
    tags: ['Finance', 'Report', 'Q3 Review'],
    kind: 'csv',
    department: 'Finance',
  },
  {
    title: 'Internal Audit Findings',
    description: 'Summary of audit observations and remediation owners.',
    tags: ['Finance', 'Compliance', 'Confidential'],
    kind: 'pdf',
    department: 'Finance',
  },
  {
    title: 'Software License Agreement',
    description: 'Signed licence agreement with the CRM provider.',
    tags: ['Legal', 'Contract', 'Vendor'],
    kind: 'pdf',
    department: 'Legal',
  },
  {
    title: 'Office Lease Agreement',
    description: 'Lease terms for the headquarters office.',
    tags: ['Legal', 'Contract', 'Confidential'],
    kind: 'pdf',
    department: 'Legal',
  },
  {
    title: 'Network Topology Diagram',
    description: 'Office and data centre network layout.',
    tags: ['Technical', 'Security'],
    kind: 'png',
    department: 'Engineering',
  },
  {
    title: 'Code Review Guidelines',
    description: 'What reviewers check and how to give useful feedback.',
    tags: ['Technical', 'Policy'],
    kind: 'txt',
    department: 'Engineering',
  },
  {
    title: 'Customer Support Playbook',
    description: 'Escalation paths and response time targets.',
    tags: ['Policy'],
    kind: 'docx',
    department: 'Operations',
  },
  {
    title: 'Inventory Count Sheet',
    description: 'Quarterly stock count for office equipment.',
    tags: ['Report', 'Q3 Review'],
    kind: 'xlsx',
    department: 'Operations',
  },
  {
    title: 'Training Catalogue',
    description: 'Available internal and external training courses.',
    tags: ['HR', 'Onboarding'],
    kind: 'csv',
    department: 'Human Resources',
  },
  {
    title: 'Whistleblower Policy',
    description: 'How to raise concerns confidentially and how they are handled.',
    tags: ['Legal', 'Policy', 'Compliance'],
    kind: 'pdf',
    department: 'Legal',
  },
  {
    title: 'Product Launch Checklist',
    description: 'Cross-team tasks for launching a new product.',
    tags: ['Marketing', 'Strategy', 'Template'],
    kind: 'docx',
    department: 'Marketing',
  },
  {
    title: 'Org Chart',
    description: 'Reporting lines across all departments.',
    tags: ['HR'],
    kind: 'png',
    department: 'Human Resources',
  },
  {
    title: 'Business Continuity Plan',
    description: 'How critical operations continue during major disruptions.',
    tags: ['Security', 'Compliance', 'Strategy'],
    kind: 'pdf',
    department: 'Operations',
  },
];

const quarterly: DocumentTemplate[] = [
  'Q1 2025',
  'Q2 2025',
  'Q3 2025',
  'Q4 2025',
  'Q1 2026',
  'Q2 2026',
  'Q3 2026',
].map((quarter) => ({
  title: `Quarterly Financial Report ${quarter}`,
  description: `Revenue, costs and cash flow for ${quarter}.`,
  tags: ['Finance', 'Report'],
  kind: 'pdf',
  department: 'Finance',
}));

const monthly: DocumentTemplate[] = ['April', 'May', 'June', 'July', 'August', 'September'].map(
  (month) => ({
    title: `Operations Review ${month} 2026`,
    description: `Monthly operations KPIs and actions for ${month}.`,
    tags: ['Report'],
    kind: 'xlsx',
    department: 'Operations',
  }),
);

const minutes: DocumentTemplate[] = ['January', 'March', 'May', 'July', 'September'].map(
  (month) => ({
    title: `Board Meeting Minutes ${month} 2026`,
    description: `Minutes and decisions from the ${month} board meeting.`,
    tags: ['Strategy', 'Confidential'],
    kind: 'txt',
    department: 'Legal',
  }),
);

export const documentTemplates: DocumentTemplate[] = [
  ...unique,
  ...quarterly,
  ...monthly,
  ...minutes,
];
