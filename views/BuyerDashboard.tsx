
import React, { useState } from 'react';
import { User, Transaction, Dispute, DisputeStatus, Review } from '../types';

interface BuyerDashboardProps {
  user: User;
  transactions: Transaction[];
  disputes: Dispute[];
  reviews: Review[];
  onRaiseDispute: (dispute: Dispute) => void;
  onAddReview: (review: Review) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user, transactions, disputes, reviews, onRaiseDispute, onAddReview }) => {
  const [activeDisputeTid, setActiveDisputeTid] = useState<string | null>(null);
  const [activeReviewTid, setActiveReviewTid] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<any>('other');
  const [disputeDesc, setDisputeDesc] = useState('');
  
  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction = transactions.find(t => t.id === activeDisputeTid);
    if (!transaction) return;

    onRaiseDispute({
      id: `dis-${Date.now()}`,
      transactionId: transaction.id,
      buyerId: user.id,
      sellerId: transaction.sellerId,
      reason: disputeReason,
      description: disputeDesc,
      status: DisputeStatus.OPEN,
      timestamp: Date.now()
    });
    setActiveDisputeTid(null);
    setDisputeDesc('');
    alert("DISPUTE FILED: Super Admin Justice Hub notified.");
  };

  const handleSubmitReview = () => {
    const transaction = transactions.find(t => t.id === activeReviewTid);
    if (!transaction) return;

    onAddReview({
        id: `rev-${Date.now()}`,
        productId: transaction.productId,
        buyerId: user.id,
        buyerName: user.name,
        rating: reviewRating,
        comment: reviewComment,
        timestamp: Date.now(),
        verifiedPurchase: true
    });
    setActiveReviewTid(null);
    setReviewComment('');
    alert("Review Submitted. Thank you.");
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2">Buyer Portal</h2>
          <p className="text-gray-500 font-medium uppercase text-[10px] tracking-widest">Secure Account: {user.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-gray-100">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction History</h3>
            </div>
            {transactions.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest">No transaction packets synced</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.map(t => {
                  const activeDispute = disputes.find(d => d.transactionId === t.id);
                  const hasReviewed = reviews.some(r => r.productId === t.productId && r.buyerId === user.id);
                  
                  return (
                    <div key={t.id} className="p-8 space-y-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900 uppercase text-sm">{t.productName}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Store: {t.storeName}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-lg font-black text-indigo-600">₦{t.amount.toLocaleString()}</p>
                          <div className="flex gap-4">
                             {activeDispute ? (
                               <span className="text-[8px] font-black uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Dispute: {activeDispute.status}</span>
                             ) : (
                               <button onClick={() => setActiveDisputeTid(t.id)} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline">Raise Dispute</button>
                             )}
                             {!hasReviewed && (
                               <button onClick={() => setActiveReviewTid(t.id)} className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:underline">Leave Review</button>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Global Identity</h3>
           <div className="space-y-4">
              <p className="text-sm font-bold">{user.name}</p>
              <p className="text-xs font-bold text-gray-500">{user.email}</p>
              <div className="pt-4 border-t border-gray-100">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-2">Protocol Note</p>
                 <p className="text-[10px] font-medium leading-relaxed italic text-gray-500">Your purchases are monitored by the Super Admin Justice Hub to ensure radical vendor transparency.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Review Modal */}
      {activeReviewTid && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative">
              <button onClick={() => setActiveReviewTid(null)} className="absolute top-8 right-8 text-gray-400">✕</button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Verified Review</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Rating</label>
                    <div className="flex gap-2">
                        {[1,2,3,4,5].map(r => (
                            <button key={r} onClick={() => setReviewRating(r)} className={`text-2xl ${reviewRating >= r ? 'opacity-100' : 'opacity-20'}`}>⭐</button>
                        ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Comment</label>
                    <textarea 
                      value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-xs h-32 border border-gray-200"
                    />
                 </div>
                 <button onClick={handleSubmitReview} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Submit Verified Review</button>
              </div>
           </div>
        </div>
      )}

      {activeDisputeTid && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative">
              <button onClick={() => setActiveDisputeTid(null)} className="absolute top-8 right-8 text-gray-400">✕</button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Initiate Dispute Panel</h3>
              <form onSubmit={handleRaiseDispute} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Primary Incident Reason</label>
                    <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold border border-gray-200">
                       <option value="fake_product">Fake / Counterfeit Product</option>
                       <option value="scam">Scam / Fraud Detected</option>
                       <option value="not_delivered">Items Not Delivered</option>
                       <option value="damaged">Items Damaged</option>
                       <option value="other">Other Incident</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Incident Details</label>
                    <textarea 
                      required value={disputeDesc} onChange={e => setDisputeDesc(e.target.value)}
                      placeholder="Provide evidence description for Admin Audit..."
                      className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-xs h-32 border border-gray-200"
                    />
                 </div>
                 <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Notify Justice Hub</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
