
import React, { useState, useEffect } from 'react';
import { UserRole, Store } from '../types';

interface AuthViewProps {
  stores: Store[];
  onLogin: (email: string, role: UserRole, pin: string, storeName?: string, hint?: string, referralCode?: string) => void;
  initialIsRegister?: boolean;
  initialRole?: UserRole;
}

export const AuthView: React.FC<AuthViewProps> = ({ stores, onLogin, initialIsRegister = false, initialRole = UserRole.BUYER }) => {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [hint, setHint] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    setIsRegister(initialIsRegister);
    setRole(initialRole);
  }, [initialIsRegister, initialRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    onLogin(email, role, pin, role === UserRole.SELLER ? storeName : undefined, hint, referralCode);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 transition-all animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-200">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{isRegister ? 'Sign Up' : 'Log In'}</h2>
        <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{isRegister ? 'Join our marketplace' : 'Enter your details'}</p>
      </div>
      
      <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
        <button 
          onClick={() => setIsRegister(false)}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRegister ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-gray-400'}`}
        >
          Login
        </button>
        <button 
          onClick={() => setIsRegister(true)}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRegister ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-gray-400'}`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setRole(UserRole.BUYER)}
                className={`p-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.BUYER ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-gray-100 dark:border-slate-800 text-gray-400'}`}
              >
                Buyer
              </button>
              <button 
                type="button" 
                onClick={() => setRole(UserRole.SELLER)}
                className={`p-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.SELLER ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-gray-100 dark:border-slate-800 text-gray-400'}`}
              >
                Seller
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Email Address</label>
          <input 
            type="email" 
            required 
            className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all" 
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1 relative">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">PIN (4+ Digits)</label>
          <div className="relative">
            <input 
              type={showPin ? "text" : "password"} 
              required 
              maxLength={8}
              className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all tracking-[0.5em]" 
              placeholder="••••"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            />
            <button 
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
            >
              {showPin ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {isRegister && (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Security Hint (Optional)</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all" 
              placeholder="e.g. Pet's name"
              value={hint}
              onChange={e => setHint(e.target.value)}
            />
          </div>
        )}

        {isRegister && role === UserRole.SELLER && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Store Name</label>
              <input 
                type="text" 
                required 
                className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all" 
                placeholder="My Store"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Referral ID (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all" 
                placeholder="Enter Staff ID if recruited"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
              />
            </div>
          </>
        )}

        <button 
          type="submit" 
          className="w-full bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.3em] py-5 rounded-2xl mt-4 hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95"
        >
          {isRegister ? 'Create Account' : 'Authenticate'}
        </button>

        {!isRegister && (
          <div className="text-center pt-2">
            <button type="button" onClick={() => alert("Contact support for PIN recovery.")} className="text-[9px] font-black uppercase text-gray-400 hover:text-indigo-600 tracking-widest">Forgotten PIN?</button>
          </div>
        )}

        <div className="border-t dark:border-slate-800 pt-6">
          <p className="text-[8px] text-center text-gray-400 mb-4 uppercase font-black tracking-[0.4em]">Demo Access</p>
          <div className="flex flex-wrap gap-2 justify-center">
             <button 
               type="button" 
               onClick={() => onLogin('admin@omni.com', UserRole.ADMIN, '6561')} 
               className="text-[9px] px-4 py-2 bg-slate-900 text-white rounded-full font-black border border-transparent transition hover:scale-105"
             >
               ADMIN: 6561
             </button>
             <button 
               type="button" 
               onClick={() => onLogin('seller@tech.com', UserRole.SELLER, '0000', 'TechHub')} 
               className="text-[9px] px-4 py-2 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-full font-black border border-indigo-100 dark:border-slate-700 transition hover:scale-105"
             >
               SELLER: 0000
             </button>
          </div>
        </div>
      </form>
    </div>
  );
};
