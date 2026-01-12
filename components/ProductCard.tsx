
import React, { useState } from 'react';
import { Product, CartItem } from '../types';
import { Icons, PAYMENT_METHODS } from '../constants';

interface ProductCardProps {
  product: Product;
  onClickStore: (storeName: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  showWishlistBtn?: boolean;
  onAddToCart?: (item: CartItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onClickStore, 
  isWishlisted, 
  onToggleWishlist,
  showWishlistBtn = true,
  onAddToCart
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  const currency = product.currencySymbol || '₦';
  const payMethod = PAYMENT_METHODS.find(m => m.id === product.paymentMethod);
  const gallery = product.gallery || [product.imageUrl];

  const handleAddToCart = () => {
    if (product.category === 'Fashion' && product.sizes && !selectedSize) {
      alert("Please select a size first");
      return;
    }
    onAddToCart?.({
      ...product,
      selectedSize,
      selectedImageUrl: selectedImage,
      quantity: 1
    });
    setShowModal(false);
  };

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl dark:hover:shadow-indigo-500/10 transition-all group relative flex flex-col h-full cursor-pointer"
      >
        <div className="relative h-64 overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
          <div className="absolute top-4 right-4 z-20">
            {showWishlistBtn && onToggleWishlist && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(product.id);
                }}
                className={`p-3 rounded-2xl shadow-xl transition-all hover:scale-110 ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-gray-400'}`}
              >
                <svg className="w-5 h-5" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
            {product.category}
          </div>
        </div>
        
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2 mb-4">
             <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-tighter hover:underline">@{product.storeName}</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span className="text-[10px] text-gray-400 font-black">{product.location}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-2xl font-black text-indigo-600">{currency}{product.price.toLocaleString()}</span>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600">
               <Icons.Plus />
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-full max-h-[85vh] animate-slide-up relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 text-white lg:text-slate-400 p-3 rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="lg:w-1/2 h-80 lg:h-auto relative bg-slate-100 dark:bg-slate-800">
              <img src={selectedImage} className="w-full h-full object-cover transition-opacity duration-500" />
              <div className="absolute bottom-8 left-8 right-8 flex gap-4 overflow-x-auto no-scrollbar">
                {gallery.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-4 transition-all flex-shrink-0 ${selectedImage === img ? 'border-indigo-600 scale-110 shadow-xl' : 'border-white/50 hover:border-white'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-8 lg:p-12 overflow-y-auto no-scrollbar space-y-8">
              <div>
                <h2 className="text-4xl font-black tracking-tighter mb-4 dark:text-white">{product.name}</h2>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-500 uppercase tracking-widest">
                  <button onClick={() => onClickStore(product.storeName)} className="text-indigo-600 hover:underline">Store: {product.storeName}</button>
                  <span>•</span>
                  <span>{product.location}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Description</h4>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed font-medium">{product.description}</p>
              </div>

              {product.category === 'Fashion' && product.sizes && product.sizes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Available Sizes</h4>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs transition-all border-2 ${selectedSize === size ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-transparent border-gray-100 dark:border-slate-700 text-gray-500 hover:border-indigo-400'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-8 pt-8 border-t dark:border-slate-800">
                <div className="text-left w-full sm:w-auto">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price Total</p>
                   <p className="text-4xl font-black text-indigo-600">{currency}{product.price.toLocaleString()}</p>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                >
                  <Icons.Store />
                  Add to Cart
                </button>
              </div>
              
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <span>Secure Payments via {payMethod?.name}</span>
                <span className={product.stock < 5 ? 'text-red-500' : 'text-green-500'}>{product.stock} Units left</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
