
import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Marketplace', view: 'home', icon: <Icons.Home /> },
    { label: 'Wishlist', view: 'wishlist', icon: <Icons.Home /> },
  ];

  if (user?.role === UserRole.SELLER) {
    navItems.push({ label: 'Dashboard', view: 'seller-dashboard', icon: <Icons.Admin /> });
  } else if (user?.role === UserRole.ADMIN) {
    navItems.push({ label: 'Root Admin', view: 'admin-dashboard', icon: <Icons.Admin /> });
  }

  const handleDirectoryClick = (action: string) => {
    setMobileMenuOpen(false);
    switch (action) {
      case 'Global Feed':
        onNavigate('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'Active Stores':
        onNavigate('home');
        setTimeout(() => {
          const browseSection = document.getElementById('browse');
          browseSection?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case 'Verification Center':
        if (user?.role === UserRole.SELLER) onNavigate('seller-dashboard');
        else if (user?.role === UserRole.ADMIN) onNavigate('admin-dashboard');
        else onNavigate('auth');
        break;
      default:
        onNavigate('home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 text-indigo-600 active:scale-90 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <h1 
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} 
              className="text-xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 cursor-pointer tracking-tighter"
            >
              OMNI
            </h1>
            <nav className="hidden lg:flex space-x-2 ml-4">
              {navItems.map((item) => (
                <button 
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${currentView === item.view ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 hover:text-indigo-600'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <button 
              onClick={onToggleTheme}
              className="p-2 sm:p-3 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            <button 
              onClick={onOpenCart}
              className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 hover:bg-indigo-100 transition-all"
            >
              <Icons.Store />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white dark:border-slate-900 animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-1 sm:gap-4 pl-2 border-l dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">Session</p>
                  <p className="text-xs font-bold truncate max-w-[100px]">{user.name}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 sm:p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
                >
                  <Icons.Logout />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('auth')}
                className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Improved Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-2xl z-[100] animate-slide-up overflow-hidden">
            <div className="p-4 space-y-2">
              <p className="px-4 text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mb-3">Omni Portal Menu</p>
              {navItems.map((item) => (
                <button 
                  key={item.view}
                  onClick={() => { onNavigate(item.view); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === item.view ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-500 active:bg-gray-100 dark:active:bg-slate-800'}`}
                >
                  <span className="opacity-70 scale-90">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-gray-100 dark:bg-slate-800 my-4 mx-4"></div>
              <p className="px-4 text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mb-3">System Directory</p>
              <div className="grid grid-cols-2 gap-3 px-2 pb-4">
                <button onClick={() => handleDirectoryClick('Global Feed')} className="bg-gray-50 dark:bg-slate-800 p-5 rounded-2xl text-[9px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-tighter border dark:border-slate-700 shadow-sm">Global Feed</button>
                <button onClick={() => handleDirectoryClick('Verification Center')} className="bg-gray-50 dark:bg-slate-800 p-5 rounded-2xl text-[9px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-tighter border dark:border-slate-700 shadow-sm">Protocol</button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full">
        {children}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="col-span-1 sm:col-span-2">
            <h2 className="text-2xl font-black text-indigo-600 tracking-tighter mb-4">OMNI MARKETPLACE</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed">Verified global sourcing hub for independent multi-vendor commerce. Advanced supply chain integration.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Directory</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-600 dark:text-slate-300">
              <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleDirectoryClick('Global Feed')}>Global Feed</li>
              <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleDirectoryClick('Active Stores')}>Active Stores</li>
              <li className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleDirectoryClick('Verification Center')}>Verification Center</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-600 dark:text-slate-300">
              <li className="cursor-pointer hover:text-indigo-600 transition-colors">System Nodes</li>
              <li className="cursor-pointer hover:text-indigo-600 transition-colors">Conflict Proto</li>
              <li className="cursor-pointer hover:text-indigo-600 transition-colors">API Docs</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
