import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { ShieldCheck, Lock, ArrowRight, Loader2, KeyRound, AlertTriangle, Terminal, WifiOff } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, status, error, isDevMode, toggleDevMode } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [emailInput, setEmailInput] = useState('elena.vance@chief-internal.org');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [prodSubmitAttempted, setProdSubmitAttempted] = useState(false);

  const roleProfiles: Record<UserRole, { title: string; subtitle: string; email: string }> = {
    owner: {
      title: 'Owner',
      subtitle: 'Complete authority — All operational policies and approvals',
      email: 'elena.vance@chief-internal.org'
    },
    manager: {
      title: 'Operations Manager',
      subtitle: 'Approvals & dispatch — Cannot override system interlocks',
      email: 'marcus.brody@chief-internal.org'
    },
    worker: {
      title: 'Field Worker',
      subtitle: 'View tasks & sensors — Read-only intervention gates',
      email: 'tomas.rivera@chief-internal.org'
    },
    viewer: {
      title: 'Compliance Auditor',
      subtitle: 'Audit log & telemetry readout — Restricted actions',
      email: 'auditor@chief-internal.org'
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmailInput(roleProfiles[role].email);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdSubmitAttempted(true);
    await login(selectedRole);
  };

  const isAuthenticating = status === 'authenticating';

  return (
    <div className="min-h-screen bg-[#021209] text-emerald-50 flex flex-col justify-center items-center p-4 sm:p-6">
      
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 mb-1 shadow-lg shadow-emerald-950/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            CHIEF MOBILE
          </h1>
          <p className="text-xs text-emerald-300/60 font-mono">
            Authoritative Operational Identity &amp; Session Gateway
          </p>
        </div>

        {/* Global DEV Mode Banner or Truthful Production Notice */}
        {isDevMode ? (
          <div className="p-3.5 rounded-xl border border-amber-600 bg-amber-950/70 text-amber-200 text-xs font-mono space-y-1 shadow-lg">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>DEVELOPMENT AUTHENTICATION — NOT CHIEF AUTH</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed text-[11px]">
              Preset personas are simulated locally for interface testing. No real Chief session is created.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-rose-900/80 bg-rose-950/60 text-rose-200 text-xs font-mono space-y-1.5 shadow-lg">
            <div className="flex items-center gap-2 text-rose-300 font-bold uppercase tracking-wider text-[11px]">
              <WifiOff className="w-4 h-4 text-rose-400" />
              <span>PRODUCTION AUTHENTICATION — SERVICE NOT CONNECTED</span>
            </div>
            <p className="text-rose-200/80 leading-relaxed text-[11px]">
              The Chief Identity Service endpoint (<code className="text-rose-100">/api/v1/auth</code>) is not provisioned. Production logins cannot be fabricated client-side.
            </p>
          </div>
        )}

        {/* Login Box */}
        <div className="rounded-2xl border border-emerald-900/50 bg-[#062416]/90 p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5">
          
          {/* DEV Mode Only: Persona Presets Selection */}
          {isDevMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="text-amber-300 uppercase tracking-wider block font-semibold">
                  Simulated Test Persona:
                </label>
                <span className="text-[10px] text-amber-400/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80 font-bold">
                  DEV ONLY
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['owner', 'manager', 'worker', 'viewer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === r
                        ? 'bg-[#0e3b23] border-amber-500 text-white shadow-sm ring-1 ring-amber-500/40'
                        : 'bg-[#03150d] border-emerald-950/80 text-emerald-300/60 hover:text-emerald-100 hover:bg-[#082918]'
                    }`}
                  >
                    <span className="text-xs font-semibold block font-mono capitalize">
                      {r}
                    </span>
                    <span className="text-[10px] text-emerald-400/50 line-clamp-1">
                      {roleProfiles[r].title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-emerald-300/70 block">
                User Identity (Email)
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                disabled={!isDevMode && isAuthenticating}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03140c] border border-emerald-950 text-emerald-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300/70">
                <span>Passcode / Credential</span>
                <span className="text-emerald-400/80 text-[10px]">Masked / Sanitized</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  disabled={!isDevMode && isAuthenticating}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#03140c] border border-emerald-950 text-emerald-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <KeyRound className="w-4 h-4 text-emerald-400/50 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* In DEV mode: display selected role scope */}
            {isDevMode && (
              <div className="p-3 rounded-xl bg-[#03150d] border border-emerald-950/80 text-[11px] font-mono text-emerald-300/70 space-y-1">
                <span className="text-amber-300 font-semibold block">
                  Simulated {roleProfiles[selectedRole].title} Scope:
                </span>
                <p className="text-emerald-400/60 leading-snug">
                  {roleProfiles[selectedRole].subtitle}
                </p>
              </div>
            )}

            {/* Error display on failed attempt */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error.code || 'Authentication Failure'}</span>
                </div>
                <p className="leading-relaxed text-[11px]">{error.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className={`w-full min-h-[46px] rounded-xl font-mono font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-60 ${
                isDevMode 
                  ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-amber-950/40' 
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-950/40'
              }`}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Session Authority...</span>
                </>
              ) : isDevMode ? (
                <>
                  <span>Simulate Sign-In as {roleProfiles[selectedRole].title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick DEV mode toggle link for local testing */}
          <div className="pt-2 border-t border-emerald-950/80 flex items-center justify-between text-[11px] font-mono text-emerald-400/60">
            <span>Runtime Environment:</span>
            <button
              type="button"
              onClick={toggleDevMode}
              className="text-emerald-400 hover:underline flex items-center gap-1 text-[10px]"
              title="Toggle DEV mode for local testing"
            >
              Mode: <strong className={isDevMode ? 'text-amber-400 font-bold' : 'text-emerald-300'}>{isDevMode ? 'DEV (SIMULATED)' : 'PRODUCTION'}</strong>
              <span className="text-slate-500">(click to toggle)</span>
            </button>
          </div>
        </div>

        {/* Security Policy Footer Note */}
        <div className="text-center text-[11px] font-mono text-emerald-400/60 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400">
            <Lock className="w-3 h-3" />
            <span>Chief Security Policy: Zero Plaintext Credential Storage</span>
          </div>
          <p>
            {isDevMode 
              ? 'Local development testing active. In production, authentications require signed tokens from Chief.'
              : 'Production gateway fail-closed. Real Chief identity verification is mandatory.'
            }
          </p>
        </div>

      </div>
    </div>
  );
};
