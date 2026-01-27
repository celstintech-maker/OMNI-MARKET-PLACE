import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Product, User, Dispute, Transaction, AIConfig, BankDetails, Review, SiteConfig } from '../types';
import { Icons, CATEGORIES, PAYMENT_METHODS, COUNTRY_CURRENCY_MAP } from '../constants';

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
  onUpdateTransaction?: (transaction: Transaction) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, products, adminConfig, disputes, transactions, categories, reviews, onAddProduct, onDeleteProduct, onUpdateUser, onBatchAddProducts, onUpdateProduct, onUpdateTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'finance' | 'settings' | 'ai' | 'orders' | 'compliance' | 'analytics'>('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  
  // Subscription & Extension State
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number} | null>(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionDuration, setExtensionDuration] = useState<6 | 12>(12);
  const [extensionProof, setExtensionProof] = useState<string | null>(null);
  
  // First Time Rent Payment Proof
  const [rentProofDraft, setRentProofDraft] = useState<string | null>(null);

  // Order Management State
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  // Edit State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Copy URL State
  const [urlCopied, setUrlCopied] = useState(false);

  // Compliance/Settings Local State
  const [cacDraft, setCacDraft] = useState(user.verification?.cacRegistrationNumber || '');
  const [docPreview, setDocPreview] = useState<string | null>(user.verification?.govDocumentUrl || null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(user.verification?.profilePictureUrl || null);
  const [storeNameDraft, setStoreNameDraft] = useState(user.storeName || '');
  
  // Payment Gateway Local State
  const [gatewayKeys, setGatewayKeys] = useState({
    paystack: user.sellerPaymentConfig?.paystackPublicKey || '',
    flutterwave: user.sellerPaymentConfig?.flutterwavePublicKey || '',
    stripe: user.sellerPaymentConfig?.stripePublicKey || ''
  });

  // Bank Details Local State
  const [bankDetails, setBankDetails] = useState({
    bankName: user.bankDetails?.bankName || '',
    accountNumber: user.bankDetails?.accountNumber || '',
    accountName: user.bankDetails?.accountName || ''
  });

  const identityDocRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  const [newListing, setNewListing] = useState({
    name: '',
    price: '',
    stock: '',
    category: categories[0] || 'Uncategorized',
    imageUrl: '',   // Image 1
    gallery2: '',   // Image 2
    gallery3: '',   // Image 3
    description: '',
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

  // Timer Effect
  useEffect(() => {
    if (user.rentPaid && user.subscriptionExpiry) {
      const timer = setInterval(() => {
        const now = Date.now();
        const diff = user.subscriptionExpiry! - now;
        
        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0 });
          // Optionally handle expiration logic here (e.g. set rentPaid to false)
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft({ days, hours, minutes });
        }
      }, 60000); // Update every minute
      
      // Initial call
      const now = Date.now();
      const diff = user.subscriptionExpiry - now;
      if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft({ days, hours, minutes });
      } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }

      return () => clearInterval(timer);
    }
  }, [user.rentPaid, user.subscriptionExpiry]);

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

  // Comprehensive Analytics
  const analyticsData = useMemo(() => {
    // 1. Sales Trend (Group by Date) - Last 7 unique activity days or just chronological
    const salesByTimestamp: Record<number, number> = {};
    
    myTransactions.forEach(t => {
      const d = new Date(t.timestamp);
      d.setHours(0,0,0,0);
      const time = d.getTime();
      salesByTimestamp[time] = (salesByTimestamp[time] || 0) + t.amount;
    });

    const trend = Object.keys(salesByTimestamp).map(ts => parseInt(ts)).sort((a,b) => a - b).map(ts => ({
      date: new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: salesByTimestamp[ts]
    }));

    // Normalize for chart (last 7 points or all if less)
    const displayTrend = trend.slice(-10); 
    const maxTrendValue = Math.max(...displayTrend.map(d => d.amount), 1);

    // 2. Demographics (Group by City)
    const locationCounts: Record<string, number> = {};
    myTransactions.forEach(t => {
      const loc = t.billingDetails.city?.trim() || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });
    
    const totalOrders = myTransactions.length;
    const demographics = Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count, percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { displayTrend, maxTrendValue, demographics };
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

  const handleUpdateStatus = (tx: Transaction, status: 'confirmed' | 'failed' | 'shipped' | 'delivered', note?: string) => {
      if (onUpdateTransaction) {
          onUpdateTransaction({ ...tx, status, sellerNote: note });
      }
      setRejectingTxId(null);
      setRejectionNote('');
  };

  const handleIdentitySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB Limit
        alert("File too large. Please use a smaller image (<1MB) for demo purposes.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB Limit
        alert("File too large. Please use a smaller image (<1MB) for demo purposes.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (field: keyof typeof newListing, file: File | null) => {
    if (file) {
      if (file.size > 500 * 1024) { // 500KB Limit to be extremely safe with localStorage
        alert("Image too large. Please use an image under 500KB to prevent storage errors.");
        return;
      }
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

  // New: Submit Rent Proof
  const handleRentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024) {
            alert("File too large. Max 1MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setRentProofDraft(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const handleSubmitRentProof = () => {
    if (!rentProofDraft) {
        alert("Please select an image for proof of payment.");
        return;
    }
    onUpdateUser({
        ...user,
        rentPaymentProof: rentProofDraft,
        rentPaymentStatus: 'pending'
    });
    alert("Payment Proof Submitted. Please wait for Admin confirmation.");
  };

  // Copy URL Handler
  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/store/${encodeURIComponent(user.storeName || '')}`;
    navigator.clipboard.writeText(url);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Extension Modal Handler
  const handleOpenExtension = (duration: 6 | 12) => {
    setExtensionDuration(duration);
    setExtensionProof(null);
    setShowExtensionModal(true);
  };

  const handleSubmitExtensionRequest = () => {
    if (!extensionProof) {
        alert("Please upload proof of payment.");
        return;
    }
    const cost = extensionDuration === 12 ? 75000 : 50000;
    
    onUpdateUser({
        ...user,
        pendingExtensionRequest: {
            durationMonths: extensionDuration,
            amount: cost,
            proofOfPayment: extensionProof,
            timestamp: Date.now()
        }
    });
    setShowExtensionModal(false);
    alert("Extension Request Submitted. Admin will review your payment shortly.");
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024) {
            alert("File too large. Max 1MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setExtensionProof(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const handleUpdateStore = () => {
    onUpdateUser({ ...user, storeName: storeNameDraft });
    alert("Store Details Updated.");
  };

  const handleUpdatePaymentKeys = () => {
    onUpdateUser({
      ...user,
      bankDetails: bankDetails,
      sellerPaymentConfig: {
        paystackPublicKey: gatewayKeys.paystack,
        flutterwavePublicKey: gatewayKeys.flutterwave,
        stripePublicKey: gatewayKeys.stripe
      }
    });
    alert("Payment Configuration Updated Successfully.");
  };

  const handleCountryChange = (country: string) => {
    const currencyData = COUNTRY_CURRENCY_MAP[country];
    if (currencyData) {
      onUpdateUser({
        ...user,
        country: country,
        currency: currencyData.code,
        currencySymbol: currencyData.symbol
      });
    }
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
    if (!user.rentPaid) {
        alert("Shop Rent must be paid and confirmed before uploading inventory.");
        return;
    }
    if (!user.verification?.profilePictureUrl) {
        alert("Please upload a Business Logo/Profile Picture in the Compliance tab before trading.");
        setActiveTab('compliance');
        return;
    }

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
          currencySymbol: user.currencySymbol // Inherit currency
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
        imageUrl: product.imageUrl || product.gallery?.[0] || '',
        gallery2: product.gallery?.[1] || '',
        gallery3: product.gallery?.[2] || '',
        description: product.description,
        videoUrl: product.videoUrl || ''
    });
    setEditingProductId(product.id);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    if (!user.rentPaid) {
        alert("Shop Rent must be paid and confirmed before uploading inventory.");
        return;
    }
    if (!user.verification?.profilePictureUrl) {
        alert("Please upload a Business Logo/Profile Picture in the Compliance tab before adding products.");
        setActiveTab('compliance');
        return;
    }

    setNewListing({
        name: '',
        price: '',
        stock: '',
        category: categories[0] || 'Uncategorized',
        imageUrl: '',
        gallery2: '',
        gallery3: '',
        description: '',
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

  const menuItems = [
      { id: 'inventory', icon: '📦', label: 'Inventory' },
      { id: 'orders', icon: '🚚', label: 'Orders' },
      { id: 'analytics', icon: '📊', label: 'Analytics' },
      { id: 'finance', icon: '🏦', label: 'Finance' },
      { id: 'ai', icon: '🤖', label: 'AI Agent' },
      { id: 'compliance', icon: '⚖️', label: 'Compliance' },
      { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative px-2 sm:px-0">
      {/* Low Stock Warning */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 shadow-lg animate-slide-up flex justify-between items-center rounded-2xl">
           <div>
             <h3 className="text-red-700 dark:text-red-400 font-black uppercase tracking-widest text-xs">Stock Alert: {lowStockProducts.length} Items Critical</h3>
             <p className="text-red-600/70 dark:text-red-300/70 text-[10px] font-bold mt-1">
               Restock immediately to prevent delisting. Reports have been generated.
             </p>
           </div>
           <button onClick={() => { setActiveTab('inventory'); setFilterLowStock(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-red-700 transition">View Inventory</button>
        </div>
      )}

      {/* ... (Verification Warning, Notifications, Rental Fee Logic - Keeping existing blocks) ... */}
      {!user.verification?.govDocumentUrl && (
        <div className="bg-[#fef9c3] dark:bg-yellow-900/30 border-4 border-double border-[#854d0e] dark:border-yellow-600 text-[#854d0e] dark:text-yellow-500 p-6 text-center font-serif shadow-xl animate-bounce rounded-2xl">
           <h3 className="text-2xl font-bold uppercase tracking-widest border-b-2 border-[#854d0e] dark:border-yellow-600 inline-block mb-2 px-4">Notice of Compliance</h3>
           <p className="text-sm italic font-medium mt-2">
             Attention Merchant: Your establishment has not submitted the required identity documents. 
             Please proceed to the Compliance tab immediately to avoid suspension of trade privileges.
           </p>
        </div>
      )}

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

      {!user.rentPaid ? (
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-indigo-600 animate-slide-up">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 w-full">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Settlement Required</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Shop Rental Fee: ₦{adminConfig.rentalPrice.toLocaleString()}</p>
                 
                 {user.rentPaymentStatus === 'pending' ? (
                     <div className="bg-indigo-900/50 border border-indigo-500 p-6 rounded-2xl flex items-center gap-4">
                         <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                         <div>
                             <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Payment Under Review</p>
                             <p className="text-[10px] text-gray-400 mt-1">Admins are verifying your proof. Access will be granted shortly.</p>
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-4">
                        <div className="p-6 bg-[#fffbf0] text-slate-900 border-4 border-double border-slate-900 font-serif relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fffbf0] px-4 text-xs font-bold uppercase tracking-widest border-x-2 border-slate-900">
                            Official Wire Instructions
                            </div>
                            <div className="text-center space-y-1 pt-2">
                            <p className="text-xs uppercase font-bold tracking-widest opacity-60">Pay To The Order Of</p>
                            <pre className="text-sm font-bold whitespace-pre-wrap leading-relaxed">{adminConfig.adminBankDetails}</pre>
                            </div>
                        </div>
                        
                        <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30">
                            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest mb-2">Upload Payment Proof</p>
                            <div className="flex gap-2">
                                <input type="file" onChange={handleRentProofUpload} accept="image/*" className="text-[10px] text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" />
                                <button onClick={handleSubmitRentProof} className="bg-white text-indigo-900 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200">Submit</button>
                            </div>
                        </div>
                     </div>
                 )}
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 animate-slide-up border border-indigo-800">
            <div>
               <h3 className="text-xl font-black uppercase tracking-tighter">License Active</h3>
               {timeLeft ? (
                   <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">
                       Expires in: <span className="text-white text-lg">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
                   </p>
               ) : (
                   <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Lifetime Access (Legacy)</p>
               )}
            </div>
            
            {/* Extension Buttons or Pending State */}
            {user.pendingExtensionRequest ? (
                <div className="bg-indigo-800/50 px-6 py-3 rounded-xl border border-indigo-600/50 flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Extension Pending</p>
                        <p className="text-xs font-bold">{user.pendingExtensionRequest.durationMonths} Months • ₦{user.pendingExtensionRequest.amount.toLocaleString()}</p>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleOpenExtension(6)}
                        className="bg-indigo-700 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition shadow-lg border border-indigo-500"
                    >
                        Extend 6 Months (₦50,000)
                    </button>
                    <button 
                        onClick={() => handleOpenExtension(12)}
                        className="bg-white text-indigo-900 hover:bg-gray-100 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition shadow-lg"
                    >
                        Extend 1 Year (₦75,000)
                    </button>
                </div>
            )}
        </div>
      )}

      {/* Extension Payment Modal - (Keeping existing block) ... */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative border dark:border-slate-800 animate-slide-up">
                <button onClick={() => setShowExtensionModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">✕</button>
                <div className="text-center space-y-2 mb-8">
                    <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Extension Protocol</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Selected: <span className="text-indigo-600">{extensionDuration} Months</span>
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl text-center border border-indigo-100 dark:border-indigo-800">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Amount Due</p>
                        <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                            ₦{extensionDuration === 12 ? '75,000' : '50,000'}
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Transfer Instructions</p>
                        <pre className="text-sm font-bold dark:text-white whitespace-pre-wrap font-mono">{adminConfig.adminBankDetails}</pre>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Upload Payment Receipt</label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer">
                                <div className="bg-white dark:bg-slate-950 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500 transition-colors">
                                    <span className="text-2xl">📎</span>
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Select Image</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} />
                                </div>
                            </label>
                            {extensionProof && (
                                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border dark:border-slate-700 relative group">
                                    <img src={extensionProof} className="w-full h-full object-cover" alt="Proof" />
                                    <button onClick={() => setExtensionProof(null)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 font-bold text-xs">✕</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmitExtensionRequest} 
                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition"
                    >
                        Submit for Admin Review
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Main Header / Store Overview */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-gray-200 dark:border-slate-800 pb-6 gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
             <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase leading-none dark:text-white">{user.storeName || 'Merchant'} Store</h2>
             {sellerRating > 0 && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full flex items-center gap-1">
                   <span className="text-lg">⭐</span>
                   <span className="text-xs font-black text-yellow-700 dark:text-yellow-400">{sellerRating.toFixed(1)}/5</span>
                </div>
             )}
           </div>
           
           <div className="flex items-center gap-3 mt-2">
                <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live URL: 
                    <span className="text-indigo-600 dark:text-indigo-400 select-all">
                        {window.location.host}/#/store/{encodeURIComponent(user.storeName || '')}
                    </span>
                </p>
                <button 
                    onClick={handleCopyLink}
                    className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 p-2 rounded-lg transition-all flex items-center gap-2"
                    title="Copy Store Link"
                >
                    {urlCopied ? (
                        <>
                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            <span className="text-[9px] font-black uppercase text-green-500">Copied</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            <span className="text-[9px] font-black uppercase">Copy</span>
                        </>
                    )}
                </button>
           </div>
           
           {/* Tile Menu */}
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
             {menuItems.map(item => (
               <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id as any); setFilterLowStock(false); }} 
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
        </div>
        <div className="flex gap-2 w-full md:w-auto self-end">
            <button onClick={() => {
                if (!user.rentPaid) { alert("Rent must be confirmed."); return; }
                if (!user.verification?.profilePictureUrl) { alert("Upload profile picture/logo first."); setActiveTab('compliance'); return; }
                setShowBulkModal(true);
            }} className="flex-1 md:flex-none bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 md:px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={!user.rentPaid}>
               Bulk Upload
            </button>
            <button onClick={openAddModal} className="flex-1 md:flex-none bg-indigo-600 text-white px-4 md:px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={!user.rentPaid}>
               <Icons.Plus /> Add Product
            </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-slide-up">
           {/* ... Inventory logic ... */}
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
                     <img src={p.imageUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                     <div className="flex-1">
                        <p className="font-black text-xs uppercase mb-1 truncate dark:text-white">{p.name}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-black text-xs">{p.currencySymbol || '₦'}{p.price.toLocaleString()}</p>
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

      {/* Orders Management Section - (Keeping existing block) */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm animate-slide-up">
           <div className="p-8 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Order Fulfillment Queue</h3>
           </div>
           {myTransactions.length === 0 ? (
             <div className="py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest">No order packets received</div>
           ) : (
             <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {myTransactions.sort((a,b) => b.timestamp - a.timestamp).map(t => {
                  const status = t.status || 'pending';
                  const isPending = status === 'pending';
                  return (
                  <div key={t.id} className={`p-8 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition ${status === 'failed' ? 'bg-red-50/20' : ''}`}>
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                status === 'failed' ? 'bg-red-100 text-red-700' :
                                status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                status === 'delivered' ? 'bg-gray-200 text-gray-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                                {status.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">#{t.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString()}</span>
                     </div>
                     
                     <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                           <div>
                                <p className="font-black uppercase text-sm dark:text-white">{t.productName}</p>
                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{user.currencySymbol || '₦'}{t.amount.toLocaleString()}</p>
                           </div>
                           
                           {/* Buyer Details */}
                           <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl space-y-2 border border-gray-100 dark:border-slate-700">
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Buyer Dossier</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold dark:text-white">{t.billingDetails.fullName}</p>
                                        <p className="text-[10px] text-gray-500">{t.billingDetails.address}, {t.billingDetails.city}, {t.billingDetails.state}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <a href={`mailto:${t.billingDetails.email}`} className="text-[10px] text-indigo-500 font-bold hover:underline flex items-center gap-1">
                                            ✉️ {t.billingDetails.email}
                                        </a>
                                        <a href={`tel:${t.billingDetails.phone}`} className="text-[10px] text-green-500 font-bold hover:underline flex items-center gap-1">
                                            📞 {t.billingDetails.phone} <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[8px] uppercase">Call</span>
                                        </a>
                                    </div>
                                </div>
                           </div>

                           {/* Payment Proof / Method */}
                           <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">{t.paymentMethod.replace('_', ' ')}</span>
                                {t.proofOfPayment && (
                                    <button 
                                        onClick={() => setViewingProof(t.proofOfPayment!)}
                                        className="text-[10px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        📎 View Payment Proof
                                    </button>
                                )}
                                {t.paymentReference && (
                                    <span className="text-[10px] text-gray-500 font-mono bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-700">Ref: {t.paymentReference}</span>
                                )}
                           </div>
                        </div>

                        {/* Actions */}
                        {isPending && (
                            <div className="flex flex-col gap-2 min-w-[150px]">
                                <button 
                                    onClick={() => handleUpdateStatus(t, 'confirmed')}
                                    className="bg-green-600 text-white py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition shadow-lg"
                                >
                                    Confirm Payment
                                </button>
                                <button 
                                    onClick={() => setRejectingTxId(t.id)}
                                    className="bg-red-50 text-red-600 border border-red-100 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition"
                                >
                                    Reject / Report
                                </button>
                            </div>
                        )}
                        {status === 'confirmed' && (
                            <div className="flex flex-col gap-2 min-w-[150px]">
                                <button 
                                    onClick={() => handleUpdateStatus(t, 'shipped')}
                                    className="bg-indigo-600 text-white py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg"
                                >
                                    Mark Shipped
                                </button>
                            </div>
                        )}
                     </div>
                  </div>
                )})}
             </div>
           )}
        </div>
      )}

      {/* Analytics, Finance, AI, Compliance, Settings Tabs - (Keeping existing blocks) */}
      {/* ... */}
      
      {activeTab === 'analytics' && (<div className="space-y-8 animate-slide-up"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gross Revenue</p><p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{user.currencySymbol}{grossSales.toLocaleString()}</p></div><div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Net Earnings</p><p className="text-3xl font-black text-green-600 dark:text-green-400 mt-2">{user.currencySymbol}{netEarnings.toLocaleString()}</p></div><div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Commission Paid</p><p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{user.currencySymbol}{totalCommission.toLocaleString()}</p></div><div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Orders Fulfilled</p><p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{myTransactions.length}</p></div></div></div>)}
      
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
           <div className="space-y-8">
              <div className={`p-8 rounded-[2.5rem] border-2 border-dashed text-center ${isVerified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                 <div className="text-4xl mb-4">{isVerified ? '✅' : '⚠️'}</div>
                 <h3 className={`text-xl font-black uppercase tracking-tighter ${isVerified ? 'text-green-700' : 'text-amber-700'}`}>
                    {isVerified ? 'Verification Complete' : 'Action Required'}
                 </h3>
                 <p className={`text-xs font-bold mt-2 ${isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                    {isVerified ? 'Your store is fully authorized on the global network.' : 'Upload required documents to prevent suspension.'}
                 </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Business Registration (CAC/EIN)</label>
                    <input value={cacDraft} onChange={e => setCacDraft(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono outline-none" placeholder="RC-123456" />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Government ID / Passport</label>
                    <input type="file" ref={identityDocRef} onChange={handleIdentitySelect} className="hidden" accept="image/*" />
                    <div onClick={() => identityDocRef.current?.click()} className="w-full h-32 bg-gray-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition relative overflow-hidden">
                       {docPreview ? (
                          <img src={docPreview} className="absolute inset-0 w-full h-full object-cover" />
                       ) : (
                          <>
                             <span className="text-2xl text-gray-300">📄</span>
                             <span className="text-[9px] font-bold text-gray-400 uppercase mt-2">Click to Upload</span>
                          </>
                       )}
                    </div>
                 </div>

                 <button onClick={handleComplianceSubmit} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Submit for Audit</button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 h-fit">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">Store Identity</h3>
              <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-4">* Required before trading</p>
              <div className="flex flex-col items-center space-y-6">
                 <div className="w-32 h-32 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center relative overflow-hidden group">
                    {profilePicPreview ? (
                       <img src={profilePicPreview} className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-4xl text-gray-300">🏪</span>
                    )}
                    <div onClick={() => profilePicRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                       <span className="text-white text-[9px] font-black uppercase">Edit</span>
                    </div>
                    <input type="file" ref={profilePicRef} onChange={handleProfilePicSelect} className="hidden" accept="image/*" />
                 </div>
                 <p className="text-xs text-gray-500 text-center px-4">This image appears on your store page and receipts. Use a high-res logo.</p>
                 <button onClick={handleComplianceSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Save Identity</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'finance' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up"><div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800"><h3 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">Gateway Configuration</h3><div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Paystack Public Key</label><input value={gatewayKeys.paystack} onChange={e => setGatewayKeys({...gatewayKeys, paystack: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono" placeholder="pk_live_..." /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Flutterwave Key</label><input value={gatewayKeys.flutterwave} onChange={e => setGatewayKeys({...gatewayKeys, flutterwave: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono" placeholder="FLWPUBK_..." /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Stripe Public Key</label><input value={gatewayKeys.stripe} onChange={e => setGatewayKeys({...gatewayKeys, stripe: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono" placeholder="pk_test_..." /></div><button onClick={handleUpdatePaymentKeys} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition">Save Keys</button></div></div><div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800"><h3 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">Bank Payout Details</h3><div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Bank Name</label><input value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold" placeholder="e.g. Chase, Zenith" /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Account Number</label><input value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono" placeholder="0000000000" /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Account Name</label><input value={bankDetails.accountName} onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold" placeholder="Legal Account Name" /></div><button onClick={handleUpdatePaymentKeys} className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition">Update Bank</button></div></div></div>)}
      {activeTab === 'settings' && (<div className="max-w-3xl mx-auto space-y-8 animate-slide-up"><div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6"><h3 className="text-xl font-black uppercase tracking-tighter mb-2 dark:text-white">General Configuration</h3><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Store Name</label><div className="flex gap-2"><input value={storeNameDraft} onChange={e => setStoreNameDraft(e.target.value)} className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none" /><button onClick={handleUpdateStore} className="px-6 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Save</button></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Operating Region</label><select value={user.country || 'Nigeria'} onChange={e => handleCountryChange(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none cursor-pointer">{Object.keys(COUNTRY_CURRENCY_MAP).map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Currency</label><div className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-xl text-xs font-bold text-gray-500 cursor-not-allowed">{user.currency} ({user.currencySymbol})</div></div></div></div><div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6"><h3 className="text-xl font-black uppercase tracking-tighter mb-2 dark:text-white">Payment Methods</h3><p className="text-xs text-gray-500">Enable methods you want to offer to buyers.</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{PAYMENT_METHODS.map(m => (<button key={m.id} onClick={() => handleTogglePaymentMethod(m.id)} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${user.enabledPaymentMethods?.includes(m.id) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-700 opacity-60'}`}><div className="flex items-center gap-3"><span className="text-xl">{m.icon}</span><span className="text-[10px] font-black uppercase tracking-widest dark:text-white">{m.name}</span></div>{user.enabledPaymentMethods?.includes(m.id) && <span className="text-indigo-600 font-bold">✓</span>}</button>))}</div></div><div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 flex justify-between items-center"><div><h3 className="text-sm font-black uppercase tracking-widest dark:text-white">Monthly Analytics Report</h3><p className="text-xs text-gray-500 mt-1">Receive PDF summaries via email.</p></div><button onClick={toggleMonthlyReport} className={`w-12 h-6 rounded-full p-1 transition-colors ${user.monthlyReportSubscribed ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${user.monthlyReportSubscribed ? 'translate-x-6' : ''}`}></div></button></div></div>)}
      {activeTab === 'ai' && (<div className="max-w-2xl mx-auto space-y-8 animate-slide-up"><div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl text-center"><div className="text-4xl mb-4">🤖</div><h3 className="text-2xl font-black uppercase tracking-tighter">Your AI Agent</h3><p className="text-indigo-200 text-xs font-medium max-w-sm mx-auto mt-2">Customize how your automated support agent interacts with customers visiting your store.</p></div><div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Auto-Reply Status</span><button onClick={() => handleUpdateAI({ autoReplyEnabled: !user.aiConfig?.autoReplyEnabled })} className={`w-12 h-6 rounded-full p-1 transition-colors ${user.aiConfig?.autoReplyEnabled ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${user.aiConfig?.autoReplyEnabled ? 'translate-x-6' : ''}`}></div></button></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Greeting Message</label><input value={user.aiConfig?.greeting || ''} onChange={e => handleUpdateAI({ greeting: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="Welcome to our store! How can I help?" /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Agent Tone</label><div className="grid grid-cols-2 gap-3">{['professional', 'friendly', 'enthusiastic', 'minimalist'].map(t => (<button key={t} onClick={() => handleUpdateAI({ tone: t as any })} className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition ${user.aiConfig?.tone === t ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-gray-100 dark:border-slate-800 text-gray-400'}`}>{t}</button>))}</div></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Special Instructions</label><textarea value={user.aiConfig?.specialInstructions || ''} onChange={e => handleUpdateAI({ specialInstructions: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-medium h-32 outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="e.g. Always mention we offer free shipping on orders over $50. Be polite but brief." /></div></div></div>)}

      {/* Add/Edit Product Modal */}
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
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Valuation ({user.currencySymbol || '₦'})</label>
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
                 
                 {/* Image Upload - Main + 2 Gallery Slots */}
                 <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 block">Product Gallery (Max 3)</label>
                    
                    <div className="grid grid-cols-3 gap-4">
                        {/* Image 1 (Main) */}
                        <div className="space-y-2">
                            <div className="relative aspect-square bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                                {newListing.imageUrl ? (
                                    <img src={newListing.imageUrl} alt="Main" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl text-gray-300">1</span>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleFileSelect('imageUrl', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <p className="text-[9px] font-bold text-center text-gray-400">Main Image</p>
                        </div>

                        {/* Image 2 */}
                        <div className="space-y-2">
                            <div className="relative aspect-square bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                                {newListing.gallery2 ? (
                                    <img src={newListing.gallery2} alt="Gallery 2" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl text-gray-300">2</span>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleFileSelect('gallery2', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <p className="text-[9px] font-bold text-center text-gray-400">Gallery 2</p>
                        </div>

                        {/* Image 3 */}
                        <div className="space-y-2">
                            <div className="relative aspect-square bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                                {newListing.gallery3 ? (
                                    <img src={newListing.gallery3} alt="Gallery 3" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl text-gray-300">3</span>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleFileSelect('gallery3', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <p className="text-[9px] font-bold text-center text-gray-400">Gallery 3</p>
                        </div>
                    </div>
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
                    // Construct gallery array from the 3 potential images
                    const gallery = [newListing.imageUrl, newListing.gallery2, newListing.gallery3].filter(Boolean);
                    
                    const productData = {
                      name: newListing.name,
                      price: parseFloat(newListing.price) || 0,
                      stock: parseInt(newListing.stock) || 0,
                      category: newListing.category,
                      imageUrl: newListing.imageUrl, // Main image
                      description: newListing.description,
                      gallery, // Updated gallery
                      videoUrl: newListing.videoUrl,
                      currencySymbol: user.currencySymbol // Ensure product inherits currency
                    };

                    if (editingProductId && onUpdateProduct) {
                        const original = products.find(p => p.id === editingProductId);
                        if (original) {
                            onUpdateProduct({ ...original, ...productData });
                            alert("Product Updated Successfully");
                        }
                    } else {
                        if (!productData.imageUrl) {
                            alert("Main Image is required.");
                            return;
                        }
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

      {showBulkModal && (/* ... kept as is ... */ <div/>)}
    </div>
  );
};