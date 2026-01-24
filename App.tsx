
import React, { useState, useEffect } from 'react';
import { User, Product, Store, UserRole, Transaction, CartItem, Message, Dispute, DisputeStatus, Review } from './types';
import { MOCK_PRODUCTS, MOCK_STORES, Icons, CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import { Layout } from './components/Layout';
import { MarketplaceHome } from './views/MarketplaceHome';
import { SellerDashboard } from './views/SellerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { StaffDashboard } from './views/StaffDashboard';
import { StorePage } from './views/StorePage';
import { AuthView } from './views/AuthView';
import { ChatSupport } from './components/ChatSupport';
import { BuyerDashboard } from './views/BuyerDashboard';
import { LegalView } from './views/LegalView';
import { AboutUsView } from './views/AboutUsView';
import { ServicesView } from './views/ServicesView';
import { CartView } from './views/CartView';
import { PurchaseSuccessView } from './views/PurchaseSuccessView';

type View = 'home' | 'seller-dashboard' | 'admin-dashboard' | 'staff-dashboard' | 'store-page' | 'auth' | 'wishlist' | 'buyer-dashboard' | 'privacy' | 'terms' | 'sourcing' | 'cookies' | 'about' | 'services' | 'cart' | 'purchase-success';

export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundUrl: string;
  commissionRate: number;
  rentalPrice: number;
  adminBankDetails: string;
  announcement: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  officeAddress: string;
  availableRentMethods: string[];
  stripePublicKey?: string;
  stripeSecretKey?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string;
  taxEnabled: boolean;
  taxRate: number;
  autoFlaggingEnabled: boolean;
}

const STORAGE_KEYS = {
  USER: 'omni_current_user',
  VENDORS: 'omni_vendors',
  PRODUCTS: 'omni_products',
  STORES: 'omni_stores',
  CONFIG: 'omni_site_config',
  THEME: 'omni_theme',
  TRANSACTIONS: 'omni_transactions',
  DISPUTES: 'omni_disputes',
  CATEGORIES: 'omni_categories',
  REVIEWS: 'omni_reviews',
  SITE_UNLOCKED: 'omni_security_clearance'
};

const SecurityGate: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '6561') {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-[9999] text-center font-mono select-none">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        <div className="relative w-24 h-24 mx-auto mb-8">
           <div className={`absolute inset-0 border-4 border-indigo-600 rounded-full animate-spin ${error ? 'border-red-600' : 'border-indigo-600'}`} style={{ animationDuration: '3s' }}></div>
           <div className={`absolute inset-4 border-4 border-slate-700 rounded-full animate-spin ${error ? 'border-red-900' : 'border-slate-700'}`} style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
           <div className="absolute inset-0 flex items-center justify-center text-4xl">🔒</div>
        </div>
        
        <div>
           <h1 className="text-3xl font-black uppercase text-white tracking-[0.5em] mb-2">Omni Private</h1>
           <p className="text-indigo-500 text-xs font-bold uppercase tracking-widest">Restricted Network Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <input 
             type="password" 
             value={pin}
             onChange={(e) => setPin(e.target.value)}
             className={`w-full bg-slate-900 border-2 ${error ? 'border-red-600 text-red-500' : 'border-slate-800 text-white focus:border-indigo-600'} rounded-xl p-5 text-center text-2xl font-black outline-none tracking-[1em] transition-all`}
             placeholder="••••"
             maxLength={4}
             autoFocus
           />
           <button 
             type="submit"
             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-lg active:scale-95"
           >
             Decrypt Interface
           </button>
        </form>
        
        {error && (
          <p className="text-red-500 text-xs font-black uppercase tracking-widest animate-pulse">Access Denied: Invalid Credential</p>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isSiteUnlocked, setIsSiteUnlocked] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.SITE_UNLOCKED) === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : {
      siteName: "OMNI",
      logoUrl: "",
      faviconUrl: "",
      heroTitle: "OMNI MARKETPLACE",
      heroSubtitle: "Hyper-curated selections from independent global verified vendors.",
      heroBackgroundUrl: "",
      commissionRate: 0.10,
      rentalPrice: 75000,
      adminBankDetails: "Omni Global Central Hub\nBank: Apex Global Bank\nAccount: 0098877665\nSort Code: 01-02-03",
      announcement: "WELCOME TO THE FUTURE OF GLOBAL COMMERCE. VERIFIED VENDORS ONLY.",
      footerText: "Omni is a hyper-curated multi-vendor marketplace protocol.",
      contactEmail: "support@omni.link",
      contactPhone: "+234 800 OMNI HELP",
      officeAddress: "Silicon Valley Hub, Digital Way, Tech Park 101",
      availableRentMethods: ['bank_transfer', 'stripe', 'paystack'],
      stripePublicKey: '',
      paystackPublicKey: '',
      flutterwavePublicKey: '',
      taxEnabled: true,
      taxRate: 0.05, // 5% tax
      autoFlaggingEnabled: true
    };
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [vendors, setVendors] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: 's1', 
        name: 'Alex Johnson', 
        email: 'alex@tech.com', 
        role: UserRole.SELLER, 
        pin: '0000',
        storeName: 'TechHub', 
        verification: { businessName: 'TechHub', businessAddress: 'SF', country: 'United States', phoneNumber: '555', profilePictureUrl: '', verificationStatus: 'verified', productSamples: [], approvalDate: Date.now() - 10000000 },
        rentPaid: true,
        aiConfig: { greeting: "Welcome to TechHub! I am your AI assistant.", tone: "professional", autoReplyEnabled: true, specialInstructions: "" },
        notifications: []
      },
      { id: 'admin1', name: 'Super Admin', email: 'admin@omni.com', role: UserRole.ADMIN, pin: '6561', notifications: [] }
    ];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) return JSON.parse(saved);
    return MOCK_PRODUCTS as Product[];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return saved ? JSON.parse(saved) : [];
  });

  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STORES);
    return saved ? JSON.parse(saved) : MOCK_STORES as Store[];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [disputes, setDisputes] = useState<Dispute[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISPUTES);
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as 'light' | 'dark') || 'light';
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [lastOrderDetails, setLastOrderDetails] = useState<{ transactions: Transaction[] } | null>(null);

  // Security Protocols: Anti-Inspection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }
      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
      }
      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }
      // Block Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(siteConfig));
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [currentUser, vendors, products, siteConfig, stores, transactions, disputes, categories, reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Routing Logic
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2); // remove #/
      
      if (hash.startsWith('store/')) {
        const storeName = decodeURIComponent(hash.split('store/')[1]);
        const foundStore = stores.find(s => s.name === storeName);
        if (foundStore) {
          if (foundStore.status === 'suspended' && currentUser?.role !== UserRole.ADMIN) {
             alert("This store is currently suspended.");
             setCurrentView('home');
          } else {
             setSelectedStore(foundStore);
             setCurrentView('store-page');
             trackVisit(foundStore);
          }
        } else {
          setCurrentView('home');
        }
      } else if (hash === 'home' || hash === '') {
        setCurrentView('home');
        trackAdminVisit();
      } else {
        setCurrentView(hash as View);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial load
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [stores, currentUser]);

  const addNotification = (userId: string, message: string) => {
    setVendors(prevVendors => prevVendors.map(v => {
      if (v.id === userId) {
        const currentNotes = v.notifications || [];
        return { ...v, notifications: [message, ...currentNotes].slice(0, 20) };
      }
      return v;
    }));
  };

  const trackAdminVisit = () => {
    const admin = vendors.find(v => v.role === UserRole.ADMIN);
    if (admin) {
      addNotification(admin.id, `Visitor detected on Marketplace Home at ${new Date().toLocaleTimeString()}`);
    }
  };

  const trackVisit = (store: Store) => {
    // Notify Seller
    addNotification(store.sellerId, `Visitor detected at your store "${store.name}" at ${new Date().toLocaleTimeString()}`);
    // Notify Admin
    const admin = vendors.find(v => v.role === UserRole.ADMIN);
    if (admin) {
      addNotification(admin.id, `User visiting store: ${store.name}`);
    }
  };

  const handleNavigate = (view: string) => {
    window.location.hash = `#/${view}`;
    window.scrollTo(0, 0);
  };

  const navigateToStore = (storeName: string) => {
    window.location.hash = `#/store/${encodeURIComponent(storeName)}`;
  };

  const onLogin = (email: string, role: UserRole, pin: string, storeName?: string, hint?: string, referralCode?: string) => {
    const existing = vendors.find(v => v.email === email);
    
    if (existing) {
      // PIN CHECK
      if (existing.pin && existing.pin !== pin) {
        alert("Invalid PIN credentials.");
        return;
      }
      
      if (existing.isSuspended) {
        alert("Account is currently suspended by Admin.");
        return;
      }

      setCurrentUser(existing);
      if (existing.role === UserRole.ADMIN) handleNavigate('admin-dashboard');
      else if (existing.role === UserRole.SELLER) handleNavigate('seller-dashboard');
      else if ([UserRole.STAFF, UserRole.MARKETER, UserRole.TECHNICAL, UserRole.TEAM_MEMBER].includes(existing.role)) handleNavigate('staff-dashboard');
      else handleNavigate('buyer-dashboard');
      
    } else {
      // Register new user
      const loggedUser: User = { 
        id: `u-${Date.now()}`, 
        name: email.split('@')[0], 
        email, 
        role, 
        pin, // Store the PIN
        storeName,
        recruitedBy: referralCode, // Link the new user to the staff member
        aiConfig: { greeting: "Hi! How can I assist you?", tone: "friendly", autoReplyEnabled: true, specialInstructions: "" },
        notifications: []
      };
      setVendors([...vendors, loggedUser]);
      if (role === UserRole.SELLER && storeName) {
        setStores([...stores, { id: `st-${Date.now()}`, sellerId: loggedUser.id, name: storeName, description: `Marketplace for ${storeName}`, bannerUrl: 'https://picsum.photos/1200/400', status: 'active' }]);
      }
      setCurrentUser(loggedUser);
      if (loggedUser.role === UserRole.ADMIN) handleNavigate('admin-dashboard');
      else if (loggedUser.role === UserRole.SELLER) handleNavigate('seller-dashboard');
      else if ([UserRole.STAFF, UserRole.MARKETER, UserRole.TECHNICAL, UserRole.TEAM_MEMBER].includes(loggedUser.role)) handleNavigate('staff-dashboard');
      else handleNavigate('buyer-dashboard');
    }
  };

  const onLogout = () => { setCurrentUser(null); handleNavigate('home'); };
  const onAddToCart = (item: CartItem) => setCart([...cart, item]);
  const onUpdateUser = (u: User) => { 
    if (currentUser && u.id === currentUser.id) setCurrentUser(u); 
    setVendors(vendors.map(v => v.id === u.id ? u : v)); 
  };
  const onRaiseDispute = (dispute: Dispute) => setDisputes([...disputes, dispute]);
  const onUpdateDispute = (updated: Dispute) => setDisputes(disputes.map(d => d.id === updated.id ? updated : d));
  const onAddCategory = (cat: string) => setCategories([...categories, cat]);
  const onAddReview = (review: Review) => setReviews([...reviews, review]);
  const onFlagProduct = (productId: string) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const newFlags = (p.flags || 0) + 1;
        // Auto flag logic if enabled by Super Admin
        const shouldHide = siteConfig.autoFlaggingEnabled && newFlags >= 3; 
        return { ...p, flags: newFlags, isFlagged: p.isFlagged || shouldHide };
      }
      return p;
    }));
    const admin = vendors.find(v => v.role === UserRole.ADMIN);
    if (admin) addNotification(admin.id, `Product ${productId} reported by community.`);
  };

  const handleToggleVendorStatus = (id: string) => {
    // Toggle Vendor Suspension
    setVendors(prev => prev.map(v => v.id === id ? { ...v, isSuspended: !v.isSuspended } : v));
    
    // Toggle Store Suspension
    setStores(prev => prev.map(s => {
      if (s.sellerId === id) {
        return { ...s, status: s.status === 'active' ? 'suspended' : 'active' };
      }
      return s;
    }));
  };

  const handleUnlockSite = () => {
    setIsSiteUnlocked(true);
    sessionStorage.setItem(STORAGE_KEYS.SITE_UNLOCKED, 'true');
  };

  if (!isSiteUnlocked) {
    return <SecurityGate onUnlock={handleUnlockSite} />;
  }

  // Get current user's fresh state from vendors list for notifications and pin updates
  const freshCurrentUser = currentUser ? vendors.find(v => v.id === currentUser.id) || currentUser : null;

  return (
    <Layout 
      user={freshCurrentUser} onLogout={onLogout} onNavigate={handleNavigate} currentView={currentView}
      theme={theme} onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      cartCount={cart.length} onOpenCart={() => handleNavigate('cart')} config={siteConfig}
    >
      {currentView === 'home' && (
        <MarketplaceHome 
          config={siteConfig} products={products} stores={stores} categories={categories}
          onNavigateToStore={navigateToStore}
          wishlist={wishlist} onToggleWishlist={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          isLoggedIn={!!freshCurrentUser} currentUser={freshCurrentUser} onAddToCart={onAddToCart} onBecomeSeller={() => handleNavigate('auth')}
          onFlagProduct={onFlagProduct}
        />
      )}
      {currentView === 'auth' && <AuthView stores={stores} onLogin={onLogin} />}
      {currentView === 'cart' && (
        <CartView 
          cart={cart} 
          setCart={setCart} 
          onNavigate={handleNavigate} 
          onCompletePurchase={(newTs) => { setTransactions([...transactions, ...newTs]); setLastOrderDetails({ transactions: newTs }); setCart([]); handleNavigate('purchase-success'); }} 
          config={siteConfig}
        />
      )}
      {currentView === 'purchase-success' && lastOrderDetails && (
        <PurchaseSuccessView transactions={lastOrderDetails.transactions} onNavigate={handleNavigate} />
      )}
      {currentView === 'about' && <AboutUsView config={siteConfig} />}
      {currentView === 'services' && <ServicesView config={siteConfig} />}
      {['privacy', 'terms', 'sourcing', 'cookies'].includes(currentView) && <LegalView view={currentView as any} config={siteConfig} />}
      {currentView === 'seller-dashboard' && freshCurrentUser && (
        <SellerDashboard 
          user={freshCurrentUser} products={products} adminConfig={siteConfig} disputes={disputes} categories={categories}
          transactions={transactions} reviews={reviews}
          onAddProduct={(p) => setProducts([...products, { ...p, id: `p-${Date.now()}` } as Product])}
          onDeleteProduct={(id) => setProducts(products.filter(p => p.id !== id))}
          onUpdateUser={onUpdateUser} onBatchAddProducts={(newPs) => setProducts([...products, ...newPs])}
        />
      )}
      {currentView === 'admin-dashboard' && freshCurrentUser?.role === UserRole.ADMIN && (
        <AdminDashboard 
          vendors={vendors} stores={stores} products={products} transactions={transactions} categories={categories}
          siteConfig={siteConfig} allMessages={allMessages} disputes={disputes} currentUser={freshCurrentUser}
          onUpdateConfig={setSiteConfig} onUpdateUser={onUpdateUser}
          onToggleVendorStatus={handleToggleVendorStatus}
          onDeleteVendor={(id) => setVendors(vendors.filter(v => v.id !== id))}
          onUpdateDispute={onUpdateDispute} onAddCategory={onAddCategory}
          onCreateStaff={(staff) => setVendors([...vendors, staff])}
          onUpdateProduct={(p) => setProducts(products.map(prod => prod.id === p.id ? p : prod))}
        />
      )}
      {currentView === 'staff-dashboard' && freshCurrentUser && (
        <StaffDashboard user={freshCurrentUser} transactions={transactions} vendors={vendors} disputes={disputes} onUpdateUser={onUpdateUser} />
      )}
      {currentView === 'store-page' && selectedStore && (
        <StorePage 
          store={selectedStore} products={products} onNavigateToStore={navigateToStore} 
          wishlist={wishlist} onToggleWishlist={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} 
          isLoggedIn={!!freshCurrentUser} onAddToCart={onAddToCart} 
          reviews={reviews} onFlagProduct={onFlagProduct}
        />
      )}
      {currentView === 'buyer-dashboard' && freshCurrentUser && (
        <BuyerDashboard 
          user={freshCurrentUser} transactions={transactions} disputes={disputes} reviews={reviews}
          onRaiseDispute={onRaiseDispute} onAddReview={onAddReview}
        />
      )}
      <ChatSupport currentUser={freshCurrentUser} stores={stores} globalMessages={allMessages} onSendMessage={(id, msg) => setAllMessages(prev => ({...prev, [id]: [...(prev[id] || []), msg]}))} theme={theme} />
    </Layout>
  );
};

export default App;
