
import React, { useState } from 'react';
import { User, Transaction, Feedback } from '../types';

interface BuyerDashboardProps {
  user: User;
  transactions: Transaction[];
  onFeedbackSubmit?: (transactionId: string, feedback: Feedback) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user, transactions, onFeedbackSubmit }) => {
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const myPurchases = transactions;

  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackId || !onFeedbackSubmit) return;
    
    onFeedbackSubmit(activeFeedbackId, {
      rating,
      comment,
      timestamp: Date.now(),
      buyerName: user.name
    });
    
    setActiveFeedbackId(null);
    setRating(5);
    setComment('');
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2">My Portal</h2>
          <p className="text-gray-500 font-medium">Manage your global procurement node and purchase history.</p>
        </div>
        <div className="bg-indigo-600 text-white px-8 py-4 rounded-3xl shadow-xl shadow-indigo-100 flex items-center gap-4">
           <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">🛍️</div>
           <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200 leading-none mb-1">Active Purchases</p>
              <p className="text-xl font-black leading-none">{myPurchases.length}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-8 border-b dark:border-slate-800">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Transactions</h3>
            </div>
            {myPurchases.length === 0 ? (
              <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest">No purchase data synced</div>
            ) : (
              <div className="divide-y dark:divide-slate-800">
                {myPurchases.map(t => (
                  <div key={t.id} className="p-8 space-y-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{t.productName}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Store: {t.storeName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-600">{t.currencySymbol}{t.amount.toLocaleString()}</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{new Date(t.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {!t.feedback ? (
                      <button 
                        onClick={() => setActiveFeedbackId(t.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition"
                      >
                        Rate Order
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 pt-2 border-t dark:border-slate-700/50">
                         <span className="text-amber-500 font-bold text-xs">{t.feedback.rating} ★</span>
                         <p className="text-xs italic text-gray-500 line-clamp-1">"{t.feedback.comment}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">User Profile</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-1">Display Name</label>
                    <p className="font-bold text-lg">{user.name}</p>
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-1">Contact Email</label>
                    <p className="font-bold text-lg lowercase">{user.email}</p>
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-1">Security Hint</label>
                    <p className="font-bold text-gray-500 italic">"{user.passwordHint || 'No hint configured'}"</p>
                 </div>
              </div>
           </div>
           <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-200 dark:border-amber-800">
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">Protocol Note</p>
              <p className="text-xs font-bold text-gray-500 leading-relaxed">Your data is synced globally across all seller marketplaces. Use your primary PIN for all authenticated nodes.</p>
           </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {activeFeedbackId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 sm:p-12 shadow-2xl relative">
              <button onClick={() => setActiveFeedbackId(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-6">Rate Your Experience</h3>
              
              <form onSubmit={handleFeedback} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">Rating Score</label>
                    <div className="flex gap-4">
                       {[1,2,3,4,5].map(s => (
                         <button 
                           key={s} 
                           type="button" 
                           onClick={() => setRating(s)}
                           className={`w-12 h-12 rounded-xl text-xl font-black transition-all ${rating >= s ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-100 text-gray-300'}`}
                         >
                           ★
                         </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">Your Comment</label>
                    <textarea 
                      required
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Tell the community how you liked this service..."
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm h-32 border-2 border-transparent focus:border-indigo-600 transition"
                    />
                 </div>

                 <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl">Sync Feedback</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
