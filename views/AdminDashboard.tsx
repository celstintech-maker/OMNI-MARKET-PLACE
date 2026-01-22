
import React, { useState, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'finance' | 'cms' | 'buyers' | 'chat_logs' | 'inventory_audit'>('users');
  const [selectedSellerDetail, setSelectedSellerDetail] = useState<User | null>(null);
  const [monitoredChannel, setMonitoredChannel] = useState<string | null>(null);
  const [auditSellerId, setAuditSellerId] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Filter for all users who are registered as Sellers
  const allSellers = allUsers.filter(u => u.role === UserRole.SELLER);
  
  // Vendors specifically waiting for audit
  const pendingVendors = allSellers.filter(v => v.verification?.verificationStatus === 'pending');
  
  const platformRevenue = siteConfig.commissionRate > 0 
    ? transactions.reduce((acc, curr) => acc + curr.commission, 0)
    : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateConfig({
          ...siteConfig,
          [type === 'logo' ? 'logoUrl' : 'faviconUrl']: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onUpdateConfig({ ...siteConfig, commissionRate: value / 100 });
    } else if (e.target.value === '') {
      onUpdateConfig({ ...siteConfig, commissionRate: 0 });
    }
  };

  if (monitoredChannel) {
    const store = stores.find(s => s.id === monitoredChannel);
    return (
      <div className="animate-fade-in space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border dark:border-slate-800 shadow-2xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setMonitoredChannel(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h2 className="text-xl sm:text-3xl font-black tracking-tighter truncate max-w-[150px] sm:max-w-none">Surveillance: {store?.name || 'System'}</h2>
          </div>
          <span className="bg-red-500 text-white text-[7px] sm:text-[8px] font-black uppercase px-3 py-1 rounded-full shrink-0">Live</span>
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl sm:rounded-3xl border dark:border-slate-800">
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

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 px-2 sm:px-0">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {[
          { id: 'users', label: 'Sellers' },
          { id: 'buyers', label: 'Buyers' },
          { id: 'inventory_audit', label: 'Inventory Node' },
          { id: 'verifications', label: 'Audit', badge: pendingVendors.length },
          { id: 'chat_logs', label: 'Surveillance' },
          { id: 'cms', label: 'System' },
          { id: 'finance', label: 'Economy' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}
          >
            {tab.label} {tab.badge ? <span className="ml-1 bg-red-500 text-white px-1.5 rounded-full text-[7px]">{tab.badge}</span> : ''}
          </button>
        ))}
      </div>

      {activeTab === 'cms' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] border dark:border-slate-800 space-y-6">
              <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-gray-400">Brand Identity Assets</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border dark:border-slate-700">
                    {siteConfig.logoUrl ? <img src={siteConfig.logoUrl} className="w-full h-full object-contain" /> : <span className="text-[8px] font-black uppercase opacity-20">LOGO</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Site Logo</p>
                    <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" accept="image/*" />
                    <button onClick={() => logoInputRef.current?.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest">Upload Logo</button>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border dark:border-slate-700">
                    {siteConfig.faviconUrl ? <img src={siteConfig.faviconUrl} className="w-8 h-8 object-contain" /> : <span className="text-[8px] font-black uppercase opacity-20">ICON</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Favicon Asset</p>
                    <input type="file" ref={faviconInputRef} onChange={(e) => handleFileUpload(e, 'favicon')} className="hidden" accept="image/x-icon,image/png" />
                    <button onClick={() => faviconInputRef.current?.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest">Upload Favicon</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] border dark:border-slate-800 space-y-6">
              <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-gray-400">Node Identity</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Network Title</label>
                  <input value={siteConfig.siteName} onChange={e => onUpdateConfig({...siteConfig, siteName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Support Email</label>
                  <input value={siteConfig.contactEmail} onChange={e => onUpdateConfig({...siteConfig, contactEmail: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Support Phone Number</label>
                  <input value={siteConfig.contactPhone} onChange={e => onUpdateConfig({...siteConfig, contactPhone: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Office Hub Address</label>
                  <textarea value={siteConfig.officeAddress} onChange={e => onUpdateConfig({...siteConfig, officeAddress: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm h-20" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] border dark:border-slate-800 space-y-6 max-w-2xl">
            <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-gray-400">Footer CMS</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Footer Tagline</label>
                <textarea value={siteConfig.footerText} onChange={e => onUpdateConfig({...siteConfig, footerText: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-xs h-20" />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Copyright Statement (Banner)</label>
                <input value={siteConfig.announcement} onChange={e => onUpdateConfig({...siteConfig, announcement: e.target.value})} placeholder="Welcome banner or legal text" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory_audit' && (
        <div className="space-y-6 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 h-fit">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Select Vendor Node</h4>
                 <div className="space-y-2">
                    {allSellers.map(vendor => (
                      <button 
                        key={vendor.id}
                        onClick={() => setAuditSellerId(vendor.id)}
                        className={`w-full p-4 rounded-xl text-left text-xs font-black uppercase tracking-widest transition-all ${auditSellerId === vendor.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500'}`}
                      >
                         {vendor.storeName || vendor.name}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                 {auditSellerId ? (
                   <div className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 overflow-hidden shadow-sm">
                      <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Inventory Feed</h4>
                         <span className="text-[8px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{products.filter(p => p.sellerId === auditSellerId).length} Items Detected</span>
                      </div>
                      <div className="divide-y dark:divide-slate-800">
                        {products.filter(p => p.sellerId === auditSellerId).length === 0 ? (
                          <div className="p-20 text-center opacity-40 uppercase text-[10px] font-black tracking-widest">No listings found for this node</div>
                        ) : (
                          products.filter(p => p.sellerId === auditSellerId).map(p => (
                            <div key={p.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                               <img src={p.imageUrl} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="" />
                               <div className="flex-1">
                                  <p className="font-black text-sm">{p.name}</p>
                                  <div className="flex gap-4 mt-1">
                                     <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">{p.category}</p>
                                     <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Stock: {p.stock}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-lg font-black text-slate-900 dark:text-white">₦{p.price.toLocaleString()}</p>
                               </div>
                            </div>
                          ))
                        )}
                      </div>
                   </div>
                 ) : (
                   <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">Initialize Vendor Node Audit</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 animate-slide-up">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[2.5rem] border dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black dark:text-white uppercase tracking-tight">Commission Protocol</h4>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Manage platform fee deductions</p>
              </div>
              <button 
                onClick={() => onUpdateConfig({...siteConfig, commissionRate: siteConfig.commissionRate > 0 ? 0 : 0.10})}
                className={`w-14 h-7 rounded-full transition-all relative ${siteConfig.commissionRate > 0 ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${siteConfig.commissionRate > 0 ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Commission Rate (%)</p>
                <span className="text-[8px] font-black bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded uppercase">Manual Override</span>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  value={Math.round(siteConfig.commissionRate * 100)}
                  onChange={handleCommissionChange}
                  className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl text-3xl font-black outline-none border-2 border-transparent focus:border-indigo-500 transition-all"
                  placeholder="0"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">%</span>
              </div>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">This rate will be applied to all verified vendor transactions across the network.</p>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 sm:p-12 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-center">
            <p className="text-[8px] sm:text-[10px] font-black uppercase text-indigo-200 tracking-[0.3em] mb-4">Network Revenue</p>
            <p className="text-4xl sm:text-6xl font-black">₦{platformRevenue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
          <table className="min-w-full divide-y dark:divide-slate-800 font-bold">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Seller Entity</th>
                <th className="px-8 py-5 text-right text-[10px] uppercase tracking-widest text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {allSellers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-8 py-6">
                    <p className="text-slate-900 dark:text-white font-black">{u.storeName || u.name}</p>
                    <p className="text-[10px] text-gray-400 font-black tracking-widest">{u.email}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => setSelectedSellerDetail(u)} className="text-indigo-600 text-[10px] font-black uppercase underline tracking-widest">Audit Credentials</button>
                  </td>
                </tr>
              ))}
              {allSellers.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center opacity-40 uppercase text-[10px] font-black tracking-widest">No registered sellers detected</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'verifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
          <table className="min-w-full divide-y dark:divide-slate-800 font-bold">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] uppercase tracking-widest text-gray-400">Pending Identity</th>
                <th className="px-8 py-5 text-right text-[10px] uppercase tracking-widest text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {pendingVendors.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-8 py-6">
                    <p className="text-slate-900 dark:text-white font-black">{u.storeName || u.name}</p>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{u.verification?.country || 'Pending Verification'}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => setSelectedSellerDetail(u)} className="text-indigo-600 text-[10px] font-black uppercase underline tracking-widest">Review Protocol</button>
                  </td>
                </tr>
              ))}
              {pendingVendors.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center opacity-40 uppercase text-[10px] font-black tracking-widest">Verification queue clear</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Seller Credentials Audit Modal */}
      {selectedSellerDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 sm:p-12 shadow-2xl relative animate-slide-up">
              <button 
                onClick={() => setSelectedSellerDetail(null)}
                className="absolute top-8 right-8 text-gray-400 hover:text-indigo-600 transition"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="space-y-8">
                 <div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Vendor Audit: {selectedSellerDetail.storeName || selectedSellerDetail.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Identification Credentials</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-gray-50 dark:bg-slate-800/50 p-8 rounded-3xl border dark:border-slate-800">
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Business Name</label>
                       <p className="font-black text-sm">{selectedSellerDetail.verification?.businessName || selectedSellerDetail.name}</p>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Contact Phone</label>
                       <p className="font-black text-sm">{selectedSellerDetail.verification?.phoneNumber || 'Unverified'}</p>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Node Email</label>
                       <p className="font-black text-sm lowercase">{selectedSellerDetail.email}</p>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Audit Status</label>
                       <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${selectedSellerDetail.verification?.verificationStatus === 'verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {selectedSellerDetail.verification?.verificationStatus || 'Awaiting Sync'}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Physical Warehouse/Office Node</label>
                    <p className="bg-gray-50 dark:bg-slate-800/30 p-4 rounded-2xl text-xs font-medium leading-relaxed">
                       {selectedSellerDetail.verification?.businessAddress || 'No physical address synced for this node.'}
                    </p>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedSellerDetail(null)}
                      className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                       Close Audit
                    </button>
                    {selectedSellerDetail.verification?.verificationStatus === 'pending' && (
                      <button 
                        onClick={() => {
                          onUpdateUser({
                            ...selectedSellerDetail,
                            verification: { ...selectedSellerDetail.verification!, verificationStatus: 'verified' }
                          });
                          setSelectedSellerDetail(null);
                        }}
                        className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-200"
                      >
                         Approve Node
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
