import React, { useState, useEffect, useMemo } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product, Store, User, CartItem } from '../types';
import { CATEGORIES } from '../constants';
import { SiteConfig } from '../App';

interface MarketplaceHomeProps {
  config: SiteConfig;
  products: Product[];
  stores: Store[];
  onNavigateToStore: (storeName: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  isLoggedIn: boolean;
  currentUser: User | null;
  onAddToCart?: (item: CartItem) => void;
  onBecomeSeller?: () => void;
}

const BackgroundSlideshow = ({ products, customUrl }: { products: Product[], customUrl?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (customUrl || products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [products.length, customUrl]);

  if (customUrl && customUrl.trim() !== "") {
    return (
      <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
        <img src={customUrl} className="w-full h-full object-cover opacity-40 scale-110 animate-pulse-slow" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-slate-950/70 to-slate-950 z-10"></div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
      {products.length > 0 ? products.map((p, idx) => (
        <div 
          key={p.id} 
          className={`absolute inset-0 transition-opacity duration-[3000ms] ${idx === currentIndex ? 'opacity-40 scale-110' : 'opacity-0 scale-100'} transform transition-transform duration-[8000ms] ease-linear`}
        >
          <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
        </div>
      )) : (
        <div className="absolute inset-0 bg-slate-900 opacity-40"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-slate-950/70 to-slate-950 z-10"></div>
    </div>
  );
};

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({ 
  config, products, stores, onNavigateToStore, wishlist, onToggleWishlist, isLoggedIn, currentUser, onAddToCart, onBecomeSeller 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const categoryMatch = activeCategory === 'All' || p.category === activeCategory;
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.storeName.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [products, activeCategory, searchQuery]);

  const vendorResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return stores.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [stores, searchQuery]);

  const slideshowProducts = useMemo(() => products.slice(0, 5), [products]);

  return (
    <div className="space-y-16 pb-20">
      <section className="relative -mt-8 -mx-4 sm:-mx-8 md:-mx-12 px-8 py-24 md:py-48 flex items-center justify-center overflow-hidden min-h-[85vh]">
        <BackgroundSlideshow products={slideshowProducts} customUrl={config.heroBackgroundUrl} />
        
        <div className="relative z-20 text-center max-w-5xl space-y-12 animate-fade-in">
          <div className="inline-block px-6 py-2 bg-indigo-600/30 backdrop-blur-xl border border-white/20 rounded-full mb-4 animate-slide-up shadow-2xl">
             <span className="text-white font-black text-[10px] uppercase tracking-[0.5em]">Verified Global Sourcing Protocol</span>
          </div>
          
          <h2 className="text-5xl md:text-[8.5rem] font-black text-white tracking-tighter leading-[0.85] animate-unblur drop-shadow-2xl">
            {config.heroTitle}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto pt-4 animate-slide-up animation-delay-300">
            {[
              { label: 'Active Stores', value: stores.length + 42, suffix: '+' },
              { label: 'Total Products', value: products.length + 120, suffix: '+' },
              { label: 'Verified Hubs', value: 12, suffix: '' },
              { label: 'Uptime', value: 99.9, suffix: '%' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl hover:bg-white/20 transition-all hover:scale-110 group cursor-default">
                <p className="text-[32px] md:text-[42px] font-black text-white leading-none tracking-tighter mb-1 group-hover:text-indigo-400 transition-colors">
                  {stat.value}{stat.suffix}
                </p>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/50 group-hover:text-white transition-colors">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto relative group pt-4 animate-slide-up animation-delay-500">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 animate-gradient-x"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[2.5rem] overflow-hidden p-3 shadow-2xl">
              <div className="pl-6 pr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection or verified vendors..."
                className="w-full bg-transparent border-none text-white font-black text-xl outline-none placeholder:text-white/30 py-4"
              />
            </div>

            {vendorResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] border dark:border-slate-800 p-8 z-50 animate-slide-up">
                <div className="flex items-center justify-between mb-6 px-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Match Identified</p>
                   <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">Secure Entry</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {vendorResults.map(store => (
                    <button 
                      key={store.id} 
                      onClick={() => onNavigateToStore(store.name)}
                      className="w-full flex items-center gap-6 p-5 hover:bg-white dark:hover:bg-slate-800 rounded-[2rem] transition-all text-left border-2 border-transparent hover:border-indigo-600 group shadow-sm hover:shadow-xl"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <img src={store.bannerUrl} className="w-full h-full rounded-2xl object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="" />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-lg text-slate-900 dark:text-white leading-tight">{store.name}</p>
                        <p className="text-xs text-gray-400 font-bold line-clamp-1">{store.description}</p>
                      </div>
                      <div className="bg-indigo-600 text-white p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition translate-x-4 group-hover:translate-x-0">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4 animate-slide-up animation-delay-700">
             <button onClick={() => document.getElementById('stores-list')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-slate-950 px-16 py-6 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:scale-110 transition shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:shadow-white/50 active:scale-95">Browse Products</button>
             {!isLoggedIn && (
               <button onClick={onBecomeSeller} className="bg-indigo-600/20 backdrop-blur-xl border border-indigo-500/50 text-white px-16 py-6 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition hover:scale-110 active:scale-95">Open Store</button>
             )}
          </div>
        </div>
      </section>

      {/* Stores Section - Triggered by Browse Products */}
      <section id="stores-list" className="space-y-12 scroll-mt-24">
        <div className="text-center space-y-4">
           <h3 className="text-4xl font-black tracking-tighter">Verified Vendors</h3>
           <p className="text-gray-500 font-medium">Select a store to enter their exclusive marketplace node.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
           {stores.map(store => (
             <div 
              key={store.id} 
              onClick={() => onNavigateToStore(store.name)}
              className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2"
             >
                <div className="h-48 relative overflow-hidden">
                   <img src={store.bannerUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="" />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-500"></div>
                </div>
                <div className="p-8">
                   <div className="flex justify-between items-start mb-4">
                      <h4 className="text-2xl font-black tracking-tighter">{store.name}</h4>
                      <span className="bg-green-50 dark:bg-green-900/20 text-green-600 text-[8px] font-black uppercase px-3 py-1 rounded-full">Online</span>
                   </div>
                   <p className="text-gray-500 text-sm font-medium line-clamp-2 mb-6">{store.description}</p>
                   <button className="w-full py-4 bg-gray-50 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                      Enter Marketplace
                   </button>
                </div>
             </div>
           ))}
        </div>
      </section>

      <section id="browse" className="space-y-12 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b dark:border-slate-800 pb-8">
           <div>
             <h3 className="text-4xl font-black tracking-tighter mb-2">Global Feed</h3>
             <p className="text-gray-500 font-medium text-base">Real-time products synchronized from verified global nodes.</p>
           </div>
           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
             {['All', ...CATEGORIES].map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)}
                 className={`px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 scale-105' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
           {filteredProducts.map(product => (
             <ProductCard 
               key={product.id} 
               product={product} 
               onClickStore={onNavigateToStore}
               isWishlisted={wishlist.includes(product.id)}
               onToggleWishlist={isLoggedIn ? onToggleWishlist : undefined}
               onAddToCart={onAddToCart}
             />
           ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-32 text-center bg-gray-50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-dashed border-gray-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-gray-400 font-black uppercase text-xs tracking-[0.5em]">No matching products identified in this sector</p>
          </div>
        )}
      </section>
    </div>
  );
};