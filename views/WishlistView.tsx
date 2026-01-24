
import React from 'react';
import { Product, CartItem } from '../types';
import { ProductCard } from '../components/ProductCard';

interface WishlistViewProps {
  wishlist: string[];
  products: Product[];
  onNavigateToStore: (storeName: string) => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (item: CartItem) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ 
  wishlist, 
  products, 
  onNavigateToStore, 
  onToggleWishlist,
  onAddToCart 
}) => {
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Wishlist</h2>
          <p className="text-gray-500">Items you've saved for later</p>
        </div>
        <span className="text-sm font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
          {wishlistedProducts.length} Items
        </span>
      </div>

      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClickStore={onNavigateToStore}
              isWishlisted={true}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Explore the marketplace and click the heart icon to save products you love.</p>
        </div>
      )}
    </div>
  );
};
