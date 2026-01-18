import React, { useState, useRef, useEffect } from 'react';
import { Product, User, SellerVerification, BankDetails, Message, UserRole } from '../types';
import { Icons, CATEGORIES, COUNTRY_CURRENCY_MAP, PAYMENT_METHODS, NIGERIA_LOCATIONS, MOCK_STORES } from '../constants';
import { ChatSupport } from '../components/ChatSupport';

interface SellerDashboardProps {
  user: User;
  products: Product[];
  onAddProduct: (product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  unreadCount?: number;
  onClearNotifications?: () => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, products, onAddProduct, onDeleteProduct, onUpdateUser, unreadCount = 0, onClearNotifications, onUpdateProduct 
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'messages' | 'ai' | 'finance'>('inventory');
  
  // AI State management
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(`ai_enabled_${user.id}`);
    return saved === null ? true : JSON.parse(saved);
  });
  const [aiPrompts, setAiPrompts] = useState<string[]>(() => {
    const saved = localStorage.getItem(`ai_persona_${user.id}`);
    return saved ? JSON.parse(saved) : Array(10).fill('');
  });
  const [chatDecay, setChatDecay] = useState<number>(() => {
    const saved = localStorage.getItem(`ai_decay_${user.id}`);
    return saved ? JSON.parse(saved) : 5;
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const sellerProducts = products.filter(p => p.sellerId === user.id);
  const totalValuation = sellerProducts.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
  const commissionRate = 0.10; 
  const projectedEarnings = totalValuation * (1 - commissionRate);
  
  const myStoreId = MOCK_STORES.find(s => s.sellerId === user.id)?.id || `st-${user.id}`;
  const isVerified = user.verification?.verificationStatus === 'verified';
  const currency = COUNTRY_CURRENCY_MAP[user.verification?.country || 'Nigeria']?.symbol || '₦';

  const storeLink = `${window.location.origin}${window.location.pathname}#/store/${encodeURIComponent(user.storeName || '')}`;

  const [bizForm, setBizForm] = useState({
    businessName: user.storeName || '',
    businessAddress: user.verification?.businessAddress || '',
    phoneNumber: user.verification?.phoneNumber || '',
    country: user.verification?.country || user.country || 'Nigeria',
    state: user.verification?.state || '',
    city: user.verification?.city || ''
  });

  const handleSaveAiConfig = () => {
    localStorage.setItem(`ai_persona_${user.id}`, JSON.stringify(aiPrompts));
    localStorage.setItem(`ai_enabled_${user.id}`, JSON.stringify(aiEnabled));
    localStorage.setItem(`ai_decay_${user.id}`, JSON.stringify(chatDecay));
    alert("AI Settings Saved: Changes updated for your store.");
  };

  const handleStockUpdate = (product: Product, newStock: number) => {
    if (onUpdateProduct) {
      onUpdateProduct({ ...product, stock: Math.max(0, newStock) });
    }
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      verification: {
        ...bizForm,
        profilePictureUrl: 'https://picsum.photos/200/200?random=biz',
        verificationStatus: 'pending',
        productSamples: ['https://picsum.photos/400/300?random=sample1']
      }
    };
    onUpdateUser(updatedUser);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdatePayment = (methodId: string) => {
    onUpdateUser({ ...user, paymentMethod: methodId });
    setShowPaymentModal(false);
  };

  if (!isVerified) {
    return (
      <div className="animate-fade-in space-y-8 py-8 sm:py-12 max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 p-8 sm:p-12 text-center shadow-2xl">
           <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-tighter">Account Verification</h2>
           <p className="text-gray-500 mb-10 text-sm font-medium">Complete verification to start selling products.</p>
           
           {user.verification?.verificationStatus === 'pending' ? (
             <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2rem] border-2 border-dashed border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-black tracking-widest uppercase text-[10px] animate-pulse">
               Waiting for Admin Approval
             </div>
           ) : (
             <form onSubmit={handleSubmitVerification} className="space-y-4 text-left bg-gray-50 dark:bg-slate-800/50 p-6 rounded-[2rem]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 px-2 tracking-widest">Business Name</label>
                    <input required placeholder="Business Name" value={bizForm.businessName} onChange={e => setBizForm({...bizForm, businessName: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-white dark:bg-slate-900 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 px-2 tracking-widest">Phone Number</label>
                    <input required placeholder="+123..." value={bizForm.phoneNumber} onChange={e => setBizForm({...bizForm, phoneNumber: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-white dark:bg-slate-900 shadow-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 px-2 tracking-widest">Country</label>
                  <select 
                    value={bizForm.country} 
                    onChange={e => setBizForm({...bizForm, country: e.target.value})}
                    className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-white dark:bg-slate-900 shadow-sm appearance-none"
                  >
                    {Object.keys(COUNTRY_CURRENCY_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 px-2 tracking-widest">State / Province</label>
                    <input required placeholder="State" value={bizForm.state} onChange={e => setBizForm({...bizForm, state: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-white dark:bg-slate-900 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 px-2 tracking-widest">City</label>
                    <input required placeholder="City" value={bizForm.city} onChange={e => setBizForm({...bizForm, city: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-white dark:bg-slate-900 shadow-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 px-2 tracking-widest">Business Address</label>
                  <textarea required placeholder="Full physical address..." value={bizForm.businessAddress} onChange={e => setBizForm({...bizForm, businessAddress: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none h-24 text-sm font-medium bg-white dark:bg-slate-900 shadow-sm" />
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200 mt-4 transition-transform active:scale-95">Submit for Verification</button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-10 px-4 sm:px-0">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-4">{user.storeName} Hub</h2>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {['inventory', 'finance', 'messages', 'ai'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`pb-3 text-[10px] uppercase tracking-widest font-black border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
              >
                {tab === 'ai' ? 'AI Settings' : tab}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
          <Icons.Plus /> New Listing
        </button>
      </div>

      {activeTab === 'ai' && (
        <div className="space-y-8 animate-slide-up max-w-4xl">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <div>
                      <h3 className="text-xl font-black tracking-tight uppercase">AI Sales Agent</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customize how your store's AI interacts</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2 pr-4 rounded-2xl border dark:border-slate-700">
                  <button 
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative ${aiEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${aiEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Agent {aiEnabled ? 'Active' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">AI Auto-Delete</h4>
                  <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700">
                    <label className="text-[9px] font-black uppercase text-gray-400 block mb-2">Delete Inactive Chats (Minutes)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        min="1"
                        max="60"
                        value={chatDecay}
                        onChange={(e) => setChatDecay(parseInt(e.target.value) || 5)}
                        className="w-24 p-3 bg-white dark:bg-slate-900 rounded-xl outline-none font-black text-indigo-600 border dark:border-slate-700"
                      />
                      <p className="text-[10px] font-bold text-gray-500 leading-tight">
                        Inactive chats will be cleared after this time to keep things fresh.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                   <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800 w-full">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Status Report</p>
                      <p className="text-xs font-bold text-gray-500">
                        {aiEnabled ? `Agent is handling questions with a ${chatDecay}m delete threshold.` : "AI is off. You'll need to answer questions manually."}
                      </p>
                   </div>
                </div>
              </div>
              
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] mb-4">Store Instructions (Max 10)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {aiPrompts.map((prompt, idx) => (
                     <div key={idx} className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest px-1">Instruction {idx + 1}</label>
                        <input 
                          value={prompt}
                          onChange={(e) => {
                            const newPrompts = [...aiPrompts];
                            newPrompts[idx] = e.target.value;
                            setAiPrompts(newPrompts);
                          }}
                          placeholder={`E.g., Offer 10% discount on bulk orders...`}
                          className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border-none outline-none font-bold text-sm shadow-inner focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                     </div>
                   ))}
                 </div>
                 <button 
                  onClick={handleSaveAiConfig}
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:scale-[1.01] active:scale-95 transition-all mt-8"
                 >
                   Save AI Settings
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="flex flex-col gap-4 sm:gap-6 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Value</p>
                 <p className="text-3xl sm:text-4xl font-black">{currency}{totalValuation.toLocaleString()}</p>
              </div>
              <div className="bg-green-600 p-6 sm:p-8 rounded-[2rem] text-white shadow-xl shadow-green-100 dark:shadow-none">
                 <p className="text-[10px] font-black text-green-200 uppercase tracking-widest mb-2">Expected Payout (After Fees)</p>
                 <p className="text-3xl sm:text-4xl font-black">{currency}{projectedEarnings.toLocaleString()}</p>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm">
              <h4 className="text-[10px] font-black uppercase mb-6 tracking-widest text-gray-400">Store Link</h4>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                 <div className="flex-1 w-full truncate">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Shareable Link</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-indigo-300 truncate">{storeLink}</p>
                 </div>
                 <button 
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto bg-white dark:bg-slate-800 text-indigo-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 dark:border-indigo-700 shadow-sm active:scale-95 transition-all"
                 >
                   {copied ? 'Copied!' : 'Copy Link'}
                 </button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm">
              <h4 className="text-[10px] font-black uppercase mb-6 tracking-widest text-gray-400">Payment Settings</h4>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800">
                 <div className="text-3xl">🏦</div>
                 <div className="flex-1 text-center sm:text-left">
                    <p className="font-black text-sm">{PAYMENT_METHODS.find(m => m.id === user.paymentMethod)?.name || 'Direct Bank Settlement'}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Safe Payouts within 24 Hours</p>
                 </div>
                 <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="text-indigo-600 font-black text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-4 decoration-indigo-200"
                 >
                   Edit Details
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="block lg:hidden divide-y dark:divide-slate-800">
            {sellerProducts.map(p => (
              <div key={p.id} className="p-6 space-y-3">
                 <div className="flex justify-between items-start">
                    <span className="text-sm font-black dark:text-white leading-none truncate max-w-[60%]">{p.name}</span>
                    <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         min="0"
                         value={p.stock}
                         onChange={(e) => handleStockUpdate(p, parseInt(e.target.value) || 0)}
                         className="w-16 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg text-center font-black text-[10px] outline-none border border-transparent focus:border-indigo-600"
                       />
                       <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${p.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>Units</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-1">
                    <span className="text-indigo-600 font-black text-lg">{currency}{p.price.toLocaleString()}</span>
                    <button className="text-[8px] font-black uppercase tracking-widest text-gray-400 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-xl">Edit</button>
                 </div>
              </div>
            ))}
            {sellerProducts.length === 0 && <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest">No Products Found</div>}
          </div>

          <table className="hidden lg:table min-w-full divide-y dark:divide-slate-800 font-bold">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name</th>
                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {sellerProducts.map(p => (
                <tr key={p.id}>
                  <td className="px-10 py-6">{p.name}</td>
                  <td className="px-10 py-6 text-indigo-600">{currency}{p.price.toLocaleString()}</td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Update Stock:</label>
                       <input 
                         type="number" 
                         min="0"
                         value={p.stock}
                         onChange={(e) => handleStockUpdate(p, parseInt(e.target.value) || 0)}
                         className="w-20 p-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-center font-black text-xs outline-none border border-transparent focus:border-indigo-600 transition-all"
                       />
                       <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{p.stock < 5 ? 'Low' : 'OK'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 h-[600px] flex animate-slide-up overflow-hidden shadow-sm">
          <ChatSupport 
            currentUser={user} 
            isEmbedded={true} 
            forcedChannelId={myStoreId} 
            theme="light" 
            aiInstructions={aiPrompts.filter(p => p.trim() !== '')}
            decayMinutes={chatDecay}
          />
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-8 shadow-2xl space-y-8 relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-8 right-8 text-gray-400 p-2"><Icons.Logout /></button>
            <h3 className="text-2xl font-black tracking-tighter">Payment Node</h3>
            <div className="space-y-3">
              {PAYMENT_METHODS.map(m => (
                <button 
                  key={m.id}
                  onClick={() => handleUpdatePayment(m.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${user.paymentMethod === m.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-100 dark:border-slate-800 hover:border-indigo-200'}`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="font-black text-sm">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 sm:p-10 shadow-2xl space-y-6 sm:space-y-8 relative max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-400 p-2"><Icons.Logout /></button>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tighter">Add New Item</h3>
              <div className="space-y-4">
                 <input placeholder="Item Name" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold shadow-sm" />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input placeholder="Price" type="number" className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold shadow-sm" />
                    <input placeholder="Stock Quantity" type="number" className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold shadow-sm" />
                 </div>
                 <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none appearance-none shadow-sm">
                   {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <button onClick={() => { onAddProduct({ name: 'New Item', sellerId: user.id, price: 100, stock: 10, category: 'Electronics', storeName: user.storeName }); setShowAddModal(false); }} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200">Post Item</button>
           </div>
        </div>
      )}
    </div>
  );
};