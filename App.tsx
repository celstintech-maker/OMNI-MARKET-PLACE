
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, Store, UserRole, Transaction, CartItem, Message, Feedback } from './types';
import { MOCK_PRODUCTS, MOCK_STORES, COUNTRY_CURRENCY_MAP, Icons, PAYMENT_METHODS } from './constants';
import { Layout } from './components/Layout';
import { MarketplaceHome } from './views/MarketplaceHome';
import { SellerDashboard } from './views/SellerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { StorePage } from './views/StorePage';
import { AuthView } from './views/AuthView';
import { ChatSupport } from './components/ChatSupport';
import { WishlistView } from './views/WishlistView';
import { BuyerDashboard } from './views/BuyerDashboard';
import { LegalView } from './views/LegalView';
import { AboutUsView } from './views/AboutUsView';
import { ServicesView } from './views/ServicesView';

type View = 'home' | 'seller-dashboard' | 'admin-dashboard' | 'store-page' | 'auth' | 'wishlist' | 'buyer-dashboard' | 'privacy' | 'terms' | 'sourcing' | 'cookies' | 'about' | 'services';

export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundUrl: string;
  commissionRate: number;
  announcement: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  officeAddress: string;
}

const PIN_STORAGE_KEY = 'omni_pins_secure';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    siteName: "OMNI",
    logoUrl: "",
    faviconUrl: "",
    heroTitle: "OMNI MARKETPLACE",
    heroSubtitle: "Hyper-curated selections from independent global verified vendors.",
    heroBackgroundUrl: "",
    commissionRate: 0.10,
    announcement: "WELCOME TO THE FUTURE OF GLOBAL COMMERCE. VERIFIED VENDORS ONLY.",
    footerText: "Verified global sourcing hub for independent multi-vendor commerce. Advanced supply chain integration.",
    contactEmail: "support@omni.link",
    contactPhone: "+234 800 OMNI HELP",
    officeAddress: "Silicon Valley Hub, Digital Way"
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
      bankDetails: { bankName: 'Omni Bank', accountNumber: '0123456789', accountName: 'TechHub Solutions' },
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

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS.map(p => {
    const vendor = vendors.find(v => v.id === p.sellerId);
    const country = vendor?.verification?.country || vendor?.country || 'Nigeria';
    return { 
      ...p, 
      stock: 10,
      sizes: p.category === 'Fashion' ? ['38', '40', '42', '44'] : [],
      currencySymbol: COUNTRY_CURRENCY_MAP[country]?.symbol || '₦',
      location: country,
      paymentMethod: vendor?.paymentMethod || 'bank_transfer'
    } as Product;
  }));

  const [stores, setStores] = useState<Store[]>(MOCK_STORES as Store[]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
    if (view !== 'store-page') setSelectedStore(null);
  };

  const onLogin = (email: string, role: UserRole, pin: string, storeName?: string) => {
    const existing = vendors.find(v => v.email === email);
    if (existing) {
      setCurrentUser(existing);
    } else {
      const newUser: User = { id: `u-${Date.now()}`, name: email.split('@')[0], email, role, storeName };
      setVendors([...vendors, newUser]);
      setCurrentUser(newUser);
    }
    handleNavigate('home');
  };

  const onLogout = () => {
    setCurrentUser(null);
    handleNavigate('home');
  };

  const onToggleWishlist = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const onAddToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
  };

  const onSendMessage = (channelId: string, message: Message) => {
    setAllMessages(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), message]
    }));
  };

  return (
    <Layout 
      user={currentUser} 
      onLogout={onLogout} 
      onNavigate={handleNavigate} 
      currentView={currentView}
      theme={theme}
      onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      cartCount={cart.length}
      onOpenCart={() => setIsCartOpen(true)}
      config={siteConfig}
    >
      {currentView === 'home' && (
        <MarketplaceHome 
          config={siteConfig}
          products={products}
          stores={stores}
          onNavigateToStore={(name) => {
            const s = stores.find(st => st.name === name);
            if (s) { setSelectedStore(s); handleNavigate('store-page'); }
          }}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          onAddToCart={onAddToCart}
          onBecomeSeller={() => handleNavigate('auth')}
        />
      )}

      {currentView === 'auth' && <AuthView stores={stores} onLogin={onLogin} />}
      
      {currentView === 'seller-dashboard' && currentUser && (
        <SellerDashboard 
          user={currentUser} 
          products={products} 
          onAddProduct={(p) => setProducts([...products, { ...p, id: `p-${Date.now()}` } as Product])}
          onDeleteProduct={(id) => setProducts(products.filter(p => p.id !== id))}
          onUpdateUser={(u) => {
            setCurrentUser(u);
            setVendors(vendors.map(v => v.id === u.id ? u : v));
          }}
        />
      )}

      {currentView === 'admin-dashboard' && currentUser?.role === UserRole.ADMIN && (
        <AdminDashboard 
          vendors={vendors}
          stores={stores}
          products={products}
          transactions={[]}
          siteConfig={siteConfig}
          onUpdateConfig={setSiteConfig}
          onToggleVendorStatus={() => {}}
          onDeleteVendor={() => {}}
          onUpdateUser={(u) => setVendors(vendors.map(v => v.id === u.id ? u : v))}
        />
      )}

      {currentView === 'store-page' && selectedStore && (
        <StorePage 
          store={selectedStore} 
          products={products} 
          onNavigateToStore={(name) => {
            const s = stores.find(st => st.name === name);
            if (s) setSelectedStore(s);
          }}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          isLoggedIn={!!currentUser}
        />
      )}

      {currentView === 'privacy' && <LegalView view="privacy" config={siteConfig} />}
      {currentView === 'terms' && <LegalView view="terms" config={siteConfig} />}
      {currentView === 'sourcing' && <LegalView view="sourcing" config={siteConfig} />}
      {currentView === 'cookies' && <LegalView view="cookies" config={siteConfig} />}
      {currentView === 'about' && <AboutUsView config={siteConfig} />}
      {currentView === 'services' && <ServicesView config={siteConfig} />}

      <ChatSupport 
        currentUser={currentUser} 
        stores={stores} 
        globalMessages={allMessages} 
        onSendMessage={onSendMessage}
        theme={theme}
      />
    </Layout>
  );
};

export default App;
