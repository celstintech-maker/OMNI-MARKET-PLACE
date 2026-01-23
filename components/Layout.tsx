
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Icons } from '../constants';
import { SiteConfig } from '../App';

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
  config: SiteConfig;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, user, onLogout, onNavigate, currentView, theme, onToggleTheme, cartCount, onOpenCart, config 
}) => {
  const [footerExpanded, setFooterExpanded] = useState(false);

  const navItems = [
    { label: 'Marketplace', view: 'home', icon: <Icons.Home /> },
    { label: 'About', view: 'about', icon: <Icons.Admin /> },
    { label: 'Services', view: 'services', icon: <Icons.Plus /> },
  ];

  if (user?.role === UserRole.SELLER) {
    navItems.push({ label: 'Dashboard', view: 'seller-dashboard', icon: <Icons.Admin /> });
  } else if (user?.role === UserRole.ADMIN) {
    navItems.push({ label: 'Control Center', view: 'admin-dashboard', icon: <Icons.Admin /> });
  } else if (user?.role === UserRole.BUYER) {
    navItems.push({ label: 'My Portal', view: 'buyer-dashboard', icon: <Icons.Home /> });
  } else if ([UserRole.STAFF, UserRole.MARKETER, UserRole.TEAM_MEMBER, UserRole.TECHNICAL].includes(user?.role || '' as any)) {
    navItems.push({ label: 'Staff Hub', view: 'staff-dashboard', icon: <Icons.Admin /> });
  }

  const handleNavClick = (view: string) => {
    onNavigate(view);
    window.location.hash = `#/${view}`;
    setFooterExpanded(false);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 sticky top-0 z-[100] transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div 
              onClick={() => { onNavigate('home'); window.location.hash = '#/home'; }} 
              className="flex items-center gap-2 cursor-pointer shrink-0"
            >
              <h1 className="text-xl sm:text-3xl font-black text-indigo-600 dark:text-white tracking-tighter uppercase leading-none">
                {config.siteName}
              </h1>
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar mask-linear-fade">
              {navItems.map((item) => (
                <button 
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-[9px] sm:text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${currentView === item.view ? 'text-indigo-600 bg-indigo-50 dark:bg-slate-800 dark:text-indigo-400' : 'text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 sm:p-3 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-all"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={onOpenCart} className="relative p-2 sm:p-3 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 transition-all">
              <Icons.Store />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">{cartCount}</span>
              )}
            </button>
            {user ? (
              <button onClick={onLogout} className="p-2 sm:p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"><Icons.Logout /></button>
            ) : (
              <button onClick={() => { onNavigate('auth'); window.location.hash = '#/auth'; }} className="bg-indigo-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition">Sign In</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full pb-32">
        {children}
      </main>

      {/* Slide-Up Footer Drawer */}
      <footer className={`fixed bottom-0 left-0 right-0 z-[110] bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 transition-all duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${footerExpanded ? 'max-h-[85vh] overflow-y-auto' : 'max-h-16 overflow-hidden'}`}>
        <button 
          onClick={() => setFooterExpanded(!footerExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <span className="text-indigo-600 dark:text-white font-black text-[10px] uppercase tracking-[0.3em]">Network Info</span>
            {!footerExpanded && (
              <p className="hidden md:block text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-xs">
                © {new Date().getFullYear()} {config.siteName} Infrastructure
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-white">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
               {footerExpanded ? 'Close' : 'Expand'}
             </span>
             <svg className={`w-5 h-5 transition-transform duration-500 ${footerExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
             </svg>
          </div>
        </button>

        <div className={`p-8 sm:p-12 transition-opacity duration-300 ${footerExpanded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5 space-y-6 text-center md:text-left">
              <h2 className="text-3xl font-black text-indigo-600 dark:text-white tracking-tighter uppercase leading-none">{config.siteName}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium mx-auto md:mx-0 max-w-sm">
                {config.footerText}
              </p>
            </div>
            
            <div className="md:col-span-3 space-y-4 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Marketplace</h4>
              <ul className="space-y-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                <li><button onClick={() => handleNavClick('home')} className="hover:text-indigo-600 dark:hover:text-white">Browse Assets</button></li>
                <li><button onClick={() => handleNavClick('about')} className="hover:text-indigo-600 dark:hover:text-white">About Us</button></li>
                <li><button onClick={() => handleNavClick('services')} className="hover:text-indigo-600 dark:hover:text-white">Services</button></li>
                <li><button onClick={() => handleNavClick('privacy')} className="hover:text-indigo-600 dark:hover:text-white">Legal Protocol</button></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-6 bg-gray-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Global Support</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-900 dark:text-white">
                <li className="flex items-center gap-3"><span className="text-indigo-500">📧</span> <span className="text-xs break-all">{config.contactEmail}</span></li>
                <li className="flex items-center gap-3"><span className="text-indigo-500">📞</span> <span className="text-xs">{config.contactPhone}</span></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800 text-center">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">
                © {new Date().getFullYear()} {config.siteName}. All Rights Reserved.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
