
import React, { useState, useRef } from 'react';
import { Product, User, Dispute, Transaction, AIConfig, BankDetails } from '../types';
import { Icons, CATEGORIES } from '../constants';
import { SiteConfig } from '../App';

interface SellerDashboardProps {
  user: User;
  products: Product[];
  adminConfig: SiteConfig;
  disputes: Dispute[];
  transactions: Transaction[];
  onAddProduct: (product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  onBatchAddProducts?: (products: Product[]) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, products, adminConfig, disputes, transactions, onAddProduct, onDeleteProduct, onUpdateUser 
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'finance' | 'settings' | 'ai' | 'orders' | 'compliance'>('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Compliance/Settings Local State
  const [cacDraft, setCacDraft] = useState(user.verification?.cacRegistrationNumber || '');
  const [docPreview, setDocPreview] = useState<string | null>(user.verification?.govDocumentUrl || null);
  const [storeNameDraft, setStoreNameDraft] = useState(user.storeName || '');
  
  const identityDocRef = useRef<HTMLInputElement>(null);

  const [newListing, setNewListing] = useState({
    name: '',
    price: '',
    category: CATEGORIES[0],
    imageUrl: '',
    description: ''
  });

  const isVerified = user.verification?.verificationStatus === 'verified';
  const identityApproved = user.verification?.identityApproved;
  const myProducts = products.filter(p => p.sellerId === user.id);
  const myTransactions = transactions.filter(t => t.sellerId === user.id);

  const handleIdentitySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleComplianceSubmit = () => {
    onUpdateUser({
      ...user,
      verification: { 
        ...(user.verification as any), 
        cacRegistrationNumber: cacDraft,
        govDocumentUrl: docPreview || undefined
      }
    });
    alert("Compliance Packet Transmitted. Audit Pending.");
  };

  const handlePayRental = () => {
    onUpdateUser({ ...user, rentPaid: true });
    alert("Settlement Synchronized. Node fully activated.");
  };

  const handleUpdateStore = () => {
    onUpdateUser({ ...user, storeName: storeNameDraft });
    alert("Store Meta-Data Updated.");
  };

  const handleUpdateAI = (config: Partial<AIConfig>) => {
    onUpdateUser({
      ...user,
      aiConfig: { ...(user.aiConfig || { greeting: "Hi!", tone: "friendly", autoReplyEnabled: true, specialInstructions: "" }), ...config }
    });
  };

  if (!isVerified) {
    return (
       <div className="max-w-2xl mx-auto py-32 text-center space-y-8 bg-white dark:bg-slate-900 p-12 rounded-[3rem] border dark:border-slate-800 shadow-2xl animate-slide-up">
          <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 mx-auto text-4xl animate-pulse">⏳</div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Node Under Initial Audit</h2>
          <p className="text-gray-500 font-medium leading-relaxed uppercase text-xs tracking-widest">Global Protocol review in progress. Please wait for Super Admin initialization.</p>
       </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Rental Fee Logic */}
      {!user.rentPaid && (
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-indigo-600 animate-slide-up">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Settlement Required</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Shop Rental Fee: ₦{adminConfig.rentalPrice.toLocaleString()}</p>
                 <div className="bg-slate-800 p-4 rounded-xl mt-4 border border-slate-700">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Central Bank Details</p>
                    <pre className="text-xs font-mono opacity-80">{adminConfig.adminBankDetails}</pre>
                 </div>
              </div>
              <button onClick={handlePayRental} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition">Authorize Settlement</button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b dark:border-slate-800 pb-6 gap-6">
        <div>
           <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">{user.storeName || 'Merchant'} Node</h2>
           <div className="flex gap-6 mt-6 overflow-x-auto no-scrollbar">
             {['inventory', 'orders', 'ai', 'finance', 'compliance', 'settings'].map(tab => (
               <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`pb-2 text-[10px] uppercase tracking-widest font-black border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               >
                 {tab}
               </button>
             ))}
           </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition">
          <Icons.Plus /> Broadcast Signal
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
           {myProducts.length === 0 ? (
             <div className="col-span-full py-32 text-center border-2 border-dashed dark:border-slate-800 rounded-[3rem] text-gray-400 font-black uppercase text-[10px] tracking-widest">No active broadcast signals</div>
           ) : (
             myProducts.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border dark:border-slate-800 flex items-center gap-6 group">
                  <img src={p.imageUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                  <div className="flex-1">
                     <p className="font-black text-xs uppercase mb-1 truncate">{p.name}</p>
                     <p className="text-indigo-600 font-black text-xs">₦{p.price.toLocaleString()}</p>
                     <button onClick={() => onDeleteProduct(p.id)} className="text-[8px] font-black uppercase text-red-500 hover:underline mt-2">De-List Item</button>
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
           <div className="p-8 border-b dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Network Orders</h3>
              <span className="text-[10px] font-black uppercase text-indigo-600">{myTransactions.length} Total</span>
           </div>
           <div className="divide-y dark:divide-slate-800">
             {myTransactions.map(t => (
               <div key={t.id} className="p-8 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800/20 transition">
                  <div>
                    <p className="font-black text-sm uppercase">{t.productName}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">Ref: {t.id.slice(-8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-600 text-sm">₦{t.amount.toLocaleString()}</p>
                    <p className="text-[8px] font-black uppercase text-green-500">Fulfilled</p>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-10 animate-slide-up">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl animate-pulse">🤖</div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">AI Node Config</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Agent Greeting</label>
                    <input 
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border dark:border-slate-700 focus:border-indigo-600"
                      value={user.aiConfig?.greeting}
                      onChange={(e) => handleUpdateAI({ greeting: e.target.value })}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Agent Personality</label>
                    <select 
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold border dark:border-slate-700"
                      value={user.aiConfig?.tone}
                      onChange={(e) => handleUpdateAI({ tone: e.target.value as any })}
                    >
                       <option value="professional">Professional</option>
                       <option value="friendly">Friendly</option>
                       <option value="enthusiastic">Enthusiastic</option>
                       <option value="minimalist">Minimalist</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Knowledge Base Extension</label>
                 <textarea 
                   className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-medium text-xs h-40 border dark:border-slate-700 focus:border-indigo-600"
                   placeholder="Special instructions for your store agent..."
                   value={user.aiConfig?.specialInstructions}
                   onChange={(e) => handleUpdateAI({ specialInstructions: e.target.value })}
                 />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-8 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800">
                 <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Gross Yield</p>
                 <p className="text-3xl font-black">₦{myTransactions.reduce((a,b) => a+b.amount,0).toLocaleString()}</p>
              </div>
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white">
                 <p className="text-[10px] font-black uppercase opacity-60 mb-1">Wallet Nexus Balance</p>
                 <p className="text-3xl font-black">₦{(myTransactions.reduce((a,b) => a+b.amount,0) * 0.9).toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800">
                 <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Tax Node (10%)</p>
                 <p className="text-3xl font-black text-red-500">₦{(myTransactions.reduce((a,b) => a+b.amount,0) * 0.1).toLocaleString()}</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-10 animate-slide-up">
           <h3 className="text-2xl font-black uppercase tracking-tighter">Compliance Protocol</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">CAC Enterprise ID</label>
                    <input 
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold border dark:border-slate-700" 
                      value={cacDraft}
                      onChange={e => setCacDraft(e.target.value)}
                    />
                 </div>
                 <div className="p-10 border-2 border-dashed dark:border-slate-700 rounded-3xl text-center space-y-4">
                    <div className="text-3xl opacity-50">🪪</div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Gov-Issued Identity Artifact</p>
                    <button onClick={() => identityDocRef.current?.click()} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Select File</button>
                    <input type="file" ref={identityDocRef} className="hidden" onChange={handleIdentitySelect} />
                    {docPreview && <img src={docPreview} className="w-20 h-20 mx-auto rounded-lg object-cover" />}
                 </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-3xl space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-indigo-600">Protocol Guidelines</h4>
                 <ul className="text-[10px] font-bold text-gray-500 uppercase space-y-2">
                    <li>• Clear Artifact Visibility Required</li>
                    <li>• 24h Audit Sync Period</li>
                    <li>• One Year License Validity</li>
                 </ul>
              </div>
           </div>
           <button onClick={handleComplianceSubmit} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Authorize Compliance Submission</button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-8 animate-slide-up">
           <h3 className="text-2xl font-black uppercase tracking-tighter">Node Meta-Data</h3>
           <div className="space-y-6 max-w-xl">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Broadcast Store Name</label>
                 <input 
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold border dark:border-slate-700 focus:border-indigo-600" 
                    value={storeNameDraft}
                    onChange={e => setStoreNameDraft(e.target.value)}
                 />
              </div>
              <button onClick={handleUpdateStore} className="bg-slate-900 dark:bg-indigo-600 text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Update Meta-Data</button>
           </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative animate-slide-up">
              <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500">✕</button>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-10 text-center">New Broadcast Signal</h3>
              <div className="space-y-6">
                 <input placeholder="Item Name" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" onChange={e => setNewListing({...newListing, name: e.target.value})} />
                 <input placeholder="Price (₦)" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" onChange={e => setNewListing({...newListing, price: e.target.value})} />
                 <input placeholder="Image Artifact URL" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" onChange={e => setNewListing({...newListing, imageUrl: e.target.value})} />
                 <button 
                  onClick={() => { onAddProduct({...newListing, price: parseFloat(newListing.price), sellerId: user.id, storeName: user.storeName!}); setShowAddModal(false); }} 
                  className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                 >
                   Authorize Broadcast
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
