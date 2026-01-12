
import React, { useState, useEffect } from 'react';
import { UserRole, Store } from '../types';

interface AuthViewProps {
  stores: Store[];
  onLogin: (email: string, role: UserRole, storeName?: string, registeredUnderSellerId?: string) => void;
  initialIsRegister?: boolean;
  initialRole?: UserRole;
}

export const AuthView: React.FC<AuthViewProps> = ({ stores, onLogin, initialIsRegister = false, initialRole = UserRole.BUYER }) => {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [selectedSellerId, setSelectedSellerId] = useState('');

  // Synchronize internal state with props when they change (e.g. clicking "Become a Seller" after having visited the login page)
  useEffect(() => {
    setIsRegister(initialIsRegister);
    setRole(initialRole);
  }, [initialIsRegister, initialRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, role, role === UserRole.SELLER ? storeName : undefined, role === UserRole.BUYER ? selectedSellerId : undefined);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 transition-colors">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      <p className="text-gray-500 dark:text-slate-400 mb-8">{isRegister ? 'Start your journey with Omni.' : 'Sign in to manage your orders or store.'}</p>
      
      <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-8">
        <button 
          onClick={() => setIsRegister(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${!isRegister ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-500'}`}
        >
          Login
        </button>
        <button 
          onClick={() => setIsRegister(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${isRegister ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-slate-500'}`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setRole(UserRole.BUYER)}
                className={`p-3 border-2 rounded-xl text-xs font-bold transition ${role === UserRole.BUYER ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-500'}`}
              >
                Buy Products
              </button>
              <button 
                type="button" 
                onClick={() => setRole(UserRole.SELLER)}
                className={`p-3 border-2 rounded-xl text-xs font-bold transition ${role === UserRole.SELLER ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-500'}`}
              >
                Sell Products
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Email Address</label>
          <input 
            type="email" 
            required 
            className="w-full border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl p-3 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition" 
            placeholder="john@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {isRegister && role === UserRole.BUYER && (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Select Favorite Seller</label>
            <select 
              required
              className="w-full border-2 border-gray-100 dark:border-slate-700 rounded-xl p-3 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition bg-white dark:bg-slate-800 dark:text-white"
              value={selectedSellerId}
              onChange={e => setSelectedSellerId(e.target.value)}
            >
              <option value="">Select a seller...</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {isRegister && role === UserRole.SELLER && (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Store Name</label>
            <input 
              type="text" 
              required 
              className="w-full border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl p-3 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition" 
              placeholder="Cool Gadgets Shop"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
            />
          </div>
        )}

        <button 
          type="submit" 
          className="w-full bg-indigo-600 dark:bg-indigo-500 text-white font-bold py-4 rounded-xl mt-4 hover:bg-indigo-700 dark:hover:bg-indigo-400 transition shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          {isRegister ? 'Create Account' : 'Sign In'}
        </button>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
          <p className="text-[10px] text-center text-gray-400 dark:text-slate-500 mb-3 uppercase font-bold tracking-widest">Quick Access</p>
          <div className="flex flex-wrap gap-2 justify-center">
             <button 
               type="button" 
               onClick={() => onLogin('admin@omni.com', UserRole.ADMIN)} 
               className="text-[10px] px-4 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 font-bold border border-transparent dark:border-slate-700 transition"
             >
               Admin
             </button>
             <button 
               type="button" 
               onClick={() => onLogin('seller@tech.com', UserRole.SELLER, 'TechHub')} 
               className="text-[10px] px-4 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 font-bold border border-transparent dark:border-slate-700 transition"
             >
               Seller (TechHub)
             </button>
          </div>
        </div>
      </form>
    </div>
  );
};
