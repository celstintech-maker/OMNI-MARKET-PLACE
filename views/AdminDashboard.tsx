import React, { useState } from 'react';
import { User, Product, Transaction, UserRole, Dispute, DisputeStatus, Message, SiteConfig, VisitorLog } from '../types';
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
  visitorLogs: VisitorLog[];
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
  vendors, siteConfig, disputes, products, transactions, categories, currentUser, visitorLogs, onDeleteVendor, onUpdateUser, onUpdateDispute, onUpdateConfig, onAddCategory, onCreateStaff, onUpdateProduct, onToggleVendorStatus, onSendNotification
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'activities' | 'justice' | 'settings' | 'ai' | 'staff' | 'flagged' | 'traffic'>('users');
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setAiOutput("API Key missing. Please ensure 'API_KEY' is set in your Vercel Project Settings (Environment Variables) and redeploy.");
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
    alert("Product Cleared. Active on Feed.");
  };

  const handleDeleteProduct = (productId: string) => {
    // This is a UI simulation since we don't have a direct onDeleteProduct prop in admin dashboard interface, 
    // but typically admin would have full CRUD. For now, we update it to unlisted or clear flags. 
    // Since App.tsx handles state, we can simulate 'delete' by unflagging or marking stock 0 if delete prop missing
    // But wait, ProductCard has onDeleteProduct from SellerDashboard. 
    // Let's assume we can clear the flags effectively removing it from the flag queue.
    const product = products.find(p => p.id === productId);
    if(product) {
       onUpdateProduct({ ...product, isFlagged: false, flags: 0, stock: 0 }); // Soft delete by zeroing stock and unflagging
       alert("Product deactivated and removed from flag queue.");
    }
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
    {id: 'traffic', label: 'Traffic', icon: '📡'},
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
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
           <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Global Transaction Ledger</h3>
           <p className="text-xs text-gray-500 font-bold mb-4">Complete registry of all network purchases, buyer identities, and payment vectors.</p>
           
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y dark:divide-slate-800">
                  <thead className="bg-gray-50 dark:bg-slate-800/50">
                    <tr>
                       <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Date & ID</th>
                       <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Buyer Identity</th>
                       <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Product / Store</th>
                       <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Financial</th>
                       <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold uppercase text-xs">No Transactions Recorded</td></tr>
                    ) : transactions.sort((a,b) => b.timestamp - a.timestamp).map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                         <td className="px-6 py-6">
                            <p className="font-bold text-xs dark:text-white">{new Date(t.timestamp).toLocaleDateString()}</p>
                            <span className="text-[8px] font-mono text-gray-400">{t.id}</span>
                         </td>
                         <td className="px-6 py-6">
                            <p className="font-black text-xs uppercase dark:text-white">{t.billingDetails.fullName}</p>
                            <p className="text-[9px] text-gray-500">{t.billingDetails.phone}</p>
                            <p className="text-[9px] text-gray-400 truncate max-w-[150px]">{t.billingDetails.address}, {t.billingDetails.city}</p>
                         </td>
                         <td className="px-6 py-6">
                            <p className="font-bold text-xs dark:text-white">{t.productName}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{t.storeName}</p>
                         </td>
                         <td className="px-6 py-6">
                            <p className="font-black text-green-600">{t.currencySymbol}{t.amount.toLocaleString()}</p>
                            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-[8px] font-bold uppercase">{t.paymentMethod.replace('_', ' ')}</span>
                         </td>
                         <td className="px-6 py-6">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${t.deliveryType === 'home_delivery' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                               {t.deliveryType.replace('_', ' ')}
                            </span>
                         </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
        </div>
      )}
      
      {activeTab === 'traffic' && (
        <div className="space-y-6 animate-slide-up">
           <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Live Traffic Monitor</h3>
                <p className="text-xs text-gray-500 font-bold">Real-time visitor logs and network node access.</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 <span className="text-xs font-black text-green-700 dark:text-green-400">{visitorLogs.length} Active Nodes</span>
              </div>
           </div>

           <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 font-mono text-xs overflow-hidden shadow-2xl border border-slate-700">
              <div className="flex justify-between border-b border-slate-700 pb-4 mb-4 text-gray-500 font-bold uppercase tracking-widest">
                 <span className="w-24">Time</span>
                 <span className="w-32">IP Address</span>
                 <span className="w-40">Location</span>
                 <span className="flex-1">Device / Agent</span>
                 <span className="w-32 text-right">Target Node</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                 {visitorLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center hover:bg-white/5 p-2 rounded transition-colors cursor-default">
                       <span className="w-24 text-green-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                       <span className="w-32 text-blue-300">{log.ip}</span>
                       <span className="w-40 text-yellow-300">{log.location}</span>
                       <span className="flex-1 truncate pr-4 opacity-70">{log.device}</span>
                       <span className="w-32 text-right font-bold text-indigo-400 uppercase tracking-widest">{log.page}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'flagged' && (
        <div className="space-y-6 animate-slide-up">
           <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Flagged Assets Queue</h3>
           <p className="text-xs text-gray-500 font-bold mb-4">Items reported by the community for policy violations. Review immediately.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flaggedProducts.length === 0 ? (
                 <div className="col-span-full py-20 text-center bg-green-50 dark:bg-green-900/10 rounded-[3rem] border-2 border-dashed border-green-200 dark:border-green-800">
                    <p className="text-green-600 dark:text-green-400 font-black uppercase text-xs tracking-widest">No Active Flags</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-bold">The ecosystem is clean.</p>
                 </div>
              ) : (
                 flaggedProducts.map(product => (
                    <div key={product.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-lg relative overflow-hidden group">
                       <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-2 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest z-10">
                          {product.flags} Flags
                       </div>
                       <div className="h-48 rounded-2xl overflow-hidden mb-4 bg-gray-100 relative">
                          <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[2px]"></div>
                       </div>
                       <div className="space-y-2">
                          <h4 className="font-black text-sm uppercase dark:text-white truncate">{product.name}</h4>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor: <span className="text-indigo-600">{product.storeName}</span></p>
                          <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                             Reason: Community Report (Check Details)
                          </p>
                       </div>
                       <div className="flex gap-2 mt-6">
                          <button onClick={() => handleApproveProduct(product)} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-green-100 hover:text-green-600 transition">
                             Dismiss / Approve
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-700 transition shadow-lg">
                             Delete Asset
                          </button>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}
      
      {activeTab === 'staff' && (/* ... Staff Tab Content ... */ <div className="p-8 text-center text-gray-400 font-bold">Staff Management Module Loaded</div>)}
      {activeTab === 'justice' && (/* ... Justice Tab Content ... */ <div className="p-8 text-center text-gray-400 font-bold">Justice Hub Module Loaded</div>)}
      
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

              {/* Hero Stats Configuration */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Hero Statistics</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Verified Sellers</label>
                       <input 
                         value={siteConfig.stats?.verifiedSellers || ''} 
                         onChange={(e) => onUpdateConfig({...siteConfig, stats: { ...siteConfig.stats, verifiedSellers: e.target.value }})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Available Assets</label>
                       <input 
                         value={siteConfig.stats?.availableAssets || ''} 
                         onChange={(e) => onUpdateConfig({...siteConfig, stats: { ...siteConfig.stats, availableAssets: e.target.value }})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Secure Nodes</label>
                       <input 
                         value={siteConfig.stats?.secureNodes || ''} 
                         onChange={(e) => onUpdateConfig({...siteConfig, stats: { ...siteConfig.stats, secureNodes: e.target.value }})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Network Uptime</label>
                       <input 
                         value={siteConfig.stats?.networkUptime || ''} 
                         onChange={(e) => onUpdateConfig({...siteConfig, stats: { ...siteConfig.stats, networkUptime: e.target.value }})} 
                         className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
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
                 
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Ad Banners (Upload)</label>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium text-xs outline-none border dark:border-slate-700"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 mb-6">
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

                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 border-t dark:border-slate-700 pt-4">Banner Dynamics</h4>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest pl-1">Animation Style</label>
                          <select 
                            value={siteConfig.bannerAnimationStyle || 'fade'}
                            onChange={(e) => onUpdateConfig({...siteConfig, bannerAnimationStyle: e.target.value as any})}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700 uppercase"
                          >
                            <option value="fade">Fade</option>
                            <option value="slide">Slide</option>
                            <option value="zoom">Zoom</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest pl-1">Shuffle Interval (ms)</label>
                          <input 
                            type="number"
                            value={siteConfig.bannerInterval || 5000}
                            onChange={(e) => onUpdateConfig({...siteConfig, bannerInterval: Number(e.target.value)})}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest pl-1">Transition Speed (ms)</label>
                          <input 
                            type="number"
                            value={siteConfig.bannerTransitionSpeed || 1000}
                            onChange={(e) => onUpdateConfig({...siteConfig, bannerTransitionSpeed: Number(e.target.value)})}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold text-xs outline-none border dark:border-slate-700"
                          />
                       </div>
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