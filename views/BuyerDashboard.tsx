
import React, { useState } from 'react';
import { User, Transaction, Dispute, DisputeStatus, Review, SellerRecommendation } from '../types';

interface BuyerDashboardProps {
  user: User;
  transactions: Transaction[];
  disputes: Dispute[];
  reviews: Review[];
  recommendations?: SellerRecommendation[];
  onRaiseDispute: (dispute: Dispute) => void;
  onAddReview: (review: Review) => void;
  onUpdateUser: (user: User) => void;
  onAddRecommendation?: (rec: SellerRecommendation) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user, transactions, disputes, reviews, recommendations = [], onRaiseDispute, onAddReview, onUpdateUser, onAddRecommendation }) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'profile' | 'recommendations'>('transactions');
  const [activeDisputeTid, setActiveDisputeTid] = useState<string | null>(null);
  const [activeReviewTid, setActiveReviewTid] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<any>('other');
  const [disputeDesc, setDisputeDesc] = useState('');
  
  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Seller Recommendation State
  const [showRecModal, setShowRecModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [recRating, setRecRating] = useState(5);
  const [recComment, setRecComment] = useState('');

  // Derive unique sellers from transactions for recommendation
  const myVendors = Array.from(new Set(transactions.map(t => JSON.stringify({ id: t.sellerId, name: t.storeName })))).map(s => JSON.parse(s as string));

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

  const handleSubmitRecommendation = () => {
    if (!selectedSellerId || !recComment.trim()) {
        alert("Please select a vendor and add a comment.");
        return;
    }
    const vendor = myVendors.find((v: any) => v.id === selectedSellerId);
    if (!vendor) return;

    onAddRecommendation?.({
        id: `rec-${Date.now()}`,
        sellerId: vendor.id,
        buyerId: user.id,
        buyerName: user.name,
        storeName: vendor.name,
        rating: recRating,
        comment: recComment,
        timestamp: Date.now()
    });
    setShowRecModal(false);
    setRecComment('');
    setRecRating(5);
    alert("Seller Recommendation Posted to Global Reputation Ledger.");
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({
          ...user,
          profilePicture: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2 dark:text-white">Buyer Portal</h2>
          <p className="text-gray-500 font-medium uppercase text-[10px] tracking-widest">Secure Account: {user.name}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setActiveTab('transactions')} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-400'}`}>Orders</button>
            <button onClick={() => setActiveTab('recommendations')} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'recommendations' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-400'}`}>Recommendations</button>
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-400'}`}>Profile</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'transactions' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
                <div className="p-8 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction History</h3>
                </div>
                {transactions.length === 0 ? (
                <div className="py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest">No transaction packets synced</div>
                ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {transactions.map(t => {
                    const activeDispute = disputes.find(d => d.transactionId === t.id);
                    const hasReviewed = reviews.some(r => r.productId === t.productId && r.buyerId === user.id);
                    const status = t.status || 'pending';

                    return (
                        <div key={t.id} className="p-8 space-y-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                        <div className="flex items-center justify-between">
                            <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{t.productName}</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    status === 'failed' ? 'bg-red-100 text-red-700' :
                                    status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>{status}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Store: {t.storeName}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">₦{t.amount.toLocaleString()}</p>
                            <div className="flex gap-4">
                                {activeDispute ? (
                                <span className="text-[8px] font-black uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Dispute: {activeDispute.status}</span>
                                ) : (
                                <button onClick={() => setActiveDisputeTid(t.id)} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline">Raise Dispute</button>
                                )}
                                {!hasReviewed && status === 'delivered' && (
                                <button onClick={() => setActiveReviewTid(t.id)} className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:underline">Leave Review</button>
                                )}
                            </div>
                            </div>
                        </div>
                        
                        {/* Show Seller Note if failed or relevant */}
                        {t.sellerNote && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500">
                                <p className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 mb-1">Seller Message</p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">"{t.sellerNote}"</p>
                            </div>
                        )}
                        </div>
                    );
                    })}
                </div>
                )}
            </div>
          )}

          {activeTab === 'recommendations' && (
              <div className="space-y-6 animate-slide-up">
                  <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl flex justify-between items-center">
                      <div>
                          <h3 className="font-black text-xl uppercase tracking-tighter">Vendor Endorsements</h3>
                          <p className="text-indigo-200 text-xs font-medium mt-1">Recommend sellers you've trusted to the global network.</p>
                      </div>
                      <button onClick={() => setShowRecModal(true)} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition">Recommend</button>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                      <div className="p-8 border-b border-gray-100 dark:border-slate-800">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">My Endorsements</h3>
                      </div>
                      {recommendations.filter(r => r.buyerId === user.id).length === 0 ? (
                          <div className="py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest">No recommendations made yet</div>
                      ) : (
                          <div className="divide-y divide-gray-100 dark:divide-slate-800">
                              {recommendations.filter(r => r.buyerId === user.id).map(r => (
                                  <div key={r.id} className="p-8 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                                      <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-black text-sm uppercase dark:text-white">{r.storeName}</h4>
                                          <span className="text-gray-400 text-[10px] font-mono">{new Date(r.timestamp).toLocaleDateString()}</span>
                                      </div>
                                      <div className="text-yellow-400 text-sm mb-2">{'⭐'.repeat(r.rating)}</div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{r.comment}"</p>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm h-fit">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Global Identity</h3>
           <div className="flex flex-col items-center mb-6">
              <div className="relative group w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-slate-700 mb-3">
                 {user.profilePicture ? (
                    <img src={user.profilePicture} className="w-full h-full object-cover" alt="Profile" />
                 ) : (
                    <span className="text-2xl text-gray-300">👤</span>
                 )}
                 <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white text-[9px] font-black uppercase">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} />
                 </label>
              </div>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest cursor-pointer hover:underline">Change Avatar</p>
           </div>
           <div className="space-y-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Name</p>
                 <p className="text-sm font-bold dark:text-white">{user.name}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Email</p>
                 <p className="text-xs font-bold text-gray-500">{user.email}</p>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-2">Protocol Note</p>
                 <p className="text-[10px] font-medium leading-relaxed italic text-gray-500">Your purchases are monitored by the Super Admin Justice Hub to ensure radical vendor transparency.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Review Modal */}
      {activeReviewTid && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border dark:border-slate-800 animate-slide-up">
              <button onClick={() => setActiveReviewTid(null)} className="absolute top-8 right-8 text-gray-400">✕</button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 dark:text-white">Verified Review</h3>
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
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl outline-none font-medium text-xs h-32 border border-gray-200 dark:border-slate-700"
                    />
                 </div>
                 <button onClick={handleSubmitReview} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Submit Verified Review</button>
              </div>
           </div>
        </div>
      )}

      {/* Recommendation Modal */}
      {showRecModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border dark:border-slate-800 animate-slide-up">
                  <button onClick={() => setShowRecModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">✕</button>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 dark:text-white">Recommend Vendor</h3>
                  <div className="space-y-6">
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Select Vendor</label>
                          <select 
                            value={selectedSellerId} 
                            onChange={e => setSelectedSellerId(e.target.value)}
                            className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl outline-none font-bold text-xs border border-gray-200 dark:border-slate-700"
                          >
                              <option value="">-- Choose verified vendor --</option>
                              {myVendors.map((v: any) => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Endorsement Rating</label>
                          <div className="flex gap-2">
                              {[1,2,3,4,5].map(r => (
                                  <button key={r} onClick={() => setRecRating(r)} className={`text-2xl ${recRating >= r ? 'opacity-100' : 'opacity-20'}`}>⭐</button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Public Comment</label>
                          <textarea 
                              value={recComment} 
                              onChange={e => setRecComment(e.target.value)}
                              placeholder="Why do you recommend this seller?"
                              className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl outline-none font-medium text-xs h-32 border border-gray-200 dark:border-slate-700"
                          />
                      </div>
                      <button onClick={handleSubmitRecommendation} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Broadcast Recommendation</button>
                  </div>
              </div>
          </div>
      )}

      {activeDisputeTid && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border dark:border-slate-800 animate-slide-up">
              <button onClick={() => setActiveDisputeTid(null)} className="absolute top-8 right-8 text-gray-400">✕</button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 dark:text-white">Initiate Dispute Panel</h3>
              <form onSubmit={handleRaiseDispute} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Primary Incident Reason</label>
                    <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl outline-none font-bold border border-gray-200 dark:border-slate-700 text-xs">
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
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl outline-none font-medium text-xs h-32 border border-gray-200 dark:border-slate-700"
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
