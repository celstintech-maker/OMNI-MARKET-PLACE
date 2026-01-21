
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, Store, UserRole, Transaction, CartItem, Message, Feedback, Review, Dispute } from './types';
import { MOCK_PRODUCTS, MOCK_STORES, COUNTRY_CURRENCY_MAP, Icons, PAYMENT_METHODS, CATEGORIES } from './constants';
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
import { CartDrawer } from './components/CartDrawer';

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
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  
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
        productSamples: ['https://picsum.photos/400/300?random=31'],
        govtIdUrl: 'https://picsum.photos/800/600?random=101',
        taxId: 'US-99-887766',
        bankAccountVerified: true
      }
    },
    { 
      id: 's3', 
      name: 'Sarah Home', 
      email: 'sarah@homedecor.com', 
      role: UserRole.SELLER, 
      storeName: 'HomeDecor', 
      country: 'United Kingdom',
      isSuspended: false, 
      paymentMethod: 'stripe',
      passwordHint: 'Default demo PIN',
      bankDetails: { bankName: 'UK Bank', accountNumber: '0123456789', accountName: 'HomeDecor Ltd' },
      verification: {
        businessName: 'HomeDecor Ltd',
        businessAddress: '123 Oxford Street, London',
        country: 'United Kingdom',
        phoneNumber: '+44 7700 900000',
        profilePictureUrl: 'https://picsum.photos/200/200?random=22',
        verificationStatus: 'verified',
        productSamples: ['https://picsum.photos/400/300?random=32'],
        govtIdUrl: 'https://picsum.photos/800/600?random=102',
        taxId: 'UK-VAT-12345678',
        bankAccountVerified: true
      }
    },
    { 
      id: 's4', 
      name: 'Jessica Glow', 
      email: 'jessica@glowup.com', 
      role: UserRole.SELLER, 
      storeName: 'GlowUp', 
      country: 'United States',
      isSuspended: false, 
      paymentMethod: 'paypal',
      passwordHint: 'Default demo PIN',
      bankDetails: { bankName: 'US Bank', accountNumber: '0987654321', accountName: 'GlowUp Inc' },
      verification: {
        businessName: 'GlowUp Inc',
        businessAddress: '456 Beauty Lane, LA',
        country: 'United States',
        phoneNumber: '+1 555 123 4567',
        profilePictureUrl: 'https://picsum.photos/200/200?random=23',
        verificationStatus: 'verified',
        productSamples: ['https://picsum.photos/400/300?random=33']
      }
    },
    { 
      id: 's5', 
      name: 'Robert Book', 
      email: 'robert@booknook.com', 
      role: UserRole.SELLER, 
      storeName: 'BookNook', 
      country: 'Canada',
      isSuspended: false, 
      paymentMethod: 'stripe',
      passwordHint: 'Default demo PIN',
      bankDetails: { bankName: 'Canada Bank', accountNumber: '1122334455', accountName: 'BookNook Ltd' },
      verification: {
        businessName: 'BookNook Ltd',
        businessAddress: '789 Maple Drive, Toronto',
        country: 'Canada',
        phoneNumber: '+1 416 555 0199',
        profilePictureUrl: 'https://picsum.photos/200/200?random=24',
        verificationStatus: 'verified',
        productSamples: ['https://picsum.photos/400/300?random=34']
      }
    },
    { 
      id: 's6', 
      name: 'Tom Play', 
      email: 'tom@playtime.com', 
      role: UserRole.SELLER, 
      storeName: 'PlayTime', 
      country: 'Australia',
      isSuspended: false, 
      paymentMethod: 'stripe',
      passwordHint: 'Default demo PIN',
      bankDetails: { bankName: 'Oz Bank', accountNumber: '9988776655', accountName: 'PlayTime Pty Ltd' },
      verification: {
        businessName: 'PlayTime Pty Ltd',
        businessAddress: '321 Kangaroo Court, Sydney',
        country: 'Australia',
        phoneNumber: '+61 2 5550 1234',
        profilePictureUrl: 'https://picsum.photos/200/200?random=25',
        verificationStatus: 'verified',
        productSamples: ['https://picsum.photos/400/300?random=35']
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
      paymentMethod: vendor?.paymentMethod || 'bank_transfer',
      reviews: []
    } as Product;
  }));

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 't1',
      productId: 'p1',
      productName: 'Wireless Noise Cancelling Headphones',
      sellerId: 's1',
      buyerId: 'u-123', // Demo buyer
      storeName: 'TechHub',
      amount: 299.99,
      commission: 29.99,
      timestamp: Date.now() - 100000000,
      currencySymbol: '$',
      paymentMethod: 'stripe'
    },
    {
      id: 't2',
      productId: 'p3',
      productName: 'Modern Coffee Table',
      sellerId: 's3',
      buyerId: 'u-123', // Demo buyer
      storeName: 'HomeDecor',
      amount: 150.00,
      commission: 15.00,
      timestamp: Date.now() - 50000000,
      currencySymbol: '£',
      paymentMethod: 'stripe'
    }
  ]);

  const [stores, setStores] = useState<Store[]>(MOCK_STORES as Store[]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!currentUser) return;
    const updated = vendors.find(v => v.id === currentUser.id);
    if (updated) {
      setCurrentUser(updated);
    }
  }, [vendors]);

  const handleNavigate = (view: string) => {
    let target = view as View;
    if (target === 'seller-dashboard' && currentUser?.role !== UserRole.SELLER) {
      target = 'auth';
    } else if (target === 'admin-dashboard' && currentUser?.role !== UserRole.ADMIN) {
      target = 'auth';
    } else if (target === 'buyer-dashboard' && !currentUser) {
      target = 'home';
    }
    setCurrentView(target);
    if (target !== 'store-page') setSelectedStore(null);
  };

  const handleAddCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    }
  };

  const onLogin = (email: string, role: UserRole, pin: string, storeName?: string) => {
    const existing = vendors.find(v => v.email === email);
    if (existing) {
      setCurrentUser(existing);
      const r = existing.role;
      if (r === UserRole.ADMIN) {
        handleNavigate('admin-dashboard');
      } else if (r === UserRole.SELLER) {
        handleNavigate('seller-dashboard');
      } else {
        handleNavigate('buyer-dashboard');
      }
    } else {
      const newUser: User = { 
        id: `u-${Date.now()}`, 
        name: email.split('@')[0], 
        email, 
        role, 
        storeName,
        registrationDate: Date.now() 
      };
      setVendors([...vendors, newUser]);
      setCurrentUser(newUser);
      const r = role;
      if (r === UserRole.ADMIN) {
        handleNavigate('admin-dashboard');
      } else if (r === UserRole.SELLER) {
        handleNavigate('seller-dashboard');
      } else {
        handleNavigate('buyer-dashboard');
      }
    }
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
    setIsCartOpen(true);
  };

  const onSendMessage = (channelId: string, message: Message) => {
    setAllMessages(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), message]
    }));
  };

  const handleFeedbackSubmit = (transactionId: string, feedback: Feedback) => {
    // 1. Update Transaction with feedback
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, feedback } : t
    ));

    // 2. Add Review to Product
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        productId: transaction.productId,
        userId: currentUser?.id || 'anonymous',
        userName: feedback.buyerName,
        rating: feedback.rating,
        comment: feedback.comment,
        date: feedback.timestamp,
        verifiedPurchase: true
      };

      setProducts(prev => prev.map(p => 
        p.id === transaction.productId 
          ? { ...p, reviews: [...(p.reviews || []), newReview] }
          : p
      ));
    }
  };

  const handleCreateDispute = (dispute: Dispute) => {
    setDisputes(prev => [...prev, dispute]);
  };

  const handleResolveDispute = (disputeId: string, decision: string, status: 'resolved' | 'closed') => {
    setDisputes(prev => prev.map(d => 
      d.id === disputeId ? { ...d, adminDecision: decision, status } : d
    ));
  };

  const handleUpdateTransaction = (transaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
  };

  const handleReplyDispute = (disputeId: string, message: string) => {
    // In a real app, this would append a message to the dispute thread
    console.log(`Reply to dispute ${disputeId}: ${message}`);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = (paymentMethod: string) => {
    const newTransactions: Transaction[] = cart.map((item) => ({
      id: `tx-${Date.now()}-${item.id}`,
      productId: item.id,
      productName: item.name,
      sellerId: item.sellerId,
      storeName: item.storeName,
      amount: item.price * item.quantity,
      commission: (item.price * item.quantity) * siteConfig.commissionRate,
      timestamp: Date.now(),
      currencySymbol: item.currencySymbol || '₦',
      paymentMethod: item.paymentMethod || paymentMethod,
      buyerId: currentUser?.id
    }));
    setTransactions(prev => [...prev, ...newTransactions]);
    alert('Order placed successfully!');
    setCart([]);
    setIsCartOpen(false);
    if (currentUser) {
      handleNavigate('buyer-dashboard');
    } else {
      handleNavigate('home');
    }
  };

  const handleToggleVendorStatus = (id: string) => {
    setVendors(prev => prev.map(v => {
      if (v.id === id) {
        // If we are verifying a user, set their subscription expiry to 1 year from now
        const isVerifying = v.verification?.verificationStatus === 'pending';
        const newStatus = isVerifying ? 'verified' : v.verification?.verificationStatus;
        
        return {
          ...v,
          isSuspended: !v.isSuspended,
          verification: v.verification ? {
            ...v.verification,
            verificationStatus: newStatus as any
          } : undefined,
          subscriptionExpiry: isVerifying ? Date.now() + (365 * 24 * 60 * 60 * 1000) : v.subscriptionExpiry
        };
      }
      return v;
    }));
  };

  const handleDeleteVendor = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      setVendors(prev => prev.filter(v => v.id !== id));
    }
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
      <ErrorBoundary>
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cart={cart} 
          onRemoveItem={handleRemoveFromCart} 
          onCheckout={({ paymentMethod }) => handleCheckout(paymentMethod)} 
        />

      {currentView === 'home' && (
        <MarketplaceHome 
          config={siteConfig}
          products={products}
          stores={stores}
          categories={categories}
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
          transactions={transactions}
          disputes={disputes}
          onAddProduct={(p) => setProducts([...products, { ...p, id: `p-${Date.now()}` } as Product])}
          onDeleteProduct={(id) => setProducts(products.filter(p => p.id !== id))}
          onUpdateUser={(u) => {
            setCurrentUser(u);
            setVendors(vendors.map(v => v.id === u.id ? u : v));
          }}
          onUpdateTransaction={handleUpdateTransaction}
          onReplyDispute={handleReplyDispute}
        />
      )}

      {currentView === 'admin-dashboard' && currentUser?.role === UserRole.ADMIN && (
        <AdminDashboard 
          vendors={vendors}
          stores={stores}
          products={products}
          categories={categories}
          onAddCategory={handleAddCategory}
          transactions={transactions}
          disputes={disputes}
          siteConfig={siteConfig}
          onUpdateConfig={setSiteConfig}
          onToggleVendorStatus={() => {}}
          onDeleteVendor={() => {}}
          onUpdateUser={(u) => setVendors(vendors.map(v => v.id === u.id ? u : v))}
          onAddUser={(u) => setVendors([...vendors, u])}
          onResolveDispute={handleResolveDispute}
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

      {currentView === 'buyer-dashboard' && currentUser && (
        <BuyerDashboard 
          user={currentUser}
          transactions={transactions.filter(t => t.buyerId === currentUser.id)}
          disputes={disputes}
          onFeedbackSubmit={handleFeedbackSubmit}
          onFileDispute={handleCreateDispute}
        />
      )}

      {currentView === 'wishlist' && (
        <WishlistView 
          wishlist={wishlist} 
          products={products} 
          onRemoveFromWishlist={onToggleWishlist}
          onAddToCart={onAddToCart}
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
      </ErrorBoundary>
    </Layout>
  );
};

export default App;

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-black uppercase tracking-widest text-red-600">An error occurred</h2>
            <p className="text-sm font-bold text-gray-500 mt-2">Please continue browsing while we recover the page.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Reload Section
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
