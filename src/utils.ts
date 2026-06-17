import { Account, JournalEntry, AccountType } from './types';

/**
 * Calculates the current balances for all accounts based on a list of journal entries.
 */
export function calculateAccountBalances(accounts: Account[], entries: JournalEntry[]): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize all account balances to their initial value
  accounts.forEach(acc => {
    balances[acc.id] = acc.initialBalance;
  });

  // Accumulate all debits and credits
  entries.forEach(entry => {
    entry.lines.forEach(line => {
      const acc = accounts.find(a => a.id === line.accountId);
      if (!acc) return;

      const debitAmt = line.debit || 0;
      const creditAmt = line.credit || 0;

      // Bookkeeping adjustments based on normal balances:
      // Asset & Expense: increase by Debit, decrease by Credit
      // Liability, Equity, Revenue: increase by Credit, decrease by Debit
      if (acc.type === 'asset' || acc.type === 'expense') {
        balances[acc.id] = (balances[acc.id] || 0) + debitAmt - creditAmt;
      } else {
        // liability, equity, revenue
        balances[acc.id] = (balances[acc.id] || 0) + creditAmt - debitAmt;
      }
    });
  });

  return balances;
}

/**
 * Validates a journal entry's debit vs credit levels.
 */
export function validateDoubleEntry(lines: { accountId: string; debit: number; credit: number }[]): {
  isValid: boolean;
  debitTotal: number;
  creditTotal: number;
  difference: number;
} {
  const debitTotal = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const creditTotal = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  // Mitigate floating point errors
  const difference = Math.abs(debitTotal - creditTotal);
  const isValid = difference < 0.01 && debitTotal > 0;

  return {
    isValid,
    debitTotal,
    creditTotal,
    difference,
  };
}

/**
 * Formats values into secure currency formats.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
