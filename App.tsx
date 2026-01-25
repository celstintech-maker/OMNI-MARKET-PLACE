import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, Store, CartItem, Transaction, Dispute, Review, Message, UserRole, AIConfig, DisputeStatus, SiteConfig } from './types';
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
  geminiApiKey: '' // Default empty
};

const INITIAL_USERS: User[] = [
  {
    id: 'u1', name: 'Super Admin', email: 'admin@omni.com', role: UserRole.ADMIN, pin: '6561',
    verification: { businessName: 'Omni HQ', businessAddress: 'Global', country: 'Earth', phoneNumber: '000', profilePictureUrl: '', verificationStatus: 'verified', productSamples: [] }
  },
  {
    id: 's1', name: 'Tech Seller', email: 'seller@tech.com', role: UserRole.SELLER, pin: '0000', storeName: 'TechHub',
    verification: { businessName: 'Tech Hub Inc', businessAddress: '123 Tech Lane', country: 'Nigeria', phoneNumber: '1234567890', profilePictureUrl: '', verificationStatus: 'verified', identityApproved: true, productSamples: [] },
    rentPaid: true, sellerRating: 4.8, enabledPaymentMethods: ['bank_transfer', 'stripe', 'pod'],
    country: 'Nigeria', currency: 'NGN', currencySymbol: '₦', state: 'Lagos', city: 'Ikeja'
  },
  {
    id: 'b1', name: 'John Doe', email: 'buyer@gmail.com', role: UserRole.BUYER, pin: '1234'
  }
];

function App() {
  const [isSiteUnlocked, setIsSiteUnlocked] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [currentView, setCurrentView] = useState<string>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Load State from LocalStorage or Fallback to Initial Constants
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('omni_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('omni_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('omni_stores');
    return saved ? JSON.parse(saved) : MOCK_STORES;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    // Load config from local storage to persist API key
    const savedConfig = localStorage.getItem('omni_config');
    return savedConfig ? { ...INITIAL_CONFIG, ...JSON.parse(savedConfig) } : INITIAL_CONFIG;
  });
  
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('omni_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('omni_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('omni_stores', JSON.stringify(stores)); }, [stores]);
  useEffect(() => { localStorage.setItem('omni_config', JSON.stringify(siteConfig)); }, [siteConfig]);

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

  // Site Lock Rendering
  if (!isSiteUnlocked && siteConfig.siteLocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 ${theme}`}>
        <div className="max-w-md w-full space-y-8 text-center animate-slide-up">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(79,70,229,0.5)]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Site Under Construction</h1>
          <p className="text-gray-400 font-medium">Access is restricted to authorized personnel only.</p>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={lockPassword}
              onChange={(e) => setLockPassword(e.target.value)}
              placeholder="Enter Access Key"
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
               setProducts(prev => prev.map(prod => prod.id === pid ? {...prod, flags: (prod.flags || 0) + 1} : prod));
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
               setProducts(prev => prev.map(prod => prod.id === pid ? {...prod, flags: (prod.flags || 0) + 1} : prod));
            }}
          />
        )}

        {currentView === 'cart' && (
          <CartView 
            cart={cart}
            setCart={setCart}
            onNavigate={handleNavigate}
            onCompletePurchase={(txs) => {
              const txsWithBuyer = txs.map(t => ({ ...t, buyerId: freshCurrentUser?.id }));
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
          />
        )}

        {currentView === 'admin-dashboard' && freshCurrentUser?.role === UserRole.ADMIN && (
          <AdminDashboard 
            vendors={users} stores={stores} products={products} transactions={transactions} categories={categories}
            siteConfig={siteConfig} allMessages={messages} disputes={disputes} currentUser={freshCurrentUser}
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
        apiKey={siteConfig.geminiApiKey}
      />
    </div>
  );
}

export default App;