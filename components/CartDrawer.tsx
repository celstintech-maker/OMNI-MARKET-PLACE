import React, { useMemo } from 'react';
import { CartItem } from '../types';
import { Icons, PAYMENT_METHODS } from '../constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (index: number) => void;
  onCheckout: (payload: { paymentMethod: string }) => void;
  currencySymbol?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, onClose, cart, onRemoveItem, onCheckout, currencySymbol = '₦' 
}) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const uniqueMethods = useMemo(() => {
    const ids = Array.from(new Set(cart.map(i => i.paymentMethod).filter(Boolean)));
    return PAYMENT_METHODS.filter(m => ids.includes(m.id));
  }, [cart]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[140] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[150] transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l dark:border-slate-800`}>
        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter text-indigo-600">Your Cart ({cart.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Icons.Store />
              <p className="mt-4 font-black uppercase tracking-widest text-sm">Cart Empty</p>
              <button onClick={onClose} className="mt-4 text-indigo-600 font-bold text-xs uppercase underline">Start Shopping</button>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex gap-4 animate-slide-up">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                  <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-sm line-clamp-2">{item.name}</h4>
                    <button onClick={() => onRemoveItem(index)} className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{item.storeName}</p>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-indigo-600 font-black">{currencySymbol}{item.price.toLocaleString()}</p>
                    <div className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold">Qty: {item.quantity}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
            <div className="mb-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Payment System</label>
              {uniqueMethods.length === 0 ? (
                <div className="mt-2 bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 text-sm font-bold">
                  Bank Transfer
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {uniqueMethods.map(method => (
                    <span
                      key={method.id}
                      className="px-3 py-1 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold flex items-center gap-2"
                    >
                      <span>{method.icon}</span>
                      <span>{method.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="font-black uppercase text-gray-400 text-xs tracking-widest">Total Valuation</span>
              <span className="text-2xl font-black text-indigo-600">{currencySymbol}{total.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => onCheckout({ paymentMethod: uniqueMethods[0]?.id || 'bank_transfer' })}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span>Secure Checkout</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <p className="text-center text-[8px] text-gray-400 uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
              <Icons.Lock /> Encrypted Transaction Node
            </p>
          </div>
        )}
      </div>
    </>
  );
};
