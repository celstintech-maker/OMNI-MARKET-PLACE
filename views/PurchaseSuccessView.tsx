
import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';

interface PurchaseSuccessViewProps {
  transactions: Transaction[];
  onNavigate: (view: string) => void;
}

export const PurchaseSuccessView: React.FC<PurchaseSuccessViewProps> = ({ transactions, onNavigate }) => {
  const [showMailNotice, setShowMailNotice] = useState(false);
  const orderId = transactions[0]?.id.split('-')[1].toUpperCase();
  const deliveryType = transactions[0]?.deliveryType;

  useEffect(() => {
    const timer = setTimeout(() => setShowMailNotice(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-20 px-4 space-y-12 animate-fade-in text-center pb-40">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="relative w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl mx-auto">
          ✓
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Transaction Authenticated</h1>
        <p className="text-gray-500 font-bold text-xs tracking-[0.4em] uppercase">Order ID: {orderId} • Network Sync Confirmed</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl max-w-2xl mx-auto text-left">
        <div className="bg-gray-50 dark:bg-slate-800 p-8 border-b dark:border-slate-800 flex justify-between items-center">
           <h3 className="font-black text-sm uppercase tracking-widest">Ecosystem Receipt</h3>
           <span className="text-[10px] font-bold text-indigo-600 uppercase">{new Date().toLocaleDateString()}</span>
        </div>
        <div className="p-8 space-y-6">
           {transactions.map(t => (
             <div key={t.id} className="flex justify-between items-center border-b dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                <div>
                   <p className="font-black text-sm uppercase">{t.productName}</p>
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Node: {t.storeName}</p>
                </div>
                <p className="font-black text-indigo-600">₦{t.amount.toLocaleString()}</p>
             </div>
           ))}
           <div className="pt-4 flex justify-between items-end border-t-2 border-dashed dark:border-slate-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Settlement</p>
              <p className="text-3xl font-black tracking-tighter">₦{transactions.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
           </div>
        </div>
        <div className={`p-8 ${deliveryType === 'home_delivery' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-green-50/50 dark:bg-green-900/10'} border-t dark:border-slate-800`}>
           <h4 className="text-xs font-black uppercase mb-2">{deliveryType === 'home_delivery' ? '🚚 Logistics Dispatch Protocol' : '🏪 Instant Pick-up Protocol'}</h4>
           <p className="text-[10px] font-medium leading-relaxed text-gray-500">
             {deliveryType === 'home_delivery' 
               ? "Our logistics nodes have been notified. Your assets will be dispatched to your fulfillment address within 24-48 hours. Watch for a communication sync on your provided phone line."
               : "Authorization code has been sent to your dashboard. Visit the vendor's physical node with your ID for instant asset retrieval."}
           </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
         <button onClick={() => onNavigate('home')} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition">Return to Marketplace</button>
         <button onClick={() => onNavigate('buyer-dashboard')} className="bg-gray-100 dark:bg-slate-800 dark:text-white px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-gray-200 transition">Portal Dashboard</button>
      </div>

      {showMailNotice && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 animate-slide-up">
           <div className="bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <span className="animate-bounce">📧</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Mail Notification Broadcasted to Buyer</span>
           </div>
        </div>
      )}
    </div>
  );
};
