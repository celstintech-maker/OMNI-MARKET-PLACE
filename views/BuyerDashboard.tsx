
import React, { useState } from 'react';
import { User, Transaction, Dispute, DisputeStatus } from '../types';

interface BuyerDashboardProps {
  user: User;
  transactions: Transaction[];
  disputes: Dispute[];
  onRaiseDispute: (dispute: Dispute) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user, transactions, disputes, onRaiseDispute }) => {
  const [activeDisputeTid, setActiveDisputeTid] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<any>('other');
  const [disputeDesc, setDisputeDesc] = useState('');

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

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2">Buyer Portal</h2>
          <p className="text-gray-500 font-medium uppercase text-[10px] tracking-widest">Secure Node: {user.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-8 border-b dark:border-slate-800">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction History</h3>
            </div>
            {transactions.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest">No transaction packets synced</div>
            ) : (
              <div className="divide-y dark:divide-slate-800">
                {transactions.map(t => {
                  const activeDispute = disputes.find(d => d.transactionId === t.id);
                  return (
                    <div key={t.id} className="p-8 space-y-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{t.productName}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Node: {t.storeName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-indigo-600">₦{t.amount.toLocaleString()}</p>
                          {activeDispute ? (
                            <span className="text-[8px] font-black uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Dispute: {activeDispute.status}</span>
                          ) : (
                            <button onClick={() => setActiveDisputeTid(t.id)} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline">Raise Dispute</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm h-fit">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Global Identity</h3>
           <div className="space-y-4">
              <p className="text-sm font-bold">{user.name}</p>
              <p className="text-xs font-bold text-gray-500">{user.email}</p>
              <div className="pt-4 border-t dark:border-slate-800">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-2">Protocol Note</p>
                 <p className="text-[10px] font-medium leading-relaxed italic text-gray-500">Your purchases are monitored by the Super Admin Justice Hub to ensure radical vendor transparency.</p>
              </div>
           </div>
        </div>
      </div>

      {activeDisputeTid && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative">
              <button onClick={() => setActiveDisputeTid(null)} className="absolute top-8 right-8 text-gray-400">✕</button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Initiate Dispute Panel</h3>
              <form onSubmit={handleRaiseDispute} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Primary Incident Reason</label>
                    <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold">
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
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-medium text-xs h-32"
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
