
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  }

  const handleNavClick = (view: string) => {
    onNavigate(view);
    window.location.hash = `#/${view}`;
    setMobileMenuOpen(false);
    setFooterExpanded(false);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 sticky top-0 z-[100] transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-indigo-600 active:scale-90 transition-transform"
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <div 
              onClick={() => { onNavigate('home'); window.location.hash = '#/home'; setMobileMenuOpen(false); }} 
              className="flex items-center gap-2 cursor-pointer"
            >
              <h1 className="text-xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter uppercase leading-none">
                {config.siteName}
              </h1>
            </div>
            <nav className="hidden lg:flex space-x-1 ml-4">
              {navItems.map((item) => (
                <button 
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${currentView === item.view ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 hover:text-indigo-600'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <button onClick={onToggleTheme} className="p-2 sm:p-3 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={onOpenCart} className="relative p-2 sm:p-3 rounded-xl bg-indigo-50 dark:bg-slate-800/50 text-indigo-600 hover:bg-indigo-100 transition-all">
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

      <div className={`fixed inset-0 z-[150] lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <aside className={`absolute top-0 left-0 h-full w-[80%] max-w-xs bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b dark:border-slate-800">
            <h2 className="text-xl font-black text-indigo-600 tracking-tighter uppercase">Omni Menu</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <button 
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${currentView === item.view ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>

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
            <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">Network Info Node</span>
            {!footerExpanded && (
              <p className="hidden md:block text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-xs">
                © {new Date().getFullYear()} {config.siteName} Infrastructure
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-indigo-600">
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
              <h2 className="text-3xl font-black text-indigo-600 tracking-tighter uppercase leading-none">{config.siteName}</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed font-medium mx-auto md:mx-0 max-w-sm">
                {config.footerText}
              </p>
            </div>
            
            <div className="md:col-span-3 space-y-4 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Marketplace</h4>
              <ul className="space-y-4 text-xs font-bold text-gray-600 dark:text-slate-300">
                <li><button onClick={() => handleNavClick('home')} className="hover:text-indigo-600">Browse Assets</button></li>
                <li><button onClick={() => handleNavClick('about')} className="hover:text-indigo-600">About Us</button></li>
                <li><button onClick={() => handleNavClick('services')} className="hover:text-indigo-600">Services</button></li>
                <li><button onClick={() => handleNavClick('privacy')} className="hover:text-indigo-600">Legal Protocol</button></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-6 bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Global Support</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-900 dark:text-white">
                <li className="flex items-center gap-3"><span className="text-indigo-500">📧</span> <span className="text-xs break-all">{config.contactEmail}</span></li>
                <li className="flex items-center gap-3"><span className="text-indigo-500">📞</span> <span className="text-xs">{config.contactPhone}</span></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t dark:border-slate-800 text-center">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">
                © {new Date().getFullYear()} {config.siteName}. All Rights Reserved.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
