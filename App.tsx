
import React, { useState, useEffect } from 'react';
import { User, Product, Store, UserRole, Transaction, CartItem, Message, Dispute, DisputeStatus } from './types';
import { MOCK_PRODUCTS, MOCK_STORES, Icons } from './constants';
import { Layout } from './components/Layout';
import { MarketplaceHome } from './views/MarketplaceHome';
import { SellerDashboard } from './views/SellerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { StorePage } from './views/StorePage';
import { AuthView } from './views/AuthView';
import { ChatSupport } from './components/ChatSupport';
import { BuyerDashboard } from './views/BuyerDashboard';
import { LegalView } from './views/LegalView';
import { AboutUsView } from './views/AboutUsView';
import { ServicesView } from './views/ServicesView';
import { CartView } from './views/CartView';
import { PurchaseSuccessView } from './views/PurchaseSuccessView';

type View = 'home' | 'seller-dashboard' | 'admin-dashboard' | 'store-page' | 'auth' | 'wishlist' | 'buyer-dashboard' | 'privacy' | 'terms' | 'sourcing' | 'cookies' | 'about' | 'services' | 'cart' | 'purchase-success';

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
  // Gateway Keys
  stripePublicKey?: string;
  stripeSecretKey?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string;
}

const STORAGE_KEYS = {
  USER: 'omni_current_user',
  VENDORS: 'omni_vendors',
  PRODUCTS: 'omni_products',
  STORES: 'omni_stores',
  CONFIG: 'omni_site_config',
  THEME: 'omni_theme',
  TRANSACTIONS: 'omni_transactions',
  DISPUTES: 'omni_disputes'
};

const App: React.FC = () => {
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
      flutterwavePublicKey: ''
    };
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
        storeName: 'TechHub', 
        verification: { businessName: 'TechHub', businessAddress: 'SF', country: 'United States', phoneNumber: '555', profilePictureUrl: '', verificationStatus: 'verified', productSamples: [], approvalDate: Date.now() - 10000000 },
        rentPaid: true,
        aiConfig: { greeting: "Welcome to TechHub! I am your AI assistant.", tone: "professional", autoReplyEnabled: true, specialInstructions: "" }
      },
      { id: 'admin1', name: 'Super Admin', email: 'admin@omni.com', role: UserRole.ADMIN }
    ];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) return JSON.parse(saved);
    return MOCK_PRODUCTS as Product[];
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(siteConfig));
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));
  }, [currentUser, vendors, products, siteConfig, stores, transactions, disputes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
    if (view !== 'store-page') setSelectedStore(null);
    window.scrollTo(0, 0);
  };

  const onLogin = (email: string, role: UserRole, pin: string, storeName?: string) => {
    const existing = vendors.find(v => v.email === email);
    let loggedUser: User;
    if (existing) {
      loggedUser = existing;
    } else {
      loggedUser = { 
        id: `u-${Date.now()}`, 
        name: email.split('@')[0], 
        email, 
        role, 
        storeName,
        aiConfig: { greeting: "Hi! How can I assist you?", tone: "friendly", autoReplyEnabled: true, specialInstructions: "" }
      };
      setVendors([...vendors, loggedUser]);
      if (role === UserRole.SELLER && storeName) {
        setStores([...stores, { id: `st-${Date.now()}`, sellerId: loggedUser.id, name: storeName, description: `Marketplace for ${storeName}`, bannerUrl: 'https://picsum.photos/1200/400', status: 'active' }]);
      }
    }
    setCurrentUser(loggedUser);
    if (loggedUser.role === UserRole.ADMIN) handleNavigate('admin-dashboard');
    else if (loggedUser.role === UserRole.SELLER) handleNavigate('seller-dashboard');
    else handleNavigate('buyer-dashboard');
  };

  const onLogout = () => { setCurrentUser(null); handleNavigate('home'); };
  const onAddToCart = (item: CartItem) => setCart([...cart, item]);
  const onUpdateUser = (u: User) => { 
    if (currentUser && u.id === currentUser.id) setCurrentUser(u); 
    setVendors(vendors.map(v => v.id === u.id ? u : v)); 
  };
  const onRaiseDispute = (dispute: Dispute) => setDisputes([...disputes, dispute]);
  const onUpdateDispute = (updated: Dispute) => setDisputes(disputes.map(d => d.id === updated.id ? updated : d));

  return (
    <Layout 
      user={currentUser} onLogout={onLogout} onNavigate={handleNavigate} currentView={currentView}
      theme={theme} onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      cartCount={cart.length} onOpenCart={() => handleNavigate('cart')} config={siteConfig}
    >
      {currentView === 'home' && (
        <MarketplaceHome 
          config={siteConfig} products={products} stores={stores}
          onNavigateToStore={(name) => { const s = stores.find(st => st.name === name); if (s) { setSelectedStore(s); handleNavigate('store-page'); } }}
          wishlist={wishlist} onToggleWishlist={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          isLoggedIn={!!currentUser} currentUser={currentUser} onAddToCart={onAddToCart} onBecomeSeller={() => handleNavigate('auth')}
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
      {currentView === 'seller-dashboard' && currentUser && (
        <SellerDashboard 
          user={currentUser} products={products} adminConfig={siteConfig} disputes={disputes}
          transactions={transactions}
          onAddProduct={(p) => setProducts([...products, { ...p, id: `p-${Date.now()}` } as Product])}
          onDeleteProduct={(id) => setProducts(products.filter(p => p.id !== id))}
          onUpdateUser={onUpdateUser} onBatchAddProducts={(newPs) => setProducts([...products, ...newPs])}
        />
      )}
      {currentView === 'admin-dashboard' && currentUser?.role === UserRole.ADMIN && (
        <AdminDashboard 
          vendors={vendors} stores={stores} products={products} transactions={transactions}
          siteConfig={siteConfig} allMessages={allMessages} disputes={disputes}
          onUpdateConfig={setSiteConfig} onUpdateUser={onUpdateUser}
          onToggleVendorStatus={(id) => setVendors(vendors.map(v => v.id === id ? {...v, isSuspended: !v.isSuspended} : v))}
          onDeleteVendor={(id) => setVendors(vendors.filter(v => v.id !== id))}
          onAddGlobalProduct={(p) => setProducts([...products, {...p, id: `gp-${Date.now()}`} as Product])}
          onUpdateDispute={onUpdateDispute}
        />
      )}
      {currentView === 'store-page' && selectedStore && (
        <StorePage store={selectedStore} products={products} onNavigateToStore={(name) => setSelectedStore(stores.find(s => s.name === name) || null)} wishlist={wishlist} onToggleWishlist={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} isLoggedIn={!!currentUser} onAddToCart={onAddToCart} />
      )}
      {currentView === 'buyer-dashboard' && currentUser && (
        <BuyerDashboard user={currentUser} transactions={transactions} onRaiseDispute={onRaiseDispute} disputes={disputes} />
      )}
      <ChatSupport currentUser={currentUser} stores={stores} globalMessages={allMessages} onSendMessage={(id, msg) => setAllMessages(prev => ({...prev, [id]: [...(prev[id] || []), msg]}))} theme={theme} />
    </Layout>
  );
};

export default App;
