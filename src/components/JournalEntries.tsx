import React, { useState } from 'react';
import { Account, JournalEntry, JournalEntryLine } from '../types';
import { validateDoubleEntry, formatCurrency } from '../utils';
import { 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  X,
  FileText,
  BookmarkCheck
} from 'lucide-react';

interface JournalEntriesProps {
  accounts: Account[];
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export default function JournalEntries({ accounts, entries, onAddEntry, onDeleteEntry }: JournalEntriesProps) {
  // New entry form states
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  
  // Local lines list (start with 2 standard blank rows)
  const [lines, setLines] = useState<Omit<JournalEntryLine, 'id'>[]>([
    { accountId: accounts[0]?.id || '', debit: 0, credit: 0 },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 0 },
  ]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  // Local validation
  const { isValid, debitTotal, creditTotal, difference } = validateDoubleEntry(lines);

  const handleAddLine = () => {
    // Add another balanced or blank journal row line
    setLines([...lines, { accountId: accounts[0]?.id || '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return; // double entry needs at least 2 accounts
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: 'accountId' | 'debit' | 'credit', value: any) => {
    const nextLines = [...lines];
    if (field === 'accountId') {
      nextLines[index].accountId = value;
    } else {
      const numValue = Math.max(0, parseFloat(value) || 0);
      nextLines[index][field] = numValue;
      
      // Auto-mutually-exclude: a single account row line should only have one balance side.
      if (field === 'debit' && numValue > 0) {
        nextLines[index].credit = 0;
      } else if (field === 'credit' && numValue > 0) {
        nextLines[index].debit = 0;
      }
    }
    setLines(nextLines);
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (!description.trim()) {
      alert('Please fill out the journal entry description.');
      return;
    }

    const uniqueLines: JournalEntryLine[] = lines.map((line, idx) => ({
      id: `JEL-${Date.now()}-${idx}`,
      ...line,
    }));

    const newJournal: JournalEntry = {
      id: `JE-0${entries.length + 100}`.replace('00', '0'), // incremental visual code
      date,
      description: description.trim(),
      reference: reference.trim() || undefined,
      lines: uniqueLines,
    };

    onAddEntry(newJournal);
    
    // Reset form
    setDescription('');
    setReference('');
    setDate(new Date().toISOString().split('T')[0]);
    setLines([
      { accountId: accounts[0]?.id || '', debit: 0, credit: 0 },
      { accountId: accounts[1]?.id || '', debit: 0, credit: 0 },
    ]);
    setIsOpen(false);
  };

  // Filter Logic execution
  const filteredEntries = entries.filter(entry => {
    // Description or ID Search
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      entry.description.toLowerCase().includes(query) ||
      entry.id.toLowerCase().includes(query) ||
      (entry.reference && entry.reference.toLowerCase().includes(query));

    // Account filter check
    const matchesAccount = !filterAccount || entry.lines.some(l => l.accountId === filterAccount);

    // Date range check
    let matchesStartDate = true;
    if (filterStartDate) {
      matchesStartDate = new Date(entry.date) >= new Date(filterStartDate);
    }
    let matchesEndDate = true;
    if (filterEndDate) {
      matchesEndDate = new Date(entry.date) <= new Date(filterEndDate);
    }

    // Amount thresholds check (evaluate the sums of debits in entry)
    const entryTotalDebit = entry.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
    let matchesMinAmount = true;
    if (filterMinAmount) {
      matchesMinAmount = entryTotalDebit >= parseFloat(filterMinAmount);
    }
    let matchesMaxAmount = true;
    if (filterMaxAmount) {
      matchesMaxAmount = entryTotalDebit <= parseFloat(filterMaxAmount);
    }

    return matchesSearch && matchesAccount && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setFilterAccount('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper Module header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Double-Entry Journal</h2>
          <p className="text-xs text-[#71717A] mt-1">
            General chronostatic journal book keeper (Balance checking mandatory)
          </p>
        </div>

        <button
          id="btn-trigger-new-entry"
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isOpen ? 'Close Register Window' : 'Secure Journal Posting'}
        </button>
      </div>

      {/* Slide-Down Double Entry Form */}
      {isOpen && (
        <form onSubmit={handleSubmitEntry} className="bg-[#161618] p-4 sm:p-6 rounded-2xl border border-[#27272A] shadow-lg space-y-6 transition-all duration-300">
          
          <div className="border-b border-[#27272A] pb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 min-w-0">
              <FileSpreadsheet className="w-4.5 h-4.5 text-blue-400 flex-shrink-0" />
              <span className="truncate">New Journal Entry</span>
            </h3>
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider self-start sm:self-auto">GAAP Standard double journal</span>
          </div>

          {/* Core Info Input Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#A1A1AA] block">Transaction Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                <input
                  id="form-entry-date"
                  type="date"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0F0F10] border border-[#27272A] rounded-xl text-white focus:outline-hidden focus:border-blue-500 focus:bg-[#0F0F10] transition-all focus:ring-1 focus:ring-blue-500/20 font-mono"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-[#A1A1AA] block">System Description / Audit Narration</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                <input
                  id="form-entry-desc"
                  type="text"
                  required
                  placeholder="e.g. Cleared hardware billing invoices..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#71717A] focus:outline-hidden focus:border-blue-500 focus:bg-[#0F0F10] transition-all focus:ring-1 focus:ring-blue-500/20"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#A1A1AA] block">External Ref / Doc Number</label>
              <input
                id="form-entry-ref"
                type="text"
                placeholder="e.g. BILL-9921 / PYMT-40"
                className="w-full px-3 py-2 text-xs bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#71717A] focus:outline-hidden focus:border-blue-500 focus:bg-[#0F0F10] transition-all focus:ring-1 focus:ring-blue-500/20 font-mono"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

          </div>

          {/* Bookkeeping Account Rows lines itemizer */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#A1A1AA] block">Debit / Credit Line Allocation</span>
            
            <div className="space-y-2 border border-[#27272A] p-2.5 sm:p-3 bg-[#0F0F10] rounded-2xl block">
              {lines.map((line, idx) => (
                <div key={idx} className="space-y-2.5 py-3 border-b border-dashed border-[#27272A] last:border-none md:space-y-0 md:py-1.5 md:flex md:items-center md:gap-2.5">
                  
                  {/* Account Dropdown */}
                  <div className="flex-1 min-w-0">
                    <select
                      id={`line-account-${idx}`}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#161618] border border-[#27272A] text-white rounded-xl focus:outline-hidden focus:border-blue-500 transition-all font-semibold"
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} className="bg-[#161618]">
                          {acc.code} - {acc.name} ({acc.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Debit, Credit and Delete controls grouped side by side on mobile */}
                  <div className="flex items-center gap-2 md:w-auto">
                    {/* Debit Input */}
                    <div className="flex-1 md:w-32 relative">
                      <span className="absolute left-2.5 top-1.5 text-[10px] text-blue-400 font-bold">Dr</span>
                      <input
                        id={`line-debit-${idx}`}
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-[#161618] border border-[#27272A] rounded-xl text-right text-white focus:outline-hidden focus:border-blue-500 transition-all font-semibold font-mono text-blue-400"
                        value={line.debit || ''}
                        onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                      />
                    </div>

                    {/* Credit Input */}
                    <div className="flex-1 md:w-32 relative">
                      <span className="absolute left-2.5 top-1.5 text-[10px] text-amber-500 font-bold">Cr</span>
                      <input
                        id={`line-credit-${idx}`}
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-[#161618] border border-[#27272A] rounded-xl text-right text-white focus:outline-hidden focus:border-blue-500 transition-all font-semibold font-mono text-amber-400"
                        value={line.credit || ''}
                        onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                      />
                    </div>

                    {/* Delete Row Line */}
                    <button
                      id={`btn-remove-line-${idx}`}
                      type="button"
                      title="Remove Account Line"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 2}
                      className="cursor-pointer p-1.5 text-[#71717A] hover:text-rose-500 disabled:opacity-30 disabled:pointer-events-none transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Append Row Line Trigger */}
            <button
              id="btn-add-line"
              type="button"
              onClick={handleAddLine}
              className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 focus:outline-hidden transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Append Account Line Row
            </button>
          </div>

          {/* Validation Panel bar status */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 sm:p-4 bg-[#0F0F10] border border-[#27272A] rounded-2xl">
            <div className="grid grid-cols-2 xs:flex xs:flex-wrap gap-x-4 gap-y-3 sm:gap-5 text-xs">
              <div>
                <span className="text-[#71717A] uppercase tracking-widest text-[9px] font-extrabold block">Debits (Dr)</span>
                <span className="font-mono font-bold text-sm sm:text-base text-blue-400 inline-block">{formatCurrency(debitTotal)}</span>
              </div>
              
              <div>
                <span className="text-[#71717A] uppercase tracking-widest text-[9px] font-extrabold block">Credits (Cr)</span>
                <span className="font-mono font-bold text-sm sm:text-base text-amber-400 inline-block">{formatCurrency(creditTotal)}</span>
              </div>

              <div className="col-span-2 xs:col-span-1">
                <span className="text-[#71717A] uppercase tracking-widest text-[9px] font-extrabold block">Trial discrepancy</span>
                <span className={`font-mono font-bold text-sm sm:text-base block ${difference === 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                  {formatCurrency(difference)}
                </span>
              </div>
            </div>

            {/* Posting actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {isValid ? (
                <div className="flex sm:hidden lg:flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-xl font-semibold">
                  <Check className="w-4 h-4 text-emerald-400" /> Balanced
                </div>
              ) : (
                <div className="flex sm:hidden lg:flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-450" /> Out of Balance
                </div>
              )}

              <button
                id="btn-post-journal"
                type="submit"
                disabled={!isValid}
                className="cursor-pointer bg-blue-600 border border-blue-500/20 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-xl disabled:opacity-45 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5 select-none w-full sm:w-auto"
              >
                <BookmarkCheck className="w-4 h-4" />
                Commit Posting
              </button>
            </div>
          </div>

        </form>
      )}

      {/* Advanced Filter and Search Engine block (Dynamic matching) */}
      <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Quick core text search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
            <input
              id="filter-search-query"
              type="text"
              placeholder="Filter by description, reference (e.g. Acme, STRIPE, JE-0001)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#71717A] focus:outline-hidden focus:border-blue-500 focus:bg-[#0F0F10] transition-all focus:ring-1 focus:ring-blue-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#27272A] border border-[#3F3F46] rounded-xl text-[#A1A1AA]">
              <Filter className="w-4 h-4" />
            </span>
            <button
              id="btn-clear-filters"
              onClick={clearFilters}
              className="cursor-pointer text-[11px] font-bold text-[#A1A1AA] hover:text-white border-b border-[#3F3F46] hover:border-white pb-0.5 focus:outline-hidden"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Collapsible filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1 border-t border-[#27272A]">
          
          {/* Account selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">Affects Account</label>
            <select
              id="filter-affected-account"
              className="w-full px-2.5 py-1.5 text-[11px] bg-[#0F0F10] border border-[#27272A] text-white rounded-xl focus:outline-hidden focus:bg-[#0F0F10] font-semibold"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
            >
              <option value="" className="bg-[#161618]">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-[#161618]">
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">Start Date</label>
            <input
              id="filter-start-date"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-2.5 py-1 text-[11px] bg-[#0F0F10] border border-[#27272A] text-white rounded-xl focus:outline-hidden focus:bg-[#0F0F10] font-mono"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">End Date</label>
            <input
              id="filter-end-date"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-2.5 py-1 text-[11px] bg-[#0F0F10] border border-[#27272A] text-white rounded-xl focus:outline-hidden focus:bg-[#0F0F10] font-mono"
            />
          </div>

          {/* Min Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">Min Sum ($)</label>
            <input
              id="filter-min-amount"
              type="number"
              placeholder="e.g. 5000"
              value={filterMinAmount}
              onChange={(e) => setFilterMinAmount(e.target.value)}
              className="w-full px-2.5 py-1 text-[11px] bg-[#0F0F10] border border-[#27272A] text-white rounded-xl focus:outline-hidden focus:bg-[#0F0F10] font-semibold font-mono"
            />
          </div>

          {/* Max Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">Max Sum ($)</label>
            <input
              id="filter-max-amount"
              type="number"
              placeholder="e.g. 50000"
              value={filterMaxAmount}
              onChange={(e) => setFilterMaxAmount(e.target.value)}
              className="w-full px-2.5 py-1 text-[11px] bg-[#0F0F10] border border-[#27272A] text-white rounded-xl focus:outline-hidden focus:bg-[#0F0F10] font-semibold font-mono"
            />
          </div>

        </div>

      </div>

      {/* Main Filtered Journal ledger Entries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#71717A] uppercase tracking-widest block">
            Committed Records Ledger ({filteredEntries.length} entries matching)
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center bg-[#161618] border border-[#27272A] rounded-2xl">
            <p className="text-[#71717A] text-xs">No transaction records match the specified filters.</p>
            <button 
              onClick={clearFilters}
              className="mt-3 text-xs bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] font-bold px-3 py-1.5 rounded-lg transition-all border border-[#3F3F46]"
            >
              Clear Filtering Filters
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredEntries.map(entry => {
              const entryDebitTotal = entry.lines.reduce((val, line) => val + (line.debit || 0), 0);
              return (
                <div key={entry.id} className="bg-[#161618] border border-[#27272A] rounded-2xl overflow-hidden shadow-xs hover:border-[#3F3F46] transition-all">
                  
                  {/* Ledger Header */}
                  <div className="bg-[#1C1C1E] border-b border-[#27272A] px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 min-w-0">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono text-xs font-extrabold text-white bg-[#27272A] border border-[#3F3F46] px-2 py-0.5 rounded-md shadow-2xs flex-shrink-0">
                          {entry.id}
                        </span>
                        <span className="font-mono text-[11px] text-[#A1A1AA] font-semibold flex-shrink-0">{entry.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#E4E4E7] truncate max-w-[220px] sm:max-w-none">{entry.description}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      {entry.reference && (
                        <span className="text-[10px] font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md block">
                          Ref: {entry.reference}
                        </span>
                      )}

                      {/* We only allow deletion of non-preseeded demo codes to prevent breaking initial accounts ratios */}
                      <button
                        id={`btn-delete-entry-${entry.id}`}
                        onClick={() => onDeleteEntry(entry.id)}
                        title="Void Posting"
                        className="cursor-pointer p-1.5 text-[#71717A] hover:text-rose-450 transition-all rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Ledger lines table breakdown */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[300px]">
                      <thead>
                        <tr className="bg-[#1C1C1E] border-b border-[#27272A] font-extrabold text-[#71717A] text-[10px] uppercase tracking-wider">
                          <th className="px-3 sm:px-5 py-2">General Ledger Account</th>
                          <th className="px-3 sm:px-5 py-2 text-right">Debit (Dr)</th>
                          <th className="px-3 sm:px-5 py-2 text-right">Credit (Cr)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line, lIdx) => {
                          const acc = accounts.find(a => a.id === line.accountId);
                          return (
                            <tr key={line.id || lIdx} className="hover:bg-[#1C1C1E] border-b border-[#27272A] last:border-none">
                              <td className="px-3 sm:px-5 py-2 sm:py-2.5 font-medium text-[#E4E4E7] truncate max-w-[130px] sm:max-w-none">
                                <span className="font-mono text-[#71717A] mr-1 sm:mr-2">{line.accountId}</span>
                                {acc?.name || 'Unknown Account'}
                              </td>
                              <td className="px-3 sm:px-5 py-2 sm:py-2.5 text-right font-mono font-bold text-blue-400">
                                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                              </td>
                              <td className="px-3 sm:px-5 py-2 sm:py-2.5 text-right font-mono font-bold text-amber-400">
                                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#1C1C1E] border-t border-[#27272A] font-extrabold text-[#E4E4E7]">
                          <td className="px-3 sm:px-5 py-2 font-bold">Total</td>
                          <td className="px-3 sm:px-5 py-2 text-right font-mono text-blue-400">{formatCurrency(entryDebitTotal)}</td>
                          <td className="px-3 sm:px-5 py-2 text-right font-mono text-amber-500">{formatCurrency(entryDebitTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
