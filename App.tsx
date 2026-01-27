
import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, Store, CartItem, Transaction, Dispute, Review, Message, UserRole, AIConfig, DisputeStatus, SiteConfig, VisitorLog } from './types';
import { CATEGORIES, MOCK_PRODUCTS, MOCK_STORES } from './constants';
import { Layout } from './components/Layout';
import { MarketplaceHome } from './views/MarketplaceHome';
import { StorePage } from './views/StorePage';
import { AuthView } from './views/AuthView';
import { SellerDashboard } from './views/SellerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { BuyerDashboard } from './views/BuyerDashboard';
import { StaffDashboard } from './views/StaffDashboard';
import { CartView } from './views/CartView';
import { PurchaseSuccessView } from './views/PurchaseSuccessView';
import { WishlistView } from './views/WishlistView';
import { LegalView } from './views/LegalView';
import { AboutUsView } from './views/AboutUsView';
import { ServicesView } from './views/ServicesView';
import { ChatSupport } from './components/ChatSupport';

const INITIAL_CONFIG: SiteConfig = {
  siteName: 'OMNI MARKET',
  logoUrl: '',
  heroTitle: 'OMNI MARKETPLACE',
  heroSubtitle: 'GLOBAL COMMERCE REIMAGINED',
  heroBackgroundUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
  adBanners: [],
  bannerAnimationStyle: 'fade', // Default animation
  bannerTransitionSpeed: 1000,
  bannerInterval: 5000,
  announcement: '🎉 Global Shipping Protocols Active - 20% Off Fees',
  footerText: 'Decentralized commerce infrastructure for the modern world.',
  contactEmail: 'support@omni.link',
  contactPhone: '+1 (555) 000-OMNI',
  adminBankDetails: 'Bank: Global Trust Bank\nAccount: 123-456-7890\nSWIFT: OMNIUS33',
  rentalPrice: 50000,
  commissionRate: 0.05,
  taxEnabled: true,
  taxRate: 0.075,
  autoFlaggingEnabled: true,
  siteLocked: true, // Default to locked
  siteLockPassword: '6561', // Updated default for demo
  maintenanceModeTitle: 'Site Under Construction',
  maintenanceModeMessage: 'Access is restricted to authorized personnel only.',
  geminiApiKey: '', // Initialize empty
  stats: {
    verifiedSellers: '152+',
    availableAssets: '852+',
    secureNodes: '24/7',
    networkUptime: '99.9%'
  }
};

const INITIAL_USERS: User[] = [
  {
    id: 'u1', name: 'Super Admin', email: 'admin@omni.com', role: UserRole.ADMIN, pin: '6561',
    verification: { businessName: 'Omni HQ', businessAddress: 'Global', country: 'Earth', phoneNumber: '000', profilePictureUrl: '', verificationStatus: 'verified', productSamples: [] },
    joinedAt: Date.now()
  },
  {
    id: 's1', name: 'Tech Seller', email: 'seller@tech.com', role: UserRole.SELLER, pin: '0000', storeName: 'TechHub',
    verification: { businessName: 'Tech Hub Inc', businessAddress: '123 Tech Lane', country: 'Nigeria', phoneNumber: '1234567890', profilePictureUrl: '', verificationStatus: 'verified', identityApproved: true, productSamples: [] },
    rentPaid: true, sellerRating: 4.8, enabledPaymentMethods: ['bank_transfer', 'stripe', 'pod'],
    country: 'Nigeria', currency: 'NGN', currencySymbol: '₦', state: 'Lagos', city: 'Ikeja',
    joinedAt: Date.now()
  },
  {
    id: 'b1', name: 'John Doe', email: 'buyer@gmail.com', role: UserRole.BUYER, pin: '1234', joinedAt: Date.now()
  }
];

function App() {
  const [isSiteUnlocked, setIsSiteUnlocked] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [currentView, setCurrentView] = useState<string>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  
  // Load State from LocalStorage or Fallback to Initial Constants
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('omni_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch (e) {
      console.error("Failed to load users", e);
      return INITIAL_USERS;
    }
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('omni_products');
      return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
    } catch (e) {
      console.error("Failed to load products", e);
      return MOCK_PRODUCTS;
    }
  });

  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const saved = localStorage.getItem('omni_stores');
      return saved ? JSON.parse(saved) : MOCK_STORES;
    } catch (e) {
      console.error("Failed to load stores", e);
      return MOCK_STORES;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    // Load config from local storage to persist API key
    try {
      const savedConfig = localStorage.getItem('omni_config');
      const parsed = savedConfig ? JSON.parse(savedConfig) : INITIAL_CONFIG;
      // Ensure stats exist if loading from old config
      return { ...INITIAL_CONFIG, ...parsed, stats: parsed.stats || INITIAL_CONFIG.stats };
    } catch (e) {
      return INITIAL_CONFIG;
    }
  });
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);

  // Persistence Effects with Try-Catch to prevent Blank Page on Quota Exceeded
  useEffect(() => { try { localStorage.setItem('omni_users', JSON.stringify(users)); } catch(e) { console.warn("Storage quota exceeded for users"); } }, [users]);
  useEffect(() => { try { localStorage.setItem('omni_products', JSON.stringify(products)); } catch(e) { console.warn("Storage quota exceeded for products"); alert("Storage limit reached. Cannot save more data locally."); } }, [products]);
  useEffect(() => { try { localStorage.setItem('omni_stores', JSON.stringify(stores)); } catch(e) { console.warn("Storage quota exceeded for stores"); } }, [stores]);
  useEffect(() => { try { localStorage.setItem('omni_config', JSON.stringify(siteConfig)); } catch(e) { console.warn("Storage quota exceeded for config"); } }, [siteConfig]);

  // Session Restore ("Remember Login")
  useEffect(() => {
    const savedSessionId = localStorage.getItem('omni_session_id');
    if (savedSessionId) {
      const returningUser = users.find(u => u.id === savedSessionId);
      if (returningUser) {
        setCurrentUser(returningUser);
        // Auto-redirect to dashboard if they are a vendor/admin
        if (returningUser.role === UserRole.ADMIN) setCurrentView('admin-dashboard');
        else if (returningUser.role === UserRole.SELLER) setCurrentView('seller-dashboard');
        else if (returningUser.role === UserRole.STAFF) setCurrentView('staff-dashboard');
        // Buyers usually stay on home, but let's leave them on home
      }
    }
  }, []);

  // Automated Suspension Logic
  useEffect(() => {
    const now = Date.now();
    const TWO_DAYS = 48 * 60 * 60 * 1000;
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

    let hasChanges = false;
    const updatedUsers = users.map(u => {
      if (u.role !== UserRole.SELLER || u.isSuspended) return u;

      let shouldSuspend = false;
      let reason = '';

      // Check 1: Rent Bypass (48hrs)
      // Condition: Verified status (bypassed) + Rent NOT paid + Time elapsed since bypass/approval
      if (u.verification?.verificationStatus === 'verified' && !u.rentPaid && u.verification.approvalDate) {
        if (now - u.verification.approvalDate > TWO_DAYS) {
          shouldSuspend = true;
          reason = 'Rent Payment Default (48hr Limit Exceeded)';
        }
      }

      // Check 2: Compliance (14 Days)
      // Condition: No Gov Document uploaded + Time elapsed since joining
      // Note: If id is timestamp based, fallback to it if joinedAt missing
      const idTimestamp = parseInt(u.id.split('-')[1]);
      const joinDate = u.joinedAt || (!isNaN(idTimestamp) ? idTimestamp : now); 
      
      if (!u.verification?.govDocumentUrl && !shouldSuspend) {
         if (now - joinDate > FOURTEEN_DAYS) {
           shouldSuspend = true;
           reason = 'Compliance Failure (14 Day ID Verification Limit Exceeded)';
         }
      }

      if (shouldSuspend) {
        hasChanges = true;
        return {
          ...u,
          isSuspended: true,
          notifications: [
            `SYSTEM ALERT: Account Suspended. Reason: ${reason}. Please contact support immediately.`,
            ...(u.notifications || [])
          ]
        };
      }
      return u;
    });

    if (hasChanges) {
      setUsers(updatedUsers);
    }
  }, [users]); // Dependent on users to trigger checks when data changes

  // Visitor Logging Simulation
  useEffect(() => {
    if (isSiteUnlocked || !siteConfig.siteLocked) {
        const fakeIPs = ['192.168.1.1', '10.0.0.5', '172.16.0.12', '102.34.12.1'];
        const fakeLocs = ['Lagos, NG', 'London, UK', 'New York, USA', 'Abuja, NG'];
        
        const newLog: VisitorLog = {
            id: `vis-${Date.now()}`,
            ip: fakeIPs[Math.floor(Math.random() * fakeIPs.length)],
            location: fakeLocs[Math.floor(Math.random() * fakeLocs.length)],
            timestamp: Date.now(),
            device: window.navigator.platform,
            page: currentView
        };
        setVisitorLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50
    }
  }, [currentView, isSiteUnlocked, siteConfig.siteLocked]);

  // Countdown Logic
  useEffect(() => {
    if (siteConfig.siteLocked && siteConfig.launchDate) {
        const timer = setInterval(() => {
            const now = Date.now();
            const difference = siteConfig.launchDate! - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft(null);
            }
        }, 1000);
        return () => clearInterval(timer);
    } else {
        setTimeLeft(null);
    }
  }, [siteConfig.siteLocked, siteConfig.launchDate]);

  const freshCurrentUser = useMemo(() => {
    return users.find(u => u.id === currentUser?.id) || currentUser;
  }, [users, currentUser]);

  const activeStore = stores.find(s => s.name === (currentView.startsWith('store/') ? decodeURIComponent(currentView.split('/')[1]) : ''));

  const handleLogin = (email: string, role: UserRole, pin: string, storeName?: string, hint?: string, referralCode?: string, extraDetails?: any) => {
    // SMART LOGIN: 
    // 1. Search for user by email ONLY (ignore the role toggle on the UI).
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      // User exists -> Attempt Login
      if (existing.pin === pin) {
        setCurrentUser(existing);
        localStorage.setItem('omni_session_id', existing.id); // Save Session
        
        // Redirect based on their ACTUAL registered role
        if (existing.role === UserRole.ADMIN) setCurrentView('admin-dashboard');
        else if (existing.role === UserRole.SELLER) setCurrentView('seller-dashboard');
        else if (existing.role === UserRole.BUYER) setCurrentView('home');
        else setCurrentView('staff-dashboard');
      } else {
        alert("Invalid PIN");
      }
    } else {
      // User does NOT exist -> Proceed with Registration
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: extraDetails?.fullName || email.split('@')[0],
        email,
        role, // Use the role selected in the registration form
        pin,
        joinedAt: Date.now(),
        storeName: role === UserRole.SELLER ? storeName : undefined,
        passwordHint: hint,
        recruitedBy: referralCode,
        country: extraDetails?.country,
        state: extraDetails?.state,
        city: extraDetails?.city,
        verification: role === UserRole.SELLER ? {
          businessName: storeName || '',
          businessAddress: `${extraDetails?.city || ''}, ${extraDetails?.state || ''}`,
          country: extraDetails?.country || '',
          phoneNumber: extraDetails?.phone || '',
          profilePictureUrl: '',
          verificationStatus: 'pending',
          productSamples: []
        } : undefined
      };
      
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('omni_session_id', newUser.id); // Save Session

      if (role === UserRole.SELLER && storeName) {
        setStores(prev => [...prev, {
          id: `st-${Date.now()}`,
          sellerId: newUser.id,
          name: storeName,
          description: 'New store',
          bannerUrl: 'https://picsum.photos/1200/400',
          status: 'active'
        }]);
      }
      
      // Redirect
      setCurrentView(role === UserRole.ADMIN ? 'admin-dashboard' : role === UserRole.SELLER ? 'seller-dashboard' : 'home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('omni_session_id'); // Clear Session
    setCurrentView('home');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleAddToCart = (item: CartItem) => {
    const existing = cart.find(c => c.id === item.id && c.selectedSize === item.selectedSize);
    if (existing) {
      setCart(cart.map(c => c.id === item.id && c.selectedSize === item.selectedSize ? { ...c, quantity: c.quantity + item.quantity } : c));
    } else {
      setCart([...cart, item]);
    }
  };

  const handleNavigate = (v: string) => {
    setCurrentView(v);
    window.scrollTo(0, 0);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleSendNotification = (userId: string, message: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      notifications: [message, ...(u.notifications || [])]
    } : u));
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  // Site Lock Rendering
  if (!isSiteUnlocked && siteConfig.siteLocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 ${theme}`}>
        <div className="max-w-2xl w-full space-y-8 text-center animate-slide-up">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(79,70,229,0.5)] animate-pulse">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
             {siteConfig.maintenanceModeTitle || "Site Under Construction"}
          </h1>
          
          <p className="text-gray-400 font-medium text-lg max-w-lg mx-auto">
             {siteConfig.maintenanceModeMessage || "Access is restricted to authorized personnel only."}
          </p>

          {/* COUNTDOWN TIMER */}
          {timeLeft && (
              <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto py-8">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="block text-3xl sm:text-4xl font-black text-indigo-400">{timeLeft.days}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Days</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="block text-3xl sm:text-4xl font-black text-indigo-400">{timeLeft.hours}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Hrs</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="block text-3xl sm:text-4xl font-black text-indigo-400">{timeLeft.minutes}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Mins</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="block text-3xl sm:text-4xl font-black text-indigo-400">{timeLeft.seconds}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Secs</span>
                  </div>
              </div>
          )}
          
          <div className="flex gap-2 justify-center max-w-xs mx-auto">
            <input 
              type="password" 
              value={lockPassword}
              onChange={(e) => setLockPassword(e.target.value)}
              placeholder="Admin Access Key"
              className="flex-1 p-4 bg-white/10 rounded-xl outline-none border border-white/10 focus:border-indigo-500 transition-colors text-center font-black tracking-widest placeholder:font-normal"
            />
            <button 
              onClick={() => {
                if (lockPassword === siteConfig.siteLockPassword) {
                  setIsSiteUnlocked(true);
                } else {
                  alert("Access Denied");
                }
              }}
              className="bg-indigo-600 px-6 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors"
            >
              Unlock
            </button>
          </div>
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.5em] mt-8">Secure Protocol Active</p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme}>
      <Layout 
        user={freshCurrentUser} 
        onLogout={handleLogout} 
        onNavigate={handleNavigate} 
        currentView={currentView} 
        theme={theme} 
        onToggleTheme={toggleTheme}
        cartCount={cart.reduce((a,b) => a + b.quantity, 0)}
        onOpenCart={() => setCurrentView('cart')}
        config={siteConfig}
        wishlistCount={wishlist.length}
      >
        {currentView === 'home' && (
          <MarketplaceHome 
            config={siteConfig}
            products={products}
            stores={stores}
            categories={categories}
            onNavigateToStore={(name) => handleNavigate(`store/${encodeURIComponent(name)}`)}
            wishlist={wishlist}
            onToggleWishlist={(pid) => setWishlist(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid])}
            isLoggedIn={!!freshCurrentUser}
            currentUser={freshCurrentUser}
            onAddToCart={handleAddToCart}
            onBecomeSeller={() => { setCurrentUser(null); setCurrentView('auth'); }}
            onFlagProduct={(pid) => {
               setProducts(prev => prev.map(prod => prod.id === pid ? {...prod, flags: (prod.flags || 0) + 1, isFlagged: true} : prod));
            }}
          />
        )}

        {currentView === 'auth' && (
          <div className="py-20">
            <AuthView 
              stores={stores} 
              onLogin={handleLogin} 
            />
          </div>
        )}

        {currentView.startsWith('store/') && activeStore && (
          <StorePage 
            store={activeStore}
            products={products}
            reviews={reviews}
            onNavigateToStore={(name) => handleNavigate(`store/${encodeURIComponent(name)}`)}
            wishlist={wishlist}
            onToggleWishlist={(pid) => setWishlist(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid])}
            isLoggedIn={!!freshCurrentUser}
            onAddToCart={handleAddToCart}
            onFlagProduct={(pid) => {
               setProducts(prev => prev.map(prod => prod.id === pid ? {...prod, flags: (prod.flags || 0) + 1, isFlagged: true} : prod));
            }}
          />
        )}

        {currentView === 'cart' && (
          <CartView 
            cart={cart}
            setCart={setCart}
            onNavigate={handleNavigate}
            currentUser={freshCurrentUser}
            onCompletePurchase={(txs) => {
              const txsWithBuyer = txs.map(t => ({ ...t, buyerId: freshCurrentUser?.id, status: 'pending' as const }));
              setTransactions([...transactions, ...txsWithBuyer]);
              setCart([]);
              setCurrentView('success');
            }}
            config={siteConfig}
            vendors={users}
          />
        )}

        {currentView === 'success' && (
          <PurchaseSuccessView 
             transactions={transactions.slice(-1)} 
             onNavigate={handleNavigate}
          />
        )}

        {currentView === 'wishlist' && (
           <WishlistView 
             wishlist={wishlist}
             products={products}
             onNavigateToStore={(name) => handleNavigate(`store/${encodeURIComponent(name)}`)}
             onToggleWishlist={(pid) => setWishlist(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid])}
             onAddToCart={handleAddToCart}
           />
        )}

        {['privacy', 'terms', 'sourcing', 'cookies'].includes(currentView) && (
           <LegalView view={currentView as any} config={siteConfig} />
        )}

        {currentView === 'about' && <AboutUsView config={siteConfig} />}
        {currentView === 'services' && <ServicesView config={siteConfig} />}

        {currentView === 'seller-dashboard' && freshCurrentUser && (
          <SellerDashboard 
            user={freshCurrentUser} products={products} adminConfig={siteConfig} disputes={disputes} categories={categories}
            transactions={transactions} reviews={reviews}
            onAddProduct={(p) => setProducts([...products, { ...p, id: `p-${Date.now()}` } as Product])}
            onDeleteProduct={(id) => setProducts(products.filter(p => p.id !== id))}
            onUpdateUser={handleUpdateUser}
            onBatchAddProducts={(newPs) => setProducts([...products, ...newPs])}
            onUpdateProduct={(updated) => setProducts(products.map(p => p.id === updated.id ? updated : p))}
            onUpdateTransaction={handleUpdateTransaction}
          />
        )}

        {currentView === 'admin-dashboard' && freshCurrentUser?.role === UserRole.ADMIN && (
          <AdminDashboard 
            vendors={users} stores={stores} products={products} transactions={transactions} categories={categories}
            siteConfig={siteConfig} allMessages={messages} disputes={disputes} currentUser={freshCurrentUser} visitorLogs={visitorLogs}
            onUpdateConfig={setSiteConfig}
            onToggleVendorStatus={(id) => setUsers(users.map(u => u.id === id ? { ...u, isSuspended: !u.isSuspended } : u))}
            onDeleteVendor={(id) => { setUsers(users.filter(u => u.id !== id)); setStores(stores.filter(s => s.sellerId !== id)); }}
            onUpdateUser={handleUpdateUser}
            onUpdateDispute={(updated) => setDisputes(disputes.map(d => d.id === updated.id ? updated : d))}
            onAddCategory={(cat) => setCategories([...categories, cat])}
            onCreateStaff={(staff) => setUsers([...users, staff])}
            onUpdateProduct={(updated) => setProducts(products.map(p => p.id === updated.id ? updated : p))}
            onSendNotification={handleSendNotification}
          />
        )}

        {currentView === 'buyer-dashboard' && freshCurrentUser?.role === UserRole.BUYER && (
          <BuyerDashboard 
             user={freshCurrentUser}
             transactions={transactions.filter(t => t.buyerId === freshCurrentUser.id)}
             disputes={disputes}
             reviews={reviews}
             onRaiseDispute={(d) => setDisputes([...disputes, d])}
             onAddReview={(r) => setReviews([...reviews, r])}
             onUpdateUser={handleUpdateUser}
          />
        )}

        {currentView === 'staff-dashboard' && freshCurrentUser && (
           <StaffDashboard 
              user={freshCurrentUser}
              transactions={transactions}
              vendors={users}
              disputes={disputes}
              onUpdateUser={handleUpdateUser}
           />
        )}
      </Layout>

      <ChatSupport 
        currentUser={freshCurrentUser}
        stores={stores}
        globalMessages={messages}
        onSendMessage={(channelId, msg) => {
           setMessages(prev => ({
             ...prev,
             [channelId]: [...(prev[channelId] || []), msg]
           }));
        }}
        theme={theme}
        config={siteConfig}
      />
    </div>
  );
}

export default App;
