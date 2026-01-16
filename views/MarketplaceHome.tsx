
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
      <section className="relative -mt-8 -mx-4 sm:-mx-8 md:-mx-12 px-8 py-24 md:py-48 flex items-center justify-center overflow-hidden min-h-[75vh]">
        <BackgroundSlideshow products={slideshowProducts} customUrl={config.heroBackgroundUrl} />
        
        <div className="relative z-20 text-center max-w-4xl space-y-10 animate-fade-in">
          <div className="inline-block px-6 py-2 bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 rounded-full mb-4">
             <span className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em]">Verified Global Sourcing</span>
          </div>
          <h2 className="text-5xl md:text-[8rem] font-black text-white tracking-tighter leading-[0.9] animate-unblur">
            {config.heroTitle}
          </h2>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] overflow-hidden p-2">
              <div className="pl-6 pr-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or verified vendors..."
                className="w-full bg-transparent border-none text-white font-bold text-lg outline-none placeholder:text-white/40 py-4"
              />
            </div>

            {vendorResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 p-6 z-50 animate-slide-up">
                <div className="flex items-center justify-between mb-4 px-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified Vendors Found</p>
                   <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">Real-time Node Matching</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {vendorResults.map(store => (
                    <button 
                      key={store.id} 
                      onClick={() => onNavigateToStore(store.name)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-3xl transition-all text-left border-2 border-transparent hover:border-indigo-600 group"
                    >
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <img src={store.bannerUrl} className="w-full h-full rounded-2xl object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="" />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-slate-900 dark:text-white">{store.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold line-clamp-1">{store.description}</p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/40 p-3 rounded-2xl text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
             <a href="#browse" className="bg-white text-slate-950 px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-[0_0_40px_rgba(255,255,255,0.2)]">Browse Collections</a>
             {!isLoggedIn && (
               <button onClick={onBecomeSeller} className="bg-indigo-600 text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition">Launch New Store</button>
             )}
          </div>
        </div>
      </section>

      <section id="browse" className="space-y-12 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b dark:border-slate-800 pb-8">
           <div>
             <h3 className="text-3xl font-black tracking-tighter mb-2">Marketplace Feed</h3>
             <p className="text-gray-500 font-medium text-sm">Curation of products from verified global vendors.</p>
           </div>
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
             {['All', ...CATEGORIES].map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)}
                 className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-gray-200'}`}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
          <div className="py-24 text-center bg-gray-50 dark:bg-slate-900 rounded-[3.5rem] border-4 border-dashed border-gray-100 dark:border-slate-800">
            <p className="text-gray-400 font-black uppercase text-xs tracking-[0.4em]">No matching products found</p>
          </div>
        )}
      </section>
    </div>
  );
};
