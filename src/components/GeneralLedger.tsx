import React, { useState } from 'react';
import { Account, JournalEntry } from '../types';
import { formatCurrency } from '../utils';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Calculator,
  Grid
} from 'lucide-react';

interface GeneralLedgerProps {
  accounts: Account[];
  entries: JournalEntry[];
}

interface LedgerLine {
  date: string;
  entryId: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export default function GeneralLedger({ accounts, entries }: GeneralLedgerProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({
    '1010': true // expand cash automatically for supreme aesthetics
  });

  const toggleExpand = (id: string) => {
    setExpandedAccounts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Compile general ledger lines for each account
  const getLedgerForAccount = (account: Account): LedgerLine[] => {
    const ledgerLines: LedgerLine[] = [];
    let runningBalance = account.initialBalance;

    // Filter and sort all entries chronologically
    const chronEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    chronEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.accountId === account.id) {
          const deb = line.debit || 0;
          const cred = line.credit || 0;

          // Bookkeeping rule: Asset & Expense increase with Debit, decrease with Credit.
          // Liabilities, Equity & Revenue increase with Credit, decrease with Debit.
          if (account.type === 'asset' || account.type === 'expense') {
            runningBalance += deb - cred;
          } else {
            runningBalance += cred - deb;
          }

          ledgerLines.push({
            date: entry.date,
            entryId: entry.id,
            description: entry.description,
            reference: entry.reference,
            debit: deb,
            credit: cred,
            runningBalance,
          });
        }
      });
    });

    return ledgerLines;
  };

  const filteredAccounts = selectedAccountId 
    ? accounts.filter(a => a.id === selectedAccountId)
    : accounts;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">General Ledgers</h2>
          <p className="text-xs text-[#71717A] mt-1">
            Grouped transaction logs categorized by Chart of Account classes
          </p>
        </div>

        {/* Quick Filter Selection */}
        <div className="w-full sm:w-64">
          <select
            id="gl-account-selector"
            className="w-full px-3 py-2 text-xs bg-[#0F0F10] border border-[#27272A] text-white shadow-2xs rounded-xl focus:outline-hidden focus:border-blue-500 transition-all font-semibold"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            <option value="" className="bg-[#161618]">Examine All Ledger Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-[#161618]">
                {acc.code} - {acc.name} ({acc.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Ledger Render Block */}
      <div className="space-y-6">
        {filteredAccounts.map(account => {
          const ledgerLines = getLedgerForAccount(account);
          const isExpanded = expandedAccounts[account.id] || !!selectedAccountId;
          
          const totalDebits = ledgerLines.reduce((sum, l) => sum + l.debit, 0);
          const totalCredits = ledgerLines.reduce((sum, l) => sum + l.credit, 0);
          const endingBalance = ledgerLines.length > 0 ? ledgerLines[ledgerLines.length - 1].runningBalance : account.initialBalance;

          return (
            <div key={account.id} className="bg-[#161618] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xs transition-all">
              
              {/* Account summary banner */}
              <div 
                onClick={() => !selectedAccountId && toggleExpand(account.id)}
                className={`px-4 sm:px-5 py-3.5 flex flex-col min-[420px]:flex-row items-start min-[420px]:items-center justify-between gap-3 select-none ${
                  !selectedAccountId ? 'cursor-pointer hover:bg-[#1C1C1E]' : ''
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {!selectedAccountId && (
                    <span className="text-[#71717A] mt-0.5 flex-shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#A1A1AA] bg-[#27272A] px-2 py-0.5 rounded-md border border-[#3F3F46] flex-shrink-0">
                        {account.code}
                      </span>
                      <h3 className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-none">{account.name}</h3>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#71717A] block">
                      {account.type} accounting record
                    </span>
                  </div>
                </div>

                {/* Totals panel in summary bar */}
                <div className="text-left min-[420px]:text-right flex-shrink-0 self-stretch min-[420px]:self-auto flex min-[420px]:block items-center justify-between gap-4 mt-1 min-[420px]:mt-0 pl-6 min-[420px]:pl-0">
                  <span className="text-[9px] text-[#71717A] font-semibold uppercase block truncate min-[420px]:mb-1">Computed balance</span>
                  <span className="font-mono font-bold text-xs text-white bg-[#0F0F10] border border-[#27272A] px-2.5 py-1 rounded-lg">
                    {formatCurrency(endingBalance)}
                  </span>
                </div>
              </div>

              {/* Transactions table (Rendered if expanded) */}
              {isExpanded && (
                <div className="border-t border-[#27272A] bg-[#0F0F10]">
                  {ledgerLines.length === 0 ? (
                    <div className="p-8 text-center bg-[#0F0F10] border-t border-[#27272A]">
                      <p className="text-[#71717A] text-xs">No ledger modifications found. Cumulative balance remains initial balance: {formatCurrency(account.initialBalance)}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                        <thead>
                          <tr className="bg-[#1C1C1E] text-[10px] text-[#71717A] font-extrabold uppercase tracking-wider border-b border-[#27272A]">
                            <th className="px-5 py-2.5">Date</th>
                            <th className="px-5 py-2.5">Doc ID</th>
                            <th className="px-5 py-2.5">Posting Narration</th>
                            <th className="px-5 py-2.5 text-right">Debit (Dr)</th>
                            <th className="px-5 py-2.5 text-right">Credit (Cr)</th>
                            <th className="px-5 py-2.5 text-right bg-[#1C1C1E]/60">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Starting Balance row */}
                          <tr className="border-b border-[#27272A] bg-[#0F0F10]/40">
                            <td className="px-5 py-2 font-mono text-[#71717A] font-medium">Opening</td>
                            <td className="px-5 py-2 font-mono text-[#71717A]">-</td>
                            <td className="px-5 py-2 text-[#71717A] italic font-medium">Accumulated historical balance brought forward</td>
                            <td className="px-5 py-2 text-right">-</td>
                            <td className="px-5 py-2 text-right">-</td>
                            <td className="px-5 py-2 text-right font-mono font-semibold text-[#A1A1AA] bg-[#161618]">
                              {formatCurrency(account.initialBalance)}
                            </td>
                          </tr>

                          {/* Dynamic transaction rows */}
                          {ledgerLines.map((line, idx) => (
                            <tr key={idx} className="hover:bg-[#1C1C1E] border-b border-[#27272A]">
                              <td className="px-5 py-2.5 font-mono text-[#71717A]">{line.date}</td>
                              <td className="px-5 py-2.5 font-mono text-[#E4E4E7] font-bold">{line.entryId}</td>
                              <td className="px-5 py-2.5 text-[#E4E4E7]">
                                <span>{line.description}</span>
                                {line.reference && (
                                  <span className="ml-2 px-1 rounded-sm bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[9px] select-all font-bold">
                                    Ref: {line.reference}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-2.5 text-right font-mono text-blue-400 font-semibold">
                                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                              </td>
                              <td className="px-5 py-2.5 text-right font-mono text-amber-400 font-semibold">
                                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                              </td>
                              <td className="px-5 py-2.5 text-right font-mono font-extrabold text-white bg-[#1C1C1E]/20">
                                {formatCurrency(line.runningBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#1C1C1E] font-bold text-[#E4E4E7] border-t border-[#27272A]">
                            <td colSpan={3} className="px-5 py-2.5 text-xs font-bold">Accumulated Account Volumes & Reconciliation</td>
                            <td className="px-5 py-2.5 text-right font-mono text-blue-400 font-extrabold">{formatCurrency(totalDebits)}</td>
                            <td className="px-5 py-2.5 text-right font-mono text-amber-500 font-extrabold">{formatCurrency(totalCredits)}</td>
                            <td className="px-5 py-2.5 text-right font-mono text-white font-extrabold bg-[#161618]/40">
                              {formatCurrency(endingBalance)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
