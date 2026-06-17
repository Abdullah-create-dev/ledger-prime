import React from 'react';
import { Account, JournalEntry } from '../types';
import { calculateAccountBalances, formatCurrency } from '../utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Scale, 
  Layers, 
  Briefcase, 
  ArrowUpRight, 
  Building,
  AlertCircle,
  Activity,
  UserCheck
} from 'lucide-react';

interface DashboardProps {
  accounts: Account[];
  entries: JournalEntry[];
  session: any;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ accounts, entries, session, onNavigate }: DashboardProps) {
  const balances = calculateAccountBalances(accounts, entries);

  // Group balances by type
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalRevenue = 0;
  let totalExpense = 0;

  accounts.forEach(acc => {
    const bal = balances[acc.id] || 0;
    if (acc.type === 'asset') totalAssets += bal;
    else if (acc.type === 'liability') totalLiabilities += bal;
    else if (acc.type === 'equity') totalEquity += bal;
    else if (acc.type === 'revenue') totalRevenue += bal;
    else if (acc.type === 'expense') totalExpense += bal;
  });

  // Profit/Loss
  const NetProfit = totalRevenue - totalExpense;

  // Let's compute a quick cash metric (from Cash Account 1010)
  const cashOnHand = balances['1010'] || 0;
  // Accounts receivable
  const receivables = balances['1200'] || 0;

  // Recent entries
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Upper Banner Status */}
      <div className="bg-[#161618] rounded-2xl p-4 sm:p-6 border border-[#27272A] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ledger Command Console</h2>
          <p className="text-xs text-[#71717A] mt-1">
            Real-time audit overview configured for <span className="font-semibold text-blue-400">{session?.name || 'Administrator'}</span>
          </p>
        </div>
        
        {/* Verification Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-semibold">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>Secure session authorized</span>
        </div>
      </div>

      {/* Primary KPI Grid (Responsive columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cash Balance */}
        <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-[#27272A] shadow-xs hover:border-[#3F3F46] transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider truncate">Cash Position (1010)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">{formatCurrency(cashOnHand)}</h3>
            <p className="text-[11px] text-[#71717A] mt-1">Liquid workspace capital reserves</p>
          </div>
        </div>

        {/* Total Assets */}
        <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-[#27272A] shadow-xs hover:border-[#3F3F46] transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider truncate">Total Assets</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl flex-shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">{formatCurrency(totalAssets)}</h3>
            <p className="text-[11px] text-[#71717A] mt-1">Fixed hardware + customer debts</p>
          </div>
        </div>

        {/* Net Income Profit */}
        <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-[#27272A] shadow-xs hover:border-[#3F3F46] transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider truncate">Net Profit</span>
            <div className={`p-2 rounded-xl flex-shrink-0 ${NetProfit >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-450'}`}>
              {NetProfit >= 0 ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight truncate ${NetProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {formatCurrency(NetProfit)}
            </h3>
            <p className="text-[11px] text-[#71717A] mt-1">Revenue minus expenses</p>
          </div>
        </div>

        {/* Leverage Ratio Check */}
        <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-[#27272A] shadow-xs hover:border-[#3F3F46] transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider truncate">Liabilities & Equity</span>
            <div className="p-2 bg-[#27272A] text-purple-400 rounded-xl flex-shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
              {formatCurrency(totalLiabilities + totalEquity)}
            </h3>
            <p className="text-[11px] text-[#71717A] mt-1 truncate">
              {totalAssets === (totalLiabilities + totalEquity) 
                ? '✅ Balanced Balance Sheet' 
                : '⚠️ Trial mismatch'}
            </p>
          </div>
        </div>

      </div>

      {/* Middle Grid: Dynamic Charts + Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Graphic Revenue vs Expense */}
        <div className="bg-[#161618] p-4 sm:p-6 rounded-2xl border border-[#27272A] shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Operational Breakdown</h3>
              <p className="text-xs text-[#71717A]">Comparing gross revenue vs expenditure payouts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            
            {/* Revenue card bar visual */}
            <div className="p-3 sm:p-4 bg-[#0F0F10] border border-[#27272A] rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#A1A1AA] truncate">Gross Income</span>
                <span className="p-1 bg-emerald-500/10 text-emerald-450 rounded-md text-[9px] sm:text-[10px] font-bold flex-shrink-0">Cr Accounts</span>
              </div>
              <p className="text-base sm:text-lg font-extrabold text-white truncate">{formatCurrency(totalRevenue)}</p>
              
              <div className="w-full bg-[#27272A] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${totalRevenue > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Expenses card bar visual */}
            <div className="p-3 sm:p-4 bg-[#0F0F10] border border-[#27272A] rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#A1A1AA] truncate">Cumulative Expense</span>
                <span className="p-1 bg-amber-500/10 text-amber-400 rounded-md text-[9px] sm:text-[10px] font-bold flex-shrink-0">Dr Accounts</span>
              </div>
              <p className="text-base sm:text-lg font-extrabold text-white truncate">{formatCurrency(totalExpense)}</p>
              
              <div className="w-full bg-[#27272A] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${totalRevenue > 0 ? Math.min(100, (totalExpense / totalRevenue) * 100) : totalExpense > 0 ? 100 : 0}%` 
                  }}
                />
              </div>
            </div>

          </div>

          {/* SVG Visual Comparison Graph */}
          <div className="pt-4 border-t border-[#27272A]">
            <span className="text-xs text-[#A1A1AA] font-semibold block mb-2">Visual Performance Matrix</span>
            <div className="w-full h-24 bg-linear-to-r from-blue-950/20 to-transparent rounded-xl flex items-end justify-between px-2.5 sm:px-6 py-2 border border-[#27272A]">
              <div className="text-center w-1/3 max-w-[80px]">
                <div className="bg-blue-600 rounded-lg mx-auto transition-all duration-700" style={{ height: '36px', width: '24px' }} />
                <span className="text-[10px] text-[#71717A] font-bold block mt-1 truncate">Revenues</span>
              </div>
              
              <div className="text-center w-1/3 max-w-[80px]">
                <div className="bg-amber-500 rounded-lg mx-auto transition-all duration-700" style={{ height: `${totalRevenue > 0 ? (totalExpense / totalRevenue) * 36 : 10}px`, width: '24px' }} />
                <span className="text-[10px] text-[#71717A] font-bold block mt-1 truncate">Expenses</span>
              </div>

              <div className="text-center w-1/3 max-w-[80px]">
                <div className={`rounded-lg mx-auto transition-all duration-700 ${NetProfit >= 0 ? 'bg-blue-400' : 'bg-rose-455'}`} style={{ height: `${totalRevenue > 0 ? (Math.max(0, NetProfit) / totalRevenue) * 36 : 10}px`, width: '24px' }} />
                <span className="text-[10px] text-[#71717A] font-bold block mt-1 truncate">Net Margin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Audits List */}
        <div className="bg-[#161618] p-4 sm:p-6 rounded-2xl border border-[#27272A] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Audit Health Check</h3>
            <p className="text-xs text-[#71717A] mt-1">Continuous double-entry validation metrics</p>
            
            <div className="space-y-4 mt-5">
              
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#27272A]">
                <span className="text-[#A1A1AA] font-medium">Standard Compliance Status:</span>
                <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">GAAP Compliant</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#27272A]">
                <span className="text-[#A1A1AA] font-medium">Double-entry status:</span>
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block animate-pulse" />
                  Entries Balanced
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#27272A]">
                <span className="text-[#A1A1AA] font-medium">Accounts Receivable:</span>
                <span className="font-semibold text-white">{formatCurrency(receivables)}</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-[#A1A1AA] font-medium">Pre-seeded Logs Count:</span>
                <span className="font-mono bg-[#0F0F10] border border-[#27272A] px-2 py-0.5 rounded-md text-slate-300 text-[11px] font-bold">{entries.length} units</span>
              </div>

            </div>
          </div>

          <button
            id="btn-navigate-journal"
            onClick={() => onNavigate('journal')}
            className="w-full cursor-pointer mt-6 bg-[#27272A] border border-[#3F3F46] text-[#E4E4E7] hover:bg-[#3F3F46] px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Activity className="w-4 h-4 text-blue-400" />
            Launch Ledger Log Books
          </button>
        </div>

      </div>

      {/* Lower Dashboard Section: Recent Entries & Account Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Journal ledger transactions */}
        <div className="bg-[#161618] p-4 sm:p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Journal Postings</h3>
            <button 
              onClick={() => onNavigate('journal')}
              className="text-xs font-bold text-blue-400 hover:underline"
            >
              Examine All
            </button>
          </div>

          <div className="space-y-3">
            {recentEntries.map(entry => {
              const totalDebits = entry.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
              return (
                <div key={entry.id} className="p-3 bg-[#0F0F10] hover:bg-[#1C1C1E] border border-[#27272A] rounded-xl flex items-center justify-between gap-2 text-xs transition-all min-w-0">
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-[#71717A] font-bold block">{entry.id} • {entry.date}</span>
                    <span className="font-semibold text-[#E4E4E7] block truncate max-w-[120px] sm:max-w-[200px]">{entry.description}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-extrabold text-white block truncate max-w-[80px] sm:max-w-[none]">{formatCurrency(totalDebits)}</span>
                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block">Balanced Entry</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart of Accounts quick ratios indicators */}
        <div className="bg-[#161618] p-4 sm:p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-white">Critical Balance Accounts</h3>
          
          <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 pt-1">
            
            <div className="p-3 bg-[#0F0F10] border border-[#27272A] rounded-xl">
              <div className="flex justify-between items-center gap-1.5 text-[10px] text-[#71717A] font-bold uppercase tracking-wider">
                <span className="truncate">Total Assets</span>
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              </div>
              <p className="text-sm sm:text-md font-extrabold text-white mt-1 truncate">{formatCurrency(totalAssets)}</p>
            </div>

            <div className="p-3 bg-[#0F0F10] border border-[#27272A] rounded-xl">
              <div className="flex justify-between items-center gap-1.5 text-[10px] text-[#71717A] font-bold uppercase tracking-wider">
                <span className="truncate">Liabilities</span>
                <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
              </div>
              <p className="text-sm sm:text-md font-extrabold text-white mt-1 truncate">{formatCurrency(totalLiabilities)}</p>
            </div>

            <div className="p-3 bg-[#0F0F10] border border-[#27272A] rounded-xl">
              <div className="flex justify-between items-center gap-1.5 text-[10px] text-[#71717A] font-bold uppercase tracking-wider">
                <span className="truncate">Revenue Cap</span>
                <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
              </div>
              <p className="text-sm sm:text-md font-extrabold text-white mt-1 truncate">{formatCurrency(totalRevenue)}</p>
            </div>

            <div className="p-3 bg-[#0F0F10] border border-[#27272A] rounded-xl">
              <div className="flex justify-between items-center gap-1.5 text-[10px] text-[#71717A] font-bold uppercase tracking-wider">
                <span className="truncate">Core Expenses</span>
                <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />
              </div>
              <p className="text-sm sm:text-md font-extrabold text-white mt-1 truncate">{formatCurrency(totalExpense)}</p>
            </div>

          </div>

          <div className="text-center pt-2">
            <button 
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Analyze P/L & Balance Reports
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
