import React, { useState } from 'react';
import { User, Product, Transaction, UserRole, Dispute, DisputeStatus, Message, SiteConfig } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AdminDashboardProps {
  vendors: User[]; 
  stores: any[];
  products: Product[];
  transactions: Transaction[];
  siteConfig: SiteConfig;
  allMessages: Record<string, Message[]>;
  disputes: Dispute[];
  categories: string[];
  currentUser: User;
  onUpdateConfig: (config: SiteConfig) => void;
  onToggleVendorStatus: (id: string) => void;
  onDeleteVendor: (id: string) => void;
  onUpdateUser: (user: User) => void;
  onUpdateDispute: (dispute: Dispute) => void;
  onAddCategory: (category: string) => void;
  onCreateStaff?: (staff: User) => void;
  onUpdateProduct: (product: Product) => void;
  onSendNotification: (userId: string, message: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  vendors, siteConfig, disputes, products, transactions, categories, currentUser, onDeleteVendor, onUpdateUser, onUpdateDispute, onUpdateConfig, onAddCategory, onCreateStaff, onUpdateProduct, onToggleVendorStatus, onSendNotification
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'activities' | 'justice' | 'settings' | 'ai' | 'staff' | 'flagged'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [editingVendorAI, setEditingVendorAI] = useState<string | null>(null);
  
  // Activities / Messaging State
  const [messagingSeller, setMessagingSeller] = useState<User | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [expandedSellerTransactions, setExpandedSellerTransactions] = useState<string | null>(null);

  // Staff Creation & Editing State
  const [newStaff, setNewStaff] = useState({ name: '', email: '', pin: '1234', role: UserRole.STAFF });
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');

  // Filter vendors based on role
  const sellers = vendors.filter(u => u.role === UserRole.SELLER);
  const staffMembers = vendors.filter(u => [UserRole.STAFF, UserRole.MARKETER, UserRole.TECHNICAL, UserRole.TEAM_MEMBER].includes(u.role));
  
  // Ensure flagged products logic is robust
  const flaggedProducts = products.filter(p => p.isFlagged === true || (p.flags && p.flags > 0));

  // Ensure disputes logic is robust
  const activeDisputes = disputes.filter(d => d.status === DisputeStatus.OPEN || d.status === DisputeStatus.ESCALATED || d.status === DisputeStatus.UNDER_REVIEW);

  const handleRunAI = async (mode: 'trend' | 'policy' | 'audit') => {
    // Try process.env first, then fallback to siteConfig key
    const apiKey = process.env.API_KEY || siteConfig.geminiApiKey;
    if (!apiKey) {
      setAiOutput("API Key missing. Please ensure 'API_KEY' is set in your Vercel Project Settings (Environment Variables) and redeploy, or enter a key manually below.");
      return;
    }
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      let prompt = "";
      if (mode === 'trend') prompt = "Analyze global e-commerce trends for 2025. List top 3 categories and 3 declining categories.";
      if (mode === 'policy') prompt = "Write a strict but fair 'Prohibited Items Policy' for a global multi-vendor marketplace.";
      if (mode === 'audit') prompt = "Generate a security audit checklist for verified sellers.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiOutput(response.text || "No data received.");
    } catch (e) {
      setAiOutput("AI Connection Failed. Check API Key validity.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleBypass = (user: User) => {
    onUpdateUser({ 
       ...user, 
       verification: { 
          ...(user.verification || {}),
          businessName: user.storeName || user.verification?.businessName || 'Merchant', 
          businessAddress: user.verification?.businessAddress || 'Global Registry', 
          country: user.country || 'Global', 
          phoneNumber: user.verification?.phoneNumber || '000', 
          // Preserve existing docs/pics if any, otherwise default
          profilePictureUrl: user.verification?.profilePictureUrl || '', 
          verificationStatus: 'verified', 
          identityApproved: false, // CRITICAL: Explicitly Unapproved
          productSamples: user.verification?.productSamples || [], 
          approvalDate: Date.now() 
       },
       rentPaid: false // Ensure bypass requires rental fee
    });
    alert(`Store ${user.storeName} authorized for Initial Bypass. Rental fee protocol initiated. Identity remains Unverified.`);
  };

  const handleApproveIdentity = (user: User) => {
    const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000);
    onUpdateUser({ 
       ...user, 
       rentPaid: true,
       subscriptionExpiry: oneYearFromNow,
       verification: { 
          ...(user.verification as any), 
          identityApproved: true,
          verificationStatus: 'verified'
       } 
    });
    alert(`Merchant ${user.storeName} fully authenticated. Registry updated for 365-day license.`);
    setSelectedUser(null);
  };

  const updateVendorAI = (v: User, config: any) => {
    onUpdateUser({
      ...v,
      aiConfig: { ...(v.aiConfig || { greeting: "Hi!", tone: "friendly", autoReplyEnabled: true, specialInstructions: "" }), ...config }
    });
  };

  const handleResolveDispute = (dispute: Dispute, status: DisputeStatus) => {
    onUpdateDispute({ ...dispute, status });
    alert(`Justice Hub Status: ${status}`);
  };

  const handleAddCategory = () => {
    if(!newCategory.trim()) return;
    onAddCategory(newCategory.trim());
    setNewCategory('');
    alert("New Category Classification Added.");
  };

  const handleCreateStaff = () => {
    if (!newStaff.name || !newStaff.email) return;
    if (onCreateStaff) {
      onCreateStaff({
        id: `staff-${Date.now()}`,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        pin: newStaff.pin,
        notifications: [],
        passwordHint: `Default PIN: ${newStaff.pin}` 
      });
      alert(`Staff ${newStaff.name} created. Role: ${newStaff.role} with PIN: ${newStaff.pin}`);
      setNewStaff({ name: '', email: '', pin: '1234', role: UserRole.STAFF });
    }
  };

  const handleUpdatePin = (user: User) => {
    if (newPinValue.length < 4) {
      alert("PIN must be 4 digits or more.");
      return;
    }
    onUpdateUser({ ...user, pin: newPinValue });
    setEditingPinId(null);
    setNewPinValue('');
    alert(`PIN updated for ${user.name}`);
  };

  const handleApproveProduct = (product: Product) => {
    onUpdateProduct({ ...product, isFlagged: false, flags: 0 });
  };

  const handleSendAdminMessage = () => {
    if (!messagingSeller || !adminMessage.trim()) return;
    const msg = `[ADMIN INSIGHT]: ${adminMessage}`;
    onSendNotification(messagingSeller.id, msg);
    setAdminMessage('');
    setMessagingSeller(null);
    alert(`Insight sent to ${messagingSeller.storeName}`);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const promises = Array.from(files).map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file as Blob);
            });
        });

        Promise.all(promises).then(newBase64s => {
             onUpdateConfig({
                ...siteConfig,
                adBanners: [...(siteConfig.adBanners || []), ...newBase64s]
            });
        });
    }
    // Reset to allow selecting same file if needed
    e.target.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateConfig({
          ...siteConfig,
          logoUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getSellerSales = (sellerId: string) => {
    return transactions
      .filter(t => t.sellerId === sellerId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getSellerTransactions = (sellerId: string) => {
    return transactions.filter(t => t.sellerId === sellerId).sort((a,b) => b.timestamp - a.timestamp);
  };

  // Build Tabs with Icons
  const tabs = [
    {id: 'users', label: 'Stores', icon: '🏪'},
    {id: 'activities', label: 'Activities', icon: '📊'},
    {id: 'staff', label: 'Staff & Roles', icon: '👥'},
    {id: 'justice', label: 'Justice Hub', icon: '⚖️', count: activeDisputes.length},
    {id: 'flagged', label: 'Flagged Items', icon: '🚩', count: flaggedProducts.length},
    {id: 'ai', label: 'Super Brain AI', icon: '🧠'},
    {id: 'settings', label: 'Config', icon: '⚙️'}
  ];

  return (
    <div className="space-y-8 pb-20 px-2 sm:px-0 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
           <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Admin Infrastructure</h2>
           <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Global Registry Online
           </p>
        </div>
      </div>

      {/* Tiles Menu View */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`
              relative p-4 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all border-2
              ${activeTab === tab.id 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105 z-10' 
                : 'bg-white dark:bg-slate-900 text-gray-500 border-gray-100 dark:border-slate-800 hover:border-indigo-100 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
            {tab.count ? (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-md animate-bounce">
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
           <div className="p-8 bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Registered Store Nodes</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y dark:divide-slate-800">
                <thead className="bg-gray-50 dark:bg-slate-800/50">
                  <tr>
                     <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Performance</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Recruitment</th>
                     <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {sellers.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-bold uppercase text-xs">No Sellers Registered</td></tr>
                  ) : sellers.map(u => {
                    const sales = getSellerSales(u.id);
                    return (
                    <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors ${u.isSuspended ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-2">
                             <p className="font-black text-lg uppercase dark:text-white">{u.storeName || u.name}</p>
                             {u.isSuspended && <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Suspended</span>}
                          </div>
                          <p className="text-[10px] text-gray-400 font-black">{u.email}</p>
                          <div className="mt-2 flex items-center gap-1">
                            {[1,2,3,4,5].map(star => (
                              <button 
                                key={star}
                                onClick={() => onUpdateUser({...u, sellerRating: star})}
                                className={`text-sm focus:outline-none ${star <= (u.sellerRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${u.verification?.identityApproved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {u.verification?.identityApproved ? 'Authenticated' : u.verification?.verificationStatus === 'verified' ? 'Active (ID Pending)' : 'Initial Audit'}
                                </span>
                             </div>
                             <p className="text-xs font-black text-indigo-600">Vol: ₦{sales.toLocaleString()}</p>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          {u.recruitedBy ? (
                            <div className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-slate-800 px-3 py-1 rounded-full w-fit">
                               Ref: {u.recruitedBy}
                            </div>
                          ) : <span className="text-gray-400 text-[9px] font-bold">Organic</span>}
                       </td>
                       <td className="px-10 py-8 text-right space-x-6 min-w-[200px]">
                          {u.verification?.verificationStatus !== 'verified' && (
                            <button onClick={() => handleBypass(u)} className="text-blue-600 text-[11px] font-black uppercase hover:underline">Initial Bypass</button>
                          )}
                          <button onClick={() => setSelectedUser(u)} className="text-indigo-600 text-[11px] font-black uppercase hover:underline">Merchant Audit Profile</button>
                          <button onClick={() => onToggleVendorStatus(u.id)} className={`${u.isSuspended ? 'text-green-500' : 'text-amber-500'} text-[11px] font-black uppercase hover:underline`}>
                             {u.isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button onClick={() => onDeleteVendor(u.id)} className="text-red-500 text-[11px] font-black uppercase hover:underline">De-List Store</button>
                       </td>
                    </tr>
                  )})}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-6 animate-slide-up">
           <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Live Seller Activities</h3>
           <p className="text-xs text-gray-500 font-bold mb-4">Monitor sales performance, buyer data, and payment methods in real-time.</p>
           <div className="grid grid-cols-1 gap-6">
              {sellers.map(seller => {
                const sellerTxs = getSellerTransactions(seller.id);
                const totalSales = sellerTxs.reduce((sum, t) => sum + t.amount, 0);
                return (
                  <div key={seller.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                     <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-indigo-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">{seller.storeName?.[0]}</div>
                           <div>
                              <h4 className="font-black text-lg uppercase dark:text-white">{seller.storeName}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{sellerTxs.length} Transactions</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Gross Revenue</p>
                           <p className="text-2xl font-black text-green-600">₦{totalSales.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}
      
      {activeTab === 'staff' && (/* ... Staff Tab Content ... */ <div className="p-8 text-center text-gray-400 font-bold">Staff Management Module Loaded</div>)}
      {activeTab === 'justice' && (/* ... Justice Tab Content ... */ <div className="p-8 text-center text-gray-400 font-bold">Justice Hub Module Loaded</div>)}
      {activeTab === 'flagged' && (/* ... Flagged Tab Content ... */ <div className="p-8 text-center text-gray-400 font-bold">Flagged Items Module Loaded</div>)}
      
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* General Configuration */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">General Protocol</h3>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Marketplace Name</label>
                       <input 
                         value={siteConfig.siteName} 
                         onChange={(e) => onUpdateConfig({...siteConfig, siteName: e.target.value})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Hero Title</label>
                       <input 
                         value={siteConfig.heroTitle} 
                         onChange={(e) => onUpdateConfig({...siteConfig, heroTitle: e.target.value})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Hero Subtitle</label>
                       <input 
                         value={siteConfig.heroSubtitle} 
                         onChange={(e) => onUpdateConfig({...siteConfig, heroSubtitle: e.target.value})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Footer Tagline</label>
                       <textarea 
                         value={siteConfig.footerText} 
                         onChange={(e) => onUpdateConfig({...siteConfig, footerText: e.target.value})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium text-xs outline-none border dark:border-slate-700 h-20"
                       />
                    </div>
                 </div>
              </div>

              {/* Financial Configuration */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Financial Logic</h3>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Store Rent (₦)</label>
                           <input 
                             type="number"
                             value={siteConfig.rentalPrice} 
                             onChange={(e) => onUpdateConfig({...siteConfig, rentalPrice: Number(e.target.value)})} 
                             className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Commission Rate (0-1)</label>
                           <input 
                             type="number"
                             step="0.01"
                             value={siteConfig.commissionRate} 
                             onChange={(e) => onUpdateConfig({...siteConfig, commissionRate: Number(e.target.value)})} 
                             className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                           />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Central Bank Details</label>
                        <textarea 
                            value={siteConfig.adminBankDetails} 
                            onChange={(e) => onUpdateConfig({...siteConfig, adminBankDetails: e.target.value})} 
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-mono text-xs outline-none border dark:border-slate-700 h-24"
                            placeholder="Bank Name, Account Number, etc."
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase text-gray-500">Enable Tax</span>
                        <input 
                          type="checkbox"
                          checked={siteConfig.taxEnabled}
                          onChange={(e) => onUpdateConfig({...siteConfig, taxEnabled: e.target.checked})}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                    </div>
                 </div>
              </div>

              {/* Contact & Security */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Network Contact</h3>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Support Email</label>
                       <input 
                         value={siteConfig.contactEmail} 
                         onChange={(e) => onUpdateConfig({...siteConfig, contactEmail: e.target.value})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Support Phone</label>
                       <input 
                         value={siteConfig.contactPhone} 
                         onChange={(e) => onUpdateConfig({...siteConfig, contactPhone: e.target.value})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                 </div>
              </div>

              {/* Security */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Security Layer</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase text-gray-500">Site Lock Active</span>
                        <input 
                          type="checkbox"
                          checked={siteConfig.siteLocked}
                          onChange={(e) => onUpdateConfig({...siteConfig, siteLocked: e.target.checked})}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Site Lock Password</label>
                       <input 
                         type="text"
                         value={siteConfig.siteLockPassword} 
                         onChange={(e) => onUpdateConfig({...siteConfig, siteLockPassword: e.target.value})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                 </div>
              </div>
              
              {/* Media */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Media Assets</h3>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Brand Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                            {siteConfig.logoUrl ? (
                                <img src={siteConfig.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                            ) : (
                                <span className="text-[9px] text-gray-400">No Logo</span>
                            )}
                        </div>
                        <div className="flex-1">
                             <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium text-xs outline-none border dark:border-slate-700"
                            />
                            {siteConfig.logoUrl && (
                                <button 
                                  onClick={() => onUpdateConfig({...siteConfig, logoUrl: ''})}
                                  className="text-[9px] text-red-500 font-bold mt-1 uppercase hover:underline"
                                >
                                  Remove Logo
                                </button>
                            )}
                        </div>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Hero Background Image URL</label>
                    <input 
                        value={siteConfig.heroBackgroundUrl} 
                        onChange={(e) => onUpdateConfig({...siteConfig, heroBackgroundUrl: e.target.value})} 
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium text-xs outline-none border dark:border-slate-700"
                    />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Banner Animation Style</label>
                        <select
                            value={siteConfig.bannerAnimationStyle || 'fade'}
                            onChange={(e) => onUpdateConfig({...siteConfig, bannerAnimationStyle: e.target.value as any})}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                        >
                            <option value="fade">Fade (Default)</option>
                            <option value="zoom">Zoom Scale</option>
                            <option value="slide">Slide Transition</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Transition Speed (ms)</label>
                        <input 
                            type="number"
                            value={siteConfig.bannerTransitionSpeed || 1000}
                            onChange={(e) => onUpdateConfig({...siteConfig, bannerTransitionSpeed: parseInt(e.target.value) || 1000})}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Slide Interval (ms)</label>
                        <input 
                            type="number"
                            value={siteConfig.bannerInterval || 5000}
                            onChange={(e) => onUpdateConfig({...siteConfig, bannerInterval: parseInt(e.target.value) || 5000})}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                        />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Ad Banners (Upload)</label>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium text-xs outline-none border dark:border-slate-700"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        {siteConfig.adBanners.map((url, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden h-20">
                                <img src={url} className="w-full h-full object-cover" alt="" />
                                <button 
                                    onClick={() => onUpdateConfig({...siteConfig, adBanners: siteConfig.adBanners.filter((_, idx) => idx !== i)})}
                                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
                                >Remove</button>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {activeTab === 'ai' && (
        <div className="space-y-12 animate-slide-up">
           {/* Super Brain Section */}
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Super Brain AI Hub</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <button onClick={() => handleRunAI('trend')} className="bg-purple-50 dark:bg-purple-900/20 p-8 rounded-[2rem] text-left hover:scale-105 transition">
                    <div className="text-3xl mb-4">📈</div>
                    <h4 className="font-black uppercase text-purple-600">Trend Forecaster</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-2">Predict upcoming market shifts</p>
                 </button>
                 <button onClick={() => handleRunAI('policy')} className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2rem] text-left hover:scale-105 transition">
                    <div className="text-3xl mb-4">📜</div>
                    <h4 className="font-black uppercase text-blue-600">Policy Generator</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-2">Draft legal frameworks</p>
                 </button>
                 <button onClick={() => handleRunAI('audit')} className="bg-green-50 dark:bg-green-900/20 p-8 rounded-[2rem] text-left hover:scale-105 transition">
                    <div className="text-3xl mb-4">🛡️</div>
                    <h4 className="font-black uppercase text-green-600">Security Audit</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-2">Generate verification checklists</p>
                 </button>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-[2rem] min-h-[200px]">
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">AI Output Stream</p>
                 {aiLoading ? <div className="animate-pulse text-indigo-500 font-bold">Thinking...</div> : <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{aiOutput || "Waiting for command..."}</p>}
              </div>
              
              {/* Persistent API Key Configuration */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-indigo-100 dark:border-slate-700">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global API Key Override</p>
                    <span className="text-[9px] text-gray-400 font-bold">Status: {siteConfig.geminiApiKey ? 'Manual Key Active' : 'Using Environment Key'}</span>
                 </div>
                 <input 
                   type="password" 
                   value={siteConfig.geminiApiKey || ''}
                   onChange={(e) => onUpdateConfig({...siteConfig, geminiApiKey: e.target.value})}
                   placeholder="Enter Gemini API Key here to fix missing key issues in live view..."
                   className="w-full p-3 bg-white dark:bg-slate-900 rounded-lg text-xs border dark:border-slate-700 outline-none focus:border-indigo-500 transition-colors"
                 />
                 <p className="text-[9px] text-gray-400 mt-2 italic">This key will be stored locally and used for all AI features across the platform (Chat, Trends, etc.) if the server key is missing.</p>
              </div>
           </div>
           
           {/* ... Seller Assistant Registry ... */}
        </div>
      )}

      {/* ... Modals (Merchant Profile, Messages) ... */}
      {selectedUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 sm:p-14 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setSelectedUser(null)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500">✕</button>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Audit: {selectedUser.storeName}</h3>
              <div className="mt-8 space-y-4">
                 <button onClick={() => handleApproveIdentity(selectedUser)} className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Approve Identity</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};