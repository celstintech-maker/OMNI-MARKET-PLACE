
import React, { useState, useEffect } from 'react';
import { User, Product, Store, UserRole, Transaction, CartItem } from './types';
import { MOCK_PRODUCTS, MOCK_STORES, COUNTRY_CURRENCY_MAP, Icons } from './constants';
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

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<{ isRegister: boolean, initialRole: UserRole }>({ isRegister: false, initialRole: UserRole.BUYER });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
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
      passwordHint: 'Silicon-2025!',
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
      id: 's2', 
      name: 'Chidi Okoro', 
      email: 'chidi@style.com', 
      role: UserRole.SELLER, 
      storeName: 'StyleCo', 
      country: 'Nigeria',
      state: 'Delta',
      city: 'Asaba',
      isSuspended: false, 
      paymentMethod: 'bank_transfer',
      passwordHint: 'AsabaStyle#2024',
      bankDetails: {
        bankName: 'First Bank of Nigeria',
        accountNumber: '3124556789',
        accountName: 'Chidi Okoro Ventures'
      },
      verification: {
        businessName: 'Okoro Fashion Hub',
        businessAddress: '12 Nnebisi Road, Asaba',
        country: 'Nigeria',
        state: 'Delta',
        city: 'Asaba',
        phoneNumber: '+234 803 123 4567',
        profilePictureUrl: 'https://picsum.photos/200/200?random=22',
        verificationStatus: 'verified',
        productSamples: ['https://picsum.photos/400/300?random=33']
      }
    }
  ]);

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
      location 
    } as Product;
  }));

  const [stores, setStores] = useState<Store[]>(MOCK_STORES as Store[]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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

  const removeFromCart = (id: string, size?: string) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.selectedSize === size)));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    alert(`Order Confirmed!\nTotal: ${cart[0].currencySymbol}${cartTotal.toLocaleString()}\nThank you for shopping on OMNI.`);
    setCart([]);
    setIsCartOpen(false);
  };

  const handleLogin = (email: string, role: UserRole, storeName?: string) => {
    const newUser: User = { id: Math.random().toString(), name: email.split('@')[0], email, role, storeName, country: 'Nigeria', isSuspended: false };
    setCurrentUser(newUser);
    if (role === UserRole.SELLER) setCurrentView('seller-dashboard');
    else if (role === UserRole.ADMIN) setCurrentView('admin-dashboard');
    else setCurrentView('home');
  };

  const handleLogout = () => { setCurrentUser(null); setCurrentView('home'); setCart([]); };

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const handleNavigateToStore = (storeName: string) => {
    const store = stores.find(s => s.name === storeName);
    if (store) { setSelectedStore(store); setCurrentView('store-page'); }
  };

  /* Define handleUpdateUser to fix the missing reference error */
  const handleUpdateUser = (updatedUser: User) => {
    setVendors(prev => prev.map(v => v.id === updatedUser.id ? updatedUser : v));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  return (
    <div className={theme}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
        <Layout 
          user={currentUser} onLogout={handleLogout} onNavigate={v => setCurrentView(v as View)} currentView={currentView} theme={theme} onToggleTheme={toggleTheme}
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)} onOpenCart={() => setIsCartOpen(true)}
        >
          {currentView === 'home' && <MarketplaceHome products={products} stores={stores} onNavigateToStore={handleNavigateToStore} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isLoggedIn={!!currentUser} currentUser={currentUser} onAddToCart={handleAddToCart} onBecomeSeller={() => setCurrentView('auth')} />}
          {/* Fix: StorePage expects onBuy not onAddToCart */}
          {currentView === 'store-page' && selectedStore && <StorePage store={selectedStore} products={products} onNavigateToStore={handleNavigateToStore} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isLoggedIn={!!currentUser} onBuy={(p) => handleAddToCart({...p, quantity: 1})} />}
          {currentView === 'seller-dashboard' && currentUser && <SellerDashboard user={currentUser} products={products} onAddProduct={p => setProducts([{...p, id: Date.now().toString()} as Product, ...products])} onDeleteProduct={id => setProducts(products.filter(p => p.id !== id))} onUpdateUser={handleUpdateUser} />}
          {currentView === 'wishlist' && <WishlistView products={products} wishlist={wishlist} onNavigateToStore={handleNavigateToStore} onToggleWishlist={handleToggleWishlist} />}
          {currentView === 'auth' && <AuthView stores={stores} onLogin={handleLogin} />}
          {currentView === 'admin-dashboard' && currentUser?.role === UserRole.ADMIN && <AdminDashboard vendors={vendors} stores={stores} products={products} transactions={[]} onToggleVendorStatus={() => {}} onDeleteVendor={() => {}} onUpdateUser={handleUpdateUser} />}
        </Layout>

        {/* Cart Drawer */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-left">
              <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-2xl font-black">Shopping Bag</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-indigo-600 transition"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <Icons.Store />
                    <p className="mt-4 font-black uppercase text-xs tracking-widest">Your bag is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-[1.5rem] border dark:border-slate-800">
                      <img src={item.selectedImageUrl || item.imageUrl} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-black text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Size: {item.selectedSize || 'N/A'}</p>
                        <div className="flex justify-between items-center mt-2">
                           <span className="font-black text-indigo-600 text-sm">{item.currencySymbol}{item.price.toLocaleString()} x {item.quantity}</span>
                           <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="text-red-500 font-black text-[10px] uppercase">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-gray-50 dark:bg-slate-800 border-t dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Grand Total</span>
                    <span className="text-3xl font-black text-indigo-600">{cart[0].currencySymbol}{cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition">Secure Checkout</button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentUser && <ChatSupport currentUser={currentUser} targetSellerName="Omni Support" theme={theme} />}
      </div>
    </div>
  );
};

/* Fix for index.tsx missing default export error */
export default App;
