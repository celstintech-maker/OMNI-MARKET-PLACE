
import React, { useState, useRef } from 'react';
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
  const [showVideo, setShowVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl dark:hover:shadow-indigo-500/10 transition-all group relative flex flex-col h-full cursor-pointer"
      >
        <div className="relative h-72 overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
          
          {/* Video Indicator Badge */}
          {product.videoUrl && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
               <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 20 20">
                 <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.333-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
               </svg>
               <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Video Preview</span>
            </div>
          )}

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
        
        <div className="p-8 flex flex-col flex-grow">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-1 tracking-tighter">{product.name}</h3>
          <div className="flex items-center gap-2 mb-6">
             <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-tighter hover:underline">@{product.storeName}</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span className="text-[10px] text-gray-400 font-black tracking-widest">{product.location}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-2xl font-black text-indigo-600">{currency}{product.price.toLocaleString()}</span>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600">
               <Icons.Plus />
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-full max-h-[85vh] animate-slide-up relative">
            <button 
              onClick={() => { setShowModal(false); setShowVideo(false); }}
              className="absolute top-8 right-8 z-[110] bg-white/10 hover:bg-white/20 text-white lg:text-slate-400 p-4 rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="lg:w-1/2 h-[45vh] lg:h-auto relative bg-slate-100 dark:bg-slate-800">
              {showVideo && product.videoUrl ? (
                <div className="w-full h-full relative group">
                  <video 
                    ref={videoRef}
                    src={product.videoUrl} 
                    className="w-full h-full object-cover"
                    playsInline
                    loop
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div 
                    onClick={toggleVideoPlayback}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer"
                  >
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                       {isPlaying ? (
                         <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                       ) : (
                         <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                       )}
                    </div>
                  </div>
                </div>
              ) : (
                <img src={selectedImage} className="w-full h-full object-cover transition-opacity duration-500" />
              )}
              
              <div className="absolute bottom-10 left-10 right-10 flex gap-4 overflow-x-auto no-scrollbar">
                {product.videoUrl && (
                  <button 
                    onClick={() => setShowVideo(true)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-4 transition-all flex-shrink-0 flex items-center justify-center bg-indigo-600 ${showVideo ? 'border-white scale-110 shadow-2xl' : 'border-indigo-500/50 hover:border-indigo-400'}`}
                  >
                    <svg className="w-8 h-8 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                  </button>
                )}
                {gallery.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setSelectedImage(img); setShowVideo(false); }}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-4 transition-all flex-shrink-0 ${(!showVideo && selectedImage === img) ? 'border-white scale-110 shadow-2xl' : 'border-white/50 hover:border-white'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-10 lg:p-16 overflow-y-auto no-scrollbar space-y-10">
              <div>
                <h2 className="text-4xl lg:text-5xl font-black tracking-tighter mb-6 dark:text-white leading-none">{product.name}</h2>
                <div className="flex flex-wrap items-center gap-6 text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
                  <button onClick={() => onClickStore(product.storeName)} className="text-indigo-600 hover:text-indigo-500 transition border-b-2 border-indigo-600/20 pb-1">Vendor: {product.storeName}</button>
                  <span className="text-gray-200">/</span>
                  <span className="flex items-center gap-2">📍 {product.location}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.4em]">Product Description</h4>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed font-medium text-lg">{product.description}</p>
              </div>

              {product.category === 'Fashion' && product.sizes && product.sizes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.4em]">Available Sizes</h4>
                  <div className="flex flex-wrap gap-4">
                    {product.sizes.map(size => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-8 py-4 rounded-2xl font-black text-xs transition-all border-2 ${selectedSize === size ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/40 scale-105' : 'bg-transparent border-gray-100 dark:border-slate-800 text-gray-500 hover:border-indigo-400'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-10 pt-10 border-t dark:border-slate-800">
                <div className="text-left w-full sm:w-auto">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Valuation</p>
                   <p className="text-5xl font-black text-indigo-600 tracking-tighter">{currency}{product.price.toLocaleString()}</p>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 w-full bg-slate-900 dark:bg-indigo-600 text-white py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 hover:shadow-indigo-500/40"
                >
                  <Icons.Store />
                  Secure Purchase
                </button>
              </div>
              
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest pt-4">
                <span className="flex items-center gap-2">🛡️ Secured via {payMethod?.name}</span>
                <span className={`${product.stock < 5 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>{product.stock} Units Available</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
