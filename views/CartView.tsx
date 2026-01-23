
import React, { useState, useMemo, useEffect } from 'react';
import { CartItem, Transaction, BillingDetails, DeliveryType } from '../types';
import { Icons, PAYMENT_METHODS } from '../constants';
import { SiteConfig } from '../App';

interface CartViewProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  onNavigate: (view: string) => void;
  onCompletePurchase: (newTransactions: Transaction[]) => void;
  config: SiteConfig;
}

export const CartView: React.FC<CartViewProps> = ({ cart, setCart, onNavigate, onCompletePurchase, config }) => {
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'billing' | 'payment' | 'syncing'>('review');
  const [countdown, setCountdown] = useState(5);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('home_delivery');
  
  // Local state to track selected payment methods per vendor group
  const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>({});

  const [billing, setBilling] = useState<BillingDetails>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: ''
  });

  const vendorGroups = useMemo(() => {
    const groups: Record<string, { storeName: string; items: CartItem[]; total: number; sellerId: string; paymentMethod: string }> = {};
    cart.forEach(item => {
      if (!groups[item.sellerId]) {
        groups[item.sellerId] = { 
          storeName: item.storeName, 
          items: [], 
          total: 0, 
          sellerId: item.sellerId,
          paymentMethod: selectedMethods[item.sellerId] || item.paymentMethod || 'bank_transfer'
        };
      }
      groups[item.sellerId].items.push(item);
      groups[item.sellerId].total += item.price * item.quantity;
    });
    return Object.values(groups);
  }, [cart, selectedMethods]);

  useEffect(() => {
    let timer: any;
    if (checkoutStep === 'syncing' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (checkoutStep === 'syncing' && countdown === 0) {
      const newTransactions: Transaction[] = cart.map(item => ({
        id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: item.id,
        productName: item.name,
        sellerId: item.sellerId,
        storeName: item.storeName,
        amount: item.price * item.quantity,
        commission: (item.price * item.quantity) * config.commissionRate,
        timestamp: Date.now(),
        currencySymbol: item.currencySymbol || '₦',
        paymentMethod: selectedMethods[item.sellerId] || item.paymentMethod || 'bank_transfer',
        billingDetails: billing,
        deliveryType: deliveryType
      }));
      onCompletePurchase(newTransactions);
    }
    return () => clearInterval(timer);
  }, [checkoutStep, countdown, cart, billing, deliveryType, config.commissionRate, selectedMethods]);

  const totalCartValue = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const removeItem = (id: string, size?: string) => {
    setCart(cart.filter(item => !(item.id === id && item.selectedSize === size)));
  };

  const updateQuantity = (id: string, size: string | undefined, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id && item.selectedSize === size) {
        return { ...item, quantity: Math.max(1, Math.min(item.stock, item.quantity + delta)) };
      }
      return item;
    }));
  };

  const handleMethodChange = (sellerId: string, methodId: string) => {
    setSelectedMethods(prev => ({ ...prev, [sellerId]: methodId }));
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto">
          <Icons.Store />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Your Bag is Empty</h2>
        <button onClick={() => onNavigate('home')} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl">Return to Hub</button>
      </div>
    );
  }

  if (checkoutStep === 'syncing') {
    return (
      <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-12">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="376.8" strokeDashoffset={376.8 * (1 - countdown / 5)} className="text-indigo-500 transition-all duration-1000" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white">{countdown}</span>
        </div>
        <div className="space-y-4 max-w-lg">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Processing Order</h2>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing transaction packets with {vendorGroups.length} vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 animate-fade-in pb-32">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b dark:border-slate-800 pb-8">
        <div>
          <h2 className="text-5xl font-black tracking-tighter uppercase">Procurement Bag</h2>
          <p className="text-gray-500 font-bold text-xs mt-2">Aggregating {vendorGroups.length} unique vendors</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 rounded-3xl">
           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Global Total</p>
           <p className="text-3xl font-black text-indigo-600">₦{totalCartValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          {checkoutStep === 'review' ? (
            vendorGroups.map((group, idx) => (
              <div key={group.sellerId} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="bg-gray-50 dark:bg-slate-800 p-6 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase">{group.storeName[0]}</div>
                      <h3 className="text-sm font-black uppercase tracking-tight">{group.storeName}</h3>
                   </div>
                   <span className="text-[8px] font-black uppercase bg-white dark:bg-slate-900 px-3 py-1 rounded-full border dark:border-slate-700">Seller ID: {group.sellerId.slice(-5)}</span>
                </div>
                <div className="divide-y dark:divide-slate-800">
                  {group.items.map(item => (
                    <div key={`${item.id}-${item.selectedSize}`} className="p-6 sm:p-8 flex gap-6 hover:bg-gray-50/50 transition">
                      <img src={item.selectedImageUrl || item.imageUrl} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                      <div className="flex-1 space-y-2">
                         <h4 className="font-black text-sm uppercase leading-none">{item.name}</h4>
                         <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                               <button onClick={() => updateQuantity(item.id, item.selectedSize, -1)} className="w-8 h-8 flex items-center justify-center font-black">-</button>
                               <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.id, item.selectedSize, 1)} className="w-8 h-8 flex items-center justify-center font-black">+</button>
                            </div>
                            <button onClick={() => removeItem(item.id, item.selectedSize)} className="text-[9px] font-black uppercase text-red-500 hover:underline">Remove</button>
                         </div>
                      </div>
                      <div className="text-right font-black text-indigo-600">₦{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : checkoutStep === 'billing' ? (
            <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-8 animate-slide-up">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Logistics Dossier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Full Name</label>
                    <input value={billing.fullName} onChange={e => setBilling({...billing, fullName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold border dark:border-slate-700" placeholder="John Doe" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Encrypted Email</label>
                    <input type="email" value={billing.email} onChange={e => setBilling({...billing, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold border dark:border-slate-700" placeholder="john@omni.link" />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Fulfillment Address</label>
                    <textarea value={billing.address} onChange={e => setBilling({...billing, address: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold h-24 border dark:border-slate-700" placeholder="Street address for delivery location..." />
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
               {vendorGroups.map((group, i) => {
                 const currentMethod = selectedMethods[group.sellerId] || group.paymentMethod || 'bank_transfer';
                 const isBankTransfer = currentMethod === 'bank_transfer';
                 const isPOD = currentMethod === 'pod';

                 return (
                   <div key={i} className="bg-white dark:bg-slate-900 border-l-8 border-indigo-600 p-8 rounded-3xl shadow-sm space-y-6 animate-slide-up">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xl font-black uppercase tracking-tighter">Settlement: {group.storeName}</h4>
                        <select 
                          value={currentMethod}
                          onChange={(e) => handleMethodChange(group.sellerId, e.target.value)}
                          className="bg-gray-100 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black uppercase p-3 outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                          {PAYMENT_METHODS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      {isBankTransfer ? (
                        <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl space-y-4">
                           <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2">Central Company Bank Details</p>
                           <pre className="text-sm font-black dark:text-white whitespace-pre-wrap leading-relaxed">{config.adminBankDetails || "Admin bank details not configured."}</pre>
                           <p className="text-[9px] text-gray-400 font-black leading-relaxed italic border-t dark:border-slate-700 pt-4">"Please initiate transfer to the company bank above. Vendors will ship items once our central hub verifies the transaction packet."</p>
                        </div>
                      ) : isPOD ? (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 space-y-2">
                           <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Payment on Delivery Protocol</p>
                           <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200">Our logistics agent will collect the settlement upon fulfillment. Please ensure you have the correct valuation (₦{group.total.toLocaleString()}) available at the delivery location.</p>
                        </div>
                      ) : (
                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 text-[10px] font-bold">
                           Please proceed with the external {currentMethod.toUpperCase()} transaction gateway for this vendor group.
                        </div>
                      )}
                   </div>
                 );
               })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl sticky top-24">
            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Summary Protocol</h3>
            <div className="space-y-4 text-sm font-bold text-gray-500 uppercase tracking-widest">
               <div className="flex justify-between"><span>Aggregated Value</span><span>₦{totalCartValue.toLocaleString()}</span></div>
               <div className="pt-4 border-t dark:border-slate-800 flex justify-between items-end">
                  <div>
                     <p className="text-[9px] font-black uppercase text-gray-400">Total Valuation</p>
                     <p className="text-4xl font-black text-indigo-600 tracking-tighter">₦{totalCartValue.toLocaleString()}</p>
                  </div>
               </div>
            </div>
            <div className="pt-8">
               {checkoutStep === 'review' && <button onClick={() => setCheckoutStep('billing')} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] shadow-xl">Proceed to Logistics</button>}
               {checkoutStep === 'billing' && <button onClick={() => setCheckoutStep('payment')} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] shadow-xl">Confirm Logistics</button>}
               {checkoutStep === 'payment' && <button onClick={() => setCheckoutStep('syncing')} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] shadow-xl">Authorize Settlement</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
