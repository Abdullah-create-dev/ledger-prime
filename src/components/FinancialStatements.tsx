import React, { useState } from 'react';
import { Account, JournalEntry } from '../types';
import { calculateAccountBalances, formatCurrency } from '../utils';
import { 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Scale, 
  Download, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface FinancialStatementsProps {
  accounts: Account[];
  entries: JournalEntry[];
}

export default function FinancialStatements({ accounts, entries }: FinancialStatementsProps) {
  const [statementType, setStatementType] = useState<'PL' | 'BS'>('PL');
  const [reportingPeriod, setReportingPeriod] = useState('All-Time System Logs');

  const balances = calculateAccountBalances(accounts, entries);

  // Group balances by type
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalRevenue = 0;
  let totalExpense = 0;

  const assetsList: { name: string; code: string; balance: number }[] = [];
  const liabilitiesList: { name: string; code: string; balance: number }[] = [];
  const equityList: { name: string; code: string; balance: number }[] = [];
  const revenueList: { name: string; code: string; balance: number }[] = [];
  const expenseList: { name: string; code: string; balance: number }[] = [];

  accounts.forEach(acc => {
    const bal = balances[acc.id] || 0;
    const item = { name: acc.name, code: acc.code, balance: bal };

    if (acc.type === 'asset') {
      totalAssets += bal;
      assetsList.push(item);
    } else if (acc.type === 'liability') {
      totalLiabilities += bal;
      liabilitiesList.push(item);
    } else if (acc.type === 'equity') {
      totalEquity += bal;
      equityList.push(item);
    } else if (acc.type === 'revenue') {
      totalRevenue += bal;
      revenueList.push(item);
    } else if (acc.type === 'expense') {
      totalExpense += bal;
      expenseList.push(item);
    }
  });

  // Calculate Profit & Loss Net Profit
  const netIncomePL = totalRevenue - totalExpense;

  // Bookkeeping adjustment of Net Income into Balance Sheet
  // Net Income flows into Retained Earnings (Equity)
  // Therefore, total equity on balance sheet must increase by net Income PL to achieve total balance!
  const adjustedTotalEquity = totalEquity + netIncomePL;
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + adjustedTotalEquity)) < 0.01;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Audit Statements & Reporting</h2>
          <p className="text-xs text-[#71717A] mt-1">
            Dynamic generated GAAP financial accounts matching absolute journal ledgers
          </p>
        </div>

        {/* Action button row */}
        <div className="flex items-center gap-2">
          <button
            id="btn-print-statement"
            onClick={handlePrint}
            className="cursor-pointer bg-[#27272A] border border-[#3F3F46] hover:bg-[#3F3F46] text-[#E4E4E7] text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-[#A1A1AA]" />
            Print Report
          </button>
        </div>
      </div>

      {/* Toggle View Tabs selector */}
      <div className="bg-[#161618] p-1 rounded-xl border border-[#27272A] max-w-sm flex">
        <button
          id="btn-select-pl-statement"
          onClick={() => setStatementType('PL')}
          className={`cursor-pointer flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 text-[11px] min-w-0 ${
            statementType === 'PL' 
              ? 'bg-[#27272A] border border-[#3F3F46] text-white shadow-xs' 
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Profit & Loss</span>
        </button>
        <button
          id="btn-select-bs-statement"
          onClick={() => setStatementType('BS')}
          className={`cursor-pointer flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 text-[11px] min-w-0 ${
            statementType === 'BS' 
              ? 'bg-[#27272A] border border-[#3F3F46] text-white shadow-xs' 
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Balance Sheet</span>
        </button>
      </div>

      {/* Core Statement Card */}
      <div className="bg-[#161618] border border-[#27272A] rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs relative overflow-hidden print:border-none print:shadow-none print:p-0">
        
        {/* Subtle Watermark details */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-blue-950/10 via-transparent to-transparent pointer-events-none" />

        {/* Corporate header details */}
        <div className="border-b border-[#27272A] pb-5 text-center sm:text-left flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="text-lg font-bold text-white">LedgerPrime HQ Inc.</h3>
            <p className="text-[11px] sm:text-xs text-blue-400 font-bold uppercase tracking-widest leading-normal">
              {statementType === 'PL' ? 'Statement of Income & Profit Loss' : 'Statement of Financial Position'}
            </p>
            <p className="text-[11px] text-[#71717A] font-mono">
              Reporting Window: {reportingPeriod} (USD Calculations)
            </p>
          </div>
          <div className="text-left sm:text-right font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl self-stretch sm:self-auto flex sm:block items-center justify-between gap-4">
            <span className="font-bold block uppercase tracking-wider text-[8px] text-blue-400/80">Auditor Status</span>
            <span>✓ Active Log Verified</span>
          </div>
        </div>

        {/* Render Form 1: PROFIT & LOSS */}
        {statementType === 'PL' && (
          <div className="pt-6 space-y-6">
            
            {/* Revenues Section */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold text-[#71717A] uppercase tracking-widest border-b border-[#27272A] pb-1.5">
                Operating Revenues
              </h4>
              <div className="space-y-1.5 pt-1">
                {revenueList.map(item => (
                  <div key={item.code} className="flex justify-between items-center text-xs text-[#E4E4E7] py-1">
                    <span className="font-medium">
                      <span className="font-mono text-[#71717A] mr-2">{item.code}</span>
                      {item.name}
                    </span>
                    <span className="font-mono font-semibold text-white">{formatCurrency(item.balance)}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-[#27272A] flex justify-between items-center text-xs font-bold text-white">
                <span>Total Accumulated Revenue</span>
                <span className="font-mono text-sm underline tracking-wide text-blue-400">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold text-[#71717A] uppercase tracking-widest border-b border-[#27272A] pb-1.5">
                Operating & Work Expenditures
              </h4>
              <div className="space-y-1.5 pt-1">
                {expenseList.map(item => (
                  <div key={item.code} className="flex justify-between items-center text-xs text-[#E4E4E7] py-1">
                    <span className="font-medium">
                      <span className="font-mono text-[#71717A] mr-2">{item.code}</span>
                      {item.name}
                    </span>
                    <span className="font-mono font-semibold text-white">{formatCurrency(item.balance)}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-[#27272A] flex justify-between items-center text-xs font-bold text-white">
                <span>Total Operating Expenditures</span>
                <span className="font-mono text-sm underline tracking-wide text-amber-500">{formatCurrency(totalExpense)}</span>
              </div>
            </div>

            {/* Net Profits final summary row */}
            <div className="pt-4 border-t-2 border-[#27272A] border-double">
              <div className="p-4 bg-[#0F0F10] rounded-2xl border border-[#27272A] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="min-w-0">
                  <h5 className="text-xs font-extrabold text-white uppercase tracking-wide truncate">Net Profit Margin / Loss</h5>
                  <p className="text-[10px] text-[#71717A] mt-0.5">Retained directly into capitalization balance</p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0 flex sm:block items-center justify-between gap-4 mt-2 sm:mt-0">
                  <span className={`font-mono text-base font-extrabold block ${netIncomePL >= 0 ? 'text-blue-400' : 'text-rose-450'}`}>
                    {formatCurrency(netIncomePL)}
                  </span>
                  <span className="inline-block text-[8px] bg-[#27272A] text-[#A1A1AA] px-1.5 py-0.5 rounded-sm font-bold border border-[#3F3F46] flex-shrink-0">GAAP STATEMENT</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Render Form 2: BALANCE SHEET */}
        {statementType === 'BS' && (
          <div className="pt-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Assets Section (Debit normal) */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest border-b-2 border-blue-950 pb-1.5">
                    1. Assets (Debit normal)
                  </h4>
                  <div className="space-y-2 pt-2 pb-4">
                    {assetsList.map(item => (
                      <div key={item.code} className="flex justify-between items-center text-xs text-[#E4E4E7] py-1">
                        <span className="font-semibold">
                          <span className="font-mono text-[#71717A] mr-2">{item.code}</span>
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-white">{formatCurrency(item.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#27272A] flex justify-between items-center text-xs font-extrabold text-white">
                  <span>TOTAL CORPORATE ASSETS</span>
                  <span className="font-mono text-sm tracking-wide bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 text-blue-400">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
              </div>

              {/* Liabilities and Equity Section (Credit normal) */}
              <div className="space-y-5">
                
                {/* Liabilities */}
                <div>
                  <h4 className="text-xs font-extrabold text-amber-500 uppercase tracking-widest border-b-2 border-amber-950/40 pb-1.5">
                    2. Liabilities (Credit normal)
                  </h4>
                  <div className="space-y-2 pt-2">
                    {liabilitiesList.length === 0 ? (
                      <span className="text-[#71717A] text-xs italic block py-2">No active short term debts reported.</span>
                    ) : (
                      liabilitiesList.map(item => (
                        <div key={item.code} className="flex justify-between items-center text-xs text-[#E4E4E7] py-1">
                          <span className="font-semibold">
                            <span className="font-mono text-[#71717A] mr-2">{item.code}</span>
                            {item.name}
                          </span>
                          <span className="font-mono font-bold text-white">{formatCurrency(item.balance)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-[#27272A] flex justify-between items-center text-[11px] font-bold text-[#A1A1AA]">
                    <span>Total Accrued Liabilities</span>
                    <span className="font-mono text-white">{formatCurrency(totalLiabilities)}</span>
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-[#27272A] pb-1.5">
                    3. Shareholder Equity (Credit normal)
                  </h4>
                  <div className="space-y-2 pt-2">
                    {equityList.map(item => (
                      <div key={item.code} className="flex justify-between items-center text-xs text-[#E4E4E7] py-1">
                        <span className="font-semibold">
                          <span className="font-mono text-[#71717A] mr-2">{item.code}</span>
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-white">{formatCurrency(item.balance)}</span>
                      </div>
                    ))}
                    
                    {/* Retained Earnings (Net income addition flows details to align total balance!) */}
                    <div className="flex justify-between items-start text-xs text-[#E4E4E7] py-1 border-b border-[#27272A]">
                      <div className="space-y-0.5">
                        <span className="font-semibold">
                          <span className="font-mono text-[#71717A] mr-2">3990</span>
                          Current Period Earnings (P/L)
                        </span>
                        <span className="text-[9px] text-[#71717A] block italic leading-none">Net income transfer ratio</span>
                      </div>
                      <span className="font-mono font-bold text-white pt-0.5">{formatCurrency(netIncomePL)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#27272A] flex justify-between items-center text-[11px] font-bold text-[#A1A1AA]">
                    <span>Total Balanced Equity</span>
                    <span className="font-mono text-white">{formatCurrency(adjustedTotalEquity)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#27272A] flex justify-between items-center text-xs font-extrabold text-white">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="font-mono text-sm tracking-wide bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-amber-400">
                    {formatCurrency(totalLiabilities + adjustedTotalEquity)}
                  </span>
                </div>

              </div>

            </div>

            {/* Assets == Liabilities + Equity validation block */}
            <div className="pt-4 border-t-2 border-[#27272A] border-double">
              <div className={`p-3.5 sm:p-4 rounded-2xl border ${
                isBalanced 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
              } flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <Scale className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Accounting Equation Status</span>
                  </span>
                  <p className="text-[10px] text-[#A1A1AA] mt-1.5 leading-relaxed">
                    Under standard double-entry parameter constraints, total corporate Assets must equal Liabilities + Equity.
                  </p>
                </div>
                <div className="text-left lg:text-right select-none shrink-0 self-stretch lg:self-auto">
                  <span className="font-bold text-[10px] sm:text-xs font-mono uppercase tracking-widest block bg-[#0F0F10] px-3 py-2 border border-[#27272A] rounded-xl text-center">
                    {isBalanced ? '✓ Equation Balanced' : '⚠️ Unbalanced Ledger'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Audit footers */}
        <div className="mt-8 pt-4 border-t border-[#27272A] text-[10px] text-[#71717A] flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Official audit ledger generated by PrimeLedger HQ System.</span>
          <span className="font-mono font-bold text-[10px] text-[#A1A1AA]">Secure Code: SHA-256/LEDGER-SYSTEM-AUTH</span>
        </div>

      </div>

    </div>
  );
}
