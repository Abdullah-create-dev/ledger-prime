import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  PlusCircle, 
  BookOpen, 
  FileText, 
  LogOut, 
  Lock, 
  Menu, 
  X, 
  ShieldCheck, 
  User,
  Scale
} from 'lucide-react';
import { Account, JournalEntry, UserSession, INITIAL_ACCOUNTS, INITIAL_JOURNAL_ENTRIES } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import JournalEntries from './components/JournalEntries';
import GeneralLedger from './components/GeneralLedger';
import FinancialStatements from './components/FinancialStatements';

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Accounting Ledger States
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab ] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize session and journal database from localStorage
  useEffect(() => {
    // 1. Session check
    const savedSessionStr = localStorage.getItem('accounting_active_session');
    if (savedSessionStr) {
      const parsedSession = JSON.parse(savedSessionStr);
      if (parsedSession && parsedSession.isFullyAuthenticated) {
        setSession(parsedSession);
      }
    }

    // 2. Fetch or seed Journal database
    const savedEntriesStr = localStorage.getItem('accounting_journal_db');
    if (savedEntriesStr) {
      setEntries(JSON.parse(savedEntriesStr));
    } else {
      // Seed initial double-entry sample books
      setEntries(INITIAL_JOURNAL_ENTRIES);
      localStorage.setItem('accounting_journal_db', JSON.stringify(INITIAL_JOURNAL_ENTRIES));
    }

    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    localStorage.removeItem('accounting_active_session');
    setSession(null);
    setActiveTab('dashboard');
  };

  // Add customized journal entry
  const handleAddEntry = (entry: JournalEntry) => {
    const nextEntries = [entry, ...entries];
    setEntries(nextEntries);
    localStorage.setItem('accounting_journal_db', JSON.stringify(nextEntries));
  };

  // Remove / Void a journal entry
  const handleDeleteEntry = (id: string) => {
    const confirmation = window.confirm(`Are you absolutely sure you want to void and delete journal posting ${id}? This action permanently reverses all associated ledger totals.`);
    if (!confirmation) return;

    const nextEntries = entries.filter(e => e.id !== id);
    setEntries(nextEntries);
    localStorage.setItem('accounting_journal_db', JSON.stringify(nextEntries));
  };

  // Custom tab switcher layout triggers
  const triggerNavigation = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // close responsiveness drawer
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] text-[#E4E4E7] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#27272A] border-t-blue-600 animate-spin" />
          <span className="text-[#71717A] text-xs font-semibold tracking-wider">Accessing Ledger Suite...</span>
        </div>
      </div>
    );
  }

  // Underneath, if no valid session is present, show Auth forms
  if (!session) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#E4E4E7] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Upper header section on layout */}
      <header className="bg-[#161618] border-b border-[#27272A] px-5 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs lg:px-8">
        <div className="flex items-center gap-3">
          {/* Menu triggers for responsive side lists */}
          <button
            id="btn-sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 focus:outline-hidden hover:bg-[#27272A] rounded-lg lg:hidden"
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight leading-none text-white">LedgerPrime HQ</h1>
              <span className="text-[10px] text-[#71717A] font-medium">Global Audit Ledger Pro</span>
            </div>
          </div>
        </div>

        {/* User profile with simple logout actions */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#27272A] border border-[#3F3F46] rounded-xl">
            <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />
            <span className="text-[#E4E4E7]">{session.name}</span>
          </div>

          <button
            id="btn-user-logout"
            onClick={handleLogout}
            title="Secure termination of console session"
            className="cursor-pointer bg-[#27272A] border border-[#3F3F46] text-slate-300 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-[#71717A]" />
            <span className="hidden md:inline font-medium">Logout Securely</span>
          </button>
        </div>
      </header>

      {/* Primary Layout Chassis split */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Navigation Sidebar Drawer (Handles desktop and mobile overlays) */}
        <aside className={`
          fixed lg:sticky top-[69px] left-0 h-[calc(100vh-69px)] w-64 bg-[#161618] border-r border-[#27272A] text-[#E4E4E7] z-30 transition-transform duration-300 
          lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-4 py-6 flex flex-col justify-between h-full">
            
            {/* Nav list groups */}
            <nav className="space-y-1.5">
              
              <button
                id="sidebar-nav-dashboard"
                onClick={() => triggerNavigation('dashboard')}
                className={`w-full cursor-pointer px-4.5 py-3 rounded-xl flex items-center gap-3.5 text-xs font-bold transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-[#A1A1AA] hover:bg-[#27272A] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                Ledger Dashboard
              </button>

              <button
                id="sidebar-nav-journal"
                onClick={() => triggerNavigation('journal')}
                className={`w-full cursor-pointer px-4.5 py-3 rounded-xl flex items-center gap-3.5 text-xs font-bold transition-all ${
                  activeTab === 'journal' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-[#A1A1AA] hover:bg-[#27272A] hover:text-white'
                }`}
              >
                <PlusCircle className="w-4.5 h-4.5 shrink-0" />
                Double Entry Postings
              </button>

              <button
                id="sidebar-nav-ledger"
                onClick={() => triggerNavigation('ledger')}
                className={`w-full cursor-pointer px-4.5 py-3 rounded-xl flex items-center gap-3.5 text-xs font-bold transition-all ${
                  activeTab === 'ledger' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-[#A1A1AA] hover:bg-[#27272A] hover:text-white'
                }`}
              >
                <BookOpen className="w-4.5 h-4.5 shrink-0" />
                Category Ledgers
              </button>

              <button
                id="sidebar-nav-reports"
                onClick={() => triggerNavigation('reports')}
                className={`w-full cursor-pointer px-4.5 py-3 rounded-xl flex items-center gap-3.5 text-xs font-bold transition-all ${
                  activeTab === 'reports' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-[#A1A1AA] hover:bg-[#27272A] hover:text-white'
                }`}
              >
                <FileText className="w-4.5 h-4.5 shrink-0" />
                P/L & Balance Statements
              </button>

            </nav>

            {/* Bottom section in nav side list */}
            <div className="space-y-4">
              
              {/* Security Shield Lock summary bar */}
              <div className="p-3.5 bg-[#0F0F10] border border-[#27272A] rounded-xl space-y-2 text-[10px]">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>MFA Shield Verification</span>
                </div>
                <p className="text-[#71717A] leading-relaxed font-semibold">
                  Continuous session verification secures account databases against physical or remote leaks.
                </p>
              </div>

              {/* Dev Info disclaimer */}
              <div className="px-4.5 text-[10px] text-[#71717A] font-mono tracking-tight text-center">
                <span>SYSTEM VERSION 2.6.0-PRO</span>
              </div>
            </div>

          </div>
        </aside>

        {/* Sidebar backdrop modal selector on responsive displays */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-[69px] bg-black/50 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* Primary workspace layout container panel */}
        <main className="flex-1 overflow-x-hidden p-6 md:p-8 relative">
          
          {/* Active Tab rendering switchboard */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              accounts={accounts} 
              entries={entries} 
              session={session} 
              onNavigate={triggerNavigation} 
            />
          )}

          {activeTab === 'journal' && (
            <JournalEntries 
              accounts={accounts} 
              entries={entries} 
              onAddEntry={handleAddEntry} 
              onDeleteEntry={handleDeleteEntry}
            />
          )}

          {activeTab === 'ledger' && (
            <GeneralLedger 
              accounts={accounts} 
              entries={entries} 
            />
          )}

          {activeTab === 'reports' && (
            <FinancialStatements 
              accounts={accounts} 
              entries={entries} 
            />
          )}

        </main>

      </div>
    </div>
  );
}
