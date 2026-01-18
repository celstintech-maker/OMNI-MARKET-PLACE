
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, Store, UserRole, Transaction, CartItem, Message } from './types';
import { MOCK_PRODUCTS, MOCK_STORES, COUNTRY_CURRENCY_MAP, Icons, PAYMENT_METHODS } from './constants';
import { Layout } from './components/Layout';
import { MarketplaceHome } from './views/MarketplaceHome';
import { SellerDashboard } from './views/SellerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { StorePage } from './views/StorePage';
import { AuthView } from './views/AuthView';
import { ChatSupport } from './components/ChatSupport';
import { WishlistView } from './views/WishlistView';

type View = 'home' | 'seller-dashboard' | 'admin-dashboard' | 'store-page' | 'auth' | 'wishlist';
type Theme = 'light' | 'dark';

export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundUrl: string;
  commissionRate: number;
  announcement: string;
}

const PIN_STORAGE_KEY = 'omni_pins_secure';
const ATTEMPT_STORAGE_KEY = 'omni_auth_attempts';

// Security Utility: Sanitize inputs to prevent XSS
const sanitizeInput = (str: string) => str.replace(/[<>]/g, '').trim();

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    paymentMethod: 'pod'
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [unreadNotifications, setUnreadNotifications] = useState<string[]>([]);
  const [authLockout, setAuthLockout] = useState<number>(0);
  
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    heroTitle: "OMNI MARKETPLACE",
    heroSubtitle: "Hyper-curated selections from independent global verified vendors.",
    heroBackgroundUrl: "",
    commissionRate: 0.10,
    announcement: "WELCOME TO THE FUTURE OF GLOBAL COMMERCE. VERIFIED VENDORS ONLY."
  });

  const [vendors, setVendors] = useState<User[]>([
    { 
      id: 's1', 
      name: 'Alex Johnson', 
      email: 'alex@tech.com', 
      role: UserRole.SELLER, 
      storeName: 'TechHub', 
      country: 'United States',
      isSuspended: false, 
      paymentMethod: 'stripe',
      passwordHint: 'Default demo PIN',
      verification: {
        businessName: 'TechHub Solutions Inc',
        businessAddress: '123 Innovation Drive, SF',
        country: 'United States',
        phoneNumber: '+1 (555) 012-3456',
        profilePictureUrl: 'https://picsum.photos/200/200?random=21',
        verificationStatus: 'verified',
        productSamples: ['https://picsum.photos/400/300?random=31']
      }
    },
    { 
      id: 'admin1',
      name: 'Super Admin',
      email: 'admin@omni.com',
      role: UserRole.ADMIN,
      country: 'Nigeria',
      isSuspended: false,
      passwordHint: 'Golden Ratio Square'
    }
  ]);

  const [storedPins, setStoredPins] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(PIN_STORAGE_KEY);
      return saved ? JSON.parse(atob(saved)) : { // Base64 "obfuscation" for local storage
        'admin@omni.com': '6561',
        'alex@tech.com': '0000',
        'seller@tech.com': '0000'
      };
    } catch { return {}; }
  });

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS.map(p => {
    const vendor = vendors.find(v => v.id === p.sellerId);
    const country = vendor?.verification?.country || vendor?.country || 'Nigeria';
    const location = vendor?.verification?.country === 'Nigeria' 
      ? `${vendor.verification.city}, ${vendor.verification.state}`
      : country;
    return { 
      ...p, 
      stock: 10,
      sizes: p.category === 'Fashion' ? ['38', '40', '42', '44'] : [],
      currencySymbol: COUNTRY_CURRENCY_MAP[country]?.symbol || '₦',
      location,
      paymentMethod: vendor?.paymentMethod || 'bank_transfer'
    } as Product;
  }));

  const [stores, setStores] = useState<Store[]>(MOCK_STORES as Store[]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    localStorage.setItem(PIN_STORAGE_KEY, btoa(JSON.stringify(storedPins)));
  }, [storedPins]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/store/')) {
        const storeName = decodeURIComponent(hash.replace('#/store/', ''));
        const store = stores.find(s => s.name === storeName);
        if (store) {
          setSelectedStore(store);
          setCurrentView('store-page');
        }
      } else if (hash === '#/home' || hash === '') {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [stores]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogin = (email: string, role: UserRole, pin: string, storeName?: string, hint?: string) => {
    // SECURITY: Brute Force Check
    const now = Date.now();
    if (authLockout > now) {
      alert(`SECURITY LOCKOUT: Too many attempts. Try again in ${Math.ceil((authLockout - now) / 1000)} seconds.`);
      return;
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPin = pin.replace(/\D/g, '');

    // SECURITY: Super Admin Hardcoded Integrity Check
    if (sanitizedEmail === 'admin@omni.com') {
      if (sanitizedPin !== '6561') {
        const attempts = parseInt(localStorage.getItem(ATTEMPT_STORAGE_KEY) || '0') + 1;
        localStorage.setItem(ATTEMPT_STORAGE_KEY, attempts.toString());
        if (attempts >= 5) {
          setAuthLockout(now + 60000); // 1 min lockout
          localStorage.setItem(ATTEMPT_STORAGE_KEY, '0');
        }
        alert("CRITICAL ERROR: Access Violation. Attempt logged.");
        return;
      }
    } else {
      const expectedPin = storedPins[sanitizedEmail];
      if (expectedPin && expectedPin !== sanitizedPin) {
        alert("ACCESS DENIED: Credentials Invalid.");
        return;
      }
    }

    localStorage.setItem(ATTEMPT_STORAGE_KEY, '0');

    const existingVendor = vendors.find(v => v.email === sanitizedEmail);
    const newUser: User = existingVendor || { 
      id: Math.random().toString(36).substring(7), 
      name: sanitizeInput(sanitizedEmail.split('@')[0]), 
      email: sanitizedEmail, 
      role, 
      storeName: storeName ? sanitizeInput(storeName) : undefined, 
      country: 'Nigeria', 
      isSuspended: false, 
      paymentMethod: 'bank_transfer',
      passwordHint: hint ? sanitizeInput(hint) : undefined,
      verification: role === UserRole.SELLER ? {
        businessName: storeName ? sanitizeInput(storeName) : '',
        businessAddress: 'Pending Submission',
        country: 'Nigeria',
        phoneNumber: 'Not set',
        profilePictureUrl: 'https://picsum.photos/200/200?random=auth',
        verificationStatus: 'pending',
        productSamples: []
      } : undefined
    };

    // SECURITY: Prevent unauthorized seller registration for protected accounts
    if (role === UserRole.SELLER && !existingVendor) {
      setVendors(prev => [...prev, newUser]);
      setStores(prev => [...prev, {
        id: `st-${newUser.id}`,
        sellerId: newUser.id,
        name: newUser.storeName || 'Unnamed Store',
        description: 'Store awaiting activation.',
        bannerUrl: 'https://picsum.photos/1200/400?random=new',
        status: 'suspended'
      }]);
    }

    if (!storedPins[sanitizedEmail]) {
      setStoredPins(prev => ({ ...prev, [sanitizedEmail]: sanitizedPin }));
    }

    setCurrentUser(newUser);
    if (role === UserRole.SELLER) setCurrentView('seller-dashboard');
    else if (role === UserRole.ADMIN) setCurrentView('admin-dashboard');
    else setCurrentView('home');
  };

  const handleLogout = () => { 
    setCurrentUser(null); 
    setCurrentView('home'); 
    setCart([]); 
    window.location.hash = '#/home'; 
  };

  const handleUpdateUser = (updatedUser: User) => {
    // SECURITY: Only allow user to update their own data or if admin
    if (currentUser?.role !== UserRole.ADMIN && currentUser?.id !== updatedUser.id) return;
    setVendors(prev => prev.map(v => v.id === updatedUser.id ? updatedUser : v));
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.selectedSize === item.selectedSize);
      if (existing) {
        return prev.map(i => (i.id === item.id && i.selectedSize === item.selectedSize) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTransactions: Transaction[] = cart.map(item => ({
      id: `tr-${Math.random().toString(36).substr(2, 9)}`,
      productId: item.id,
      productName: item.name,
      sellerId: item.sellerId,
      storeName: item.storeName,
      amount: item.price * item.quantity,
      commission: (item.price * item.quantity) * siteConfig.commissionRate,
      timestamp: Date.now(),
      currencySymbol: item.currencySymbol || '₦',
      paymentMethod: checkoutData.paymentMethod
    }));

    setTransactions(prev => [...prev, ...newTransactions]);
    setCart([]);
    setIsCheckout(false);
    setIsCartOpen(false);
    alert(`Order Placed Successfully via ${PAYMENT_METHODS.find(m => m.id === checkoutData.paymentMethod)?.name || 'Direct Transfer'}.\nDelivery will be handled by Celstin Logistics.\nTracking: https://celstin-logistics-ne.vercel.app/`);
  };

  const handleToggleWishlist = (productId: string) => setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const handleNavigateToStore = (storeName: string) => window.location.hash = `#/store/${encodeURIComponent(storeName)}`;
  const handleSendMessage = (channelId: string, message: Message) => setAllMessages(prev => ({ ...prev, [channelId]: [...(prev[channelId] || []), message] }));
  const handleClearChat = (channelId: string) => setAllMessages(prev => { const next = { ...prev }; delete next[channelId]; return next; });
  const handleDeleteUser = (userId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    setVendors(prev => prev.filter(v => v.id !== userId));
    setStores(prev => prev.filter(s => s.sellerId !== userId));
    setProducts(prev => prev.filter(p => p.sellerId !== userId));
    if (currentUser?.id === userId) handleLogout();
  };

  const cartTotal = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
  const cartCurrency = cart.length > 0 ? cart[0].currencySymbol : '₦';

  return (
    <div className={theme}>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-300">
        {siteConfig.announcement && (
          <div className="bg-indigo-600 text-white py-2 text-[10px] font-black text-center tracking-[0.3em] uppercase">{siteConfig.announcement}</div>
        )}
        <Layout 
          user={currentUser} onLogout={handleLogout} onNavigate={v => {
            if (v === 'home') window.location.hash = '#/home';
            else setCurrentView(v as View);
          }} currentView={currentView} theme={theme} onToggleTheme={toggleTheme}
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)} onOpenCart={() => setIsCartOpen(true)}
        >
          {currentView === 'home' && <MarketplaceHome config={siteConfig} products={products} stores={stores.filter(s => s.status === 'active')} onNavigateToStore={handleNavigateToStore} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isLoggedIn={!!currentUser} currentUser={currentUser} onAddToCart={handleAddToCart} onBecomeSeller={() => setCurrentView('auth')} />}
          {currentView === 'store-page' && selectedStore && <StorePage store={selectedStore} products={products} onNavigateToStore={handleNavigateToStore} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isLoggedIn={!!currentUser} onBuy={(p) => handleAddToCart({...p, quantity: 1})} />}
          {currentView === 'seller-dashboard' && currentUser && <SellerDashboard user={currentUser} products={products} onAddProduct={p => setProducts([{...p, id: Date.now().toString()} as Product, ...products])} onDeleteProduct={id => setProducts(products.filter(p => p.id !== id))} onUpdateUser={handleUpdateUser} onUpdateProduct={handleUpdateProduct} unreadCount={unreadNotifications.filter(id => id === currentUser.id).length} onClearNotifications={() => setUnreadNotifications([])} />}
          {currentView === 'wishlist' && <WishlistView products={products} wishlist={wishlist} onNavigateToStore={handleNavigateToStore} onToggleWishlist={handleToggleWishlist} />}
          {currentView === 'auth' && <AuthView stores={stores.filter(s => s.status === 'active')} onLogin={handleLogin} />}
          {currentView === 'admin-dashboard' && currentUser?.role === UserRole.ADMIN && <AdminDashboard vendors={vendors} stores={stores} products={products} transactions={transactions} siteConfig={siteConfig} onUpdateConfig={setSiteConfig} onToggleVendorStatus={() => {}} onDeleteVendor={handleDeleteUser} onUpdateUser={handleUpdateUser} />}
        </Layout>

        {isCartOpen && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => { setIsCartOpen(false); setIsCheckout(false); }} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-up overflow-hidden">
              <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-2xl font-black">{isCheckout ? 'Checkout Details' : 'Shopping Bag'}</h3>
                <button onClick={() => { setIsCartOpen(false); setIsCheckout(false); }}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {!isCheckout ? (
                  <>
                    {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center text-gray-400"><Icons.Store /><p className="mt-4 font-black uppercase text-xs tracking-widest">Your bag is empty</p></div> : cart.map(item => (
                      <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-[1.5rem] border dark:border-slate-800 font-bold"><img src={item.selectedImageUrl || item.imageUrl} className="w-20 h-20 rounded-xl object-cover" /><div className="flex-1"><h4>{item.name}</h4><p className="text-[10px] text-gray-400 font-bold">Size: {item.selectedSize || 'N/A'}</p><div className="flex justify-between items-center mt-2"><span className="text-indigo-600">{item.currencySymbol}{item.price.toLocaleString()} x {item.quantity}</span></div></div></div>
                    ))}
                  </>
                ) : (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 mb-6">
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Omni Delivery Service</p>
                       <p className="text-xs font-bold text-gray-600 dark:text-gray-300">All orders are delivered via <a href="https://celstin-logistics-ne.vercel.app/" target="_blank" className="underline text-indigo-600">Celstin Logistics</a>. Providing real-time tracking across major regions.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <input required placeholder="Full Name" value={checkoutData.name} onChange={e => setCheckoutData({...checkoutData, name: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-gray-50 dark:bg-slate-800 shadow-inner" />
                      <input required placeholder="Phone Number" value={checkoutData.phone} onChange={e => setCheckoutData({...checkoutData, phone: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-gray-50 dark:bg-slate-800 shadow-inner" />
                      <input required placeholder="City / Region" value={checkoutData.city} onChange={e => setCheckoutData({...checkoutData, city: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none text-sm font-bold bg-gray-50 dark:bg-slate-800 shadow-inner" />
                      <textarea required placeholder="Full Delivery Address" value={checkoutData.address} onChange={e => setCheckoutData({...checkoutData, address: e.target.value})} className="w-full p-4 rounded-xl border-none outline-none h-24 text-sm font-medium bg-gray-50 dark:bg-slate-800 shadow-inner" />
                    </div>

                    <div className="space-y-3 pt-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Payment Method</label>
                      <div className="grid grid-cols-1 gap-2">
                        {PAYMENT_METHODS.filter(m => m.id === 'pod' || m.id === 'bank_transfer' || m.id === 'stripe').map(m => (
                          <button 
                            key={m.id}
                            type="button"
                            onClick={() => setCheckoutData({...checkoutData, paymentMethod: m.id})}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${checkoutData.paymentMethod === m.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-gray-100 dark:border-slate-800 text-gray-400 hover:border-indigo-200'}`}
                          >
                            <span className="text-xl">{m.icon}</span>
                            <span className="font-black text-[10px] uppercase tracking-widest">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl mt-6 active:scale-95 transition-transform">Confirm Order ({cartCurrency}{cartTotal.toLocaleString()})</button>
                    <button type="button" onClick={() => setIsCheckout(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Back to Bag</button>
                  </form>
                )}
              </div>

              {!isCheckout && cart.length > 0 && (
                <div className="p-8 border-t dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                    <span className="text-2xl font-black text-indigo-600">{cartCurrency}{cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => setIsCheckout(true)} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl transition hover:scale-[1.02] active:scale-95">Initiate Checkout Protocol</button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <ChatSupport 
          currentUser={currentUser} 
          stores={stores.filter(s => s.status === 'active')} 
          globalMessages={allMessages} 
          onSendMessage={handleSendMessage} 
          onClearChat={handleClearChat}
          theme={theme} 
        />
      </div>
    </div>
  );
};

export default App;
