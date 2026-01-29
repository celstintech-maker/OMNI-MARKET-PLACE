
import React, { useState, useEffect, useMemo } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product, Store, User, CartItem, SiteConfig } from '../types';

// Define the interface for MarketplaceHome component props
interface MarketplaceHomeProps {
  config: SiteConfig;
  products: Product[];
  stores: Store[];
  categories: string[];
  onNavigateToStore: (storeName: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  isLoggedIn: boolean;
  currentUser: User | null;
  onAddToCart: (item: CartItem) => void;
  onBecomeSeller: () => void;
  onFlagProduct: (productId: string) => void;
}

const BackgroundSlideshow = ({ products, customUrl }: { products: Product[], customUrl?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const images = products.length > 0 ? products.map(p => p.imageUrl) : [];

  useEffect(() => {
    if (customUrl || images.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length, customUrl]);

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
      {images.length > 0 ? images.map((img, idx) => (
        <div 
          key={idx} 
          className={`absolute inset-0 transition-opacity duration-[3000ms] ${idx === currentIndex ? 'opacity-40 scale-110' : 'opacity-0 scale-100'} transform transition-transform duration-[8000ms] ease-linear`}
        >
          <img src={img} className="w-full h-full object-cover" alt="" />
        </div>
      )) : (
        <div className="absolute inset-0 bg-slate-900 opacity-40"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-slate-950/70 to-slate-950 z-10"></div>
    </div>
  );
};

const BannerTiles = ({ banners, config }: { banners: string[], config: SiteConfig }) => {
  const [displayBanners, setDisplayBanners] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);

  // Initialize display
  useEffect(() => {
    if (banners.length > 0) {
      // Pick up to 3 initially
      setDisplayBanners(banners.slice(0, 3));
    }
  }, [banners]);

  // Shuffling Logic
  useEffect(() => {
    if (banners.length <= 3) return; // No need to shuffle if we fit all

    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        // Randomly shuffle the full list and pick top 3
        const shuffled = [...banners].sort(() => Math.random() - 0.5);
        setDisplayBanners(shuffled.slice(0, 3));
        setIsTransitioning(false);
      }, config.bannerTransitionSpeed || 800); // Wait for exit animation before swapping

    }, config.bannerInterval || 5000);

    return () => clearInterval(interval);
  }, [banners, config.bannerInterval, config.bannerTransitionSpeed]);

  const getAnimationClass = (isActive: boolean) => {
    const style = config.bannerAnimationStyle || 'fade';
    if (isActive) return 'opacity-100 scale-100 translate-y-0';
    
    switch (style) {
      case 'zoom': return 'opacity-0 scale-90';
      case 'slide': return 'opacity-0 translate-y-10';
      case 'fade':
      default: return 'opacity-0';
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 -mt-8 relative z-30 animate-slide-up">
        <div className={`grid grid-cols-1 ${displayBanners.length > 1 ? 'md:grid-cols-2' : ''} ${displayBanners.length > 2 ? 'lg:grid-cols-3' : ''} gap-4 sm:gap-6`}>
          {displayBanners.map((banner, index) => (
            <div
              key={`${banner}-${index}`} // Composite key to force animation reset on change if needed, or stable index
              onClick={() => setSelectedBanner(banner)}
              className={`
                relative w-full aspect-[21/9] sm:aspect-[16/9] md:aspect-[3/2] rounded-[2.5rem] overflow-hidden shadow-2xl 
                border-4 border-white/10 dark:border-slate-800 bg-gray-100 dark:bg-slate-900 group cursor-pointer
                transition-all ease-in-out
                ${getAnimationClass(!isTransitioning)}
              `}
              style={{ transitionDuration: `${config.bannerTransitionSpeed || 800}ms` }}
            >
              <img
                src={banner}
                alt={`Ad Banner ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
              
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 z-20 hover:bg-white/20 transition-colors">
                 <span className="text-[8px] font-black uppercase tracking-widest text-white shadow-sm">Featured</span>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                 <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-lg">View Full Image</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {selectedBanner && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedBanner(null)}
        >
           <div className="relative max-w-[90vw] max-h-[90vh]">
             <img 
               src={selectedBanner} 
               className="max-w-full max-h-[90vh] rounded-[2rem] shadow-2xl border-2 border-white/10 animate-slide-up" 
               alt="Full Banner"
             />
             <button 
                onClick={(e) => { e.stopPropagation(); setSelectedBanner(null); }}
                className="absolute -top-4 -right-4 bg-white text-slate-900 p-3 rounded-full hover:bg-gray-200 transition shadow-lg"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
        </div>
      )}
    </>
  );
};

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({ 
  config, products, stores, categories, onNavigateToStore, wishlist, onToggleWishlist, isLoggedIn, currentUser, onAddToCart, onBecomeSeller, onFlagProduct 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStoreFilter, setActiveStoreFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out products from suspended stores
  const activeStores = useMemo(() => stores.filter(s => s.status !== 'suspended'), [stores]);
  const activeStoreNames = useMemo(() => activeStores.map(s => s.name), [activeStores]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Only show products from active stores
      if (!activeStoreNames.includes(p.storeName)) return false;

      const categoryMatch = activeCategory === 'All' || p.category === activeCategory;
      const storeMatch = activeStoreFilter === 'All' || p.storeName === activeStoreFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = p.name.toLowerCase().includes(searchLower) || 
                          p.storeName.toLowerCase().includes(searchLower);
                          
      return categoryMatch && storeMatch && searchMatch;
    });
  }, [products, activeCategory, activeStoreFilter, searchQuery, activeStoreNames]);

  const vendorResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return activeStores.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeStores, searchQuery]);

  const slideshowProducts = useMemo(() => filteredProducts.slice(0, 5), [filteredProducts]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      <section className="relative -mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 py-16 md:py-48 flex items-center justify-center overflow-hidden min-h-[60vh] md:min-h-[75vh]">
        <BackgroundSlideshow products={slideshowProducts} customUrl={config.heroBackgroundUrl} />
        
        <div className="relative z-20 text-center max-w-5xl space-y-8 md:space-y-12 animate-fade-in w-full">
          <div className="inline-block px-4 py-1.5 bg-indigo-600/30 backdrop-blur-xl border border-white/20 rounded-full mb-2 animate-slide-up shadow-2xl">
             <span className="text-white font-black text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.5em]">The Decentralized Shopping Network</span>
          </div>
          
          <h2 className="text-4xl sm:text-6xl md:text-[8.5rem] font-black text-white tracking-tighter leading-[0.9] animate-unblur drop-shadow-2xl px-2">
            {config.heroTitle}
            <span className="block text-xl sm:text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mt-4 tracking-widest font-bold">
               {config.heroSubtitle || 'GLOBAL COMMERCE REIMAGINED'}
            </span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 max-w-4xl mx-auto pt-4 animate-slide-up animation-delay-300 px-2">
            {[
              { label: 'Verified Sellers', value: config.stats?.verifiedSellers || '150+' },
              { label: 'Available Assets', value: config.stats?.availableAssets || '850+' },
              { label: 'Secure Nodes', value: config.stats?.secureNodes || '24/7' },
              { label: 'Network Uptime', value: config.stats?.networkUptime || '99.9%' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-2xl border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-2xl hover:bg-white/20 transition-all group cursor-default">
                <p className="text-2xl sm:text-4xl md:text-[42px] font-black text-white leading-none tracking-tighter mb-1 group-hover:text-indigo-400 transition-colors">
                  {stat.value}
                </p>
                <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.3em] text-white/50 group-hover:text-white transition-colors">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto relative group pt-4 animate-slide-up animation-delay-500 px-2">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-[2rem] sm:rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 animate-gradient-x"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-3xl border border-white/30 rounded-2xl sm:rounded-[2.5rem] overflow-hidden p-2 sm:p-3 shadow-2xl">
              <div className="pl-4 pr-2 sm:pl-6 sm:pr-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or stores..."
                className="w-full bg-transparent border-none text-white font-black text-lg sm:text-xl outline-none placeholder:text-white/40 py-3 sm:py-4"
              />
            </div>

            {vendorResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-3xl sm:rounded-[3rem] shadow-2xl border dark:border-slate-800 p-4 sm:p-8 z-50 animate-slide-up">
                <div className="flex items-center justify-between mb-4 px-2">
                   <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">Store Match Identified</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {vendorResults.map(store => (
                    <button 
                      key={store.id} 
                      onClick={() => onNavigateToStore(store.name)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-left group"
                    >
                      <img src={store.bannerUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      <div className="flex-1">
                        <p className="font-black text-sm dark:text-white leading-tight">{store.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold truncate">{store.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4 animate-slide-up animation-delay-700 px-4">
             <button onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto bg-white text-slate-950 px-10 sm:px-16 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:scale-105 transition shadow-xl active:scale-95">Access Markets</button>
             {!isLoggedIn && (
               <button onClick={onBecomeSeller} className="w-full sm:w-auto bg-indigo-600/30 backdrop-blur-xl border border-indigo-500/50 text-white px-10 sm:px-16 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-indigo-600 transition active:scale-95">Open Store</button>
             )}
          </div>
        </div>
      </section>

      {/* Verified Partner Banners Widget - Now with dynamic tile view and config passed */}
      <BannerTiles banners={config.adBanners} config={config} />

      <section id="stores-list" className="space-y-8 sm:space-y-12 scroll-mt-24 px-2 sm:px-0">
        <div className="text-center space-y-2">
           <h3 className="text-3xl sm:text-4xl font-black tracking-tighter dark:text-white">Active Protocols</h3>
           <p className="text-gray-500 font-medium text-sm px-4">Direct marketplace access for verified global distributors.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
           {activeStores.map(store => (
             <div 
              key={store.id} 
              onClick={() => onNavigateToStore(store.name)}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer"
             >
                <div className="h-32 relative overflow-hidden">
                   <img src={store.bannerUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="" />
                </div>
                <div className="p-4">
                   <div className="flex flex-col gap-1 mb-2">
                      <div className="flex justify-between items-center">
                         <h4 className="text-sm font-black tracking-tighter dark:text-white truncate">{store.name}</h4>
                         <span className="bg-green-50 dark:bg-green-900/20 text-green-600 text-[6px] font-black uppercase px-2 py-0.5 rounded-full">Live</span>
                      </div>
                   </div>
                   <p className="text-gray-500 text-[10px] font-medium line-clamp-2 mb-3 h-8">{store.description}</p>
                   <button className="w-full py-2 bg-gray-50 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white rounded-xl font-black text-[8px] uppercase tracking-widest transition-all">
                      Access
                   </button>
                </div>
             </div>
           ))}
        </div>
      </section>

      <section id="browse" className="space-y-8 sm:space-y-12 scroll-mt-24 px-2 sm:px-0">
        <div className="flex flex-col gap-6 border-b dark:border-slate-800 pb-6 sm:pb-8">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
               <h3 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 dark:text-white">Live Asset Feed</h3>
               <p className="text-gray-500 font-medium text-sm sm:text-base">Real-time products synced from verified stores.</p>
             </div>
             
             {/* Store Filter Dropdown */}
             <div className="relative">
                <select 
                  value={activeStoreFilter}
                  onChange={(e) => setActiveStoreFilter(e.target.value)}
                  className="appearance-none bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest px-6 py-4 rounded-2xl border-r-8 border-transparent outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors pr-12 shadow-sm w-full sm:w-auto"
                >
                  <option value="All">All Stores</option>
                  {activeStores.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
             </div>
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-2 px-2">
             {['All', ...categories].map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)}
                 className={`px-6 py-3.5 rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
           {filteredProducts.map(product => (
             <ProductCard 
               key={product.id} 
               product={product} 
               onClickStore={onNavigateToStore}
               isWishlisted={wishlist.includes(product.id)}
               onToggleWishlist={onToggleWishlist}
               onAddToCart={onAddToCart}
             />
           ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 sm:py-32 text-center bg-gray-50 dark:bg-slate-900/50 rounded-3xl sm:rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em]">No matching assets found</p>
          </div>
        )}
      </section>
    </div>
  );
};
