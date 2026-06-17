import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Key, 
  CheckCircle, 
  RefreshCw, 
  KeyRound, 
  AlertCircle,
  Settings,
  Server,
  Eye,
  EyeOff,
  Save,
  Check
} from 'lucide-react';
import { UserSession } from '../types';

interface AuthProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // 2FA Flow states
  const [step, setStep] = useState<'credentials' | 'setup-2fa' | 'verify-2fa'>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Real OTP dynamic states
  const [emailSentReal, setEmailSentReal] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  // SMTP client configurations stored locally inside browser's local sandbox
  const [showSmtpSettings, setShowSmtpSettings] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Restore existing configurations on startup
  useEffect(() => {
    const savedSmtpStr = localStorage.getItem('accounting_smtp_config');
    if (savedSmtpStr) {
      try {
        const conf = JSON.parse(savedSmtpStr);
        if (conf.host) setSmtpHost(conf.host);
        if (conf.port) setSmtpPort(conf.port.toString());
        if (conf.user) setSmtpUser(conf.user);
        if (conf.pass) setSmtpPass(conf.pass);
        if (conf.from) setSmtpFrom(conf.from);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Generate simulated 2FA secret & call backend to transmit code to actual inbox
  const regenerateMfa = async () => {
    const targetEmail = email || 'admin@accounting.com';
    setIsLoadingOtp(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Fetch SMTP details from state or store
    let smtpCustom = null;
    const savedSmtpStr = localStorage.getItem('accounting_smtp_config');
    if (savedSmtpStr) {
      try {
        smtpCustom = JSON.parse(savedSmtpStr);
      } catch (e) {
        console.error(e);
      }
    } else if (smtpUser.trim() && smtpPass.trim()) {
      smtpCustom = {
        host: smtpHost.trim(),
        port: Number(smtpPort.trim()) || 587,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        from: smtpFrom.trim() || `"LedgerPrime Security" <${smtpUser.trim()}>`
      };
    }

    try {
      const resp = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: targetEmail,
          smtp_custom: smtpCustom
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setEmailSentReal(!!data.emailSent);
        setIsSimulated(!!data.simulated);
        setSimulatedCode(data.code || '');
        setOtpCode(''); // Keep entirely blank so the user must type the code!
        if (data.token) {
          setOtpToken(data.token);
        }
        
        if (data.emailSent) {
          setSuccessMessage(`A real single-use verification code has been dispatched to ${targetEmail}. Please check your email inbox!`);
        } else {
          setSuccessMessage('Security transmitter online. Verification challenge generated successfully.');
        }
      } else {
        setErrorMessage(data.error || 'Failed to dispatch 2-step verification code to your email.');
      }
    } catch (err: any) {
      setErrorMessage(`Failed to connect to authentication gateway server: ${err.message || 'unknown error'}`);
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpUser.trim() || !smtpPass.trim()) {
      setErrorMessage('SMTP credentials are required to save custom transmitter settings.');
      return;
    }

    const config = {
      host: smtpHost.trim() || 'smtp.gmail.com',
      port: Number(smtpPort.trim()) || 587,
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      from: smtpFrom.trim() || `"LedgerPrime Security" <${smtpUser.trim()}>`
    };

    localStorage.setItem('accounting_smtp_config', JSON.stringify(config));
    setSuccessMessage('SMTP Secure Credentials enrolled successfully. Your verification challenges will now deliver directly to your real inboxes!');
    
    // Auto collapse settings after save
    setShowSmtpSettings(false);

    // Auto-trigger send if already in configuration/interactive phase
    if (step === 'setup-2fa' || step === 'verify-2fa') {
      regenerateMfa();
    }
  };

  useEffect(() => {
    if (step === 'setup-2fa' || step === 'verify-2fa') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 16; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setMfaSecret(secret);
      regenerateMfa();
    }
  }, [step]);

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!email || !password || (isSignUp && !fullName)) {
      setErrorMessage('Please fill in all standard credentials.');
      return;
    }

    // Retrieve users database from localStorage
    const savedUsersStr = localStorage.getItem('accounting_users');
    const users = savedUsersStr ? JSON.parse(savedUsersStr) : [];

    if (isSignUp) {
      // Check if user exists
      const userExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setErrorMessage('An account with this email address already exists.');
        return;
      }

      // Create new user in state, default 2FA status
      const newUser = {
        email: email.toLowerCase(),
        password,
        name: fullName,
        twoFactorSecret: 'MFA_SECRET_XYZ_' + Math.floor(Math.random()*100000),
        twoFactorEnabled: true,
      };

      users.push(newUser);
      localStorage.setItem('accounting_users', JSON.stringify(users));

      // Successfully registered, proceed to 2FA Setup
      setStep('setup-2fa');
    } else {
      // Login attempt
      const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.password !== password) {
        setErrorMessage('Invalid e-mail or password credentials. Please register securely if you do not have an account.');
        return;
      }

      // Proceed to verification
      setStep('verify-2fa');
    }
  };

  const verifyTwoStepCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otpCode) {
      setErrorMessage('Please enter the 6-digit verification pin.');
      return;
    }

    try {
      const targetEmail = email || 'admin@accounting.com';
      const resp = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: targetEmail, code: otpCode, token: otpToken }),
      });
      const data = await resp.json();
      
      if (resp.ok && data.success) {
        // Successful authentication! Establish actual session details
        const savedUsersStr = localStorage.getItem('accounting_users');
        const users = savedUsersStr ? JSON.parse(savedUsersStr) : [];
        const activeUser = users.find((u: any) => u.email.toLowerCase() === targetEmail.toLowerCase());

        const activeUserSession: UserSession = {
          email: targetEmail.toLowerCase(),
          name: activeUser?.name || fullName || (targetEmail.toLowerCase() === 'admin@accounting.com' ? 'Lead Financial Controller' : 'Auditor User'),
          twoFactorEnabled: true,
          twoFactorSecret: mfaSecret || 'SECURE_EMAIL_AUTHENTICATED',
          isFullyAuthenticated: true,
        };
        
        // Save session
        localStorage.setItem('accounting_active_session', JSON.stringify(activeUserSession));
        onLoginSuccess(activeUserSession);
      } else {
        setErrorMessage(data.error || 'Verification failed. The OTP code is invalid or has expired. Please verify and retry.');
      }
    } catch (err: any) {
      setErrorMessage(`Verification connection failed: ${err.message || 'unknown server contact exception'}`);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage('');
    setSuccessMessage('');
    setStep('credentials');
    setEmail('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F10] p-4 font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-[#161618] rounded-2xl shadow-2xl overflow-hidden border border-[#27272A] transition-all duration-300">
        
        {/* Top Branding Section */}
        <div className="bg-[#1C1C1E] border-b border-[#27272A] px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-blue-900/20 via-transparent to-transparent opacity-80" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-3 backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">LedgerPrime HQ</h1>
            <p className="text-[#A1A1AA] text-xs mt-1">Enterprise-Grade Double-Entry Bookkeeping Suite</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          
          {/* Messages */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-400 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Step 1: Input Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white">
                  {isSignUp ? 'Establish Firm Ledger' : 'Identity Verification'}
                </h2>
                <p className="text-xs text-[#71717A] mt-1">
                  {isSignUp 
                    ? 'Register your financial audit account securely' 
                    : 'Provide authorization parameters to unlock accounts'}
                </p>
              </div>

              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#A1A1AA] tracking-wide block">Auditor Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4.5 w-4.5 text-[#71717A]" />
                    <input
                      id="input-fullname"
                      type="text"
                      className="w-full pl-10 pr-4 py-2 text-sm bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#71717A] focus:outline-hidden focus:border-blue-500 transition-all focus:ring-1 focus:ring-blue-500/20"
                      placeholder="e.g. Bro Al-Kamil"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A1A1AA] tracking-wide block">Auditor Corporate E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-[#71717A]" />
                  <input
                    id="input-email"
                    type="email"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#71717A] focus:outline-hidden focus:border-blue-500 transition-all focus:ring-1 focus:ring-blue-500/20"
                    placeholder="e.g. auditor@ledgerprime.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A1A1AA] tracking-wide block">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-[#71717A]" />
                  <input
                    id="input-password"
                    type="password"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#71717A] focus:outline-hidden focus:border-blue-500 transition-all focus:ring-1 focus:ring-blue-500/20"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-credential-submit"
                  type="submit"
                  className="w-full cursor-pointer bg-blue-600 border border-blue-500/20 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-white/80" />
                  {isSignUp ? 'Proceed to 2-Step Setup' : 'Initiate Verification'}
                </button>
              </div>

              <div className="text-center pt-3 text-xs text-[#71717A]">
                {isSignUp ? 'Already own an account?' : 'First time establishing logs?'}
                <button
                  id="btn-switch-auth-mode"
                  type="button"
                  onClick={switchMode}
                  className="text-blue-400 font-semibold hover:underline ml-1 focus:outline-hidden"
                >
                  {isSignUp ? 'Login Securely' : 'Register Securely'}
                </button>
              </div>


            </form>
          )}

          {/* Form Step 2: 2-Step Verification SETUP */}
          {step === 'setup-2fa' && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-block px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold tracking-wide uppercase">Setup Protocol Required</span>
                <h2 className="text-lg font-bold text-white mt-2">Enhanced 2-Step Security</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  We secure financial records with multi-factor authentication (MFA) protocols.
                </p>
              </div>

              {/* Dispatch Security Graphic (Beautiful premium mail layout) */}
              <div className="p-6 bg-[#0F0F10] rounded-xl border border-[#27272A] flex flex-col items-center gap-3 text-center">
                <div className="relative w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 shadow-md">
                  <Mail className="w-8 h-8 text-blue-400 shrink-0" />
                  <div className="absolute -top-1 -right-1 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full p-1 text-[9px] font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Enroll Secure Ledger Access</p>
                  <p className="text-[11px] text-[#71717A] max-w-xs mt-1">
                    To authorize your new ledger profile, verify the challenge code sent directly to your email inbox.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex gap-2 text-[#E4E4E7] text-xs">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-blue-400" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <span className="font-bold block text-blue-400">Security OTP Transmitter</span>
                    
                    {isLoadingOtp ? (
                      <p className="text-xs text-[#A1A1AA] flex items-center gap-2 py-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        Transmitting secure verification challenge to your email inbox...
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#A1A1AA] leading-normal font-normal">
                        A secure 6-digit confirmation PIN has been dispatched to your email address: <span className="text-white font-bold break-all">{email || 'admin@accounting.com'}</span>. Please open your inbox (also check spam folder if necessary) to retrieve your code.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 border-t border-blue-500/15">
                      <button 
                        onClick={regenerateMfa}
                        disabled={isLoadingOtp}
                        type="button"
                        title="Resend verification code"
                        className="inline-flex items-center text-blue-300 hover:text-blue-200 font-bold hover:underline cursor-pointer disabled:opacity-50 text-[11px]"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingOtp ? 'animate-spin' : ''}`} /> Resend Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={verifyTwoStepCode} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#A1A1AA] block text-center">Enter 6-Digit Code</label>
                  <input
                    id="input-setup-otp"
                    type="text"
                    maxLength={6}
                    className="w-full text-center tracking-widest font-mono font-bold text-xl py-2.5 bg-[#0F0F10] border border-[#27272A] rounded-xl text-white focus:outline-hidden focus:border-blue-500 focus:bg-[#0F0F10] focus:ring-2 focus:ring-blue-500/20"
                    placeholder="______"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <button
                  id="btn-verification-setup-confirm"
                  type="submit"
                  className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4.5 h-4.5 text-white" />
                  Authorize & Enroll Database
                </button>
              </form>
            </div>
          )}

          {/* Form Step 3: 2-Step LOG IN Verification Challenge */}
          {step === 'verify-2fa' && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-block px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold tracking-wide uppercase">2-Step Challenge</span>
                <h2 className="text-lg font-bold text-white mt-2">Enter verification Code</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Please supply the secure login verification PIN sent to your corporate address.
                </p>
              </div>

              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex gap-2 text-white text-xs leading-relaxed font-semibold">
                  <Key className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <span className="font-bold text-blue-400 block">Security OTP Transmitter</span>
                    
                    {isLoadingOtp ? (
                      <p className="text-xs text-[#A1A1AA] flex items-center gap-2 py-1 font-normal">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        Transmitting secure verification challenge to your email inbox...
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#A1A1AA] leading-normal font-normal">
                        We sent a secure 6-digit confirmation PIN to your email address: <span className="text-white font-bold break-all">{email || 'admin@accounting.com'}</span>. Open your inbox and specify the code below to grant access.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 border-t border-blue-500/15">
                      <button 
                        onClick={regenerateMfa}
                        disabled={isLoadingOtp}
                        type="button"
                        title="Resend Verification Code"
                        className="inline-flex items-center text-blue-300 hover:text-blue-200 font-bold hover:underline cursor-pointer text-[11px] disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 text-blue-300 mr-1 ${isLoadingOtp ? 'animate-spin' : ''}`} /> Resend Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={verifyTwoStepCode} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#A1A1AA] block text-center">6-Digit Verification PIN</label>
                  <input
                    id="input-challenge-otp"
                    type="text"
                    maxLength={6}
                    className="w-full text-center tracking-widest font-mono font-bold text-xl py-3 bg-[#0F0F10] border border-[#27272A] rounded-xl text-white focus:outline-hidden focus:border-blue-500 focus:bg-[#0F0F10] focus:ring-1 focus:ring-blue-500/20"
                    placeholder="______"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    id="btn-challenge-back"
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setOtpCode('');
                    }}
                    className="w-1/3 cursor-pointer bg-[#27272A] border border-[#3F3F46] text-[#E4E4E7] font-medium text-xs rounded-xl py-2.5 hover:bg-[#3F3F46] transition-all"
                  >
                    Back to password
                  </button>
                  <button
                    id="btn-challenge-verify"
                    type="submit"
                    className="w-2/3 cursor-pointer bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4.5 h-4.5 text-white" />
                    Verify & Access Suite
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Visual Real Email SMTP Service configurator gating */}
        <div className="border-t border-[#27272A] bg-[#1C1C1E] px-6 py-4">
          <button
            id="btn-toggle-smtp-panel"
            type="button"
            onClick={() => setShowSmtpSettings(!showSmtpSettings)}
            className="w-full flex items-center justify-between text-[#A1A1AA] hover:text-white transition-all text-xs font-semibold py-1 focus:outline-hidden"
          >
            <span className="flex items-center gap-2">
              <Settings className={`w-4 h-4 text-blue-400 ${showSmtpSettings ? 'animate-spin' : ''}`} />
              🔧 Webmail SMTP Service Configuration
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
              {showSmtpSettings ? 'Collapse' : 'Expand Setup'}
            </span>
          </button>

          {showSmtpSettings && (
            <div className="mt-4 pt-3 border-t border-[#27272A]/80 space-y-3.5 text-xs text-[#A1A1AA]">
              <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 leading-relaxed font-sans text-[11px] text-[#A1A1AA]">
                ℹ️ <strong className="text-white font-semibold">Self-Hosted SMTP Delivery Mode:</strong> Since you are in Google AI Studio testing, you can input your private SMTP credentials below. Real emails will be transmitted instantly. <br/>
                <span className="text-amber-400/90 font-semibold">Tip: For Gmail, use an "App Password" from your Google security console instead of your master password.</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#A1A1AA] block">SMTP Server Host</label>
                <div className="relative">
                  <Server className="absolute left-3 top-2 h-4 w-4 text-[#71717A]" />
                  <input
                    id="smtp-host"
                    type="text"
                    className="w-full pl-9 pr-3 py-1.5 bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#52525B] text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#A1A1AA] block">Port (Default 587)</label>
                  <input
                    id="smtp-port"
                    type="text"
                    className="w-full px-3 py-1.5 bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#52525B] text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#A1A1AA] block">Sender Name (Optional)</label>
                  <input
                    id="smtp-from-name"
                    type="text"
                    className="w-full px-3 py-1.5 bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#52525B] text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder='"LedgerPrime" <no-reply@...>'
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#A1A1AA] block">SMTP Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2 h-4 w-4 text-[#71717A]" />
                  <input
                    id="smtp-user"
                    type="email"
                    className="w-full pl-9 pr-3 py-1.5 bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#52525B] text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder="your-email@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#A1A1AA] block">SMTP App Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2 h-4 w-4 text-[#71717A]" />
                  <input
                    id="smtp-pass"
                    type={showSmtpPassword ? 'text' : 'password'}
                    className="w-full pl-9 pr-10 py-1.5 bg-[#0F0F10] border border-[#27272A] rounded-xl text-white placeholder-[#52525B] text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                  <button
                    id="btn-toggle-smtp-password-visibility"
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-3 top-1.5 text-[#71717A] hover:text-white transition-all focus:outline-hidden"
                  >
                    {showSmtpPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-save-smtp-config"
                type="button"
                onClick={handleSaveSmtp}
                className="w-full cursor-pointer bg-blue-600/90 text-white font-semibold text-[11px] py-2 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" /> Enroll SMTP Credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
