
import React, { useState } from 'react';
import { User, Transaction, Feedback, Dispute } from '../types';

interface BuyerDashboardProps {
  user: User;
  transactions: Transaction[];
  disputes: Dispute[];
  onFeedbackSubmit?: (transactionId: string, feedback: Feedback) => void;
  onFileDispute?: (dispute: Dispute) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user, transactions, disputes, onFeedbackSubmit, onFileDispute }) => {
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('Item Not Received');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const myPurchases = transactions;

  const handleDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDisputeId || !onFileDispute) return;

    const transaction = transactions.find(t => t.id === activeDisputeId);
    if (!transaction) return;

    onFileDispute({
      id: `case-${Date.now()}`,
      transactionId: activeDisputeId,
      buyerId: user.id,
      sellerId: transaction.sellerId,
      status: 'open',
      reason: disputeReason,
      createdAt: Date.now(),
      messages: [{
        id: `msg-${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        text: disputeDescription,
        timestamp: Date.now()
      }]
    });

    setActiveDisputeId(null);
    setDisputeDescription('');
    setDisputeReason('Item Not Received');
    alert("DISPUTE FILED: Case opened with global resolution center.");
  };

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
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setActiveFeedbackId(t.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition"
                        >
                          Rate Order
                        </button>
                        <button 
                          onClick={() => setActiveDisputeId(t.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition"
                        >
                          Report Issue
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 pt-2 border-t dark:border-slate-700/50">
                           <span className="text-amber-500 font-bold text-xs">{t.feedback.rating} ★</span>
                           <p className="text-xs italic text-gray-500 line-clamp-1">"{t.feedback.comment}"</p>
                        </div>
                        <button 
                          onClick={() => setActiveDisputeId(t.id)}
                          className="text-[8px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition"
                        >
                          Report Issue with Order
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Disputes Section */}
          {disputes.filter(d => d.buyerId === user.id).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-8 border-b dark:border-slate-800">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500">Active Disputes</h3>
              </div>
              <div className="divide-y dark:divide-slate-800">
                {disputes.filter(d => d.buyerId === user.id).map(d => (
                  <div key={d.id} className="p-8 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="font-black text-sm text-red-600">{d.reason}</p>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Case ID: {d.id}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${d.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                         {d.status}
                       </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                       <p className="line-clamp-2">Latest: {d.messages[d.messages.length - 1]?.text}</p>
                    </div>
                    {d.adminDecision && (
                       <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                          <p className="text-[8px] font-black uppercase text-indigo-500 tracking-widest mb-1">Admin Resolution</p>
                          <p className="font-bold text-xs text-indigo-800 dark:text-indigo-200">{d.adminDecision}</p>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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

      {/* Dispute Modal */}
      {activeDisputeId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 sm:p-12 shadow-2xl relative">
              <button onClick={() => setActiveDisputeId(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-6 text-red-600">File a Dispute</h3>
              <p className="text-gray-500 text-sm mb-6">Our admins will act as mediators if this cannot be resolved within 48 hours.</p>
              
              <form onSubmit={handleDispute} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">Reason for Dispute</label>
                    <select 
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600 transition"
                    >
                      <option value="Item Not Received">Item Not Received</option>
                      <option value="Item Not As Described">Item Not As Described</option>
                      <option value="Damaged Item">Damaged Item</option>
                      <option value="Other">Other</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">Detailed Description</label>
                    <textarea 
                      required
                      value={disputeDescription}
                      onChange={e => setDisputeDescription(e.target.value)}
                      placeholder="Please describe the issue in detail..."
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm h-32 border-2 border-transparent focus:border-indigo-600 transition"
                    />
                 </div>

                 <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl">Submit to Admin</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
