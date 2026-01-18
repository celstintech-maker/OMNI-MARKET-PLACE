
import React, { useState } from 'react';
import { User, Store, Product, Transaction, UserRole, Message } from '../types';
import { COUNTRY_CURRENCY_MAP } from '../constants';
import { SiteConfig } from '../App';
import { ChatSupport } from '../components/ChatSupport';

interface AdminDashboardProps {
  vendors: User[]; 
  stores: Store[];
  products: Product[];
  transactions: Transaction[];
  siteConfig: SiteConfig;
  allMessages?: Record<string, Message[]>;
  onUpdateConfig: (config: SiteConfig) => void;
  onToggleVendorStatus: (id: string) => void;
  onDeleteVendor: (id: string) => void;
  onUpdateUser: (user: User) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  vendors: allUsers, stores, products, transactions, siteConfig, allMessages = {}, onUpdateConfig, onToggleVendorStatus, onDeleteVendor, onUpdateUser 
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'finance' | 'cms' | 'buyers' | 'chat_logs'>('users');
  const [selectedSellerDetail, setSelectedSellerDetail] = useState<User | null>(null);
  const [monitoredChannel, setMonitoredChannel] = useState<string | null>(null);

  const pendingVendors = allUsers.filter(v => v.verification?.verificationStatus === 'pending');
  const buyers = allUsers.filter(v => v.role === UserRole.BUYER);
  
  const totalGTV = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const platformRevenue = transactions.reduce((acc, curr) => acc + curr.commission, 0);

  const handleVerify = (vendor: User, status: 'verified' | 'rejected') => {
    onUpdateUser({
      ...vendor,
      verification: { ...vendor.verification!, verificationStatus: status }
    });
  };

  if (monitoredChannel) {
    const store = stores.find(s => s.id === monitoredChannel);
    return (
      <div className="animate-fade-in space-y-8 bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-2xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMonitoredChannel(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h2 className="text-3xl font-black tracking-tighter">Live Surveillance: {store?.name || 'System Support'}</h2>
          </div>
          <span className="bg-red-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full animate-pulse">Monitoring Active</span>
        </div>
        <div className="flex-1 overflow-hidden rounded-3xl border dark:border-slate-800">
           <ChatSupport 
             currentUser={allUsers.find(u => u.role === UserRole.ADMIN) || null} 
             isEmbedded={true} 
             forcedChannelId={monitoredChannel} 
             theme="light" 
             globalMessages={allMessages}
           />
        </div>
      </div>
    );
  }

  if (selectedSellerDetail) {
    const v = selectedSellerDetail.verification;
    return (
      <div className="animate-fade-in space-y-8 bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedSellerDetail(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h2 className="text-3xl font-black tracking-tighter">Vendor Profile: {v?.businessName}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <img src={v?.profilePictureUrl} className="w-full aspect-video object-cover rounded-3xl shadow-lg" />
            <div className="grid grid-cols-2 gap-4">
              {v?.productSamples.map((s, i) => (
                <img key={i} src={s} className="rounded-2xl border aspect-square object-cover" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Business Name</p>
                <p className="font-bold text-lg">{v?.businessName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phone Number</p>
                <p className="font-bold text-lg">{v?.phoneNumber}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Business Address</p>
                <p className="font-bold text-lg">{v?.businessAddress}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Country/Region</p>
                <p className="font-bold text-lg">{v?.country}, {v?.state}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Settlement Method</p>
                <p className="font-bold text-lg uppercase">{selectedSellerDetail.paymentMethod}</p>
              </div>
            </div>
            <div className="pt-8 border-t dark:border-slate-800 flex gap-4">
              <button onClick={() => handleVerify(selectedSellerDetail, 'verified')} className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Activate Vendor</button>
              <button onClick={() => handleVerify(selectedSellerDetail, 'rejected')} className="flex-1 bg-red-50 text-red-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Decline Request</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button onClick={() => setActiveTab('users')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>Sellers</button>
        <button onClick={() => setActiveTab('buyers')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'buyers' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>Buyers Registry</button>
        <button onClick={() => setActiveTab('verifications')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap relative ${activeTab === 'verifications' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>Applications {pendingVendors.length > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px]">{pendingVendors.length}</span>}</button>
        <button onClick={() => setActiveTab('chat_logs')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'chat_logs' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>Master Chat Logs</button>
        <button onClick={() => setActiveTab('cms')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'cms' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>Site Customization</button>
        <button onClick={() => setActiveTab('finance')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'finance' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>Finance Hub</button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
          <table className="min-w-full divide-y dark:divide-slate-800 font-bold">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-10 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Seller Entity</th>
                <th className="px-10 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Store Status</th>
                <th className="px-10 py-5 text-right text-[10px] uppercase tracking-widest text-gray-400">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {allUsers.filter(u => u.role === UserRole.SELLER).map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-10 py-6">
                    <p className="text-slate-900 dark:text-white font-black">{u.storeName || u.name}</p>
                    <p className="text-[10px] text-gray-400 font-black tracking-widest lowercase">{u.email}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${u.isSuspended ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {u.isSuspended ? 'Suspended' : 'Live Node'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setSelectedSellerDetail(u)} className="text-indigo-600 text-[10px] font-black uppercase underline tracking-widest">View Credentials</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'chat_logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
          <div className="p-8 border-b dark:border-slate-800 bg-indigo-50/30">
            <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600">Global Communication Hub</h4>
            <p className="text-xs text-gray-500 mt-1 font-medium">Monitor all real-time interactions between vendors and buyers.</p>
          </div>
          <table className="min-w-full divide-y dark:divide-slate-800 font-bold">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-10 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Conversation Node</th>
                <th className="px-10 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Message Count</th>
                <th className="px-10 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Last Activity</th>
                <th className="px-10 py-5 text-right text-[10px] uppercase tracking-widest text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {['system', ...stores.map(s => s.id)].map(channelId => {
                const msgs = allMessages[channelId] || [];
                const store = stores.find(s => s.id === channelId);
                const lastMsg = msgs[msgs.length - 1];
                return (
                  <tr key={channelId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-10 py-6">
                      <p className="font-black">{channelId === 'system' ? 'Omni Global Support' : (store?.name || 'Unknown Store')}</p>
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">ID: {channelId}</p>
                    </td>
                    <td className="px-10 py-6 text-xs text-indigo-600 font-black">{msgs.length} Pkts</td>
                    <td className="px-10 py-6 text-[10px] font-bold text-gray-400">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString() : 'No Activity'}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button 
                        onClick={() => setMonitoredChannel(channelId)}
                        className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        Enter Surveillance
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'buyers' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
          <table className="min-w-full divide-y dark:divide-slate-800 font-bold">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-10 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Buyer Name</th>
                <th className="px-10 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Origin Seller Node</th>
                <th className="px-10 py-5 text-right text-[10px] uppercase tracking-widest text-gray-400">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {buyers.map(b => (
                <tr key={b.id}>
                  <td className="px-10 py-6">
                    <p className="font-black">{b.name}</p>
                    <p className="text-[10px] text-gray-400 lowercase font-black tracking-widest">{b.email}</p>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-xs font-bold text-indigo-600">{b.registeredUnderSellerId ? `Node ${b.registeredUnderSellerId}` : 'Global Market Entry'}</p>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="text-[10px] font-black text-red-500 uppercase tracking-widest">Block Access</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'cms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border dark:border-slate-800 space-y-6">
            <h4 className="text-xl font-black uppercase tracking-widest mb-4">Identity & Branding</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Site Title</label>
                <input value={siteConfig.siteName} onChange={e => onUpdateConfig({...siteConfig, siteName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Logo URL</label>
                <input value={siteConfig.logoUrl} onChange={e => onUpdateConfig({...siteConfig, logoUrl: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Favicon URL</label>
                <input value={siteConfig.faviconUrl} onChange={e => onUpdateConfig({...siteConfig, faviconUrl: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border dark:border-slate-800 space-y-6">
            <h4 className="text-xl font-black uppercase tracking-widest mb-4">Support & Contact</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Contact Email</label>
                <input value={siteConfig.contactEmail} onChange={e => onUpdateConfig({...siteConfig, contactEmail: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Support Phone</label>
                <input value={siteConfig.contactPhone} onChange={e => onUpdateConfig({...siteConfig, contactPhone: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Footer Description</label>
                <textarea value={siteConfig.footerText} onChange={e => onUpdateConfig({...siteConfig, footerText: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold h-24" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verifications' && (
        <div className="space-y-6 animate-slide-up">
          {pendingVendors.length === 0 ? (
            <div className="py-24 text-center bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-4 border-dashed dark:border-slate-800">
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No pending applications</p>
            </div>
          ) : (
            pendingVendors.map(vendor => (
              <div key={vendor.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <img src={vendor.verification?.profilePictureUrl} className="w-16 h-16 rounded-2xl object-cover" />
                  <div>
                    <h4 className="text-xl font-black tracking-tighter">{vendor.verification?.businessName}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{vendor.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSellerDetail(vendor)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Process Credentials</button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
          <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none">
            <p className="text-[10px] font-black uppercase text-indigo-200 tracking-[0.4em] mb-2">Platform Revenue</p>
            <p className="text-5xl font-black">₦{platformRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] mb-2">Gross Transaction Volume</p>
            <p className="text-5xl font-black dark:text-white">₦{totalGTV.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
