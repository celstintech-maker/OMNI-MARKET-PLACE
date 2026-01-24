
import React, { useState } from 'react';
import { User, Product, Transaction, UserRole, Dispute, DisputeStatus, Message } from '../types';
import { SiteConfig } from '../App';
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
  const flaggedProducts = products.filter(p => p.isFlagged || (p.flags && p.flags > 0));

  const handleRunAI = async (mode: 'trend' | 'policy' | 'audit') => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setAiOutput("API Key missing. Cannot connect to Super Brain.");
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
      setAiOutput("AI Connection Failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleBypass = (user: User) => {
    onUpdateUser({ 
       ...user, 
       verification: { 
          businessName: user.storeName || 'Merchant', 
          businessAddress: user.verification?.businessAddress || 'Global Registry', 
          country: user.country || 'Global', 
          phoneNumber: user.verification?.phoneNumber || '000', 
          profilePictureUrl: '', 
          verificationStatus: 'verified', 
          productSamples: [], 
          approvalDate: Date.now() 
       },
       rentPaid: false // Ensure bypass requires rental fee
    });
    alert(`Store ${user.storeName} authorized for Initial Bypass. Rental fee protocol initiated.`);
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

  const getSellerSales = (sellerId: string) => {
    return transactions
      .filter(t => t.sellerId === sellerId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getSellerTransactions = (sellerId: string) => {
    return transactions.filter(t => t.sellerId === sellerId).sort((a,b) => b.timestamp - a.timestamp);
  };

  // Build Tabs
  const tabs = [
    {id: 'users', label: 'Stores'},
    {id: 'activities', label: 'Activities'},
    {id: 'staff', label: 'Staff & Roles'},
    {id: 'justice', label: 'Justice Hub', count: disputes.filter(d => d.status === DisputeStatus.ESCALATED || d.status === DisputeStatus.OPEN).length},
    {id: 'flagged', label: 'Flagged Items', count: flaggedProducts.length},
    {id: 'ai', label: 'Super Brain AI'},
    {id: 'settings', label: 'Config'}
  ];

  const activeDisputes = disputes.filter(d => d.status === DisputeStatus.OPEN || d.status === DisputeStatus.ESCALATED);

  return (
    <div className="space-y-8 pb-20 px-2 sm:px-0 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
           <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Admin Infrastructure</h2>
           <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Global Registry Online
           </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-b dark:border-slate-800">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-8 py-4 rounded-t-3xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-indigo-600'}`}
          >
            {tab.label}
            {tab.count ? <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
           <div className="p-8 bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Registered Store Nodes</h3>
           </div>
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
                                  {u.verification?.identityApproved ? 'Authenticated' : u.verification?.verificationStatus === 'verified' ? 'Active Trial' : 'Initial Audit'}
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
                     <td className="px-10 py-8 text-right space-x-6">
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
      )}

      {activeTab === 'activities' && (
        <div className="space-y-6 animate-slide-up">
           <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Live Seller Activities</h3>
           <p className="text-xs text-gray-500 font-bold mb-4">Monitor sales performance, buyer data, and payment methods in real-time.</p>
           
           <div className="grid grid-cols-1 gap-6">
              {sellers.map(seller => {
                const sellerTxs = getSellerTransactions(seller.id);
                const totalSales = sellerTxs.reduce((sum, t) => sum + t.amount, 0);
                const isExpanded = expandedSellerTransactions === seller.id;

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
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Gross Revenue</p>
                              <p className="text-2xl font-black text-green-600">₦{totalSales.toLocaleString()}</p>
                           </div>
                           <div className="flex gap-2">
                             <button 
                               onClick={() => setMessagingSeller(seller)}
                               className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition"
                             >
                               Send Insight
                             </button>
                             <button 
                               onClick={() => setExpandedSellerTransactions(isExpanded ? null : seller.id)}
                               className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition"
                             >
                               {isExpanded ? 'Hide Feed' : 'View Feed'}
                             </button>
                           </div>
                        </div>
                     </div>

                     {isExpanded && (
                        <div className="bg-gray-50 dark:bg-slate-950/30 border-t dark:border-slate-800 p-8 animate-fade-in">
                           {sellerTxs.length === 0 ? (
                             <p className="text-center text-gray-400 text-xs font-bold uppercase py-8">No recorded activity for this node.</p>
                           ) : (
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                   <thead>
                                      <tr className="border-b dark:border-slate-800">
                                         <th className="pb-4 text-[9px] font-black uppercase text-gray-400 tracking-widest">Timestamp</th>
                                         <th className="pb-4 text-[9px] font-black uppercase text-gray-400 tracking-widest">Buyer Identity</th>
                                         <th className="pb-4 text-[9px] font-black uppercase text-gray-400 tracking-widest">Product Sold</th>
                                         <th className="pb-4 text-[9px] font-black uppercase text-gray-400 tracking-widest">Settlement</th>
                                         <th className="pb-4 text-[9px] font-black uppercase text-gray-400 tracking-widest text-right">Value</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y dark:divide-slate-800">
                                      {sellerTxs.map(tx => {
                                        // Attempt to find buyer details. 
                                        // If buyerId exists, we can look up user, otherwise rely on billing details if transaction carries them (Transaction type updated previously to include billingDetails)
                                        const buyer = vendors.find(v => v.id === tx.buyerId);
                                        const buyerName = buyer?.name || tx.billingDetails?.fullName || 'Guest User';
                                        const buyerEmail = buyer?.email || tx.billingDetails?.email || 'N/A';

                                        return (
                                          <tr key={tx.id}>
                                             <td className="py-4 text-xs font-bold dark:text-gray-300">{new Date(tx.timestamp).toLocaleString()}</td>
                                             <td className="py-4">
                                                <p className="text-xs font-black dark:text-white">{buyerName}</p>
                                                <p className="text-[9px] text-gray-500">{buyerEmail}</p>
                                             </td>
                                             <td className="py-4 text-xs font-bold dark:text-gray-300">{tx.productName}</td>
                                             <td className="py-4">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${tx.paymentMethod === 'pod' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                   {tx.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}
                                                </span>
                                             </td>
                                             <td className="py-4 text-xs font-black dark:text-white text-right">₦{tx.amount.toLocaleString()}</td>
                                          </tr>
                                        );
                                      })}
                                   </tbody>
                                </table>
                             </div>
                           )}
                        </div>
                     )}
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-12 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Deploy New Staff Node</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Name</label>
                    <input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Email</label>
                    <input value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Initial PIN</label>
                    <input value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" placeholder="1234" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Role Assignment</label>
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as UserRole})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none uppercase text-xs">
                        <option value={UserRole.STAFF}>General Staff</option>
                        <option value={UserRole.MARKETER}>Marketer</option>
                        <option value={UserRole.TEAM_MEMBER}>Team Member</option>
                        <option value={UserRole.TECHNICAL}>Technical Team</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                 </div>
                 <button onClick={handleCreateStaff} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Initialize</button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-8 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Personnel</h3>
              </div>
              <table className="min-w-full divide-y dark:divide-slate-800">
                 <tbody className="divide-y dark:divide-slate-800">
                   {staffMembers.map(staff => (
                       <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-10 py-6">
                             <p className="font-black text-sm uppercase dark:text-white">{staff.name}</p>
                             <p className="text-[9px] text-gray-400 font-bold">{staff.email}</p>
                          </td>
                          <td className="px-10 py-6">
                             <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">{staff.role}</span>
                          </td>
                          <td className="px-10 py-6">
                            {editingPinId === staff.id ? (
                               <div className="flex gap-2">
                                  <input 
                                    value={newPinValue}
                                    onChange={(e) => setNewPinValue(e.target.value)}
                                    className="w-20 bg-gray-100 dark:bg-slate-700 rounded-lg px-2 text-[10px] font-bold outline-none"
                                    placeholder="New PIN"
                                  />
                                  <button onClick={() => handleUpdatePin(staff)} className="text-green-600 text-[9px] font-black uppercase hover:underline">Save</button>
                                  <button onClick={() => setEditingPinId(null)} className="text-gray-400 text-[9px] font-black uppercase hover:underline">Cancel</button>
                               </div>
                            ) : (
                               <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-mono text-gray-400">PIN: {staff.pin || 'N/A'}</span>
                                 <button onClick={() => { setEditingPinId(staff.id); setNewPinValue(''); }} className="text-indigo-600 text-[9px] font-black uppercase hover:underline">Reset</button>
                               </div>
                            )}
                          </td>
                          <td className="px-10 py-6 text-right">
                             <button onClick={() => onDeleteVendor(staff.id)} className="text-red-500 text-[10px] font-black uppercase hover:underline">Deactivate</button>
                          </td>
                       </tr>
                   ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'justice' && (
        <div className="space-y-6 animate-slide-up">
           {activeDisputes.length === 0 ? (
             <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed dark:border-slate-800 text-gray-400 font-black uppercase text-[10px] tracking-widest">Justice Hub Clear</div>
           ) : (
             activeDisputes.map(d => (
               <div key={d.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${d.status === DisputeStatus.OPEN ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{d.status}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400">Incident: {d.reason.replace('_', ' ')}</span>
                     </div>
                     <p className="text-sm font-medium dark:text-slate-300 italic leading-relaxed">"{d.description}"</p>
                     {d.status === DisputeStatus.OPEN && (
                       <p className="text-[9px] text-amber-500 font-bold">Mediator: Platform (Automatic)</p>
                     )}
                     {Date.now() > d.timestamp + 172800000 && d.status === DisputeStatus.OPEN && (
                       <p className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Exceeded 48h - Admin Review Required</p>
                     )}
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-48">
                     <button onClick={() => handleResolveDispute(d, DisputeStatus.RESOLVED)} className="w-full py-3 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Finalize: Resolved</button>
                     <button onClick={() => handleResolveDispute(d, DisputeStatus.REFUNDED)} className="w-full py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Finalize: Refund</button>
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {activeTab === 'flagged' && (
        <div className="space-y-6 animate-slide-up">
           <h3 className="text-xl font-black uppercase tracking-tighter">Community & AI Flags</h3>
           {flaggedProducts.length === 0 ? (
             <div className="py-20 text-center text-gray-400 font-bold uppercase text-xs">No flagged items found</div>
           ) : (
             flaggedProducts.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={p.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-xs text-red-500 font-bold">Flags: {p.flags}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveProduct(p)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-[9px] font-black uppercase">Clear Flags</button>
                    <button onClick={() => onUpdateProduct({...p, isFlagged: true})} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-[9px] font-black uppercase">Keep Hidden</button>
                  </div>
               </div>
             ))
           )}
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

           {/* Seller Assistant Registry (Combined previous function) */}
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-12">
              <h4 className="text-2xl font-black uppercase tracking-tighter">Seller Assistant Registry</h4>
              <p className="text-gray-500 font-bold text-xs">Manage individual store AI agents.</p>
              <div className="grid grid-cols-1 gap-4">
                 {sellers.map(v => (
                    <div key={v.id} className="bg-gray-50 dark:bg-slate-800 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{v.storeName?.[0]}</div>
                          <p className="font-black text-xs uppercase tracking-tight">{v.storeName}</p>
                       </div>
                       
                       {editingVendorAI === v.id ? (
                          <div className="flex-1 grid grid-cols-2 gap-4">
                             <input className="p-3 bg-white dark:bg-slate-900 rounded-xl text-[10px] font-bold outline-none border dark:border-slate-700" defaultValue={v.aiConfig?.greeting} onBlur={(e) => updateVendorAI(v, { greeting: e.target.value })} />
                             <select className="p-3 bg-white dark:bg-slate-900 rounded-xl text-[10px] font-bold outline-none border dark:border-slate-700" value={v.aiConfig?.tone} onChange={(e) => updateVendorAI(v, { tone: e.target.value as any })}>
                                <option value="professional">Professional</option>
                                <option value="friendly">Friendly</option>
                             </select>
                          </div>
                       ) : (
                          <p className="flex-1 text-[10px] font-bold italic text-gray-400 truncate max-w-sm">"{v.aiConfig?.greeting || 'No custom greeting.'}"</p>
                       )}
                       
                       <button onClick={() => setEditingVendorAI(editingVendorAI === v.id ? null : v.id)} className="px-6 py-2 bg-white dark:bg-slate-900 rounded-xl text-[10px] font-black uppercase shadow-sm border dark:border-slate-700">Audit AI Agent</button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-12 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-[3.5rem] border dark:border-slate-800 shadow-sm space-y-12">
              <h3 className="text-3xl font-black uppercase tracking-tighter">System Configuration</h3>

              {/* CMS Section */}
              <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-8">
                 <h4 className="text-xl font-black uppercase tracking-tighter text-indigo-600">Content Management System (CMS)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Platform Identity</label>
                       <input value={siteConfig.siteName} onChange={(e) => onUpdateConfig({...siteConfig, siteName: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm border-none outline-none" placeholder="Site Name" />
                       <input value={siteConfig.heroTitle} onChange={(e) => onUpdateConfig({...siteConfig, heroTitle: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm border-none outline-none" placeholder="Hero Title" />
                       <input value={siteConfig.heroSubtitle} onChange={(e) => onUpdateConfig({...siteConfig, heroSubtitle: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm border-none outline-none" placeholder="Hero Subtitle" />
                    </div>
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Communications</label>
                       <textarea value={siteConfig.announcement} onChange={(e) => onUpdateConfig({...siteConfig, announcement: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-bold text-xs border-none outline-none h-24" placeholder="Global Announcement Bar" />
                       <input value={siteConfig.footerText} onChange={(e) => onUpdateConfig({...siteConfig, footerText: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm border-none outline-none" placeholder="Footer Text" />
                    </div>
                 </div>
              </div>

              {/* Payment Protocol Section */}
              <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-8">
                 <h4 className="text-xl font-black uppercase tracking-tighter text-indigo-600">Payment Protocol & Gateways</h4>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Bank Wire Configuration</label>
                       <textarea value={siteConfig.adminBankDetails} onChange={(e) => onUpdateConfig({...siteConfig, adminBankDetails: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-mono text-xs border-none outline-none h-32" placeholder="Bank Details for Manual Transfers..." />
                    </div>
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Gateway API Keys</label>
                       <div className="grid grid-cols-1 gap-2">
                           <input value={siteConfig.paystackPublicKey || ''} onChange={(e) => onUpdateConfig({...siteConfig, paystackPublicKey: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-mono text-[10px] border-none outline-none" placeholder="Paystack Public Key" />
                           <input value={siteConfig.flutterwavePublicKey || ''} onChange={(e) => onUpdateConfig({...siteConfig, flutterwavePublicKey: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-mono text-[10px] border-none outline-none" placeholder="Flutterwave Public Key" />
                           <input value={siteConfig.stripePublicKey || ''} onChange={(e) => onUpdateConfig({...siteConfig, stripePublicKey: e.target.value})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-mono text-[10px] border-none outline-none" placeholder="Stripe Public Key" />
                       </div>
                       <div className="pt-2">
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Shop Rental Fee</label>
                          <input type="number" value={siteConfig.rentalPrice} onChange={(e) => onUpdateConfig({...siteConfig, rentalPrice: parseFloat(e.target.value)})} className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm border-none outline-none" placeholder="Rental Price" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-3xl space-y-6">
                       <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Fiscal Policy</h4>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Enable Tax Deduction</span>
                          <button onClick={() => onUpdateConfig({...siteConfig, taxEnabled: !siteConfig.taxEnabled})} className={`w-12 h-6 rounded-full transition-colors ${siteConfig.taxEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                             <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${siteConfig.taxEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                          </button>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Tax Rate</span>
                          <input type="number" value={siteConfig.taxRate} step="0.01" onChange={(e) => onUpdateConfig({...siteConfig, taxRate: parseFloat(e.target.value)})} className="w-20 p-2 rounded-lg bg-white dark:bg-slate-900 border text-center font-bold" />
                       </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-3xl space-y-6">
                       <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Compliance AI</h4>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Post-Launch Auto-Flagging</span>
                          <button onClick={() => onUpdateConfig({...siteConfig, autoFlaggingEnabled: !siteConfig.autoFlaggingEnabled})} className={`w-12 h-6 rounded-full transition-colors ${siteConfig.autoFlaggingEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                             <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${siteConfig.autoFlaggingEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                          </button>
                       </div>
                       <p className="text-[9px] text-gray-500 font-bold">When enabled, items go live immediately but AI/Community reports will auto-hide them after threshold.</p>
                    </div>
                 </div>

                 {/* Category Management */}
                 <div className="border-t dark:border-slate-800 pt-12 space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Marketplace Taxonomy (Categories)</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                       {categories.map((cat, i) => (
                          <span key={i} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full text-[10px] font-bold uppercase">{cat}</span>
                       ))}
                    </div>
                    <div className="flex gap-4 max-w-md">
                       <input 
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="New Category Name" 
                          className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none"
                       />
                       <button onClick={handleAddCategory} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest">Add</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Merchant Profile Audit Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 sm:p-14 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={() => setSelectedUser(null)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500">✕</button>
              
              <div className="space-y-10">
                 <div className="text-center">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Merchant Audit Profile: {selectedUser.storeName}</h3>
                    <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Global ID: {selectedUser.id}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b dark:border-slate-800 pb-2">Compliance Dossier</h4>
                       
                       <div className="flex items-center gap-4">
                          {selectedUser.verification?.profilePictureUrl ? (
                             <img src={selectedUser.verification.profilePictureUrl} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-600" alt="Profile" />
                          ) : (
                             <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black uppercase text-gray-400">No Pic</div>
                          )}
                          <div>
                             <p className="text-[8px] font-black uppercase text-gray-400">Merchant Identity</p>
                             <p className="font-bold dark:text-white">{selectedUser.name}</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div>
                             <p className="text-[8px] font-black uppercase text-gray-400">CAC Record</p>
                             <p className="text-sm font-bold dark:text-white">{selectedUser.verification?.cacRegistrationNumber || 'Un-registered'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b dark:border-slate-800 pb-2">Verification Documents</h4>
                       {selectedUser.verification?.govDocumentUrl ? (
                         <div className="space-y-4 text-center">
                            <img src={selectedUser.verification.govDocumentUrl} className="w-full h-32 object-cover rounded-2xl border dark:border-slate-700" alt="Document" />
                            <a href={selectedUser.verification.govDocumentUrl} download className="block py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Download Document</a>
                         </div>
                       ) : (
                         <div className="h-40 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">Document Not <br/> Found</div>
                       )}
                    </div>
                 </div>

                 <div className="pt-10 flex gap-4">
                    <button 
                       disabled={!selectedUser.verification?.govDocumentUrl}
                       onClick={() => handleApproveIdentity(selectedUser)}
                       className="flex-1 bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                    >
                       Approve & Grant License
                    </button>
                    <button onClick={() => setSelectedUser(null)} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200">
                       Dismiss
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Admin Message Modal */}
      {messagingSeller && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-slide-up">
              <button onClick={() => setMessagingSeller(null)} className="absolute top-8 right-8 text-gray-400">✕</button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 dark:text-white">Admin Insight</h3>
              <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">To: {messagingSeller.storeName}</p>
              
              <div className="space-y-4">
                 <textarea 
                    value={adminMessage}
                    onChange={e => setAdminMessage(e.target.value)}
                    placeholder="Notify seller about top performing products or store optimizations..."
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium text-xs h-40 border border-gray-200 dark:border-slate-700 outline-none"
                    autoFocus
                 />
                 <button 
                    onClick={handleSendAdminMessage}
                    disabled={!adminMessage.trim()}
                    className="w-full bg-indigo-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                 >
                    Transmit Message
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
