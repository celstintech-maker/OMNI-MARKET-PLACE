
import React, { useState } from 'react';
import { User, Product, Transaction, UserRole, Dispute, DisputeStatus, Message, SiteConfig, VisitorLog, SellerRecommendation } from '../types';
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
  sellerRecommendations?: SellerRecommendation[];
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
  vendors, siteConfig, disputes, products, transactions, categories, currentUser, visitorLogs, sellerRecommendations = [], onDeleteVendor, onUpdateUser, onUpdateDispute, onUpdateConfig, onAddCategory, onCreateStaff, onUpdateProduct, onToggleVendorStatus, onSendNotification
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'activities' | 'justice' | 'settings' | 'ai' | 'staff' | 'flagged' | 'traffic'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  
  // User List Filter
  const [userListFilter, setUserListFilter] = useState<'sellers' | 'buyers'>('sellers');

  // Staff Creation State
  const [newStaff, setNewStaff] = useState({ name: '', email: '', pin: '1234', role: UserRole.STAFF as UserRole });

  // Config Form State
  const [configForm, setConfigForm] = useState<SiteConfig>(siteConfig);
  
  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filter vendors based on role
  const sellers = vendors.filter(u => u.role === UserRole.SELLER);
  const buyers = vendors.filter(u => u.role === UserRole.BUYER);
  const staffMembers = vendors.filter(u => [UserRole.STAFF, UserRole.MARKETER, UserRole.TECHNICAL, UserRole.TEAM_MEMBER].includes(u.role));
  
  // Pending Extension Requests
  const pendingExtensions = vendors.filter(v => v.pendingExtensionRequest);
  
  // Pending Rent Payments
  const pendingRentPayments = vendors.filter(v => v.rentPaymentStatus === 'pending');

  // Ensure flagged products logic is robust
  const flaggedProducts = products.filter(p => p.isFlagged === true || (p.flags && p.flags > 0));

  // Ensure disputes logic is robust
  const activeDisputes = disputes.filter(d => d.status === DisputeStatus.OPEN || d.status === DisputeStatus.ESCALATED || d.status === DisputeStatus.UNDER_REVIEW);

  const handleRunAI = async (mode: 'trend' | 'policy' | 'audit') => {
    const apiKey = configForm.geminiApiKey || process.env.API_KEY;
    
    if (!apiKey) {
      setAiOutput("API Key missing. Please set 'Gemini API Key' in Admin Settings or environment variables.");
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
    } catch (e: any) {
      console.error("AI Error Full:", e);
      const errorMessage = e.message || e.toString();
      setAiOutput(`AI Connection Failed.\n\nError Details:\n${errorMessage}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleBypass = (user: User) => {
    onUpdateUser({ 
       ...user,
       verification: { ...user.verification!, verificationStatus: 'verified', approvalDate: Date.now() },
       rentPaid: true,
       rentPaymentStatus: 'confirmed',
       subscriptionExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year free
    });
    alert("Vendor Bypass Activated: Verified & Rent Paid.");
  };

  const handleApproveRent = (user: User) => {
      onUpdateUser({
          ...user,
          rentPaid: true,
          rentPaymentStatus: 'confirmed',
          subscriptionExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 Year
          joinedAt: Date.now() // Reset join date for fairness or keep original
      });
      onSendNotification(user.id, "Payment Confirmed: Your store rent has been approved. You are now live.");
      alert("Rent Payment Approved");
  };

  const handleApproveExtension = (user: User) => {
      if (!user.pendingExtensionRequest) return;
      const months = user.pendingExtensionRequest.durationMonths;
      const extensionMs = months * 30 * 24 * 60 * 60 * 1000;
      
      onUpdateUser({
          ...user,
          subscriptionExpiry: (user.subscriptionExpiry || Date.now()) + extensionMs,
          pendingExtensionRequest: undefined
      });
      onSendNotification(user.id, `Extension Approved: Your store subscription has been extended by ${months} months.`);
      alert("Extension Request Approved");
  };

  const handleCreateStaff = () => {
    if (!newStaff.name || !newStaff.email) {
        alert("Name and Email required");
        return;
    }
    onCreateStaff?.({
        id: `stf-${Date.now()}`,
        ...newStaff,
        joinedAt: Date.now(),
        verification: { businessName: 'Internal', businessAddress: 'HQ', country: 'Global', phoneNumber: '000', profilePictureUrl: '', verificationStatus: 'verified', productSamples: [] }
    });
    setNewStaff({ name: '', email: '', pin: '1234', role: UserRole.STAFF });
    alert("Staff Member Created");
  };

  const handleApproveCompliance = (user: User) => {
    onUpdateUser({
        ...user,
        verification: { ...user.verification!, verificationStatus: 'verified', approvalDate: Date.now() }
    });
    onSendNotification(user.id, "Compliance Approved: Your identity documents have been verified.");
    alert("Vendor Verified");
  };

  const handleAddCategory = () => {
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName);
          setNewCategoryName('');
          alert("Category Added");
      }
  };

  const handleConfigChange = (field: keyof SiteConfig, value: any) => {
      setConfigForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = () => {
      onUpdateConfig(configForm);
      alert("Global Configuration Updated");
  };

  const handleRemoveBanner = (index: number) => {
      const updated = { ...configForm, adBanners: configForm.adBanners.filter((_, i) => i !== index) };
      setConfigForm(updated);
  };

  const handleFileUpload = (file: File, callback: (result: string) => void) => {
    if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') callback(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendDocumentReminder = (user: User) => {
    onSendNotification(user.id, "Action Required: Please submit your outstanding verification documents (ID, Business License) to complete your verification and avoid suspension.");
    alert(`Document reminder sent to ${user.email}`);
  };

  // Menu Tiles Configuration
  const menuItems = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'flagged', label: 'Flagged', icon: '🚩' },
    { id: 'justice', label: 'Justice', icon: '⚖️' },
    { id: 'activities', label: 'Activities', icon: '⚡' },
    { id: 'traffic', label: 'Traffic', icon: '🌐' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'staff', label: 'Staff', icon: '🛡️' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase dark:text-white">Central Command</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Global Admin: {currentUser.name}</p>
          </div>
       </div>

       {/* Menu Grid (Tiles View) */}
       <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {menuItems.map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveTab(item.id as any)} 
               className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${activeTab === item.id 
                 ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105 z-10' 
                 : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-900'
               }`}
             >
               <span className="text-xl">{item.icon}</span>
               <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
             </button>
          ))}
       </div>

       {activeTab === 'users' && (
          <div className="space-y-8 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pending Rent */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Pending Rent Approvals</h3>
                      {pendingRentPayments.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No pending payments.</p>
                      ) : (
                          <div className="space-y-4">
                              {pendingRentPayments.map(user => (
                                  <div key={user.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center">
                                      <div>
                                          <p className="font-black text-xs uppercase dark:text-white">{user.storeName}</p>
                                          <button onClick={() => setViewingProof(user.rentPaymentProof!)} className="text-[9px] text-indigo-500 font-bold hover:underline">View Receipt</button>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleApproveRent(user)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase">Approve</button>
                                          <button onClick={() => onSendNotification(user.id, "Payment Rejected. Please re-upload clear proof.")} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Reject</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  {/* Pending Extensions */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Subscription Extensions</h3>
                      {pendingExtensions.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No extension requests.</p>
                      ) : (
                          <div className="space-y-4">
                              {pendingExtensions.map(user => (
                                  <div key={user.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center">
                                      <div>
                                          <p className="font-black text-xs uppercase dark:text-white">{user.storeName}</p>
                                          <p className="text-[9px] text-gray-500">{user.pendingExtensionRequest?.durationMonths} Months • ₦{user.pendingExtensionRequest?.amount.toLocaleString()}</p>
                                          <button onClick={() => setViewingProof(user.pendingExtensionRequest?.proofOfPayment!)} className="text-[9px] text-indigo-500 font-bold hover:underline">View Receipt</button>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleApproveExtension(user)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase">Approve</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* User Directory */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">User Directory</h3>
                      <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                          <button 
                            onClick={() => setUserListFilter('sellers')} 
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition ${userListFilter === 'sellers' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                          >
                            Sellers
                          </button>
                          <button 
                            onClick={() => setUserListFilter('buyers')} 
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition ${userListFilter === 'buyers' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                          >
                            Buyers
                          </button>
                      </div>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                      {(userListFilter === 'sellers' ? sellers : buyers).map(user => (
                          <div key={user.id} className="p-8 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition cursor-pointer" onClick={() => setSelectedUser(user)}>
                              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <h4 className="font-black text-sm uppercase dark:text-white">{user.storeName || user.name}</h4>
                                          {user.isSuspended && <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Suspended</span>}
                                          {user.verification?.verificationStatus === 'verified' && <span className="bg-green-100 text-green-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Verified</span>}
                                      </div>
                                      <p className="text-[10px] text-gray-400 font-mono mt-1">{user.email} • ID: {user.id}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => setSelectedUser(user)} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-gray-200 dark:hover:bg-slate-600">View Profile</button>
                                      {user.role === UserRole.SELLER && (
                                        <>
                                          <button onClick={() => handleBypass(user)} className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-100">Quick Verify</button>
                                          <button onClick={() => onToggleVendorStatus(user.id)} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase text-white ${user.isSuspended ? 'bg-green-600' : 'bg-amber-500'}`}>
                                              {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                                          </button>
                                          {user.verification?.verificationStatus === 'pending' && user.verification.govDocumentUrl && (
                                              <button onClick={() => handleApproveCompliance(user)} className="bg-green-600 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-green-700">Approve Compliance</button>
                                          )}
                                        </>
                                      )}
                                      <button onClick={() => onDeleteVendor(user.id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-red-100">Delete</button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
       )}

       {activeTab === 'activities' && (
          <div className="space-y-8 animate-slide-up">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Recent System Activities</h3>
                  <div className="space-y-4">
                      {transactions.slice(0, 10).map(t => (
                          <div key={t.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-xs uppercase dark:text-white">New Transaction</p>
                                  <p className="text-[10px] text-gray-500">{t.id} • ₦{t.amount.toLocaleString()}</p>
                              </div>
                              <span className="text-[9px] font-mono text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</span>
                          </div>
                      ))}
                      {visitorLogs.slice(0, 10).map(l => (
                          <div key={l.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center opacity-70">
                              <div>
                                  <p className="font-bold text-xs uppercase dark:text-white">Visitor Access</p>
                                  <p className="text-[10px] text-gray-500">{l.ip} • {l.location}</p>
                              </div>
                              <span className="text-[9px] font-mono text-gray-400">{new Date(l.timestamp).toLocaleTimeString()}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
       )}

       {activeTab === 'flagged' && (
           <div className="space-y-8 animate-slide-up">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
                 <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6">Flagged Assets (Community Reports)</h3>
                 {flaggedProducts.length === 0 ? (
                     <p className="text-xs text-gray-400 italic">No flagged products found.</p>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {flaggedProducts.map(p => (
                             <div key={p.id} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex gap-4">
                                 <img src={p.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt="" />
                                 <div className="flex-1">
                                     <p className="font-black text-xs uppercase dark:text-white">{p.name}</p>
                                     <p className="text-[9px] text-gray-500">Flags: {p.flags || 0}</p>
                                     <div className="flex gap-2 mt-2">
                                         <button onClick={() => onUpdateProduct({ ...p, isFlagged: false, flags: 0 })} className="text-[9px] font-black uppercase text-green-600 hover:underline">Clear Flags</button>
                                         <button onClick={() => {
                                             onUpdateProduct({ ...p, isFlagged: false, flags: 0 }); // Actually remove from list or hide
                                             // In a real app, maybe delete product or ban seller
                                             alert("Product Delisted (Simulated)");
                                         }} className="text-[9px] font-black uppercase text-red-600 hover:underline">Delist Item</button>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
              </div>
           </div>
       )}

       {activeTab === 'traffic' && (
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm animate-slide-up">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Live Network Traffic</h3>
               <div className="h-64 overflow-y-auto no-scrollbar font-mono text-[10px] space-y-2 bg-black text-green-400 p-4 rounded-2xl">
                   {visitorLogs.map(log => (
                       <div key={log.id} className="flex justify-between border-b border-green-900/30 pb-1">
                           <span>[{new Date(log.timestamp).toLocaleTimeString()}] IP: {log.ip}</span>
                           <span>{log.location} • {log.page}</span>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {activeTab === 'justice' && (
           <div className="space-y-8 animate-slide-up">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                   <div className="p-8 border-b border-gray-100 dark:border-slate-800">
                       <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Dispute Resolution Console</h3>
                   </div>
                   <div className="divide-y divide-gray-100 dark:divide-slate-800">
                       {activeDisputes.length === 0 ? (
                           <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase">No active disputes. System Nominal.</div>
                       ) : (
                           activeDisputes.map(d => (
                               <div key={d.id} className="p-8">
                                   <div className="flex justify-between items-start mb-4">
                                       <div>
                                           <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-full">{d.reason.replace('_', ' ')}</span>
                                           <p className="font-black text-sm uppercase mt-2 dark:text-white">Case #{d.id}</p>
                                       </div>
                                       <span className="text-[9px] font-bold text-gray-400">{new Date(d.timestamp).toLocaleDateString()}</span>
                                   </div>
                                   <p className="text-xs text-gray-600 dark:text-gray-300 italic mb-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">"{d.description}"</p>
                                   <div className="flex gap-2">
                                       <button onClick={() => onUpdateDispute({ ...d, status: DisputeStatus.RESOLVED })} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-green-700">Resolve (Favor Buyer)</button>
                                       <button onClick={() => onUpdateDispute({ ...d, status: DisputeStatus.REFUNDED })} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700">Issue Refund</button>
                                       <button onClick={() => onUpdateDispute({ ...d, status: DisputeStatus.RESOLVED, adminNote: 'Closed in favor of seller' })} className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-gray-300">Close Case</button>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'staff' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
                   <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Create Staff Access</h3>
                   <div className="space-y-4">
                       <input value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Staff Name" className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       <input value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="Staff Email" className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value as UserRole })} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700">
                           <option value={UserRole.STAFF}>General Staff</option>
                           <option value={UserRole.MARKETER}>Marketer</option>
                           <option value={UserRole.TECHNICAL}>Technical</option>
                           <option value={UserRole.TEAM_MEMBER}>Team Member</option>
                       </select>
                       <button onClick={handleCreateStaff} className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700">Issue Credentials</button>
                   </div>
               </div>
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
                   <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Active Personnel</h3>
                   <div className="space-y-4">
                       {staffMembers.map(s => (
                           <div key={s.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                               <div>
                                   <p className="font-black text-xs uppercase dark:text-white">{s.name}</p>
                                   <p className="text-[9px] text-gray-500">{s.role}</p>
                               </div>
                               <button onClick={() => onDeleteVendor(s.id)} className="text-red-500 text-[10px] font-black uppercase hover:underline">Revoke</button>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'settings' && (
           <div className="space-y-8 animate-slide-up">
               {/* 1. Identity & Branding */}
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm space-y-6">
                   <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Identity & Branding</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Platform Name</label>
                           <input value={configForm.siteName} onChange={e => handleConfigChange('siteName', e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                       
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Platform Logo</label>
                           <div className="flex items-center gap-4">
                               {configForm.logoUrl && (
                                   <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border dark:border-slate-700">
                                       <img src={configForm.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                                   </div>
                               )}
                               <label className="cursor-pointer bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex-1 text-center border border-transparent hover:border-indigo-500">
                                   Upload Logo
                                   <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) handleFileUpload(file, (res) => handleConfigChange('logoUrl', res));
                                   }} />
                               </label>
                           </div>
                       </div>

                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hero Title</label>
                           <input value={configForm.heroTitle} onChange={e => handleConfigChange('heroTitle', e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hero Subtitle</label>
                           <input value={configForm.heroSubtitle} onChange={e => handleConfigChange('heroSubtitle', e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                       
                       <div className="md:col-span-2 space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hero Background</label>
                           <div className="space-y-2">
                               {configForm.heroBackgroundUrl && (
                                   <div className="h-32 w-full bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700 relative group">
                                       <img src={configForm.heroBackgroundUrl} className="w-full h-full object-cover" alt="Hero" />
                                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                           <span className="text-white text-[10px] font-black uppercase">Current Background</span>
                                       </div>
                                   </div>
                               )}
                               <label className="cursor-pointer block w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition text-center border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-indigo-500">
                                   Upload New Hero Image
                                   <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) handleFileUpload(file, (res) => handleConfigChange('heroBackgroundUrl', res));
                                   }} />
                               </label>
                           </div>
                       </div>
                   </div>
               </div>

               {/* 2. Ad Banner Network */}
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                       <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Ad Banner Network</h3>
                       <span className="text-xs font-bold text-indigo-600">{configForm.adBanners?.length || 0} Active</span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Animation Style</label>
                           <select value={configForm.bannerAnimationStyle} onChange={e => handleConfigChange('bannerAnimationStyle', e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700">
                               <option value="fade">Fade</option>
                               <option value="slide">Slide</option>
                               <option value="zoom">Zoom</option>
                           </select>
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Interval (ms)</label>
                           <input type="number" value={configForm.bannerInterval} onChange={e => handleConfigChange('bannerInterval', parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Upload New Banner</label>
                       <label className="cursor-pointer flex items-center justify-center w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-indigo-500 gap-2">
                           <span className="text-xl">📷</span> Select Image to Add
                           <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                   handleFileUpload(file, (res) => {
                                       const updated = { ...configForm, adBanners: [...(configForm.adBanners || []), res] };
                                       setConfigForm(updated);
                                   });
                               }
                           }} />
                       </label>
                   </div>

                   {configForm.adBanners && configForm.adBanners.length > 0 && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                           {configForm.adBanners.map((url, idx) => (
                               <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border dark:border-slate-700">
                                   <img src={url} alt="Banner" className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                       <button onClick={() => handleRemoveBanner(idx)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase">Delete</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>

               {/* 3. Financial Protocol */}
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm space-y-6">
                   <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Financial Protocol</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Commission Rate (0-1)</label>
                           <input type="number" step="0.01" value={configForm.commissionRate} onChange={e => handleConfigChange('commissionRate', parseFloat(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tax Rate (0-1)</label>
                           <input type="number" step="0.01" value={configForm.taxRate} onChange={e => handleConfigChange('taxRate', parseFloat(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Store Rental Price (₦)</label>
                           <input type="number" value={configForm.rentalPrice} onChange={e => handleConfigChange('rentalPrice', parseFloat(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                   </div>
                   <div className="flex items-center gap-3">
                       <button onClick={() => handleConfigChange('taxEnabled', !configForm.taxEnabled)} className={`w-12 h-6 rounded-full p-1 transition-colors ${configForm.taxEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                           <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${configForm.taxEnabled ? 'translate-x-6' : ''}`}></div>
                       </button>
                       <span className="text-xs font-bold dark:text-white">Enable Automated Tax Deduction</span>
                   </div>
               </div>

               {/* 4. Contact & Banking */}
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm space-y-6">
                   <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Contact & Settlement</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Support Email</label>
                           <input value={configForm.contactEmail} onChange={e => handleConfigChange('contactEmail', e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Support Phone</label>
                           <input value={configForm.contactPhone} onChange={e => handleConfigChange('contactPhone', e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" />
                       </div>
                       <div className="md:col-span-2 space-y-1">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Admin Bank Details (For Rent Collection)</label>
                           <textarea value={configForm.adminBankDetails} onChange={e => handleConfigChange('adminBankDetails', e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-medium h-32 outline-none border border-gray-100 dark:border-slate-700 font-mono" />
                       </div>
                   </div>
               </div>

               {/* 5. Category Management */}
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm space-y-6">
                   <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Global Categories</h3>
                   <div className="flex gap-2">
                       <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-slate-700" placeholder="New Category Name" />
                       <button onClick={handleAddCategory} className="bg-indigo-600 text-white px-6 rounded-xl text-[10px] font-black uppercase">Add</button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                       {categories.map(c => <span key={c} className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700">{c}</span>)}
                   </div>
               </div>

               {/* 6. AI & System Config */}
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm space-y-6">
                   <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">AI & System</h3>
                   <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gemini API Key</label>
                       <input 
                           type="password"
                           value={configForm.geminiApiKey || ''} 
                           onChange={e => handleConfigChange('geminiApiKey', e.target.value)} 
                           className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono font-bold outline-none border border-gray-100 dark:border-slate-700 focus:border-indigo-500 transition" 
                           placeholder="AIza..." 
                       />
                       <p className="text-[9px] text-gray-400 mt-1">Required for AI trend analysis and chatbot functionality.</p>
                   </div>
               </div>

               {/* 7. Security & Maintenance */}
               <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] space-y-6">
                   <h4 className="text-xl font-black uppercase tracking-tighter">Security & Maintenance</h4>
                   
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                       <div>
                           <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Site Lock Status</p>
                           <p className="text-[10px] text-gray-500">Restricts access to everyone except admins with password.</p>
                       </div>
                       <button onClick={() => handleConfigChange('siteLocked', !configForm.siteLocked)} className={`w-12 h-6 rounded-full p-1 transition-colors ${configForm.siteLocked ? 'bg-red-500' : 'bg-green-500'}`}>
                           <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${configForm.siteLocked ? 'translate-x-6' : ''}`}></div>
                       </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Access Password</label>
                           <input value={configForm.siteLockPassword} onChange={e => handleConfigChange('siteLockPassword', e.target.value)} className="w-full p-4 bg-white/10 rounded-xl outline-none text-white text-xs font-mono" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Launch Date (Timestamp)</label>
                           <input type="datetime-local" onChange={e => handleConfigChange('launchDate', new Date(e.target.value).getTime())} className="w-full p-4 bg-white/10 rounded-xl outline-none text-white text-xs font-mono" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Maintenance Title</label>
                           <input value={configForm.maintenanceModeTitle || ''} onChange={e => handleConfigChange('maintenanceModeTitle', e.target.value)} className="w-full p-4 bg-white/10 rounded-xl outline-none text-white text-xs font-bold" placeholder="Site Under Construction" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Maintenance Message</label>
                           <input value={configForm.maintenanceModeMessage || ''} onChange={e => handleConfigChange('maintenanceModeMessage', e.target.value)} className="w-full p-4 bg-white/10 rounded-xl outline-none text-white text-xs font-bold" placeholder="We are currently upgrading our systems." />
                        </div>
                   </div>
               </div>

               <button onClick={handleSaveConfig} className="w-full bg-green-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-green-700 transition transform active:scale-95">
                   Commit Global Configuration
               </button>
           </div>
       )}

       {activeTab === 'ai' && (
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm animate-slide-up space-y-6">
               <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Gemini 3 Intelligence Hub</h3>
                   {aiLoading && <span className="text-[10px] font-black uppercase text-indigo-400 animate-pulse">Processing...</span>}
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <button onClick={() => handleRunAI('trend')} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition">Analyze Trends</button>
                   <button onClick={() => handleRunAI('policy')} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition">Draft Policy</button>
                   <button onClick={() => handleRunAI('audit')} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition">Security Audit</button>
               </div>
               <div className="bg-slate-900 text-green-400 font-mono text-xs p-6 rounded-2xl min-h-[150px] whitespace-pre-wrap">
                   {aiOutput || "> Awaiting Neural Input..."}
               </div>
           </div>
       )}

       {/* Image Modal for Proofs */}
       {viewingProof && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setViewingProof(null)}>
               <div className="relative max-w-2xl w-full">
                   <img src={viewingProof} className="w-full h-auto rounded-xl shadow-2xl" alt="Proof" />
                   <button onClick={() => setViewingProof(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition">✕</button>
               </div>
           </div>
       )}

       {/* User Profile Modal */}
       {selectedUser && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in">
               <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] p-8 sm:p-12 shadow-2xl relative border dark:border-slate-800 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
                   <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">✕</button>
                   
                   <div className="space-y-8">
                       <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                           <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden border-2 border-gray-200 dark:border-slate-700 flex items-center justify-center">
                               {selectedUser.profilePicture || selectedUser.verification?.profilePictureUrl ? (
                                   <img src={selectedUser.profilePicture || selectedUser.verification?.profilePictureUrl} className="w-full h-full object-cover" alt="Profile" />
                               ) : (
                                   <span className="text-4xl">👤</span>
                               )}
                           </div>
                           <div className="text-center sm:text-left">
                               <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white">{selectedUser.name}</h3>
                               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{selectedUser.role} • ID: {selectedUser.id}</p>
                               <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                   {selectedUser.isSuspended && <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Suspended</span>}
                                   {selectedUser.verification?.verificationStatus === 'verified' && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Verified</span>}
                                   {selectedUser.rentPaid && <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Rent Paid</span>}
                               </div>
                           </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700">
                           <div>
                               <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Email</p>
                               <p className="text-sm font-bold dark:text-white">{selectedUser.email}</p>
                           </div>
                           <div>
                               <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Phone</p>
                               <p className="text-sm font-bold dark:text-white">{selectedUser.verification?.phoneNumber || 'N/A'}</p>
                           </div>
                           <div>
                               <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Location</p>
                               <p className="text-sm font-bold dark:text-white">{selectedUser.city || selectedUser.verification?.city}, {selectedUser.state || selectedUser.verification?.state}, {selectedUser.country || selectedUser.verification?.country}</p>
                           </div>
                           <div>
                               <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Joined</p>
                               <p className="text-sm font-bold dark:text-white">{selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString() : 'N/A'}</p>
                           </div>
                           {selectedUser.role === UserRole.SELLER && (
                               <div className="md:col-span-2">
                                   <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Business Info</p>
                                   <p className="text-sm font-bold dark:text-white">{selectedUser.storeName} • {selectedUser.verification?.businessAddress}</p>
                                   <p className="text-xs font-mono text-gray-500 mt-1">CAC: {selectedUser.verification?.cacRegistrationNumber || 'Not Submitted'}</p>
                               </div>
                           )}
                       </div>

                       {selectedUser.role === UserRole.SELLER && (
                           <div className="space-y-4">
                               <h4 className="text-xl font-black uppercase tracking-tighter dark:text-white">Verification Documents</h4>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                       <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Identity Document</p>
                                       {selectedUser.verification?.govDocumentUrl ? (
                                           <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700 relative group cursor-pointer" onClick={() => setViewingProof(selectedUser.verification!.govDocumentUrl!)}>
                                               <img src={selectedUser.verification.govDocumentUrl} className="w-full h-full object-cover" alt="ID" />
                                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">View Full</div>
                                           </div>
                                       ) : (
                                           <div className="h-32 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-dashed border-yellow-200 dark:border-yellow-800 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                                               <span className="text-2xl mb-1">⚠️</span>
                                               <p className="text-[9px] font-bold text-yellow-600 dark:text-yellow-500 uppercase">Document Missing</p>
                                               <button onClick={() => handleSendDocumentReminder(selectedUser)} className="mt-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[8px] font-black uppercase hover:bg-yellow-200">Send Reminder</button>
                                           </div>
                                       )}
                                   </div>
                                   <div className="space-y-2">
                                       <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Profile / Logo</p>
                                       {selectedUser.verification?.profilePictureUrl ? (
                                           <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700 relative group cursor-pointer" onClick={() => setViewingProof(selectedUser.verification!.profilePictureUrl!)}>
                                               <img src={selectedUser.verification.profilePictureUrl} className="w-full h-full object-cover" alt="Logo" />
                                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">View Full</div>
                                           </div>
                                       ) : (
                                           <div className="h-32 bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center">
                                               <p className="text-[9px] text-gray-400 font-bold uppercase">No Image</p>
                                           </div>
                                       )}
                                   </div>
                               </div>
                           </div>
                       )}

                       <div className="flex gap-3 pt-6 border-t dark:border-slate-800">
                           <button onClick={() => onToggleVendorStatus(selectedUser.id)} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${selectedUser.isSuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                               {selectedUser.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                           </button>
                           <button onClick={() => { if(confirm('Delete user permanently?')) { onDeleteVendor(selectedUser.id); setSelectedUser(null); } }} className="flex-1 bg-red-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg">
                               Delete User
                           </button>
                           {selectedUser.role === UserRole.SELLER && selectedUser.verification?.verificationStatus !== 'verified' && selectedUser.verification?.govDocumentUrl && (
                               <button onClick={() => { handleApproveCompliance(selectedUser); setSelectedUser(prev => prev ? ({...prev, verification: {...prev.verification, verificationStatus: 'verified'} as any}) : null); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg">
                                   Approve & Verify
                               </button>
                           )}
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
