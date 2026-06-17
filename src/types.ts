export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string; // Account Code is usually the ID (e.g. '1010')
  code: string;
  name: string;
  type: AccountType;
  description: string;
  initialBalance: number; // For running calculations
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalEntryLine[];
  reference?: string;
}

export interface UserSession {
  email: string;
  name: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  isFullyAuthenticated: boolean;
}

// Initial Standard Chart of Accounts
export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1010', code: '1010', name: 'Cash & Cash Equivalents', type: 'asset', description: 'Liquid cash, bank current accounts, and petty cash reserves.', initialBalance: 0 },
  { id: '1200', code: '1200', name: 'Accounts Receivable', type: 'asset', description: 'Outstanding invoices from clients for services billed.', initialBalance: 0 },
  { id: '1400', code: '1400', name: 'Merchandise Inventory', type: 'asset', description: 'Value of physical or digital inventory held for sale.', initialBalance: 0 },
  { id: '1800', code: '1800', name: 'Office Equipment & Hardware', type: 'asset', description: 'Computers, servers, office furniture, leasehold upgrades.', initialBalance: 0 },
  { id: '2000', code: '2000', name: 'Accounts Payable', type: 'liability', description: 'Outstanding short-term bills owed to service providers and vendors.', initialBalance: 0 },
  { id: '2100', code: '2100', name: 'Accrued Credit & Short-term Loans', type: 'liability', description: 'Short term borrowing, lines of credit or high-yield bills.', initialBalance: 0 },
  { id: '3000', code: '3000', name: 'Share Capital (Common Equity)', type: 'equity', description: 'Initial or subsequent capital input from proprietors or backers.', initialBalance: 0 },
  { id: '3100', code: '3100', name: 'Retained Earnings', type: 'equity', description: 'Accumulated profits kept within the business ledger.', initialBalance: 0 },
  { id: '4100', code: '4100', name: 'Client Technical Services', type: 'revenue', description: 'Earnings achieved from providing bespoke consultant/engineering hours.', initialBalance: 0 },
  { id: '4200', code: '4200', name: 'Software Product licensing', type: 'revenue', description: 'Recurring licensing, SaaS software billings, subscription profits.', initialBalance: 0 },
  { id: '5010', code: '5010', name: 'Rent & Co-working Expense', type: 'expense', description: 'Premises rent, executive suites, and physical utilities billings.', initialBalance: 0 },
  { id: '5020', code: '5020', name: 'Payroll & Compensation', type: 'expense', description: 'Staff salaries, freelance payouts, associated benefit options.', initialBalance: 0 },
  { id: '5030', code: '5030', name: 'Cloud Server Infrastructure', type: 'expense', description: 'GCP, hosting cluster nodes, database pipelines and API feeds.', initialBalance: 0 },
  { id: '5040', code: '5040', name: 'Sales & Product Promotion', type: 'expense', description: 'SaaS advertisements, client dinners, exhibition passes, listings.', initialBalance: 0 },
];

// Initial preseeded balanced double-entries to guarantee non-empty analytics
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'JE-0001',
    date: '2026-06-01',
    description: 'Initial Business Capital Infusion by Owners',
    reference: 'BANK-TRF-1002',
    lines: [
      { id: 'JEL-0001', accountId: '1010', debit: 120000, credit: 0 }, // Dr Cash
      { id: 'JEL-0002', accountId: '3000', debit: 0, credit: 120000 }, // Cr Owner Capital
    ]
  },
  {
    id: 'JE-0002',
    date: '2026-06-02',
    description: 'Purchase of High-performance Server Hardware',
    reference: 'HARDWARE-9921',
    lines: [
      { id: 'JEL-0003', accountId: '1800', debit: 12500, credit: 0 }, // Dr Office Equipment
      { id: 'JEL-0004', accountId: '1010', debit: 0, credit: 12500 }, // Cr Cash
    ]
  },
  {
    id: 'JE-0003',
    date: '2026-06-05',
    description: 'Delivered Custom SaaS Development Service to Acme Corp',
    reference: 'INV-2026-001',
    lines: [
      { id: 'JEL-0005', accountId: '1200', debit: 24000, credit: 0 }, // Dr Accounts Receivable
      { id: 'JEL-0006', accountId: '4100', debit: 0, credit: 24000 }, // Cr Client services revenue
    ]
  },
  {
    id: 'JE-0004',
    date: '2026-06-08',
    description: 'SaaS Cloud Infrastructure Subscription (AWS/Google)',
    reference: 'CLD-NODE-653',
    lines: [
      { id: 'JEL-0007', accountId: '5030', debit: 3400, credit: 0 }, // Dr Cloud Serivce Expense
      { id: 'JEL-0008', accountId: '2000', debit: 0, credit: 3400 }, // Cr Accounts Payable (Accrued bill)
    ]
  },
  {
    id: 'JE-0005',
    date: '2026-06-10',
    description: 'Partial Settlement payment received from Acme Corp',
    reference: 'PAY-ACME-404',
    lines: [
      { id: 'JEL-0009', accountId: '1010', debit: 15000, credit: 0 }, // Dr Cash
      { id: 'JEL-0010', accountId: '1200', debit: 0, credit: 15000 }, // Cr Accounts Receivable
    ]
  },
  {
    id: 'JE-0006',
    date: '2026-06-12',
    description: 'Monthly Office Rental for Technical Sandbox Labs',
    reference: 'RENT-COWRK-61',
    lines: [
      { id: 'JEL-0011', accountId: '5010', debit: 4500, credit: 0 }, // Dr Rent Expense
      { id: 'JEL-0012', accountId: '1010', debit: 0, credit: 4500 }, // Cr Cash
    ]
  },
  {
    id: 'JE-0007',
    date: '2026-06-15',
    description: 'Mid-Month Engineering Staff Salaries Paid',
    reference: 'SAL-PAY-JUNE',
    lines: [
      { id: 'JEL-0013', accountId: '5020', debit: 14000, credit: 0 }, // Dr Salary Expense
      { id: 'JEL-0014', accountId: '1010', debit: 0, credit: 14000 }, // Cr Cash
    ]
  },
  {
    id: 'JE-0008',
    date: '2026-06-15',
    description: 'Earned license sales for Mobile App Subscription Module',
    reference: 'STRIPE-BATCH-77',
    lines: [
      { id: 'JEL-0015', accountId: '1010', debit: 9800, credit: 0 }, // Dr Cash
      { id: 'JEL-0016', accountId: '4200', debit: 0, credit: 9800 }, // Cr Software licensing income
    ]
  }
];
