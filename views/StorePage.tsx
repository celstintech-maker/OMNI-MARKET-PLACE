
import React from 'react';
import { Store, Product, CartItem } from '../types';
import { ProductCard } from '../components/ProductCard';

interface StorePageProps {
  store: Store;
  products: Product[];
  onNavigateToStore: (storeName: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  isLoggedIn: boolean;
  onBuy?: (product: Product) => void;
}

export const StorePage: React.FC<StorePageProps> = ({ 
  store, 
  products, 
  onNavigateToStore,
  wishlist,
  onToggleWishlist,
  isLoggedIn,
  onBuy
}) => {
  const storeProducts = products.filter(p => p.storeName === store.name);

  /* Helper to map onBuy to onAddToCart for the ProductCard */
  const handleAddToCart = (item: CartItem) => {
    if (onBuy) {
      onBuy(item);
    }
  };

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
          <ProductCard 
            key={p.id} 
            product={p} 
            onClickStore={onNavigateToStore} 
            isWishlisted={wishlist.includes(p.id)}
            onToggleWishlist={isLoggedIn ? onToggleWishlist : undefined}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
};
