
import React, { useState, useRef, useMemo } from 'react';
import { Product, User, Dispute, Transaction, AIConfig, BankDetails, Review } from '../types';
import { Icons, CATEGORIES, PAYMENT_METHODS } from '../constants';
import { SiteConfig } from '../App';

interface SellerDashboardProps {
  user: User;
  products: Product[];
  adminConfig: SiteConfig;
  disputes: Dispute[];
  transactions: Transaction[];
  categories: string[];
  reviews: Review[];
  onAddProduct: (product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  onBatchAddProducts?: (products: Product[]) => void;
  onUpdateProduct?: (product: Product) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, products, adminConfig, disputes, transactions, categories, reviews, onAddProduct, onDeleteProduct, onUpdateUser, onBatchAddProducts, onUpdateProduct
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'finance' | 'settings' | 'ai' | 'orders' | 'compliance'>('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  
  // Edit State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Compliance/Settings Local State
  const [cacDraft, setCacDraft] = useState(user.verification?.cacRegistrationNumber || '');
  const [docPreview, setDocPreview] = useState<string | null>(user.verification?.govDocumentUrl || null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(user.verification?.profilePictureUrl || null);
  const [storeNameDraft, setStoreNameDraft] = useState(user.storeName || '');
  
  const identityDocRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  const [newListing, setNewListing] = useState({
    name: '',
    price: '',
    stock: '',
    category: categories[0] || 'Uncategorized',
    imageUrl: '',
    description: '',
    gallery1: '',
    gallery2: '',
    videoUrl: ''
  });

  const isVerified = user.verification?.verificationStatus === 'verified';
  const myProducts = products.filter(p => p.sellerId === user.id);
  const myTransactions = transactions.filter(t => t.sellerId === user.id);

  // --- ANALYTICS CALCULATIONS ---
  const grossSales = myTransactions.reduce((a,b) => a+b.amount,0);
  const totalCommission = grossSales * adminConfig.commissionRate;
  const totalTax = adminConfig.taxEnabled ? grossSales * adminConfig.taxRate : 0;
  const netEarnings = grossSales - totalCommission - totalTax;

  // Best Sellers
  const topSelling = useMemo(() => {
    const counts: Record<string, { count: number, name: string, revenue: number }> = {};
    myTransactions.forEach(t => {
      if (!counts[t.productId]) {
        counts[t.productId] = { count: 0, name: t.productName, revenue: 0 };
      }
      counts[t.productId].count += 1;
      counts[t.productId].revenue += t.amount;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [myTransactions]);

  // Seller Rating Calculation
  const sellerRating = useMemo(() => {
    const sellerReviews = reviews.filter(r => myProducts.some(p => p.id === r.productId));
    if (sellerReviews.length === 0) return 0;
    const total = sellerReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return total / sellerReviews.length;
  }, [reviews, myProducts]);

  // Low Stock
  const lowStockThreshold = 5;
  const lowStockProducts = myProducts.filter(p => p.stock < lowStockThreshold);
  const displayedInventory = filterLowStock ? lowStockProducts : myProducts;

  // --- HANDLERS ---

  const handleIdentitySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (field: keyof typeof newListing, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewListing(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplianceSubmit = () => {
    onUpdateUser({
      ...user,
      verification: { 
        ...(user.verification as any), 
        cacRegistrationNumber: cacDraft,
        govDocumentUrl: docPreview || undefined,
        profilePictureUrl: profilePicPreview || undefined
      }
    });
    alert("Compliance Packet Transmitted. Audit Pending.");
  };

  const handlePayRental = () => {
    onUpdateUser({ ...user, rentPaid: true });
    alert("Settlement Synchronized. Account fully activated.");
  };

  const handleUpdateStore = () => {
    onUpdateUser({ ...user, storeName: storeNameDraft });
    alert("Store Details Updated.");
  };

  const handleUpdateAI = (config: Partial<AIConfig>) => {
    onUpdateUser({
      ...user,
      aiConfig: { ...(user.aiConfig || { greeting: "Hi!", tone: "friendly", autoReplyEnabled: true, specialInstructions: "" }), ...config }
    });
  };

  const handleTogglePaymentMethod = (methodId: string) => {
    const currentMethods = user.enabledPaymentMethods || [];
    let newMethods;
    if (currentMethods.includes(methodId)) {
      newMethods = currentMethods.filter(m => m !== methodId);
    } else {
      newMethods = [...currentMethods, methodId];
    }
    onUpdateUser({ ...user, enabledPaymentMethods: newMethods });
  };

  const handleBulkUpload = () => {
    if (!bulkCsvText.trim()) return;
    
    const lines = bulkCsvText.trim().split('\n');
    const newProducts: Product[] = [];
    
    // Skip header if it exists (simple check)
    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const [name, price, stock, category] = lines[i].split(',').map(s => s.trim());
      if (name && price) {
        newProducts.push({
          id: `bp-${Date.now()}-${i}`,
          sellerId: user.id,
          storeName: user.storeName || 'My Store',
          name,
          price: parseFloat(price) || 0,
          stock: parseInt(stock) || 0,
          category: category || 'Uncategorized',
          description: `Bulk uploaded item: ${name}`,
          imageUrl: 'https://picsum.photos/400/400', // Placeholder
        } as Product);
      }
    }

    if (newProducts.length > 0 && onBatchAddProducts) {
      onBatchAddProducts(newProducts);
      alert(`Successfully uploaded ${newProducts.length} products.`);
      setBulkCsvText('');
      setShowBulkModal(false);
    } else {
      alert("Failed to parse CSV. Format: Name, Price, Stock, Category");
    }
  };

  const generateReport = () => {
    const headers = "Date,Order ID,Product,Amount,Status\n";
    const rows = myTransactions.map(t => 
      `${new Date(t.timestamp).toLocaleDateString()},${t.id},${t.productName},${t.amount},Completed`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Report_${new Date().toISOString().slice(0,7)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleMonthlyReport = () => {
    onUpdateUser({ ...user, monthlyReportSubscribed: !user.monthlyReportSubscribed });
    if (!user.monthlyReportSubscribed) {
      alert("Subscribed! You will receive sales and low stock reports on the 1st of every month.");
    } else {
      alert("Unsubscribed from monthly reports.");
    }
  };

  const openEditModal = (product: Product) => {
    setNewListing({
        name: product.name,
        price: (product.price !== undefined && product.price !== null) ? product.price.toString() : '0',
        stock: (product.stock !== undefined && product.stock !== null) ? product.stock.toString() : '0',
        category: product.category,
        imageUrl: product.imageUrl,
        description: product.description,
        gallery1: product.gallery?.[0] || '',
        gallery2: product.gallery?.[1] || '',
        videoUrl: product.videoUrl || ''
    });
    setEditingProductId(product.id);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setNewListing({
        name: '',
        price: '',
        stock: '',
        category: categories[0] || 'Uncategorized',
        imageUrl: '',
        description: '',
        gallery1: '',
        gallery2: '',
        videoUrl: ''
    });
    setEditingProductId(null);
    setShowAddModal(true);
  };

  if (!isVerified) {
    return (
       <div className="max-w-2xl mx-auto py-32 text-center space-y-8 bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-gray-200 dark:border-slate-800 shadow-2xl animate-slide-up">
          <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 mx-auto text-4xl animate-pulse">⏳</div>
          <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white">Store Under Initial Audit</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed uppercase text-xs tracking-widest">Global Protocol review in progress. Please wait for Super Admin initialization.</p>
       </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      {/* Low Stock Warning */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 shadow-lg animate-slide-up flex justify-between items-center">
           <div>
             <h3 className="text-red-700 dark:text-red-400 font-black uppercase tracking-widest text-xs">Stock Alert: {lowStockProducts.length} Items Critical</h3>
             <p className="text-red-600/70 dark:text-red-300/70 text-[10px] font-bold mt-1">
               Restock immediately to prevent delisting. Reports have been generated.
             </p>
           </div>
           <button onClick={() => { setActiveTab('inventory'); setFilterLowStock(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-red-700 transition">View Inventory</button>
        </div>
      )}

      {/* Verification Warning - Classic CSS */}
      {!user.verification?.govDocumentUrl && (
        <div className="bg-[#fef9c3] dark:bg-yellow-900/30 border-4 border-double border-[#854d0e] dark:border-yellow-600 text-[#854d0e] dark:text-yellow-500 p-6 text-center font-serif shadow-xl animate-bounce">
           <h3 className="text-2xl font-bold uppercase tracking-widest border-b-2 border-[#854d0e] dark:border-yellow-600 inline-block mb-2 px-4">Notice of Compliance</h3>
           <p className="text-sm italic font-medium mt-2">
             Attention Merchant: Your establishment has not submitted the required identity documents. 
             Please proceed to the Compliance tab immediately to avoid suspension of trade privileges.
           </p>
        </div>
      )}

      {/* Notifications Area */}
      {user.notifications && user.notifications.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
           <div className="flex justify-between items-center mb-2">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Store Activity Log</h4>
             <button onClick={() => onUpdateUser({...user, notifications: []})} className="text-[9px] text-gray-400 hover:text-blue-500">Clear</button>
           </div>
           <div className="max-h-24 overflow-y-auto space-y-2 no-scrollbar">
             {user.notifications.map((note, idx) => (
               <p key={idx} className="text-[10px] text-gray-600 dark:text-gray-300 font-medium truncate">• {note}</p>
             ))}
           </div>
        </div>
      )}

      {/* Rental Fee Logic with Classic CSS */}
      {!user.rentPaid && (
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-indigo-600 animate-slide-up">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 w-full">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Settlement Required</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Shop Rental Fee: ₦{adminConfig.rentalPrice.toLocaleString()}</p>
                 <div className="mt-6 p-6 bg-[#fffbf0] text-slate-900 border-4 border-double border-slate-900 font-serif relative max-w-md mx-auto md:mx-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fffbf0] px-4 text-xs font-bold uppercase tracking-widest border-x-2 border-slate-900">
                       Official Wire Instructions
                    </div>
                    <div className="text-center space-y-1 pt-2">
                       <p className="text-xs uppercase font-bold tracking-widest opacity-60">Pay To The Order Of</p>
                       <pre className="text-sm font-bold whitespace-pre-wrap leading-relaxed">{adminConfig.adminBankDetails}</pre>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-900 text-[9px] text-center italic">
                       Authorized by Central Hub • Ref: {user.id.slice(-6).toUpperCase()}
                    </div>
                 </div>
              </div>
              <button onClick={handlePayRental} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition">Authorize Settlement</button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-gray-200 dark:border-slate-800 pb-6 gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
             <h2 className="text-5xl font-black tracking-tighter uppercase leading-none dark:text-white">{user.storeName || 'Merchant'} Store</h2>
             {/* Seller Rating Display */}
             {sellerRating > 0 && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full flex items-center gap-1">
                   <span className="text-lg">⭐</span>
                   <span className="text-xs font-black text-yellow-700 dark:text-yellow-400">{sellerRating.toFixed(1)}/5</span>
                </div>
             )}
           </div>
           <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live URL: <span className="text-indigo-600 dark:text-indigo-400">omni.link/#/store/{encodeURIComponent(user.storeName || '')}</span>
           </p>
           <div className="flex gap-6 mt-6 overflow-x-auto no-scrollbar">
             {['inventory', 'orders', 'ai', 'finance', 'compliance', 'settings'].map(tab => (
               <button 
                key={tab} 
                onClick={() => { setActiveTab(tab as any); setFilterLowStock(false); }} 
                className={`pb-2 text-[10px] uppercase tracking-widest font-black border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                 {tab}
               </button>
             ))}
           </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowBulkModal(true)} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition">
               Bulk Upload (50+)
            </button>
            <button onClick={openAddModal} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition">
               <Icons.Plus /> Add Product
            </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-slide-up">
           {filterLowStock && (
              <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800">
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <p className="text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest">Critical Stock Filter Active</p>
                 </div>
                 <button onClick={() => setFilterLowStock(false)} className="text-[10px] font-black uppercase text-gray-500 hover:text-indigo-600 underline">Clear Filter</button>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedInventory.length === 0 ? (
                <div className="col-span-full py-32 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[3rem] text-gray-400 font-black uppercase text-[10px] tracking-widest">
                    {filterLowStock ? 'No low stock items found' : 'No active products'}
                </div>
              ) : (
                displayedInventory.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex items-center gap-6 group relative overflow-hidden transition-colors">
                     {p.stock < 5 && (
                       <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl z-10">Low Stock: {p.stock}</div>
                     )}
                     {p.isFlagged && (
                       <div className="absolute inset-0 bg-red-50/90 dark:bg-red-900/90 backdrop-blur-sm flex items-center justify-center z-10">
                          <span className="text-red-600 dark:text-white font-black uppercase text-xs">Flagged by Community</span>
                       </div>
                     )}
                     {/* Wishlist Icon (Visual) */}
                     <div className="absolute top-2 left-2 z-10">
                        <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-full text-gray-300 dark:text-gray-600">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                     </div>

                     <img src={p.imageUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                     <div className="flex-1">
                        <p className="font-black text-xs uppercase mb-1 truncate dark:text-white">{p.name}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-black text-xs">₦{p.price.toLocaleString()}</p>
                        <p className="text-[9px] text-gray-400 mt-1">Stock: {p.stock}</p>
                        <div className="flex gap-2 mt-2">
                           <button onClick={() => openEditModal(p)} className="text-[8px] font-black uppercase text-indigo-500 hover:underline">Edit</button>
                           <button onClick={() => onDeleteProduct(p.id)} className="text-[8px] font-black uppercase text-red-500 hover:underline">De-List</button>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-12 animate-slide-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
                 <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Gross Yield</p>
                 <p className="text-3xl font-black dark:text-white">₦{grossSales.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white">
                 <p className="text-[10px] font-black uppercase opacity-60 mb-1">Net Wallet Balance</p>
                 <p className="text-3xl font-black">₦{netEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-4">
                 <button onClick={generateReport} className="w-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest">
                    Download CSV Report
                 </button>
                 <button onClick={toggleMonthlyReport} className={`w-full py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-colors ${user.monthlyReportSubscribed ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-800 text-gray-500'}`}>
                    {user.monthlyReportSubscribed ? 'Monthly Emails Active' : 'Enable Monthly Report'}
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
                 <h3 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">Top Performing Assets</h3>
                 {topSelling.length === 0 ? (
                    <p className="text-gray-400 text-xs font-bold">No sales data recorded.</p>
                 ) : (
                    <div className="space-y-4">
                       {topSelling.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                             <div className="flex items-center gap-4">
                                <span className="text-xl font-black text-indigo-200">#{idx + 1}</span>
                                <div>
                                   <p className="font-bold text-xs dark:text-white">{item.name}</p>
                                   <p className="text-[9px] text-gray-400 font-bold uppercase">{item.count} Units Sold</p>
                                </div>
                             </div>
                             <p className="font-black text-xs text-indigo-600">₦{item.revenue.toLocaleString()}</p>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
                 <h3 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">Recent Payouts</h3>
                 <p className="text-gray-400 text-xs font-bold">Automatic settlements occur every 72 hours.</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
           <div className="p-8 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Order Fulfillment Queue</h3>
           </div>
           {myTransactions.length === 0 ? (
             <div className="py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest">No order packets received</div>
           ) : (
             <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {myTransactions.map(t => (
                  <div key={t.id} className="p-8 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">ID: {t.id.slice(-6)}</span>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(t.timestamp).toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="font-black uppercase text-sm dark:text-white">{t.productName}</p>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Via: {t.paymentMethod.replace('_', ' ')}</p>
                        </div>
                        <p className="text-xl font-black dark:text-white">₦{t.amount.toLocaleString()}</p>
                     </div>
                     <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 mb-1">Billing & Delivery:</p>
                        <p className="text-xs font-bold dark:text-gray-300">{t.billingDetails.address}, {t.billingDetails.city}</p>
                        <p className="text-[10px] text-gray-400">{t.billingDetails.email} • {t.billingDetails.phone}</p>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Identity Protocol</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Business Registration (CAC)</label>
                    <input 
                      value={cacDraft}
                      onChange={(e) => setCacDraft(e.target.value)}
                      placeholder="RC Number"
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-slate-700 outline-none focus:border-indigo-600 transition-colors"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Government ID</label>
                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 border-dashed text-center">
                       {docPreview ? (
                         <div className="relative">
                           <img src={docPreview} className="h-32 mx-auto rounded-lg object-contain" />
                           <button onClick={() => setDocPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 rounded-full text-xs">✕</button>
                         </div>
                       ) : (
                         <button onClick={() => identityDocRef.current?.click()} className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg">Upload Document</button>
                       )}
                       <input ref={identityDocRef} type="file" hidden accept="image/*" onChange={handleIdentitySelect} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Merchant Avatar</label>
                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 border-dashed text-center">
                       {profilePicPreview ? (
                         <div className="relative">
                           <img src={profilePicPreview} className="w-20 h-20 mx-auto rounded-full object-cover" />
                           <button onClick={() => setProfilePicPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 rounded-full text-xs">✕</button>
                         </div>
                       ) : (
                         <button onClick={() => profilePicRef.current?.click()} className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg">Upload Photo</button>
                       )}
                       <input ref={profilePicRef} type="file" hidden accept="image/*" onChange={handleProfilePicSelect} />
                    </div>
                 </div>
                 <button onClick={handleComplianceSubmit} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Submit for Audit</button>
              </div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Status Monitor</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">Identity Verification</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${user.verification?.identityApproved ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                       {user.verification?.identityApproved ? 'Approved' : 'Pending Audit'}
                    </span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">Store Authorization</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${user.verification?.verificationStatus === 'verified' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                       {user.verification?.verificationStatus === 'verified' ? 'Active' : 'Restricted'}
                    </span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Gemini Agent Config</h3>
              <p className="text-[10px] text-gray-500 font-bold">Configure your automated store assistant.</p>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Greeting Message</label>
                    <input 
                       defaultValue={user.aiConfig?.greeting}
                       onBlur={(e) => handleUpdateAI({ greeting: e.target.value })}
                       className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-medium text-xs border border-gray-200 dark:border-slate-700 outline-none focus:border-indigo-600 transition-colors"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Agent Tone</label>
                    <select 
                       value={user.aiConfig?.tone}
                       onChange={(e) => handleUpdateAI({ tone: e.target.value as any })}
                       className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold text-xs border border-gray-200 dark:border-slate-700 outline-none uppercase"
                    >
                       <option value="professional">Professional</option>
                       <option value="friendly">Friendly</option>
                       <option value="enthusiastic">Enthusiastic</option>
                       <option value="minimalist">Minimalist</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Special Instructions</label>
                    <textarea 
                       defaultValue={user.aiConfig?.specialInstructions}
                       onBlur={(e) => handleUpdateAI({ specialInstructions: e.target.value })}
                       placeholder="e.g. Always mention we offer free shipping over ₦50,000"
                       className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-medium text-xs border border-gray-200 dark:border-slate-700 outline-none h-24"
                    />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">Auto-Reply System</span>
                    <button 
                       onClick={() => handleUpdateAI({ autoReplyEnabled: !user.aiConfig?.autoReplyEnabled })}
                       className={`w-10 h-6 rounded-full relative transition-colors ${user.aiConfig?.autoReplyEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                    >
                       <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${user.aiConfig?.autoReplyEnabled ? 'left-5' : 'left-1'}`} />
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl">
              <div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Neural Training</h3>
                 <p className="text-indigo-200 font-medium text-sm leading-relaxed">
                    Your agent learns from your product descriptions and past interactions. Keep your inventory details rich and accurate for the best performance.
                 </p>
              </div>
              <div className="mt-8 bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Agent Status</p>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="font-bold text-sm">Online & Listening</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8 animate-slide-up">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-8">
              <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Store Identity</h3>
              <div className="flex gap-4">
                 <input 
                   value={storeNameDraft}
                   onChange={(e) => setStoreNameDraft(e.target.value)}
                   className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-slate-700 outline-none"
                   placeholder="Store Name"
                 />
                 <button onClick={handleUpdateStore} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest">Update</button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Payment Gateways</h3>
              <p className="text-[10px] font-bold text-gray-400">Enable methods you wish to accept. Bank Transfer is enabled by default via the Central Hub.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {PAYMENT_METHODS.map(method => (
                    <button 
                       key={method.id}
                       onClick={() => handleTogglePaymentMethod(method.id)}
                       className={`p-4 rounded-xl border-2 text-left transition-all ${user.enabledPaymentMethods?.includes(method.id) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'}`}
                    >
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-2xl">{method.icon}</span>
                          {user.enabledPaymentMethods?.includes(method.id) && <span className="text-indigo-600 dark:text-indigo-400">✓</span>}
                       </div>
                       <p className={`text-[10px] font-black uppercase tracking-widest ${user.enabledPaymentMethods?.includes(method.id) ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>{method.name}</p>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
      
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar border dark:border-slate-800">
              <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500">✕</button>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-10 text-center dark:text-white">{editingProductId ? 'Edit Product' : 'New Product'}</h3>
              <div className="space-y-6">
                 {/* Product Form Inputs */}
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Item Identity</label>
                   <input placeholder="Item Name" className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-slate-700 outline-none" value={newListing.name} onChange={e => setNewListing({...newListing, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Valuation (₦)</label>
                       <input type="number" placeholder="Price" className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-slate-700 outline-none" value={newListing.price} onChange={e => setNewListing({...newListing, price: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Stock Quantity</label>
                       <input type="number" placeholder="Qty" className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-slate-700 outline-none" value={newListing.stock} onChange={e => setNewListing({...newListing, stock: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Signal Class</label>
                    <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-bold border border-gray-200 dark:border-slate-700 outline-none" value={newListing.category} onChange={e => setNewListing({...newListing, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 {/* Description */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Item Description</label>
                    <textarea placeholder="Product Description..." className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl font-medium border border-gray-200 dark:border-slate-700 outline-none h-24 text-xs" value={newListing.description} onChange={e => setNewListing({...newListing, description: e.target.value})} />
                 </div>
                 
                 {/* Image Upload Simplified */}
                 <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 mb-2 block">Primary Image</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileSelect('imageUrl', e.target.files?.[0] || null)} className="block w-full text-[10px] text-gray-500 dark:text-gray-400 mb-2" />
                    {newListing.imageUrl && (
                        <img src={newListing.imageUrl} alt="Preview" className="h-20 rounded-lg object-cover" />
                    )}
                 </div>

                 {/* Video Upload Simplified */}
                 <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 mb-2 block">Product Video</label>
                    <input type="file" accept="video/*" onChange={(e) => handleFileSelect('videoUrl', e.target.files?.[0] || null)} className="block w-full text-[10px] text-gray-500 dark:text-gray-400 mb-2" />
                    {newListing.videoUrl && (
                        <p className="text-[9px] text-green-500 font-bold">Video Attached</p>
                    )}
                 </div>

                 <button onClick={() => { 
                    const gallery = [newListing.imageUrl];
                    const productData = {
                      name: newListing.name,
                      price: parseFloat(newListing.price) || 0,
                      stock: parseInt(newListing.stock) || 0,
                      category: newListing.category,
                      imageUrl: newListing.imageUrl,
                      description: newListing.description,
                      gallery,
                      videoUrl: newListing.videoUrl
                    };

                    if (editingProductId && onUpdateProduct) {
                        const original = products.find(p => p.id === editingProductId);
                        if (original) {
                            onUpdateProduct({ ...original, ...productData });
                            alert("Product Updated Successfully");
                        }
                    } else {
                        onAddProduct({
                          ...productData,
                          sellerId: user.id, 
                          storeName: user.storeName!,
                        }); 
                    }
                    setShowAddModal(false); 
                  }} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                   {editingProductId ? 'Save Changes' : 'Add Product'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] p-12 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar border dark:border-slate-800">
              <button onClick={() => setShowBulkModal(false)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500">✕</button>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-center dark:text-white">Bulk Upload Protocol</h3>
              <p className="text-center text-gray-500 text-xs font-bold mb-8">Paste CSV Data: Name, Price, Stock, Category</p>
              
              <div className="space-y-6">
                 <textarea 
                   placeholder={`Example:\nPremium Headphones, 50000, 100, Electronics\nSilk Scarf, 5000, 200, Fashion...`}
                   className="w-full p-6 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-2xl font-mono text-xs border border-gray-200 dark:border-slate-700 outline-none h-64"
                   value={bulkCsvText}
                   onChange={e => setBulkCsvText(e.target.value)}
                 />
                 <div className="flex gap-4">
                   <button 
                     onClick={() => setBulkCsvText(Array.from({length: 50}, (_, i) => `Bulk Item ${i+1}, ${(i+1)*1000}, ${Math.floor(Math.random()*100)}, Electronics`).join('\n'))}
                     className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest"
                   >
                     Generate 50 Test Items
                   </button>
                   <button 
                     onClick={handleBulkUpload}
                     className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                   >
                     Process Bulk Import
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
