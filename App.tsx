
import React, { useState, useEffect, useMemo } from 'react';
import { User, Product, Store, CartItem, Transaction, Dispute, Review, Message, UserRole, AIConfig, DisputeStatus, SiteConfig, VisitorLog, SellerRecommendation } from './types';
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

// Firebase Imports
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  arrayUnion
} from 'firebase/firestore';

// Helper to sanitize data for Firestore (removes undefined values which cause crashes)
const stripUndefined = (obj: any) => {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
};

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
  
  // Initialize view from hash or default to home
  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#/', '');
    return hash ? decodeURIComponent(hash) : 'home';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  
  // Application Data State (Synced with Firestore)
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerRecommendations, setSellerRecommendations] = useState<SellerRecommendation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [channelStatus, setChannelStatus] = useState<Record<string, { aiDisabled: boolean }>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_CONFIG);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- FIRESTORE SYNCHRONIZATION ---
  useEffect(() => {
    // 1. Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const data = snap.docs.map(d => d.data() as User);
        setUsers(data);
        // Initial Seed if empty
        if (data.length === 0) {
            INITIAL_USERS.forEach(u => setDoc(doc(db, 'users', u.id), stripUndefined(u)));
        }
    });

    // 2. Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
        const data = snap.docs.map(d => d.data() as Product);
        setProducts(data);
        // Initial Seed if empty
        if (data.length === 0) {
            MOCK_PRODUCTS.forEach(p => setDoc(doc(db, 'products', p.id), stripUndefined(p)));
        }
    });

    // 3. Stores
    const unsubStores = onSnapshot(collection(db, 'stores'), (snap) => {
        const data = snap.docs.map(d => d.data() as Store);
        setStores(data);
        if (data.length === 0) {
            MOCK_STORES.forEach(s => setDoc(doc(db, 'stores', s.id), stripUndefined(s)));
        }
    });

    // 4. Transactions
    const unsubTrans = onSnapshot(collection(db, 'transactions'), (snap) => {
        setTransactions(snap.docs.map(d => d.data() as Transaction));
    });

    // 5. Disputes
    const unsubDisputes = onSnapshot(collection(db, 'disputes'), (snap) => {
        setDisputes(snap.docs.map(d => d.data() as Dispute));
    });

    // 6. Reviews
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
        setReviews(snap.docs.map(d => d.data() as Review));
    });

    // 7. Recommendations
    const unsubRecs = onSnapshot(collection(db, 'recommendations'), (snap) => {
        setSellerRecommendations(snap.docs.map(d => d.data() as SellerRecommendation));
    });

    // 8. Site Config (Singleton)
    const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
        if (snap.exists()) {
            setSiteConfig(snap.data() as SiteConfig);
        } else {
            setDoc(doc(db, 'settings', 'config'), stripUndefined(INITIAL_CONFIG));
        }
        setIsConfigLoaded(true);
    });

    // 9. Categories
    const unsubCats = onSnapshot(doc(db, 'settings', 'categories'), (snap) => {
        if (snap.exists()) {
            setCategories(snap.data().list || CATEGORIES);
        } else {
            setDoc(doc(db, 'settings', 'categories'), { list: CATEGORIES });
        }
    });

    // 10. Messages (Listen to all channels)
    const unsubMsgs = onSnapshot(collection(db, 'channels'), (snap) => {
        const msgs: Record<string, Message[]> = {};
        const statuses: Record<string, { aiDisabled: boolean }> = {};
        
        snap.docs.forEach(d => {
            const data = d.data();
            msgs[d.id] = data.messages || [];
            statuses[d.id] = { aiDisabled: !!data.aiDisabled };
        });
        setMessages(msgs);
        setChannelStatus(statuses);
    });

    // 11. Visitor Logs
    const unsubLogs = onSnapshot(query(collection(db, 'visitor_logs'), orderBy('timestamp', 'desc')), (snap) => {
       setVisitorLogs(snap.docs.slice(0, 50).map(d => d.data() as VisitorLog));
    });

    return () => {
        unsubUsers(); unsubProducts(); unsubStores(); unsubTrans(); unsubDisputes();
        unsubReviews(); unsubRecs(); unsubConfig(); unsubCats(); unsubMsgs(); unsubLogs();
    };
  }, []);

  // Sync Current User with Firestore updates
  useEffect(() => {
      if (currentUser) {
          const syncedUser = users.find(u => u.id === currentUser.id);
          if (syncedUser) setCurrentUser(syncedUser);
      }
  }, [users]);

  // --- ACTIONS WITH FIRESTORE persistence ---

  const handleUpdateUser = async (updatedUser: User) => {
    try {
        await setDoc(doc(db, 'users', updatedUser.id), stripUndefined(updatedUser), { merge: true });
    } catch (e) {
        console.error("Error updating user:", e);
        alert("Failed to update user profile. Check connection.");
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
        await setDoc(doc(db, 'products', product.id), stripUndefined(product));
    } catch (e) {
        console.error("Error adding product:", e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'products', id));
    } catch (e) {
        console.error("Error deleting product:", e);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
        await setDoc(doc(db, 'products', product.id), stripUndefined(product), { merge: true });
    } catch (e) {
        console.error("Error updating product:", e);
    }
  };

  const handleBatchAddProducts = async (products: Product[]) => {
      const batch = writeBatch(db);
      products.forEach(p => {
          const ref = doc(db, 'products', p.id);
          batch.set(ref, stripUndefined(p));
      });
      await batch.commit();
  };

  const handleUpdateTransaction = async (tx: Transaction) => {
      await setDoc(doc(db, 'transactions', tx.id), stripUndefined(tx), { merge: true });
  };

  const handleUpdateDispute = async (d: Dispute) => {
      await setDoc(doc(db, 'disputes', d.id), stripUndefined(d), { merge: true });
  };

  const handleAddReview = async (r: Review) => {
      await setDoc(doc(db, 'reviews', r.id), stripUndefined(r));
  };

  const handleAddRecommendation = async (r: SellerRecommendation) => {
      await setDoc(doc(db, 'recommendations', r.id), stripUndefined(r));
  };

  const handleUpdateConfig = async (newConfig: SiteConfig) => {
      await setDoc(doc(db, 'settings', 'config'), stripUndefined(newConfig));
  };

  const handleAddCategory = async (cat: string) => {
      const newList = [...categories, cat];
      await setDoc(doc(db, 'settings', 'categories'), { list: newList });
  };

  const handleSendMessage = async (channelId: string, msg: Message) => {
      try {
        await setDoc(doc(db, 'channels', channelId), { messages: arrayUnion(stripUndefined(msg)) }, { merge: true });
      } catch (e) {
        console.error("Failed to send message", e);
      }
  };

  const handleClearChat = async (channelId: string) => {
      // Deletes the chat document entirely
      await deleteDoc(doc(db, 'channels', channelId));
  };

  const handleArchiveChat = async (channelId: string) => {
      // Clears messages but keeps channel
      await updateDoc(doc(db, 'channels', channelId), { messages: [] });
  };

  const handleToggleAI = async (channelId: string, disabled: boolean) => {
      try {
          await setDoc(doc(db, 'channels', channelId), { aiDisabled: disabled }, { merge: true });
      } catch (e) {
          console.error("Failed to toggle AI", e);
      }
  };

  const handleNotifySeller = (storeId: string, msg: string) => {
      const store = stores.find(s => s.id === storeId);
      if (store) {
          const seller = users.find(u => u.id === store.sellerId);
          if (seller) {
              handleUpdateUser({
                  ...seller,
                  notifications: [msg, ...(seller.notifications || [])]
              });
          }
      }
  };

  const handleCompletePurchase = async (newTxs: Transaction[]) => {
      const batch = writeBatch(db);
      newTxs.forEach(tx => {
          const ref = doc(db, 'transactions', tx.id);
          batch.set(ref, stripUndefined({ ...tx, buyerId: currentUser?.id, status: 'pending' }));
      });
      await batch.commit();
      setCart([]);
      handleNavigate('success');
  };

  const handleNavigate = (v: string) => {
    window.location.hash = `#/${v}`;
    setCurrentView(v);
    window.scrollTo(0, 0);
  };

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      setCurrentView(hash ? decodeURIComponent(hash) : 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Visitor Logging (with throttle)
  useEffect(() => {
    if ((isSiteUnlocked || !siteConfig.siteLocked) && Math.random() > 0.7) {
        const id = `vis-${Date.now()}`;
        // Fire and forget
        setDoc(doc(db, 'visitor_logs', id), stripUndefined({
            id,
            ip: '127.0.0.1', // Client IP detection requires backend
            location: 'Unknown',
            timestamp: Date.now(),
            device: navigator.platform,
            page: currentView
        })).catch(e => console.log('Log error', e));
    }
  }, [currentView, isSiteUnlocked, siteConfig.siteLocked]);

  // Automated Suspension Logic (Client-side enforcement for demo)
  useEffect(() => {
    const now = Date.now();
    const TWO_DAYS = 48 * 60 * 60 * 1000;
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

    users.forEach(u => {
      if (u.role !== UserRole.SELLER || u.isSuspended) return;

      let shouldSuspend = false;
      let reason = '';

      if (u.verification?.verificationStatus === 'verified' && !u.rentPaid && u.verification.approvalDate) {
        if (now - u.verification.approvalDate > TWO_DAYS) {
          shouldSuspend = true;
          reason = 'Rent Payment Default (48hr Limit Exceeded)';
        }
      }

      const idTimestamp = parseInt(u.id.split('-')[1]);
      const joinDate = u.joinedAt || (!isNaN(idTimestamp) ? idTimestamp : now); 
      
      if (!u.verification?.govDocumentUrl && !shouldSuspend) {
         if (now - joinDate > FOURTEEN_DAYS) {
           shouldSuspend = true;
           reason = 'Compliance Failure (14 Day ID Verification Limit Exceeded)';
         }
      }

      if (shouldSuspend) {
        handleUpdateUser({
          ...u,
          isSuspended: true,
          notifications: [
            `SYSTEM ALERT: Account Suspended. Reason: ${reason}. Please contact support immediately.`,
            ...(u.notifications || [])
          ]
        });
      }
    });
  }, [users]);

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

  const handleLogin = async (email: string, role: UserRole, pin: string, storeName?: string, hint?: string, referralCode?: string, extraDetails?: any) => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      if (existing.pin === pin) {
        setCurrentUser(existing);
        // Persist session if needed, for now just state
        if (existing.role === UserRole.ADMIN) handleNavigate('admin-dashboard');
        else if (existing.role === UserRole.SELLER) handleNavigate('seller-dashboard');
        else if (existing.role === UserRole.BUYER) handleNavigate('home');
        else handleNavigate('staff-dashboard');
      } else {
        alert("Invalid PIN");
      }
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: extraDetails?.fullName || email.split('@')[0],
        email,
        role,
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
      
      // Register in Firestore (SANITIZE DATA FIRST)
      await setDoc(doc(db, 'users', newUser.id), stripUndefined(newUser));
      setCurrentUser(newUser);

      if (role === UserRole.SELLER && storeName) {
        const newStore: Store = {
          id: `st-${Date.now()}`,
          sellerId: newUser.id,
          name: storeName,
          description: 'New store',
          bannerUrl: 'https://picsum.photos/1200/400',
          status: 'active'
        };
        await setDoc(doc(db, 'stores', newStore.id), stripUndefined(newStore));
      }
      
      handleNavigate(role === UserRole.ADMIN ? 'admin-dashboard' : role === UserRole.SELLER ? 'seller-dashboard' : 'home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    handleNavigate('home');
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

  // --- RENDER ---

  if (!isConfigLoaded) {
    return (
        <div className={`min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 ${theme}`}>
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

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
        onOpenCart={() => handleNavigate('cart')}
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
            onBecomeSeller={() => { setCurrentUser(null); handleNavigate('auth'); }}
            onFlagProduct={(pid) => {
               const p = products.find(prod => prod.id === pid);
               if (p) handleUpdateProduct({ ...p, isFlagged: true, flags: (p.flags || 0) + 1 });
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

        {currentView.startsWith('store/') && (
          activeStore ? (
            <StorePage 
              store={activeStore}
              products={products}
              reviews={reviews}
              recommendations={sellerRecommendations}
              onNavigateToStore={(name) => handleNavigate(`store/${encodeURIComponent(name)}`)}
              wishlist={wishlist}
              onToggleWishlist={(pid) => setWishlist(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid])}
              isLoggedIn={!!freshCurrentUser}
              onAddToCart={handleAddToCart}
              onFlagProduct={(pid) => {
                 const p = products.find(prod => prod.id === pid);
                 if (p) handleUpdateProduct({ ...p, isFlagged: true, flags: (p.flags || 0) + 1 });
              }}
            />
          ) : (
            <div className="py-32 text-center bg-gray-50 dark:bg-slate-900 rounded-[3rem] animate-fade-in mx-4">
               <div className="text-4xl mb-4">🏪</div>
               <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Store Protocol Failed</h3>
               <p className="text-gray-500 font-bold text-xs mt-2 uppercase tracking-widest">Target node not found or suspended</p>
               <button onClick={() => handleNavigate('home')} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition">Return to Grid</button>
            </div>
          )
        )}

        {currentView === 'cart' && (
          <CartView 
            cart={cart}
            setCart={setCart}
            onNavigate={handleNavigate}
            currentUser={freshCurrentUser}
            onCompletePurchase={handleCompletePurchase}
            config={siteConfig}
            vendors={users}
          />
        )}

        {currentView === 'success' && (
          <PurchaseSuccessView 
             transactions={transactions.slice(-1)} // Just shows the latest one for demo, ideally filter by recent ID
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

        {currentView === 'seller-dashboard' && currentUser?.role === UserRole.SELLER && (
          <SellerDashboard 
            user={freshCurrentUser!}
            products={products}
            adminConfig={siteConfig}
            disputes={disputes}
            transactions={transactions}
            categories={categories}
            reviews={reviews}
            recommendations={sellerRecommendations}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateUser={handleUpdateUser}
            onBatchAddProducts={handleBatchAddProducts}
            onUpdateProduct={handleUpdateProduct}
            onUpdateTransaction={handleUpdateTransaction}
            onAddCategory={handleAddCategory}
          />
        )}

        {currentView === 'admin-dashboard' && currentUser?.role === UserRole.ADMIN && (
          <AdminDashboard 
            vendors={users}
            stores={stores}
            products={products}
            transactions={transactions}
            siteConfig={siteConfig}
            allMessages={messages}
            disputes={disputes}
            categories={categories}
            currentUser={freshCurrentUser!}
            visitorLogs={visitorLogs}
            sellerRecommendations={sellerRecommendations}
            onUpdateConfig={handleUpdateConfig}
            onToggleVendorStatus={(id) => {
              const u = users.find(user => user.id === id);
              if (u) handleUpdateUser({ ...u, isSuspended: !u.isSuspended });
            }}
            onDeleteVendor={async (id) => {
               await deleteDoc(doc(db, 'users', id));
               // Also cascade delete products? For safety, maybe not in this demo
            }}
            onUpdateUser={handleUpdateUser}
            onUpdateDispute={handleUpdateDispute}
            onAddCategory={handleAddCategory}
            onCreateStaff={async (staff) => {
               await setDoc(doc(db, 'users', staff.id), stripUndefined(staff));
            }}
            onUpdateProduct={handleUpdateProduct}
            onSendNotification={(uid, msg) => {
               const u = users.find(user => user.id === uid);
               if(u) handleUpdateUser({ ...u, notifications: [msg, ...(u.notifications || [])] });
            }}
          />
        )}

        {currentView === 'buyer-dashboard' && currentUser?.role === UserRole.BUYER && (
          <BuyerDashboard 
            user={freshCurrentUser!}
            transactions={transactions.filter(t => t.buyerId === currentUser.id)}
            disputes={disputes}
            reviews={reviews}
            recommendations={sellerRecommendations}
            onRaiseDispute={async (d) => {
               await setDoc(doc(db, 'disputes', d.id), stripUndefined(d));
            }}
            onAddReview={handleAddReview}
            onUpdateUser={handleUpdateUser}
            onAddRecommendation={handleAddRecommendation}
          />
        )}

        {currentView === 'staff-dashboard' && [UserRole.STAFF, UserRole.MARKETER, UserRole.TECHNICAL, UserRole.TEAM_MEMBER].includes(currentUser?.role as any) && (
           <StaffDashboard 
             user={freshCurrentUser!}
             transactions={transactions}
             vendors={users}
             disputes={disputes}
             onUpdateUser={handleUpdateUser}
           />
        )}

        {['privacy', 'terms', 'sourcing', 'cookies'].includes(currentView) && (
           <LegalView view={currentView as any} config={siteConfig} />
        )}

        {currentView === 'about' && <AboutUsView config={siteConfig} />}
        
        {currentView === 'services' && <ServicesView config={siteConfig} />}

      </Layout>

      <ChatSupport 
        currentUser={freshCurrentUser}
        stores={stores}
        products={products}
        globalMessages={messages}
        channelStatus={channelStatus}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        onArchiveChat={handleArchiveChat}
        onToggleAI={handleToggleAI}
        onNotifySeller={handleNotifySeller}
        theme={theme}
        config={siteConfig}
      />
    </div>
  );
}

export default App;
