
import React, { useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product, Store, User, CartItem } from '../types';
import { CATEGORIES } from '../constants';

interface MarketplaceHomeProps {
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

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({ 
  products, stores, onNavigateToStore, wishlist, onToggleWishlist, isLoggedIn, onAddToCart, onBecomeSeller 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const filteredProducts = products.filter(p => activeCategory === 'All' || p.category === activeCategory);

  return (
    <div className="space-y-16 pb-20">
      {/* Restored Hero Section */}
      <section className="relative bg-slate-900 rounded-[3rem] overflow-hidden py-24 px-8 md:px-16 text-center animate-fade-in shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.4),transparent_70%)]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            OMNI <span className="text-indigo-400">MARKETPLACE</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 font-medium leading-relaxed">
            The premium destination for aggregated global products. Discover independent stores and world-class verified vendors in one seamless ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button 
              onClick={() => document.getElementById('stores')?.scrollIntoView({behavior:'smooth'})}
              className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition transform hover:-translate-y-1"
            >
              Browse Stores
            </button>
            <button 
              onClick={onBecomeSeller}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition"
            >
              Partner with Us
            </button>
          </div>
        </div>
      </section>

      {/* Restored Store Discovery Section */}
      <section id="stores" className="animate-slide-up">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Featured Vendors</h2>
            <p className="text-gray-500 font-medium">Shop directly from independent store owners</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stores.map(store => (
            <div 
              key={store.id}
              onClick={() => onNavigateToStore(store.name)}
              className="group relative h-64 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{store.name}</h3>
                <p className="text-indigo-300 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">Visit Storefront &rarr;</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Global Product Aggregator Section */}
      <div id="grid" className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-12 border-t dark:border-slate-800">
        <aside className="space-y-8 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6">Market Filters</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveCategory('All')} 
                className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase transition-all ${activeCategory === 'All' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-600'}`}
              >
                All Collections
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white">
            <h4 className="font-black text-lg leading-tight mb-4">Fastest Delivery in Nigeria</h4>
            <p className="text-indigo-100 text-xs font-medium mb-6">Omni Logistics ensures your orders arrive within 24-48 hours across major cities.</p>
            <div className="w-12 h-1 bg-white/30 rounded-full"></div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-black tracking-tight">Global Feed</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{filteredProducts.length} items found</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
            <div className="py-32 text-center">
              <p className="text-gray-400 font-medium italic">No products found in this category.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
