
import React from 'react';
import { Store, Product, CartItem, Review, SellerRecommendation } from '../types';
import { ProductCard } from '../components/ProductCard';

interface StorePageProps {
  store: Store;
  products: Product[];
  reviews?: Review[];
  recommendations?: SellerRecommendation[];
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
  recommendations = [],
  onNavigateToStore,
  wishlist,
  onToggleWishlist,
  isLoggedIn,
  onAddToCart,
  onFlagProduct
}) => {
  const storeProducts = products.filter(p => p.storeName === store.name && !p.isFlagged);
  const storeRecommendations = recommendations.filter(r => r.sellerId === store.sellerId);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="relative h-64 md:h-80 rounded-[3rem] overflow-hidden shadow-2xl">
        <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8 md:p-12">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">{store.name}</h1>
            <p className="text-gray-200 font-medium max-w-xl text-sm leading-relaxed">{store.description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b dark:border-slate-800 pb-6 gap-4">
        <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Global Inventory</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">{storeProducts.length} verified assets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {storeProducts.map(p => (
          <div key={p.id} className="relative group">
             <ProductCard 
                product={p} 
                onClickStore={onNavigateToStore} 
                isWishlisted={wishlist.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
             />
             {/* Report Button overlay */}
             <button 
               onClick={(e) => { e.stopPropagation(); onFlagProduct?.(p.id); alert("Item Reported to Super Admin."); }}
               className="absolute top-4 left-4 bg-red-50 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-100 shadow-sm"
               title="Report Item"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             </button>
          </div>
        ))}
      </div>

      {/* Reviews & Recommendations Section */}
      {(reviews.length > 0 || storeRecommendations.length > 0) && (
        <div className="bg-gray-50 dark:bg-slate-900 p-8 sm:p-12 rounded-[3rem] mt-16 border dark:border-slate-800">
           <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 dark:text-white">Reputation Ledger</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               {/* Product Reviews */}
               {reviews.filter(r => storeProducts.some(p => p.id === r.productId)).length > 0 && (
                   <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified Product Feedback</h4>
                        <div className="space-y-4">
                            {reviews.filter(r => storeProducts.some(p => p.id === r.productId)).map(r => (
                                <div key={r.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{r.buyerName}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{new Date(r.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-yellow-400 text-sm mb-2">{'⭐'.repeat(r.rating)}</div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 italic font-medium">"{r.comment}"</p>
                                </div>
                            ))}
                        </div>
                   </div>
               )}

               {/* Seller Recommendations */}
               {storeRecommendations.length > 0 && (
                   <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor Endorsements</h4>
                       <div className="space-y-4">
                           {storeRecommendations.map(r => (
                               <div key={r.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                   <div className="flex justify-between mb-2">
                                       <span className="text-xs font-bold text-green-600 dark:text-green-400">{r.buyerName}</span>
                                       <span className="text-[10px] text-gray-400 font-mono">{new Date(r.timestamp).toLocaleDateString()}</span>
                                   </div>
                                   <div className="text-yellow-400 text-sm mb-2">{'⭐'.repeat(r.rating)}</div>
                                   <p className="text-xs text-gray-600 dark:text-gray-300 italic font-medium">"{r.comment}"</p>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
           </div>
        </div>
      )}
    </div>
  );
};
