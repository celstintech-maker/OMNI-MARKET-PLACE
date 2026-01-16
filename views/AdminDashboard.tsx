import React, { useState } from 'react';
import { User, Store, Product, Transaction, UserRole } from '../types';
import { COUNTRY_CURRENCY_MAP } from '../constants';
import { SiteConfig } from '../App';

interface AdminDashboardProps {
  vendors: User[]; 
  stores: Store[];
  products: Product[];
  transactions: Transaction[];
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
  onToggleVendorStatus: (id: string) => void;
  onDeleteVendor: (id: string) => void;
  onUpdateUser: (user: User) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  vendors: allUsers, stores, products, transactions, siteConfig, onUpdateConfig, onToggleVendorStatus, onDeleteVendor, onUpdateUser 
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'finance' | 'cms'>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const pendingVendors = allUsers.filter(v => v.verification?.verificationStatus === 'pending');
  const totalGTV = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const platformRevenue = transactions.reduce((acc, curr) => acc + curr.commission, 0);

  const handleVerify = (vendor: User, status: 'verified' | 'rejected') => {
    const updatedUser: User = {
      ...vendor,
      verification: {
        ...vendor.verification!,
        verificationStatus: status
      }
    };
    onUpdateUser(updatedUser);
  };

  const saveUserEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser);
      setEditingUser(null);
    }
  };

  const handleRoleChange = (user: User, newRole: UserRole) => {
    onUpdateUser({ ...user, role: newRole });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-20">
      <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button onClick={() => setActiveTab('users')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>User Control</button>
        <button onClick={() => setActiveTab('verifications')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap relative ${activeTab === 'verifications' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>
          Verification
          {pendingVendors.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-black">{pendingVendors.length}</span>}
        </button>
        <button onClick={() => setActiveTab('finance')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${activeTab === 'finance' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>Finance</button>
        <button onClick={() => setActiveTab('cms')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${activeTab === 'cms' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>CMS</button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
          <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-black uppercase tracking-widest">Global User Registry</h3>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{allUsers.length} TOTAL ENTITIES</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y dark:divide-slate-800 font-bold">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Entity</th>
                  <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Role</th>
                  <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Status</th>
                  <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-black">{u.name}</span>
                        <span className="text-[10px] text-indigo-500 font-black lowercase">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        className={`bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer focus:ring-2 focus:ring-indigo-600 transition-all ${u.role === UserRole.ADMIN ? 'text-purple-600' : u.role === UserRole.SELLER ? 'text-blue-600' : 'text-gray-600'}`}
                      >
                        <option value={UserRole.BUYER}>Buyer</option>
                        <option value={UserRole.SELLER}>Seller</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                      </select>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-4 py-1.5 ${u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} text-[10px] font-black uppercase rounded-full shadow-sm`}>
                        {u.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right space-x-4">
                      <button onClick={() => setEditingUser(u)} className="text-indigo-600 text-[10px] font-black uppercase hover:underline">Edit Info</button>
                      <button onClick={() => onUpdateUser({...u, isSuspended: !u.isSuspended})} className={`${u.isSuspended ? 'text-green-600' : 'text-amber-600'} text-[10px] font-black uppercase hover:underline`}>
                        {u.isSuspended ? 'Lift' : 'Block'}
                      </button>
                      <button onClick={() => onDeleteVendor(u.id)} className="text-red-500 text-[10px] font-black uppercase hover:underline">Purge</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={saveUserEdits} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl space-y-6 relative">
            <h3 className="text-2xl font-black tracking-tighter">Master User Edit</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Full Name</label>
                <input value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Access Email</label>
                <input value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200">Commit Changes</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'cms' && (
        <div className="space-y-8 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
              <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-8">Omni Neural Support Protocol</h4>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Global Announcement Node</label>
                    <input 
                       value={siteConfig.announcement}
                       onChange={(e) => onUpdateConfig({...siteConfig, announcement: e.target.value})}
                       className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Hero Interface Title</label>
                    <input 
                       value={siteConfig.heroTitle}
                       onChange={(e) => onUpdateConfig({...siteConfig, heroTitle: e.target.value})}
                       className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-lg"
                    />
                 </div>
                 <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-800">
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-4">Support AI Behavior</p>
                    <p className="text-xs font-medium text-gray-500 mb-4">The Global Support AI manages general inquiries for buyers and guest users.</p>
                    <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Initialize Neural Update</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'verifications' && (
        <div className="space-y-6 animate-slide-up">
           {pendingVendors.length === 0 ? (
             <div className="py-24 text-center bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-slate-800">
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em]">Queue is currently empty</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-6">
               {pendingVendors.map(vendor => (
                 <div key={vendor.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border dark:border-slate-800 flex flex-col lg:flex-row gap-6 lg:gap-10 shadow-sm">
                    <div className="w-full lg:w-72">
                       <img src={vendor.verification?.profilePictureUrl} className="w-full aspect-square object-cover rounded-[2rem] mb-4 shadow-lg" />
                    </div>
                    <div className="flex-1 space-y-6">
                       <h4 className="text-2xl sm:text-3xl font-black tracking-tighter">{vendor.verification?.businessName}</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] uppercase tracking-widest font-black text-gray-400">
                          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                             <p>Security: Email (Access)</p>
                             <p className="text-slate-900 dark:text-white mt-1 lowercase truncate">{vendor.email}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                             <p>Region Protocol</p>
                             <p className="text-slate-900 dark:text-white mt-1">{vendor.verification?.country} ({COUNTRY_CURRENCY_MAP[vendor.verification?.country || 'Nigeria']?.symbol || '₦'})</p>
                          </div>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button onClick={() => handleVerify(vendor, 'verified')} className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex-1 shadow-lg shadow-indigo-100">Approve Vendor</button>
                          <button onClick={() => handleVerify(vendor, 'rejected')} className="bg-red-50 text-red-600 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex-1">Reject Application</button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-6 sm:space-y-8 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Platform GTV</p>
                 <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">₦{totalGTV.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-600 p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                 <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Revenue ({siteConfig.commissionRate * 100}%)</p>
                 <p className="text-3xl sm:text-4xl font-black">₦{platformRevenue.toLocaleString()}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};