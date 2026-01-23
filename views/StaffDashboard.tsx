
import React, { useState, useEffect } from 'react';
import { User, UserRole, Transaction, Dispute, DisputeStatus } from '../types';

interface StaffDashboardProps {
  user: User;
  transactions: Transaction[];
  vendors: User[];
  disputes: Dispute[];
  onUpdateUser?: (user: User) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, transactions, vendors, disputes, onUpdateUser }) => {
  const role = user.role;
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    // If user has default pin, force change
    if (user.pin === '1234') {
        setShowChangePin(true);
    }
  }, [user.pin]);

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
        alert("PIN must be at least 4 digits");
        return;
    }
    if (newPin === '1234') {
        alert("Cannot use default PIN");
        return;
    }
    onUpdateUser?.({ ...user, pin: newPin });
    setShowChangePin(false);
    alert("PIN Updated Successfully");
  };

  return (
    <div className="space-y-12 pb-20 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
           <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{role} Portal</span>
           <h2 className="text-4xl font-black tracking-tighter uppercase mt-4 dark:text-white">Staff Command</h2>
           <p className="text-gray-500 font-bold text-sm">Welcome, {user.name}</p>
        </div>
        <button onClick={() => setShowChangePin(true)} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Change Access PIN</button>
      </div>

      {role === UserRole.MARKETER && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total Gross Volume</h3>
              <p className="text-4xl font-black text-indigo-600 mt-2">₦{transactions.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
           </div>
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Active Vendors</h3>
              <p className="text-4xl font-black text-green-600 mt-2">{vendors.filter(v => v.role === UserRole.SELLER).length}</p>
           </div>
           <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white">
              <h3 className="text-indigo-200 font-black uppercase text-[10px] tracking-widest">Recruitment Impact</h3>
              <p className="text-4xl font-black mt-2">{vendors.filter(v => v.recruitedBy === user.email || v.recruitedBy === user.id).length} <span className="text-lg">Leads</span></p>
           </div>
        </div>
      )}

      {role === UserRole.TECHNICAL && (
        <div className="space-y-8">
           <div className="bg-slate-900 text-white p-10 rounded-[3rem] font-mono border dark:border-slate-800">
              <h3 className="text-green-400 font-bold mb-4">> SYSTEM_STATUS</h3>
              <div className="space-y-2 text-sm opacity-80">
                 <p>API_GATEWAY: <span className="text-green-400">ONLINE</span></p>
                 <p>DATABASE_SHARDS: <span className="text-green-400">SYNCED</span> (4 Nodes)</p>
                 <p>AI_MODEL_LATENCY: 45ms</p>
                 <p>PAYMENT_WEBHOOKS: ACTIVE</p>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800">
              <h3 className="font-black uppercase text-xs tracking-widest mb-6 dark:text-white">Error Logs (Simulated)</h3>
              <div className="space-y-4">
                 {[1,2,3].map(i => (
                    <div key={i} className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold font-mono">
                       [WARN] Connection retry timeout on Node-{i}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {(role === UserRole.TEAM_MEMBER || role === UserRole.STAFF) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
              <h3 className="font-black uppercase text-xs tracking-widest mb-6 dark:text-white">Pending Support Tickets</h3>
              <div className="space-y-4">
                 {disputes.filter(d => d.status === DisputeStatus.OPEN).length === 0 ? (
                    <p className="text-gray-400 font-bold text-xs">No active tickets.</p>
                 ) : disputes.map(d => (
                    <div key={d.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center">
                       <span className="text-xs font-bold dark:text-white">Dispute #{d.id.slice(-4)}</span>
                       <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-black uppercase">{d.status}</span>
                    </div>
                 ))}
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
              <h3 className="font-black uppercase text-xs tracking-widest mb-6 dark:text-white">Internal Announcements</h3>
              <p className="text-sm font-medium text-gray-500">Remember to verify all vendor documents within 24 hours of submission. The new tax protocol is live.</p>
           </div>
        </div>
      )}

      {showChangePin && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
               {!user.pin || user.pin !== '1234' && (
                   <button onClick={() => setShowChangePin(false)} className="absolute top-8 right-8 text-gray-400">✕</button>
               )}
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 dark:text-white">Security Update Required</h3>
               <form onSubmit={handleChangePin} className="space-y-6">
                  <div>
                     <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">New Security PIN</label>
                     <input 
                       autoFocus
                       value={newPin} 
                       onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))} 
                       placeholder="Enter new 4-8 digit PIN"
                       className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl outline-none font-bold border border-gray-200 dark:border-slate-700 tracking-[0.5em] text-center"
                     />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Update Credentials</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
