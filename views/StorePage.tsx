
import React from 'react';
import { Store, Product, CartItem, Review } from '../types';
import { ProductCard } from '../components/ProductCard';

interface StorePageProps {
  store: Store;
  products: Product[];
  reviews?: Review[];
  onNavigateToStore: (storeName: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  isLoggedIn: boolean;
  onAddToCart?: (item: CartItem) => void;
  onFlagProduct?: (productId: string) => void;
}

export const StorePage: React.FC<StorePageProps> = ({ 
  store, 
  products, 
  reviews = [],
  onNavigateToStore,
  wishlist,
  onToggleWishlist,
  isLoggedIn,
  onAddToCart,
  onFlagProduct
}) => {
  const storeProducts = products.filter(p => p.storeName === store.name && !p.isFlagged);

  return (
    <div className="space-y-8">
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-xl">
        <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
          <div className="text-white">
            <h1 className="text-4xl font-extrabold mb-2">{store.name}</h1>
            <p className="text-gray-200 max-w-xl">{store.description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
        <p className="text-gray-500">{storeProducts.length} items available</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {storeProducts.map(p => (
          <div key={p.id} className="relative group">
             <ProductCard 
                product={p} 
                onClickStore={onNavigateToStore} 
                isWishlisted={wishlist.includes(p.id)}
                onToggleWishlist={isLoggedIn ? onToggleWishlist : undefined}
                onAddToCart={onAddToCart}
             />
             {/* Report Button overlay */}
             <button 
               onClick={(e) => { e.stopPropagation(); onFlagProduct?.(p.id); alert("Item Reported to Super Admin."); }}
               className="absolute top-2 left-2 bg-red-50 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
               title="Report Item"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             </button>
          </div>
        ))}
      </div>

      {reviews.length > 0 && (
        <div className="bg-gray-50 p-10 rounded-[3rem] mt-12">
           <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Verified Reviews</h3>
           <div className="space-y-6">
              {reviews.filter(r => storeProducts.some(p => p.id === r.productId)).map(r => (
                 <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2">
                       <span className="text-xs font-bold text-indigo-600">{r.buyerName}</span>
                       <span className="text-xs text-gray-400">{new Date(r.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-yellow-400 text-sm mb-2">{'⭐'.repeat(r.rating)}</div>
                    <p className="text-sm text-gray-600 italic">"{r.comment}"</p>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
