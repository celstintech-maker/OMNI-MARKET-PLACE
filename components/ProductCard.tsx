
import React, { useState, useRef, useEffect } from 'react';
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
  
  // Gallery state
  const gallery = (product.gallery && product.gallery.length > 0) ? product.gallery : [product.imageUrl];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);
  const [quantity, setQuantity] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currency = product.currencySymbol || '₦';
  
  const hasVideo = !!product.videoUrl;

  // Auto-slide logic for gallery if no video is playing/interacting? 
  // Let's keep it manual for now to avoid complexity with video
  
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const handleAddToCart = () => {
    if (product.category === 'Fashion' && product.sizes && !selectedSize) {
      alert("Please select a size first");
      return;
    }
    onAddToCart?.({
      ...product,
      selectedSize,
      selectedImageUrl: gallery[currentImageIndex],
      quantity: quantity
    });
    setShowModal(false);
    setQuantity(1);
  };

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer animate-slide-up relative"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-800">
          <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={product.name} />
          {showWishlistBtn && onToggleWishlist && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
              className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all ${isWishlisted ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/80 dark:bg-slate-900/80 text-gray-400 hover:text-indigo-600'}`}
            >
              <svg className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            className="absolute bottom-2 right-2 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
          >
            <span className="text-lg font-black">+</span>
          </button>

          <div className="absolute bottom-2 left-2">
            <span className="bg-slate-950/80 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg tracking-widest shadow-xl">
              {product.category}
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-4 space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-xs sm:text-sm font-black leading-tight text-slate-900 dark:text-white line-clamp-1">{product.name}</h4>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-sm sm:text-lg font-black text-indigo-600 tracking-tighter">{currency}{product.price.toLocaleString()}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[50%]">{product.storeName}</p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-fit max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col md:flex-row animate-slide-up">
            <button 
              onClick={() => { setShowModal(false); setQuantity(1); }}
              className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 rounded-full text-white md:text-gray-400 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* MEDIA SECTION */}
            <div className={`md:w-1/2 relative bg-gray-100 dark:bg-slate-800 flex flex-col md:flex-row ${hasVideo ? 'gap-1' : ''}`}>
               {/* IMAGE SLIDER */}
               <div className={`relative ${hasVideo ? 'md:w-3/5 h-64 md:h-auto' : 'w-full h-64 md:h-auto'} overflow-hidden group`}>
                   <img src={gallery[currentImageIndex]} className="w-full h-full object-cover" alt="" />
                   
                   {/* Arrows */}
                   {gallery.length > 1 && (
                     <>
                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                     </>
                   )}

                   {/* Dots */}
                   {gallery.length > 1 && (
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {gallery.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                        ))}
                     </div>
                   )}
               </div>

               {/* VIDEO SECTION (Side by side if present) */}
               {hasVideo && (
                 <div className="md:w-2/5 h-48 md:h-auto bg-black border-l border-white/10 relative group">
                    <video 
                        ref={videoRef}
                        src={product.videoUrl} 
                        className="w-full h-full object-cover" 
                        controls
                        playsInline
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest pointer-events-none opacity-80">
                        Live Feed
                    </div>
                 </div>
               )}
            </div>

            {/* DETAILS SECTION */}
            <div className="md:w-1/2 p-8 sm:p-12 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900">
               <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-[0.2em]">{product.category}</span>
                      <span className="bg-slate-900 dark:bg-slate-700 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-[0.2em]">Verified Store</span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none dark:text-white">{product.name}</h3>
                  </div>

                  <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed italic border-l-4 border-indigo-600 pl-6">"{product.description}"</p>

                  <div className="grid grid-cols-2 gap-8 items-center pt-6 border-t dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Unit Valuation</p>
                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{currency}{product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4 justify-end">
                       <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-black">-</button>
                       <span className="text-xl font-black w-8 text-center">{quantity}</span>
                       <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-black">+</button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] space-y-6">
                    <button 
                      onClick={handleAddToCart}
                      className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-3"
                    >
                      <span className="text-xl">+</span> Initialize Transaction ({currency}{(product.price * quantity).toLocaleString()})
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
