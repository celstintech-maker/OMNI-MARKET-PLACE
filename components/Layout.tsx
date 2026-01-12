
import React from 'react';
import { UserRole, User } from '../types';
import { Icons } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentView, theme, onToggleTheme, cartCount, onOpenCart }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <h1 
              onClick={() => onNavigate('home')} 
              className="text-3xl font-black text-indigo-600 dark:text-indigo-400 cursor-pointer tracking-tighter"
            >
              OMNI
            </h1>
            <nav className="hidden lg:flex space-x-2">
              <button 
                onClick={() => onNavigate('home')}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${currentView === 'home' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 hover:text-indigo-600'}`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => onNavigate('wishlist')}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${currentView === 'wishlist' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 hover:text-indigo-600'}`}
              >
                Wishlist
              </button>
              {user?.role === UserRole.SELLER && (
                <button 
                  onClick={() => onNavigate('seller-dashboard')}
                  className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${currentView === 'seller-dashboard' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 hover:text-indigo-600'}`}
                >
                  Dashboard
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={onOpenCart}
              className="relative p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-indigo-600 hover:bg-indigo-100 transition-all"
            >
              <Icons.Store />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={onToggleTheme}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 hover:bg-indigo-50 transition-all"
            >
              {theme === 'light' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            </button>
            {user ? (
              <button 
                onClick={onLogout}
                className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
              >
                <Icons.Logout />
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('auth')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
      
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.5em]">&copy; 2025 Omni Global. Integrated Multi-Vendor Systems.</p>
        </div>
      </footer>
    </div>
  );
};
