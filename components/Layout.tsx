
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

  const navItems = [
    { label: 'Marketplace', view: 'home', icon: <Icons.Home /> },
    { label: 'Wishlist', view: 'wishlist', icon: <Icons.Home /> },
  ];

  if (user?.role === UserRole.SELLER) {
    navItems.push({ label: 'Dashboard', view: 'seller-dashboard', icon: <Icons.Admin /> });
  } else if (user?.role === UserRole.ADMIN) {
    navItems.push({ label: 'Control Center', view: 'admin-dashboard', icon: <Icons.Admin /> });
  } else if (user?.role === UserRole.BUYER) {
    navItems.push({ label: 'My Portal', view: 'buyer-dashboard', icon: <Icons.Home /> });
  }

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
            <div 
              onClick={() => { onNavigate('home'); window.location.hash = '#/home'; setMobileMenuOpen(false); }} 
              className="flex items-center gap-2 cursor-pointer"
            >
              {config.logoUrl ? (
                <img src={config.logoUrl} alt={config.siteName} className="h-8 w-auto object-contain" />
              ) : (
                <h1 className="text-xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                  {config.siteName}
                </h1>
              )}
            </div>
            <nav className="hidden lg:flex space-x-2 ml-4">
              {navItems.map((item) => (
                <button 
                  key={item.view}
                  onClick={() => { onNavigate(item.view); window.location.hash = `#/${item.view}`; }}
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
            <button onClick={onOpenCart} className="relative p-2 sm:p-3 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 hover:bg-indigo-100 transition-all">
              <Icons.Store />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">{cartCount}</span>
              )}
            </button>
            {user ? (
              <button onClick={onLogout} className="p-2 sm:p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"><Icons.Logout /></button>
            ) : (
              <button onClick={() => { onNavigate('auth'); window.location.hash = '#/auth'; }} className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition">Sign In</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full">
        {children}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-2xl font-black text-indigo-600 tracking-tighter">{config.siteName}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed font-medium">
              {config.footerText}
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 cursor-pointer transition">𝕏</div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 cursor-pointer transition">in</div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 cursor-pointer transition">fb</div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Marketplace</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-600 dark:text-slate-300">
              <li><button onClick={() => { onNavigate('home'); window.location.hash = '#/home'; }} className="hover:text-indigo-600 transition text-left">Browse Assets</button></li>
              <li><button onClick={() => { onNavigate('wishlist'); window.location.hash = '#/wishlist'; }} className="hover:text-indigo-600 transition text-left">My Wishlist</button></li>
              <li><button onClick={() => { onNavigate('auth'); window.location.hash = '#/auth'; }} className="hover:text-indigo-600 transition text-left">Vendor Entry</button></li>
              <li><button onClick={() => { onNavigate('auth'); window.location.hash = '#/auth'; }} className="hover:text-indigo-600 transition text-left">Buyer Login</button></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-600 dark:text-slate-300">
              <li><button onClick={() => window.location.hash = '#/privacy'} className="hover:text-indigo-600 transition text-left">Privacy Policy</button></li>
              <li><button onClick={() => window.location.hash = '#/terms'} className="hover:text-indigo-600 transition text-left">Terms of Service</button></li>
              <li><button onClick={() => window.location.hash = '#/sourcing'} className="hover:text-indigo-600 transition text-left">Sourcing Protocol</button></li>
              <li><button onClick={() => window.location.hash = '#/cookies'} className="hover:text-indigo-600 transition text-left">Cookie Settings</button></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Global Office</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-indigo-500">📧</span>
                <span>{config.contactEmail}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-500">📞</span>
                <span>{config.contactPhone}</span>
              </li>
              <li className="flex items-start gap-3 leading-relaxed">
                <span className="text-indigo-500">📍</span>
                <span>{config.officeAddress}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} {config.siteName}. All Rights Reserved.
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Powered by Omni Distributed Network
          </p>
        </div>
      </footer>
    </div>
  );
};
