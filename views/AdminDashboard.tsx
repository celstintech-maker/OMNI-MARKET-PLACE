
import React, { useState } from 'react';
import { User, Store, Product, Transaction } from '../types';
import { COUNTRY_CURRENCY_MAP, PAYMENT_METHODS } from '../constants';

interface AdminDashboardProps {
  vendors: User[];
  stores: Store[];
  products: Product[];
  transactions: Transaction[];
  onToggleVendorStatus: (id: string) => void;
  onDeleteVendor: (id: string) => void;
  onUpdateUser: (user: User) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ vendors, stores, products, transactions, onToggleVendorStatus, onDeleteVendor, onUpdateUser }) => {
  const [selectedVendor, setSelectedVendor] = useState<User | null>(null);

  const totalCommissionByCurrency = transactions.reduce((acc: Record<string, number>, curr) => {
    const symbol = curr.currencySymbol;
    acc[symbol] = (acc[symbol] || 0) + curr.commission;
    return acc;
  }, {} as Record<string, number>);

  const approveVendor = (vendor: User) => {
    onUpdateUser({
      ...vendor,
      verification: { ...vendor.verification!, verificationStatus: 'verified' }
    });
    setSelectedVendor(null);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 text-white rounded-3xl p-10 shadow-xl flex justify-between items-center border border-slate-800">
          <div>
            <h2 className="text-3xl font-black mb-2 tracking-tighter">System Revenue</h2>
            <p className="text-slate-400 text-sm">Aggregated commission from all successful vendor sales</p>
          </div>
          <div className="text-right">
            <div className="space-y-2">
              {Object.entries(totalCommissionByCurrency).map(([symbol, amount]) => (
                <p key={symbol} className="text-4xl font-black text-indigo-400">{symbol}{(amount as number).toLocaleString()}</p>
              ))}
              {Object.keys(totalCommissionByCurrency).length === 0 && (
                <p className="text-4xl font-black text-indigo-400">₦0.00</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-6 tracking-widest">Global Reach</h3>
           <div className="space-y-4">
             <div className="flex justify-between items-end border-b dark:border-slate-800 pb-2">
               <span className="text-gray-500 text-xs font-bold uppercase">Vendors</span>
               <span className="text-2xl font-black">{vendors.length}</span>
             </div>
             <div className="flex justify-between items-end border-b dark:border-slate-800 pb-2">
               <span className="text-gray-500 text-xs font-bold uppercase">Inventory</span>
               <span className="text-2xl font-black">{products.length}</span>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black">Vendor Master List</h3>
        </div>
        <table className="min-w-full divide-y dark:divide-slate-800">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Entity / Security</th>
              <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Geolocation</th>
              <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Finances</th>
              <th className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {vendors.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition cursor-default">
                <td className="px-8 py-6">
                  <div className="font-bold text-gray-900 dark:text-white mb-1">{v.name}</div>
                  <div className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{v.email}</div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-sm font-bold flex items-center gap-1">
                    {v.verification?.country === 'Nigeria' 
                      ? `${v.verification.city}, ${v.verification.state}`
                      : v.verification?.country || v.country || 'International'}
                    <span className="text-xs text-gray-400">({COUNTRY_CURRENCY_MAP[v.verification?.country || 'Nigeria']?.symbol})</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded w-fit uppercase">
                       {v.paymentMethod?.replace('_', ' ') || 'Not Set'}
                     </span>
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase w-fit ${v.verification?.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {v.verification?.verificationStatus || 'unverified'}
                    </span>
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => setSelectedVendor(v)} className="text-indigo-600 font-black text-xs uppercase tracking-widest mr-6 hover:underline">Audit</button>
                  <button onClick={() => onDeleteVendor(v.id)} className="text-red-500 font-black text-xs uppercase tracking-widest">Expel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVendor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-y-auto border dark:border-slate-800">
            <div className="p-10 border-b dark:border-slate-800 flex justify-between items-start">
              <div className="flex gap-8 items-center">
                <img src={selectedVendor.verification?.profilePictureUrl || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-3xl object-cover ring-8 ring-indigo-50 dark:ring-slate-800" />
                <div>
                  <h3 className="text-3xl font-black tracking-tighter">{selectedVendor.name}</h3>
                  <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">{selectedVendor.storeName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Security Access</p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                    <p className="text-xs text-indigo-500 font-bold mb-1">Login Email</p>
                    <p className="font-bold text-sm mb-4">{selectedVendor.email}</p>
                    <p className="text-xs text-indigo-500 font-bold mb-1">Security Hint</p>
                    <p className="font-mono text-xs">{selectedVendor.passwordHint || 'No hint provided'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Regional Detail</p>
                  <div className="space-y-2">
                    <p className="text-sm font-bold">{selectedVendor.verification?.country || 'Nigeria'}</p>
                    <p className="text-xs text-gray-500 font-medium">{selectedVendor.verification?.city}, {selectedVendor.verification?.state} State</p>
                    <p className="text-xs text-gray-500 font-medium">{selectedVendor.verification?.businessAddress}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Financial Gateway</p>
                  <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none">
                    <p className="text-[10px] font-black text-indigo-200 uppercase mb-4">Payout Method: {selectedVendor.paymentMethod || 'Stripe'}</p>
                    {selectedVendor.bankDetails ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-[8px] uppercase font-black text-indigo-200 opacity-80">Bank</p>
                          <p className="font-black text-sm">{selectedVendor.bankDetails.bankName}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase font-black text-indigo-200 opacity-80">Account</p>
                          <p className="font-black text-sm">{selectedVendor.bankDetails.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase font-black text-indigo-200 opacity-80">Holder</p>
                          <p className="font-black text-sm uppercase">{selectedVendor.bankDetails.accountName}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs italic opacity-80">Direct digital payout via Stripe/Paystack</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Stock Samples</p>
                <div className="grid grid-cols-2 gap-4">
                  {selectedVendor.verification?.productSamples?.map((img, i) => (
                    <img key={i} src={img} className="aspect-square object-cover rounded-2xl border dark:border-slate-800 grayscale hover:grayscale-0 transition duration-500" />
                  )) || <p className="text-xs text-gray-400">No samples provided</p>}
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-6 rounded-b-[2.5rem]">
              <button onClick={() => onToggleVendorStatus(selectedVendor.id)} className="px-8 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest">
                {selectedVendor.isSuspended ? 'Lift Ban' : 'Suspend Account'}
              </button>
              <button onClick={() => approveVendor(selectedVendor)} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none transition hover:scale-105 active:scale-95">
                Approve Identification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
