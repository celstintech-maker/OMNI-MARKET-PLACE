
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
  
  // Staff Creation State
  const [newStaff, setNewStaff] = useState({ name: '', email: '', pin: '1234', role: UserRole.STAFF as UserRole });

  // Config Form State
  const [configForm, setConfigForm] = useState<SiteConfig>(siteConfig);

  // Filter vendors based on role
  const sellers = vendors.filter(u => u.role === UserRole.SELLER);
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
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      setAiOutput("API Key missing. Please set 'API_KEY' in environment variables.");
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
      // Display the actual error message to help the user debug
      const errorMessage = e.message || e.toString();
      setAiOutput(`AI Connection Failed.\n\nError Details:\n${errorMessage}`);
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

  const handleConfirmRent = (user: User) => {
      // Confirming first-time rent
      const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000);
      onUpdateUser({
          ...user,
          rentPaid: true,
          rentPaymentStatus: 'confirmed',
          subscriptionExpiry: oneYearFromNow,
          verification: user.verification ? { ...user.verification, approvalDate: Date.now() } : undefined
      });
      onSendNotification(user.id, "Rent Payment Confirmed! Your shop is now active for 365 days.");
      alert(`Rent Confirmed for ${user.storeName}`);
  };

  const handleRejectRent = (user: User) => {
      onUpdateUser({
          ...user,
          rentPaymentStatus: 'rejected',
          rentPaymentProof: undefined
      });
      onSendNotification(user.id, "Rent Payment Rejected. Proof invalid. Please upload a clear receipt.");
      alert(`Rent Rejected for ${user.storeName}`);
  };

  const handleApproveExtension = (user: User) => {
    if (!user.pendingExtensionRequest) return;
    
    // Calculate new expiry
    // If current expiry is in future, add to it. If in past/null, add to now.
    const currentExpiry = (user.subscriptionExpiry && user.subscriptionExpiry > Date.now()) ? user.subscriptionExpiry : Date.now();
    const durationMs = user.pendingExtensionRequest.durationMonths * 30 * 24 * 60 * 60 * 1000;
    const newExpiry = currentExpiry + durationMs;

    onUpdateUser({
        ...user,
        rentPaid: true,
        subscriptionExpiry: newExpiry,
        pendingExtensionRequest: undefined // Clear request
    });
    
    onSendNotification(user.id, `Subscription Extended! ${user.pendingExtensionRequest.durationMonths} months added. Expires: ${new Date(newExpiry).toLocaleDateString()}`);
    alert(`Extension Approved for ${user.storeName}`);
  };

  const handleRejectExtension = (user: User) => {
    onUpdateUser({
        ...user,
        pendingExtensionRequest: undefined
    });
    onSendNotification(user.id, "Subscription Extension Rejected. Payment verification failed.");
    alert(`Extension Rejected for ${user.storeName}`);
  };

  const handleResolveDispute = (dispute: Dispute, status: DisputeStatus) => {
    onUpdateDispute({ ...dispute, status, adminNote: "Resolved by Admin via Justice Hub" });
  };

  const handleUnflagProduct = (product: Product) => {
    onUpdateProduct({ ...product, isFlagged: false, flags: 0 });
    alert("Item Restored to Global Feed.");
  };

  const handleCreateStaff = () => {
    if(!newStaff.name || !newStaff.email) return;
    onCreateStaff?.({
        id: `staff-${Date.now()}`,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        pin: newStaff.pin,
        joinedAt: Date.now()
    });
    setNewStaff({ name: '', email: '', pin: '1234', role: UserRole.STAFF });
    alert("Staff Member Recruited");
  };

  const handleSaveConfig = () => {
    onUpdateConfig(configForm);
    alert("System Configuration Updated");
  };

  // Helper for file uploads
  const handleFileUpload = (file: File, callback: (result: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Helper to convert timestamp to datetime-local string
  const timestampToInputValue = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in relative px-2 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase leading-none dark:text-white">Admin Control</h2>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-2">System Status: <span className="text-green-500 animate-pulse">● Online</span></p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2">
           {['users', 'flagged', 'justice', 'activities', 'traffic', 'ai', 'settings', 'staff'].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-gray-400 border-gray-200 dark:border-slate-800'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-8 animate-slide-up">
           {/* Pending Rent Payments Section */}
           {pendingRentPayments.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-[2.5rem] border border-amber-200 dark:border-amber-800 shadow-xl relative overflow-hidden">
                 <h3 className="text-xl font-black uppercase tracking-tighter text-amber-900 dark:text-amber-100 mb-6 relative z-10">Initial Rent Verifications ({pendingRentPayments.length})</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {pendingRentPayments.map(vendor => (
                       <div key={vendor.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-amber-100 dark:border-amber-900 flex flex-col justify-between h-full">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h4 className="font-black text-sm uppercase dark:text-white">{vendor.storeName}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {vendor.id}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-amber-600">Pending</p>
                             </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                             {vendor.rentPaymentProof && (
                                 <button 
                                    onClick={() => setViewingProof(vendor.rentPaymentProof!)}
                                    className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200"
                                 >
                                    View Proof
                                 </button>
                             )}
                             <button 
                                onClick={() => handleConfirmRent(vendor)}
                                className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg"
                             >
                                Confirm
                             </button>
                             <button 
                                onClick={() => handleRejectRent(vendor)}
                                className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100"
                             >
                                Reject
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Pending Extension Requests Section */}
           {pendingExtensions.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <svg className="w-64 h-64 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tighter text-indigo-900 dark:text-white mb-6 relative z-10">Pending Subscription Extensions ({pendingExtensions.length})</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {pendingExtensions.map(vendor => (
                       <div key={vendor.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-indigo-100 dark:border-indigo-900 flex flex-col justify-between h-full">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h4 className="font-black text-sm uppercase dark:text-white">{vendor.storeName}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {vendor.id}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-xl font-black text-indigo-600">₦{vendor.pendingExtensionRequest!.amount.toLocaleString()}</p>
                                <p className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full inline-block mt-1">
                                   +{vendor.pendingExtensionRequest!.durationMonths} Months
                                </p>
                             </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                             <button 
                                onClick={() => setViewingProof(vendor.pendingExtensionRequest!.proofOfPayment)}
                                className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200"
                             >
                                View Proof
                             </button>
                             <button 
                                onClick={() => handleApproveExtension(vendor)}
                                className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg"
                             >
                                Approve
                             </button>
                             <button 
                                onClick={() => handleRejectExtension(vendor)}
                                className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100"
                             >
                                Reject
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {sellers.map(vendor => (
                <div key={vendor.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:border-indigo-500 transition-colors">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black uppercase">{vendor.storeName?.[0] || 'V'}</div>
                         <div>
                            <h4 className="font-black text-sm uppercase dark:text-white">{vendor.storeName}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{vendor.country}</p>
                         </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${vendor.isSuspended ? 'bg-red-500' : 'bg-green-500'} shadow-[0_0_10px_currentColor]`}></div>
                   </div>

                   <div className="space-y-4 mb-6">
                      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase text-gray-400">Subscription</span>
                         {vendor.rentPaid 
                            ? <span className="text-[10px] font-black text-green-600 uppercase">Active</span>
                            : <span className="text-[10px] font-black text-red-500 uppercase">{vendor.rentPaymentStatus === 'pending' ? 'Reviewing' : 'Unpaid'}</span>
                         }
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase text-gray-400">Identity</span>
                         <span className={`text-[10px] font-black uppercase ${vendor.verification?.verificationStatus === 'verified' && vendor.verification?.identityApproved ? 'text-green-600' : 'text-amber-500'}`}>
                            {vendor.verification?.verificationStatus === 'verified' && vendor.verification?.identityApproved ? 'Verified' : vendor.verification?.verificationStatus === 'verified' ? 'Bypassed' : 'Pending'}
                         </span>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setSelectedUser(vendor)} className="bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-slate-700 transition">
                         Inspect Node
                      </button>
                      <button onClick={() => onToggleVendorStatus(vendor.id)} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition text-white ${vendor.isSuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                         {vendor.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                      <button onClick={() => onDeleteVendor(vendor.id)} className="col-span-2 bg-slate-900 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition">
                         Delete Node
                      </button>
                      {!vendor.verification?.identityApproved && (
                          <button onClick={() => handleBypass(vendor)} className="col-span-2 border-2 border-amber-400 text-amber-600 dark:text-amber-400 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-50 dark:hover:bg-amber-900/20 transition">
                            Authorize Bypass Protocol
                          </button>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Flagged Items */}
      {activeTab === 'flagged' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
            {flaggedProducts.length === 0 ? (
               <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase text-xs tracking-widest">No flagged items in the network</div>
            ) : (
               flaggedProducts.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-red-100 dark:border-red-900 shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-2 rounded-bl-2xl text-[10px] font-black uppercase">Flagged: {p.flags}x</div>
                     <img src={p.imageUrl} className="w-full h-40 object-cover rounded-2xl mb-4 grayscale" alt="" />
                     <h3 className="font-black text-sm uppercase dark:text-white mb-1">{p.name}</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Store: {p.storeName}</p>
                     
                     <div className="flex gap-2">
                        <button onClick={() => handleUnflagProduct(p)} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700">Restore</button>
                        <button 
                            onClick={() => {
                                alert("Please contact technical to purge asset ID: " + p.id);
                            }} 
                            className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black"
                        >
                            Purge
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>
      )}

      {/* Staff Management Tab */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
           <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Active Personnel ({staffMembers.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {staffMembers.map(staff => (
                    <div key={staff.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                        <div>
                           <p className="font-black text-sm dark:text-white">{staff.name}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{staff.role}</p>
                        </div>
                        <button onClick={() => onDeleteVendor(staff.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl">✕</button>
                    </div>
                 ))}
                 {staffMembers.length === 0 && <p className="text-gray-400 text-sm">No active staff found.</p>}
              </div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 h-fit">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">Recruit Staff</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</label>
                    <input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email Access</label>
                    <input value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Clearance Role</label>
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as UserRole})} className="w-full p-3 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none cursor-pointer">
                       <option value={UserRole.STAFF}>General Staff</option>
                       <option value={UserRole.TECHNICAL}>Technical Support</option>
                       <option value={UserRole.MARKETER}>Marketing Lead</option>
                       <option value={UserRole.TEAM_MEMBER}>Team Member</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Default PIN</label>
                    <input value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none tracking-widest" />
                 </div>
                 <button onClick={handleCreateStaff} className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition">Grant Access</button>
              </div>
           </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
           {/* ... (Existing Settings UI) ... */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 dark:text-white">General Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Marketplace Name</label>
                    <input value={configForm.siteName} onChange={e => setConfigForm({...configForm, siteName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-bold outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Logo (Upload)</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition">
                            Choose File
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], (url) => setConfigForm({...configForm, logoUrl: url}))} />
                        </label>
                        {configForm.logoUrl && (
                            <img src={configForm.logoUrl} className="h-10 w-auto object-contain rounded bg-gray-50" alt="Logo Preview" />
                        )}
                    </div>
                 </div>
                 {/* ... More inputs (kept same as before) ... */}
              </div>
           </div>
           
           <button onClick={handleSaveConfig} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition transform hover:scale-[1.01]">
              Deploy System Configuration
           </button>
        </div>
      )}

      {/* User Inspection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-[3rem] p-12 shadow-2xl relative border dark:border-slate-800 overflow-y-auto no-scrollbar animate-slide-up">
              <button onClick={() => setSelectedUser(null)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500 text-xl">✕</button>
              
              <div className="flex items-center gap-6 mb-12">
                 <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black uppercase shadow-xl">
                    {selectedUser.storeName?.[0]}
                 </div>
                 <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white">{selectedUser.storeName}</h2>
                    <p className="text-gray-500 font-bold text-sm uppercase tracking-[0.2em]">{selectedUser.email}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-[2.5rem]">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-400">Verification Dossier</h3>
                       <div className="space-y-4 text-xs font-medium dark:text-gray-300">
                          <p><span className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Business Name</span> {selectedUser.verification?.businessName}</p>
                          <p><span className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Registration #</span> {selectedUser.verification?.cacRegistrationNumber || 'N/A'}</p>
                          <p><span className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Address</span> {selectedUser.verification?.businessAddress}</p>
                          <p><span className="text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Phone</span> {selectedUser.verification?.phoneNumber}</p>
                       </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-[2.5rem]">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-400">Recommendations</h3>
                       <div className="space-y-4 max-h-48 overflow-y-auto no-scrollbar">
                           {sellerRecommendations.filter(r => r.sellerId === selectedUser.id).length === 0 ? (
                               <p className="text-xs text-gray-400 text-center">No endorsements found.</p>
                           ) : (
                               sellerRecommendations.filter(r => r.sellerId === selectedUser.id).map(r => (
                                   <div key={r.id} className="border-l-2 border-indigo-500 pl-3">
                                       <p className="text-[10px] font-bold dark:text-white">{r.buyerName} {'⭐'.repeat(r.rating)}</p>
                                       <p className="text-[10px] italic text-gray-500">"{r.comment}"</p>
                                   </div>
                               ))
                           )}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-indigo-200">Admin Actions</h3>
                       <div className="space-y-4">
                          {!selectedUser.verification?.identityApproved && (
                             <button onClick={() => handleApproveIdentity(selectedUser)} className="w-full bg-white text-indigo-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition shadow-lg">
                                Approve Identity & Grant License
                             </button>
                          )}
                          <button onClick={() => onToggleVendorStatus(selectedUser.id)} className="w-full bg-indigo-800 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900 transition">
                             {selectedUser.isSuspended ? 'Lift Suspension' : 'Suspend Account'}
                          </button>
                          <button onClick={() => { onDeleteVendor(selectedUser.id); setSelectedUser(null); }} className="w-full bg-red-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition">
                             Permanent Deletion
                          </button>
                       </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700">
                       <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-400">Direct Comms</h3>
                       <textarea 
                          placeholder="Send system notification..." 
                          className="w-full h-24 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl text-xs font-bold outline-none mb-4"
                          id="notification-text"
                       />
                       <button 
                          onClick={() => {
                             const msg = (document.getElementById('notification-text') as HTMLTextAreaElement).value;
                             if (msg) {
                                onSendNotification(selectedUser.id, `ADMIN MSG: ${msg}`);
                                alert("Notification sent.");
                             }
                          }}
                          className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90"
                       >
                          Transmit
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {viewingProof && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in" onClick={() => setViewingProof(null)}>
              <div className="relative max-w-4xl max-h-[90vh]">
                  <img src={viewingProof} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white/10" alt="Proof" />
                  <button className="absolute -top-12 right-0 text-white font-black uppercase tracking-widest text-xs hover:text-red-500">Close Viewer ✕</button>
              </div>
          </div>
      )}
      
      {activeTab === 'justice' && (
         <div className="space-y-6 animate-slide-up">
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Justice Hub ({activeDisputes.length})</h3>
            {activeDisputes.length === 0 ? (
               <div className="py-20 text-center text-gray-400 font-black uppercase text-xs tracking-widest">No active disputes</div>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                  {activeDisputes.map(d => (
                     <div key={d.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                           <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{d.reason}</span>
                           <span className="text-[10px] font-bold text-gray-400">{new Date(d.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-bold dark:text-white mb-6">"{d.description}"</p>
                        <div className="flex gap-4">
                           <button onClick={() => handleResolveDispute(d, DisputeStatus.REFUNDED)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700">Force Refund</button>
                           <button onClick={() => handleResolveDispute(d, DisputeStatus.RESOLVED)} className="bg-green-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700">Mark Resolved</button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      )}

    </div>
  );
};
