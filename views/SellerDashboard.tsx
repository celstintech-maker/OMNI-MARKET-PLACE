
import React, { useState, useRef, useEffect } from 'react';
import { Product, User, SellerVerification, BankDetails, Message, UserRole, Transaction, Dispute } from '../types';
import { Icons, CATEGORIES, COUNTRY_CURRENCY_MAP, PAYMENT_METHODS, NIGERIA_LOCATIONS, MOCK_STORES } from '../constants';
import { ChatSupport } from '../components/ChatSupport';

const GLOBAL_LOCATIONS: Record<string, string[]> = {
  'Nigeria': Object.keys(NIGERIA_LOCATIONS),
  'United States': ['Alabama', 'Alaska', 'Arizona', 'California', 'Colorado', 'Florida', 'Georgia', 'New York', 'Texas', 'Washington'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'Ontario', 'Quebec'],
  'Ghana': ['Greater Accra', 'Ashanti', 'Western', 'Central', 'Northern'],
  'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Free State'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru']
};

interface SellerDashboardProps {
  user: User;
  products: Product[];
  transactions?: Transaction[];
  disputes?: Dispute[];
  onAddProduct: (product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  unreadCount?: number;
  onClearNotifications?: () => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
  onReplyDispute?: (disputeId: string, message: Message) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, products, transactions = [], disputes = [], onAddProduct, onDeleteProduct, onUpdateUser, unreadCount = 0, onClearNotifications, onUpdateProduct, onReplyDispute, onUpdateTransaction 
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'messages' | 'ai' | 'finance' | 'feedback' | 'settings' | 'disputes'>('inventory');
  
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`ai_enabled_${user.id}`);
      return saved === null ? true : JSON.parse(saved);
    } catch {
      return true;
    }
  });
  const [aiPrompts, setAiPrompts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`ai_persona_${user.id}`);
      return saved ? JSON.parse(saved) : Array(10).fill('');
    } catch {
      return Array(10).fill('');
    }
  });
  const [chatDecay, setChatDecay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`ai_decay_${user.id}`);
      return saved ? JSON.parse(saved) : 5;
    } catch {
      return 5;
    }
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const productImagesRef = useRef<HTMLInputElement>(null);
  const productVideoRef = useRef<HTMLInputElement>(null);
  const govtIdInputRef = useRef<HTMLInputElement>(null);

  const [newListing, setNewListing] = useState({
    name: '',
    price: '',
    stock: '',
    category: CATEGORIES[0],
    description: '',
    images: [] as string[],
    videoUrl: ''
  });
  
  const [paymentForm, setPaymentForm] = useState({
    bankName: user.bankDetails?.bankName || '',
    accountNumber: user.bankDetails?.accountNumber || '',
    accountName: user.bankDetails?.accountName || '',
    paymentMethod: user.paymentMethod || 'bank_transfer',
    paystackSecret: '',
    paystackPublic: '',
    flutterwaveSecret: '',
    flutterwavePublic: '',
    stripeSecret: '',
    stripeWebhook: '',
    paypalClientId: '',
    paypalSecret: ''
  });

  const [showKeys, setShowKeys] = useState(false);

  const sellerProducts = products.filter(p => p.sellerId === user.id);
  const sellerTransactions = transactions.filter(t => t.sellerId === user.id);
  const sellerFeedback = sellerTransactions.filter(t => t.feedback).map(t => ({ ...t.feedback!, productName: t.productName }));
  
  const averageRating = sellerFeedback.length > 0 
    ? (sellerFeedback.reduce((a, b) => a + b.rating, 0) / sellerFeedback.length).toFixed(1)
    : 'N/A';

  const isVerified = user.verification?.verificationStatus === 'verified';
  const GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;
  const isGracePeriodActive = user.gracePeriodAllowed && 
                              user.registrationDate && 
                              (Date.now() - user.registrationDate < GRACE_PERIOD_MS) &&
                              !isVerified;
  
  const hasAccess = isVerified || isGracePeriodActive;
  const isExpired = user.subscriptionExpiry && Date.now() > user.subscriptionExpiry;

  const currency = COUNTRY_CURRENCY_MAP[user.verification?.country || 'Nigeria']?.symbol || '₦';

  const [bizForm, setBizForm] = useState({
    businessName: user.storeName || '',
    businessAddress: user.verification?.businessAddress || '',
    phoneNumber: user.verification?.phoneNumber || '',
    country: user.verification?.country || user.country || 'Nigeria',
    state: user.verification?.state || '',
    city: user.verification?.city || '',
    profilePictureUrl: user.verification?.profilePictureUrl || ''
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBizForm(prev => ({ ...prev, profilePictureUrl: base64 }));
        if (hasAccess) {
          onUpdateUser({
            ...user,
            verification: {
              ...user.verification!,
              profilePictureUrl: base64
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setNewListing(prev => ({ ...prev, images: [...prev.images, base64] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProductVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setNewListing(prev => ({ ...prev, videoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGovtIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBizForm(prev => ({ ...prev, govtIdUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAiConfig = () => {
    localStorage.setItem(`ai_persona_${user.id}`, JSON.stringify(aiPrompts));
    localStorage.setItem(`ai_enabled_${user.id}`, JSON.stringify(aiEnabled));
    localStorage.setItem(`ai_decay_${user.id}`, JSON.stringify(chatDecay));
    alert("AI Settings Saved: Changes updated for your store.");
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      paymentMethod: paymentForm.paymentMethod,
      bankDetails: {
        bankName: paymentForm.bankName,
        accountNumber: paymentForm.accountNumber,
        accountName: paymentForm.accountName
      }
    });
    alert("GATEWAY CONFIGURATION SYNCED: Your payment node is now active.");
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: User = {
      ...user,
      verification: {
        ...bizForm,
        verificationStatus: 'verified',
        verificationDate: Date.now(),
        productSamples: ['https://picsum.photos/400/300?random=sample1'],
        bankAccountVerified: !!(user.bankDetails?.accountNumber && user.bankDetails.bankName)
      }
    };
    onUpdateUser(updatedUser);
    alert("IDENTITY VERIFIED: Your seller node is now approved and active.");
  };

  const handleCreateListing = () => {
    if (newListing.images.length < 3) {
      alert("PROTOCOL ERROR: Minimum of 3 image assets required for node synchronization.");
      return;
    }
    if (!newListing.videoUrl) {
      alert("PROTOCOL ERROR: 15-second product verification video required.");
      return;
    }

    onAddProduct({ 
      name: newListing.name || 'New Listing', 
      sellerId: user.id, 
      price: parseFloat(newListing.price) || 0, 
      stock: parseInt(newListing.stock) || 0, 
      category: newListing.category, 
      description: newListing.description,
      storeName: user.storeName || 'Vendor Node',
      imageUrl: newListing.images[0],
      gallery: newListing.images,
      videoUrl: newListing.videoUrl
    });

    setNewListing({
      name: '',
      price: '',
      stock: '',
      category: CATEGORIES[0],
      description: '',
      images: [],
      videoUrl: ''
    });
    setShowAddModal(false);
  };

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center shadow-2xl border dark:border-slate-800">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 dark:text-white">Subscription Expired</h2>
          <p className="text-sm font-bold text-gray-500 mb-8">Your 1-year seller subscription has ended. Please contact support or renew to restore access.</p>
          <button onClick={() => alert("Renewal flow not implemented")} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition">
             Renew Subscription
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    const availableStates = GLOBAL_LOCATIONS[bizForm.country] || [];

    return (
      <div className="animate-fade-in space-y-6 sm:space-y-8 py-6 sm:py-12 max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 p-6 sm:p-12 text-center shadow-2xl">
           <h2 className="text-xl sm:text-3xl font-black mb-2 tracking-tighter uppercase">Identity Verification</h2>
           <p className="text-gray-500 mb-8 text-xs font-medium">Verify your business entity to activate your marketplace node.</p>
           
           
           
           {user.gracePeriodAllowed && (
             <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
                <h4 className="text-amber-800 dark:text-amber-400 font-black uppercase text-xs tracking-widest mb-2">Grace Period Expired</h4>
                <p className="text-amber-600 dark:text-amber-500 text-sm font-bold">Your 2-week grace period has ended. You must complete verification to continue selling.</p>
             </div>
           )}

           {user.verification?.verificationStatus === 'pending' ? (
             <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-black tracking-widest uppercase text-[10px] animate-pulse">
               Verification Protocol Pending Approval
             </div>
           ) : (
             <form onSubmit={handleSubmitVerification} className="space-y-6 text-left bg-gray-50 dark:bg-slate-800/50 p-6 rounded-[2rem]">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                      {bizForm.profilePictureUrl ? (
                        <img src={bizForm.profilePictureUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] font-black uppercase text-gray-400">Logo</span>
                      )}
                    </div>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    <button 
                      type="button" 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-lg shadow-lg hover:scale-110 transition"
                    >
                      <Icons.Camera />
                    </button>
                  </div>
                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Business Asset Upload</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required placeholder="Entity Name" value={bizForm.businessName} onChange={e => setBizForm({...bizForm, businessName: e.target.value})} className="w-full p-4 rounded-xl outline-none font-bold bg-white dark:bg-slate-900 shadow-sm" />
                  <input required placeholder="Contact Phone" value={bizForm.phoneNumber} onChange={e => setBizForm({...bizForm, phoneNumber: e.target.value})} className="w-full p-4 rounded-xl outline-none font-bold bg-white dark:bg-slate-900 shadow-sm" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select 
                    value={bizForm.country} 
                    onChange={e => setBizForm({...bizForm, country: e.target.value, state: '', city: ''})}
                    className="w-full p-4 rounded-xl border-none outline-none font-bold bg-white dark:bg-slate-900 shadow-sm appearance-none"
                  >
                    <option value="" disabled>Select Country</option>
                    {Object.keys(GLOBAL_LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select 
                    required
                    value={bizForm.state} 
                    onChange={e => setBizForm({...bizForm, state: e.target.value})}
                    className="w-full p-4 rounded-xl border-none outline-none font-bold bg-white dark:bg-slate-900 shadow-sm appearance-none"
                  >
                    <option value="" disabled>Select State/Region</option>
                    {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <input required placeholder="City" value={bizForm.city} onChange={e => setBizForm({...bizForm, city: e.target.value})} className="w-full p-4 rounded-xl outline-none font-bold bg-white dark:bg-slate-900 shadow-sm" />
                </div>

                <textarea required placeholder="Full physical location details..." value={bizForm.businessAddress} onChange={e => setBizForm({...bizForm, businessAddress: e.target.value})} className="w-full p-4 rounded-xl outline-none h-24 font-medium bg-white dark:bg-slate-900 shadow-sm" />
                
                <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">KYC Requirements</h3>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest block mb-2">Government ID</label>
                        <div 
                          onClick={() => govtIdInputRef.current?.click()}
                          className="w-full h-32 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-indigo-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800/50 transition"
                        >
                          {bizForm.govtIdUrl ? (
                            <img src={bizForm.govtIdUrl} className="h-full object-contain" />
                          ) : (
                            <span className="text-[8px] font-black uppercase text-indigo-400">Upload ID Document</span>
                          )}
                        </div>
                        <input type="file" ref={govtIdInputRef} onChange={handleGovtIdUpload} className="hidden" accept="image/*,application/pdf" />
                      </div>

                      <div>
                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest block mb-2">Tax ID / EIN / VAT</label>
                        <input 
                          required 
                          placeholder="Tax Identification Number" 
                          value={bizForm.taxId} 
                          onChange={e => setBizForm({...bizForm, taxId: e.target.value})} 
                          className="w-full p-4 rounded-xl outline-none font-bold bg-white dark:bg-slate-900 shadow-sm" 
                        />
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl mt-4 active:scale-95">Initialize Verification</button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-10 px-2 sm:px-0">
      {isGracePeriodActive && (
        <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl flex flex-col sm:flex-row justify-between items-center animate-pulse gap-4">
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-1">Grace Period Active</h3>
              <p className="text-xs opacity-80 font-medium">Your account is active for 2 weeks. Verification required thereafter.</p>
           </div>
           <div className="text-[10px] font-black uppercase bg-white/20 px-4 py-2 rounded-lg">
              {Math.ceil((GRACE_PERIOD_MS - (Date.now() - (user.registrationDate || 0))) / (1000 * 60 * 60 * 24))} Days Left
           </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-6">
           <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700">
                {user.verification?.profilePictureUrl ? (
                  <img src={user.verification.profilePictureUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-xl text-indigo-600">{user.storeName?.[0]}</div>
                )}
              </div>
              <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
           </div>
           <div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter">{user.storeName} Node</h2>
              <div className="flex gap-4 mt-2 overflow-x-auto no-scrollbar">
                {['inventory', 'orders', 'finance', 'feedback', 'disputes', 'messages', 'ai', 'settings'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)} 
                    className={`pb-2 text-[9px] uppercase tracking-widest font-black border-b-2 whitespace-nowrap transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
           </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition">
          <Icons.Plus /> Create Listing
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y dark:divide-slate-800 font-bold">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Listing</th>
                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Valuation</th>
                <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {sellerProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-10 py-6">{p.name}</td>
                  <td className="px-10 py-6 text-indigo-600">{currency}{p.price.toLocaleString()}</td>
                  <td className="px-10 py-6 text-right font-black">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sellerProducts.length === 0 && <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest">Inventory Node Empty</div>}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
           <div className="p-8 border-b dark:border-slate-800">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Fulfillment</h3>
           </div>
           <div className="divide-y dark:divide-slate-800">
             {sellerTransactions.length === 0 ? (
               <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest">No active orders</div>
             ) : (
               sellerTransactions.map(t => (
                 <div key={t.id} className="p-8 space-y-4 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="font-black text-sm">{t.productName}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Order ID: {t.id}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-indigo-600">{t.currencySymbol}{t.amount.toLocaleString()}</p>
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{new Date(t.timestamp).toLocaleDateString()}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800">
                       <div>
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Logistics Status</p>
                          {t.trackingCode ? (
                            <div>
                               <p className="font-bold text-xs text-green-600 flex items-center gap-1">
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                 Shipped via {t.carrier}
                               </p>
                               <p className="text-[10px] font-mono text-gray-500 mt-1">#{t.trackingCode}</p>
                            </div>
                          ) : (
                            <p className="font-bold text-xs text-amber-500 flex items-center gap-1">
                              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"/> Pending Shipment
                            </p>
                          )}
                       </div>
                       <button 
                         onClick={() => {
                           setEditingTransaction(t);
                           setTrackingForm({ code: t.trackingCode || '', carrier: t.carrier || '', url: t.trackingUrl || '' });
                         }}
                         className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition"
                       >
                         {t.trackingCode ? 'Update Tracking' : 'Add Tracking'}
                       </button>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      )}

      {/* Tracking Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative">
              <button onClick={() => setEditingTransaction(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-xl font-black tracking-tighter uppercase mb-6">Logistics Sync</h3>
              <form onSubmit={handleSaveTracking} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Carrier Name</label>
                    <input required value={trackingForm.carrier} onChange={e => setTrackingForm({...trackingForm, carrier: e.target.value})} placeholder="DHL, FedEx, UPS..." className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm"/>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Tracking Number</label>
                    <input required value={trackingForm.code} onChange={e => setTrackingForm({...trackingForm, code: e.target.value})} placeholder="Tracking Code" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm font-mono"/>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Tracking URL (Optional)</label>
                    <input value={trackingForm.url} onChange={e => setTrackingForm({...trackingForm, url: e.target.value})} placeholder="https://..." className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm"/>
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Update Status</button>
              </form>
           </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm animate-slide-up">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight">Payment & Settlement Node</h3>
              <button 
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest"
              >
                {showKeys ? '🙈 Hide Sensitive Keys' : '👁️ Show Sensitive Keys'}
              </button>
           </div>
           
           <form onSubmit={handleSavePayment} className="space-y-8">
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Primary Settlement Port</label>
                    <select 
                       value={paymentForm.paymentMethod}
                       onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                       className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm"
                    >
                       {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
                    </select>
                 </div>

                 <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-indigo-100 dark:border-slate-700 space-y-4">
                    {paymentForm.paymentMethod === 'paystack' && (
                       <div className="grid grid-cols-1 gap-4">
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Paystack Configuration</p>
                          <input 
                             type={showKeys ? "text" : "password"} 
                             placeholder="Paystack Secret Key (sk_live_...)" 
                             value={paymentForm.paystackSecret}
                             onChange={e => setPaymentForm({...paymentForm, paystackSecret: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                          <input 
                             type="text" 
                             placeholder="Paystack Public Key (pk_live_...)" 
                             value={paymentForm.paystackPublic}
                             onChange={e => setPaymentForm({...paymentForm, paystackPublic: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                       </div>
                    )}

                    {paymentForm.paymentMethod === 'flutterwave' && (
                       <div className="grid grid-cols-1 gap-4">
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Flutterwave Configuration</p>
                          <input 
                             type={showKeys ? "text" : "password"} 
                             placeholder="Flutterwave Secret Key (FLWSECK_...)" 
                             value={paymentForm.flutterwaveSecret}
                             onChange={e => setPaymentForm({...paymentForm, flutterwaveSecret: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                          <input 
                             type="text" 
                             placeholder="Flutterwave Public Key (FLWPUBK_...)" 
                             value={paymentForm.flutterwavePublic}
                             onChange={e => setPaymentForm({...paymentForm, flutterwavePublic: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                       </div>
                    )}

                    {paymentForm.paymentMethod === 'stripe' && (
                       <div className="grid grid-cols-1 gap-4">
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Stripe Configuration</p>
                          <input 
                             type={showKeys ? "text" : "password"} 
                             placeholder="Stripe Secret Key (sk_live_...)" 
                             value={paymentForm.stripeSecret}
                             onChange={e => setPaymentForm({...paymentForm, stripeSecret: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                          <input 
                             type={showKeys ? "text" : "password"} 
                             placeholder="Stripe Webhook Signing Secret (whsec_...)" 
                             value={paymentForm.stripeWebhook}
                             onChange={e => setPaymentForm({...paymentForm, stripeWebhook: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                       </div>
                    )}

                    {paymentForm.paymentMethod === 'paypal' && (
                       <div className="grid grid-cols-1 gap-4">
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">PayPal Business Configuration</p>
                          <input 
                             type="text" 
                             placeholder="PayPal Client ID" 
                             value={paymentForm.paypalClientId}
                             onChange={e => setPaymentForm({...paymentForm, paypalClientId: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                          <input 
                             type={showKeys ? "text" : "password"} 
                             placeholder="PayPal Client Secret" 
                             value={paymentForm.paypalSecret}
                             onChange={e => setPaymentForm({...paymentForm, paypalSecret: e.target.value})}
                             className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" 
                          />
                       </div>
                    )}

                    {paymentForm.paymentMethod === 'bank_transfer' && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input placeholder="Bank Name" value={paymentForm.bankName} onChange={e => setPaymentForm({...paymentForm, bankName: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" />
                          <input placeholder="Account No" value={paymentForm.accountNumber} onChange={e => setPaymentForm({...paymentForm, accountNumber: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" />
                          <input placeholder="Account Name" value={paymentForm.accountName} onChange={e => setPaymentForm({...paymentForm, accountName: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-sm border dark:border-slate-800" />
                       </div>
                    )}
                 </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition hover:scale-[1.01] active:scale-95">Update Settlement Node</button>
           </form>
        </div>
      )}

      {activeTab === 'settings' && (
         <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm animate-slide-up space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tight">Node Identity Settings</h3>
            <div className="flex flex-col items-center sm:items-start gap-8">
               <div className="relative group">
                 <div className="w-32 h-32 bg-gray-50 dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-indigo-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                    {user.verification?.profilePictureUrl ? (
                      <img src={user.verification.profilePictureUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl font-black text-indigo-600">{user.storeName?.[0]}</div>
                    )}
                 </div>
                 <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-xl shadow-xl hover:scale-110 transition"
                 >
                   <Icons.Camera />
                 </button>
                 <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
               </div>
               
               <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Public Store Name</label>
                    <input 
                      value={user.storeName} 
                      onChange={e => onUpdateUser({...user, storeName: e.target.value})}
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Registered Email</label>
                    <input 
                      disabled
                      value={user.email} 
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm opacity-50 cursor-not-allowed" 
                    />
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 p-8 rounded-[2rem] text-white flex flex-col justify-center">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Average Satisfaction</p>
                 <h4 className="text-5xl font-black">{averageRating}<span className="text-xl opacity-50 ml-2">/ 5.0</span></h4>
              </div>
              <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Recent Customer Feed</h4>
                 <div className="space-y-6">
                    {sellerFeedback.length === 0 ? (
                      <div className="py-10 text-center opacity-40 uppercase text-[10px] font-black tracking-widest">No reviews synced yet</div>
                    ) : (
                      sellerFeedback.map((f, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border dark:border-slate-800">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <p className="font-black text-xs uppercase tracking-widest text-indigo-600">{f.buyerName}</p>
                                 <p className="text-[9px] font-bold text-gray-400">On {f.productName}</p>
                              </div>
                              <div className="flex text-amber-500">
                                 {Array.from({length: 5}).map((_, star) => (
                                   <span key={star} className={star < f.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                                 ))}
                              </div>
                           </div>
                           <p className="text-sm font-medium italic text-gray-600 dark:text-gray-300">"{f.comment}"</p>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
           <div className="p-8 border-b dark:border-slate-800">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500">Dispute Resolution Center</h3>
           </div>
           <div className="divide-y dark:divide-slate-800">
             {disputes.filter(d => d.sellerId === user.id).length === 0 ? (
               <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest">No active disputes</div>
             ) : (
               disputes.filter(d => d.sellerId === user.id).map(d => (
                 <div key={d.id} className="p-8 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="font-black text-sm text-red-600">{d.reason}</p>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Case ID: {d.id}</p>
                       </div>
                       <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${d.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {d.status}
                          </span>
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mt-1">{new Date(d.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border dark:border-slate-800 mb-4 max-h-60 overflow-y-auto">
                       <div className="space-y-4">
                         {d.messages.map(msg => (
                           <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                             <div className={`max-w-[80%] p-3 rounded-xl text-xs font-medium ${msg.senderId === user.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border dark:border-slate-700'}`}>
                               {msg.text}
                             </div>
                             <span className="text-[8px] font-black uppercase text-gray-300 mt-1">{msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                           </div>
                         ))}
                       </div>
                    </div>

                    {d.status === 'open' && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!onReplyDispute || !replyText.trim()) return;
                        onReplyDispute(d.id, {
                          id: `msg-${Date.now()}`,
                          senderId: user.id,
                          senderName: user.storeName || user.name,
                          text: replyText,
                          timestamp: Date.now()
                        });
                        setReplyText('');
                      }} className="flex gap-4">
                         <input 
                           value={activeDisputeId === d.id ? replyText : ''}
                           onChange={e => { setActiveDisputeId(d.id); setReplyText(e.target.value); }}
                           onFocus={() => setActiveDisputeId(d.id)}
                           placeholder="Type your reply to the buyer..."
                           className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-xs"
                         />
                         <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-indigo-700 transition">Reply</button>
                      </form>
                    )}
                 </div>
               ))
             )}
           </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm animate-slide-up">
           <h3 className="text-xl font-black uppercase tracking-tight mb-8">AI Support Persona</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
             {aiPrompts.map((p, i) => (
               <input key={i} value={p} onChange={e => {
                 const next = [...aiPrompts];
                 next[i] = e.target.value;
                 setAiPrompts(next);
               }} placeholder={`Support Directive ${i+1}`} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-xs" />
             ))}
           </div>
           <button onClick={handleSaveAiConfig} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Save Directives</button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 sm:p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-400"><Icons.Logout /></button>
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-6">New Market Entry</h3>
              
              <div className="space-y-5">
                 <input placeholder="Product Name" value={newListing.name} onChange={e => setNewListing({...newListing, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm" />
                 <textarea placeholder="Product Description" value={newListing.description} onChange={e => setNewListing({...newListing, description: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-medium text-sm h-24" />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder={`Price (${currency})`} value={newListing.price} onChange={e => setNewListing({...newListing, price: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm" />
                    <input type="number" placeholder="Stock" value={newListing.stock} onChange={e => setNewListing({...newListing, stock: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm" />
                 </div>

                 <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Image Assets (Upload Min 3)</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                       {newListing.images.map((img, i) => (
                         <div key={i} className="aspect-square relative rounded-xl overflow-hidden border dark:border-slate-800">
                           <img src={img} className="w-full h-full object-cover" alt="" />
                           <button onClick={() => setNewListing(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-[8px]">✕</button>
                         </div>
                       ))}
                       <button onClick={() => productImagesRef.current?.click()} className="aspect-square bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-400 text-xl font-black">
                          +
                       </button>
                    </div>
                    <input type="file" ref={productImagesRef} onChange={handleProductImagesUpload} className="hidden" accept="image/*" multiple />
                 </div>

                 <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">15s Verification Video</p>
                    <div className="relative">
                      {newListing.videoUrl ? (
                        <div className="w-full h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                           <video src={newListing.videoUrl} className="w-full h-full object-cover opacity-50" />
                           <div className="absolute inset-0 flex items-center justify-center gap-2">
                              <span className="bg-green-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">Video Uploaded</span>
                              <button onClick={() => setNewListing(prev => ({ ...prev, videoUrl: '' }))} className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">Reset</button>
                           </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => productVideoRef.current?.click()}
                          className="w-full p-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 transition"
                        >
                           <Icons.Camera />
                           <span className="text-[10px] font-black uppercase tracking-widest mt-2">Upload MP4 / MOV</span>
                        </button>
                      )}
                      <input type="file" ref={productVideoRef} onChange={handleProductVideoUpload} className="hidden" accept="video/*" />
                    </div>
                 </div>

                 <button onClick={handleCreateListing} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl mt-6 active:scale-95 transition">Activate Listing</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
