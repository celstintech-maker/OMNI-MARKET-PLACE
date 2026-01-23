
import React, { useState } from 'react';
import { User, Product, Transaction, UserRole, Dispute, DisputeStatus, Message } from '../types';
import { SiteConfig } from '../App';
import { CATEGORIES } from '../constants';

interface AdminDashboardProps {
  vendors: User[]; 
  stores: any[];
  products: Product[];
  transactions: Transaction[];
  siteConfig: SiteConfig;
  allMessages: Record<string, Message[]>;
  disputes: Dispute[];
  onUpdateConfig: (config: SiteConfig) => void;
  onToggleVendorStatus: (id: string) => void;
  onDeleteVendor: (id: string) => void;
  onUpdateUser: (user: User) => void;
  onAddGlobalProduct: (product: Partial<Product>) => void;
  onUpdateDispute: (dispute: Dispute) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  vendors, siteConfig, disputes, products, onDeleteVendor, onUpdateUser, onUpdateDispute, onUpdateConfig, onAddGlobalProduct
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'justice' | 'settings' | 'feed' | 'ai'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingVendorAI, setEditingVendorAI] = useState<string | null>(null);
  
  const [newGlobalProduct, setNewGlobalProduct] = useState({
    name: '',
    price: '',
    category: CATEGORIES[0],
    description: '',
    imageUrl: 'https://picsum.photos/400/400?random=' + Math.random(),
    storeName: 'OMNI GLOBAL'
  });

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
    alert(`Node ${user.storeName} authorized for Initial Bypass. Rental fee protocol initiated.`);
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

  const handleAddGlobal = () => {
    if (!newGlobalProduct.name || !newGlobalProduct.price) return;
    onAddGlobalProduct({
      ...newGlobalProduct,
      price: parseFloat(newGlobalProduct.price),
      sellerId: 'admin-global',
      stock: 999,
    });
    alert("Global Item Synchronized with Network Feed.");
    setNewGlobalProduct({ name: '', price: '', category: CATEGORIES[0], description: '', imageUrl: 'https://picsum.photos/400/400?random=' + Math.random(), storeName: 'OMNI GLOBAL' });
  };

  const handleResolveDispute = (dispute: Dispute, status: DisputeStatus) => {
    onUpdateDispute({ ...dispute, status });
    alert(`Justice Hub Status Synchronized.`);
  };

  const sellers = vendors.filter(u => u.role === UserRole.SELLER);

  return (
    <div className="space-y-8 pb-20 px-2 sm:px-0 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
           <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Admin Infrastructure</h2>
           <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Global Registry Node Online
           </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-b dark:border-slate-800">
        {[
          {id: 'users', label: 'Nodes'},
          {id: 'justice', label: 'Justice Hub', count: disputes.filter(d => d.status === DisputeStatus.OPEN).length},
          {id: 'feed', label: 'Global Feed'},
          {id: 'ai', label: 'Master AI Hub'},
          {id: 'settings', label: 'System Settings'}
        ].map((tab) => (
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
           <table className="min-w-full divide-y dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                   <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant Node</th>
                   <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Compliance State</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {sellers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                     <td className="px-10 py-8">
                        <p className="font-black text-lg uppercase dark:text-white">{u.storeName || u.name}</p>
                        <p className="text-[10px] text-gray-400 font-black">{u.email}</p>
                     </td>
                     <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                           <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${u.verification?.identityApproved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                              {u.verification?.identityApproved ? 'Authenticated' : u.verification?.verificationStatus === 'verified' ? 'Active Trial' : 'Initial Audit'}
                           </span>
                        </div>
                     </td>
                     <td className="px-10 py-8 text-right space-x-6">
                        {u.verification?.verificationStatus !== 'verified' && (
                          <button onClick={() => handleBypass(u)} className="text-blue-600 text-[11px] font-black uppercase hover:underline">Initial Bypass</button>
                        )}
                        <button onClick={() => setSelectedUser(u)} className="text-indigo-600 text-[11px] font-black uppercase hover:underline">Merchant Audit Profile</button>
                        <button onClick={() => onDeleteVendor(u.id)} className="text-red-500 text-[11px] font-black uppercase hover:underline">De-List Node</button>
                     </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'justice' && (
        <div className="space-y-6 animate-slide-up">
           {disputes.length === 0 ? (
             <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed dark:border-slate-800 text-gray-400 font-black uppercase text-[10px] tracking-widest">Justice Hub Clear: No pending incidents</div>
           ) : (
             disputes.map(d => (
               <div key={d.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${d.status === DisputeStatus.OPEN ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{d.status}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400">Incident: {d.reason.replace('_', ' ')}</span>
                     </div>
                     <p className="text-sm font-medium dark:text-slate-300 italic leading-relaxed">"{d.description}"</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-48">
                     <button onClick={() => handleResolveDispute(d, DisputeStatus.RESOLVED)} className="w-full py-3 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Mark Resolved</button>
                     <button onClick={() => handleResolveDispute(d, DisputeStatus.REFUNDED)} className="w-full py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Force Refund</button>
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="space-y-12 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Global Broadcast protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Item Name</label>
                    <input value={newGlobalProduct.name} onChange={e => setNewGlobalProduct({...newGlobalProduct, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price (₦)</label>
                    <input value={newGlobalProduct.price} onChange={e => setNewGlobalProduct({...newGlobalProduct, price: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</label>
                    <select value={newGlobalProduct.category} onChange={e => setNewGlobalProduct({...newGlobalProduct, category: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700 outline-none">
                       {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
              <button onClick={handleAddGlobal} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Broadcast Globally</button>
           </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-12 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-12">
              <h4 className="text-sm font-black uppercase tracking-tighter mb-4">Seller Assistant Registry</h4>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Company Settlement Repository</h4>
                       <textarea 
                          value={siteConfig.adminBankDetails} 
                          onChange={e => onUpdateConfig({...siteConfig, adminBankDetails: e.target.value})} 
                          className="w-full p-6 bg-gray-50 dark:bg-slate-800 rounded-3xl outline-none font-black text-xs h-40 border dark:border-slate-700" 
                          placeholder="Settlement Credentials..."
                       />
                       <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Publically visible to unsettled merchants and buyers.</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Site Identity Meta-Data</h4>
                    <div className="grid grid-cols-1 gap-6">
                       <input value={siteConfig.siteName} onChange={e => onUpdateConfig({...siteConfig, siteName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700" />
                       <input type="number" value={siteConfig.rentalPrice} onChange={e => onUpdateConfig({...siteConfig, rentalPrice: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border dark:border-slate-700" />
                    </div>
                 </div>
              </div>
              <button onClick={() => alert("Global State Synchronized.")} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Commit Configuration Sync</button>
           </div>
        </div>
      )}

      {/* Merchant Profile Audit Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 sm:p-14 shadow-2xl relative animate-slide-up">
              <button onClick={() => setSelectedUser(null)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500">✕</button>
              
              <div className="space-y-10">
                 <div className="text-center">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Merchant Audit Profile: {selectedUser.storeName}</h3>
                    <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Global ID: {selectedUser.id}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b dark:border-slate-800 pb-2">Compliance Dossier</h4>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[8px] font-black uppercase text-gray-400">CAC Record</p>
                             <p className="text-sm font-bold">{selectedUser.verification?.cacRegistrationNumber || 'Un-registered'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b dark:border-slate-800 pb-2">Verification Artifacts</h4>
                       {selectedUser.verification?.govDocumentUrl ? (
                         <div className="space-y-4 text-center">
                            <img src={selectedUser.verification.govDocumentUrl} className="w-full h-32 object-cover rounded-2xl border dark:border-slate-700" alt="Artifact" />
                            <a href={selectedUser.verification.govDocumentUrl} download className="block py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Download Artifact</a>
                         </div>
                       ) : (
                         <div className="h-40 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">Artifact Not <br/> Found</div>
                       )}
                    </div>
                 </div>

                 <div className="pt-10 flex gap-4">
                    <button 
                       disabled={!selectedUser.verification?.govDocumentUrl}
                       onClick={() => handleApproveIdentity(selectedUser)} 
                       className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50"
                    >
                       Authorize Permanent Activation
                    </button>
                    <button onClick={() => setSelectedUser(null)} className="flex-1 bg-gray-100 dark:bg-slate-800 dark:text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Return to Hub</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
