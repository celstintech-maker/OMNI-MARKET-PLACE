
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
  const [quantity, setQuantity] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currency = product.currencySymbol || '₦';
  const payMethod = PAYMENT_METHODS.find(m => m.id === product.paymentMethod);
  const gallery = product.gallery || [product.imageUrl];

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
    } else if (num > product.stock) {
      setQuantity(product.stock);
    } else {
      setQuantity(num);
    }
  };

  const handleAddToCart = () => {
    if (product.category === 'Fashion' && product.sizes && !selectedSize) {
      alert("Please select a size first");
      return;
    }
    onAddToCart?.({
      ...product,
      selectedSize,
      selectedImageUrl: selectedImage,
      quantity: quantity
    });
    setShowModal(false);
    setQuantity(1);
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
        className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer animate-slide-up relative"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-800">
          <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={product.name} />
          {showWishlistBtn && onToggleWishlist && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all ${isWishlisted ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/80 dark:bg-slate-900/80 text-gray-400 hover:text-indigo-600'}`}
            >
              <svg className="w-5 h-5" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            className="absolute bottom-4 right-4 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
          >
            <span className="text-xl font-black">+</span>
          </button>

          <div className="absolute bottom-4 left-4">
            <span className="bg-slate-950/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest shadow-xl">
              {product.category}
            </span>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-start gap-4">
            <h4 className="text-sm font-black leading-tight text-slate-900 dark:text-white line-clamp-1">{product.name}</h4>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-xl font-black text-indigo-600 tracking-tighter">{currency}{product.price.toLocaleString()}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.storeName}</p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-fit max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col md:flex-row animate-slide-up">
            <button 
              onClick={() => { setShowModal(false); setQuantity(1); }}
              className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 rounded-full text-white md:text-gray-400 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="md:w-1/2 relative bg-gray-100 dark:bg-slate-800 h-64 md:h-auto overflow-hidden">
               {showVideo && product.videoUrl ? (
                 <div className="relative w-full h-full group">
                   <video 
                     ref={videoRef}
                     src={product.videoUrl} 
                     className="w-full h-full object-cover" 
                     playsInline
                     loop
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                     <button onClick={toggleVideoPlayback} className="bg-white/20 backdrop-blur-xl p-6 rounded-full text-white hover:scale-110 transition">
                       {isPlaying ? (
                         <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                       ) : (
                         <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                       )}
                     </button>
                   </div>
                   <button onClick={() => setShowVideo(false)} className="absolute bottom-6 right-6 bg-slate-950/80 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Back to Photo</button>
                 </div>
               ) : (
                 <>
                   <img src={selectedImage} className="w-full h-full object-cover" alt="" />
                   {product.videoUrl && (
                     <button onClick={() => setShowVideo(true)} className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-pulse">
                        <Icons.Camera /> Verification Feed
                     </button>
                   )}
                 </>
               )}
               <div className="absolute bottom-6 left-6 flex gap-2">
                 {gallery.map((img, i) => (
                   <button 
                    key={i} 
                    onClick={() => { setSelectedImage(img); setShowVideo(false); }}
                    className={`w-12 h-12 rounded-xl border-2 transition-all ${selectedImage === img ? 'border-white' : 'border-transparent opacity-60'}`}
                   >
                     <img src={img} className="w-full h-full object-cover rounded-lg" alt="" />
                   </button>
                 ))}
               </div>
            </div>

            <div className="md:w-1/2 p-8 sm:p-12 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900">
               <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-[0.2em]">{product.category}</span>
                      <span className="bg-slate-900 dark:bg-slate-700 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-[0.2em]">Verified Node</span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none dark:text-white">{product.name}</h3>
                  </div>

                  <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed italic border-l-4 border-indigo-600 pl-6">"{product.description}"</p>

                  <div className="grid grid-cols-2 gap-8 items-center pt-6 border-t dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Unit Valuation</p>
                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{currency}{product.price.toLocaleString()}</p>
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
