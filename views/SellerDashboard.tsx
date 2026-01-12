
import React, { useState, useRef, useEffect } from 'react';
import { Product, User, SellerVerification, BankDetails } from '../types';
import { Icons, CATEGORIES, COUNTRY_CURRENCY_MAP, PAYMENT_METHODS, NIGERIA_LOCATIONS } from '../constants';

interface SellerDashboardProps {
  user: User;
  products: Product[];
  onAddProduct: (product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, products, onAddProduct, onDeleteProduct, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'verification' | 'settings'>('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(10);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [cameraTarget, setCameraTarget] = useState<'verification' | 'product'>('product');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [bankForm, setBankForm] = useState<BankDetails>(user.bankDetails || {
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  const [newProduct, setNewProduct] = useState<Partial<Product> & { gallery: string[], sizeInput: string }>({
    name: '',
    description: '',
    price: 0,
    stock: 1,
    category: CATEGORIES[0],
    imageUrl: '', 
    gallery: [],
    sizes: [],
    sizeInput: '',
    videoUrl: '',
    paymentMethod: user.paymentMethod || 'bank_transfer'
  });

  const [verificationForm, setVerificationForm] = useState<Partial<SellerVerification>>(user.verification || {
    businessName: '',
    businessAddress: '',
    country: user.country || 'Nigeria',
    state: user.state || 'Delta',
    city: user.city || 'Asaba',
    phoneNumber: '',
    profilePictureUrl: '',
    productSamples: []
  });

  const sellerProducts = products.filter(p => p.sellerId === user.id);
  const isPending = user.verification?.verificationStatus === 'pending';
  const activeCurrency = COUNTRY_CURRENCY_MAP[user.verification?.country || user.country || 'Nigeria']?.symbol || '₦';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopCamera();
    };
  }, []);

  const startCamera = async (mode: 'photo' | 'video', target: 'verification' | 'product') => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support camera access.");
      return;
    }

    setCameraMode(mode);
    setCameraTarget(target);
    setShowCamera(true);
    setRecordingTime(10);

    try {
      const constraints = {
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      if (mode === 'video') {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setNewProduct(prev => ({ ...prev, videoUrl: url }));
          chunksRef.current = [];
        };
        setMediaRecorder(recorder);
      }
    } catch (err: any) {
      alert("Could not access camera.");
      setShowCamera(false);
    }
  };

  const startRecording = () => {
    if (!mediaRecorder) return;
    chunksRef.current = [];
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(10);
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    stopCamera();
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      
      if (cameraTarget === 'verification') {
        setVerificationForm({ ...verificationForm, profilePictureUrl: dataUrl });
      } else {
        setNewProduct(prev => {
          const updatedGallery = [...prev.gallery, dataUrl].slice(0, 3);
          return {
            ...prev,
            gallery: updatedGallery,
            imageUrl: updatedGallery[0]
          };
        });
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setIsRecording(false);
    setMediaRecorder(null);
  };

  const addSize = () => {
    if (!newProduct.sizeInput?.trim()) return;
    setNewProduct(prev => ({
      ...prev,
      sizes: [...(prev.sizes || []), prev.sizeInput.trim()],
      sizeInput: ''
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.gallery.length === 0) {
      alert("Please capture at least one product photo.");
      return;
    }
    onAddProduct({
      ...newProduct,
      sellerId: user.id,
      storeName: user.storeName || 'My Store',
      location: user.verification?.country === 'Nigeria' 
        ? `${user.verification.city}, ${user.verification.state}`
        : user.verification?.country || user.country
    });
    setNewProduct({
      name: '', description: '', price: 0, stock: 1, category: CATEGORIES[0],
      imageUrl: '', gallery: [], sizes: [], sizeInput: '', videoUrl: '',
      paymentMethod: user.paymentMethod || 'bank_transfer'
    });
    setShowAddModal(false);
  };

  const submitVerification = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onUpdateUser({
        ...user,
        country: verificationForm.country,
        state: verificationForm.state,
        city: verificationForm.city,
        verification: { ...verificationForm, verificationStatus: 'pending' } as SellerVerification
      });
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 1500);
  };

  const savePayoutSettings = () => {
    onUpdateUser({ ...user, bankDetails: bankForm });
    alert("Payout settings updated!");
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-slide-up">
        <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tighter">Profile Submitted!</h2>
        <p className="text-gray-500 max-w-lg mb-12 font-medium leading-relaxed">Your details are being reviewed. Expect verification in 24-48 hours.</p>
        <button onClick={() => { setShowSuccess(false); setActiveTab('inventory'); }} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">{user.storeName}</h2>
          <div className="flex gap-8 mt-6 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setActiveTab('inventory')} className={`pb-3 text-xs uppercase tracking-widest font-black border-b-2 transition-all ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Inventory</button>
            <button onClick={() => setActiveTab('verification')} className={`pb-3 text-xs uppercase tracking-widest font-black border-b-2 transition-all ${activeTab === 'verification' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Business Profile</button>
            <button onClick={() => setActiveTab('settings')} className={`pb-3 text-xs uppercase tracking-widest font-black border-b-2 transition-all ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Bank & Payouts</button>
          </div>
        </div>
        {activeTab === 'inventory' && !isPending && (
          <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200"><Icons.Plus /> New Product</button>
        )}
      </div>

      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xl font-black tracking-tight mb-2">Registration Identity</h3>
            <div className="space-y-4">
              <input disabled={isPending} value={verificationForm.businessName} onChange={e => setVerificationForm({...verificationForm, businessName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none disabled:opacity-50" placeholder="Full Business Name" />
              <input disabled={isPending} value={verificationForm.phoneNumber} onChange={e => setVerificationForm({...verificationForm, phoneNumber: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none disabled:opacity-50" placeholder="Business Phone Number" />
              <textarea disabled={isPending} value={verificationForm.businessAddress} onChange={e => setVerificationForm({...verificationForm, businessAddress: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl h-24 border-none disabled:opacity-50" placeholder="Physical Business Address" />
              <div className="grid grid-cols-2 gap-4">
                <select disabled={isPending} value={verificationForm.state} onChange={e => setVerificationForm({...verificationForm, state: e.target.value, city: NIGERIA_LOCATIONS[e.target.value][0]})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none">
                  {Object.keys(NIGERIA_LOCATIONS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select disabled={isPending} value={verificationForm.city} onChange={e => setVerificationForm({...verificationForm, city: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none">
                  {NIGERIA_LOCATIONS[verificationForm.state || 'Delta'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {!isPending && <button onClick={submitVerification} disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest">{isSubmitting ? 'Uploading...' : 'Submit Profile'}</button>}
          </div>
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border dark:border-slate-800 shadow-sm text-center flex flex-col items-center">
            <h3 className="text-xl font-black tracking-tight mb-8">Live Photo ID</h3>
            <div className="relative mb-10">
              {verificationForm.profilePictureUrl ? <img src={verificationForm.profilePictureUrl} className="w-64 h-64 rounded-[3rem] object-cover border-8 border-indigo-50 shadow-2xl" /> : <div className="w-64 h-64 rounded-[3rem] bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-300 border-4 border-dashed border-gray-200"><Icons.Camera /></div>}
            </div>
            {!isPending && <button onClick={() => startCamera('photo', 'verification')} className="bg-indigo-50 dark:bg-slate-800 text-indigo-600 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest"><Icons.Camera /> Snap Photo</button>}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr><th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase">Item</th><th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase">Price</th><th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase">Stock</th><th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase">Action</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {sellerProducts.map(p => (
                <tr key={p.id}>
                  <td className="px-10 py-6 flex items-center gap-5">
                    <img src={p.imageUrl} className="w-14 h-14 rounded-2xl object-cover" />
                    <div className="flex flex-col"><span className="font-bold text-gray-900 dark:text-white">{p.name}</span><span className="text-[10px] text-gray-400">{p.category}</span></div>
                  </td>
                  <td className="px-10 py-6 font-black text-indigo-600">{activeCurrency}{p.price.toLocaleString()}</td>
                  <td className="px-10 py-6"><span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">{p.stock} units</span></td>
                  <td className="px-10 py-6 text-right"><button onClick={() => onDeleteProduct(p.id)} className="text-red-500 font-black text-[10px] uppercase">Archive</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-6 animate-slide-up overflow-y-auto max-h-[90vh] no-scrollbar">
            <h3 className="text-3xl font-black tracking-tighter">Market Entry</h3>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none" placeholder="Product Title" />
              <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl h-24 border-none" placeholder="Description" />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl" placeholder="Price" />
                <input type="number" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl" placeholder="Stock" />
              </div>

              <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {newProduct.category === 'Fashion' && (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Sizes (Shoe/Wear)</label>
                  <div className="flex gap-2">
                    <input value={newProduct.sizeInput} onChange={e => setNewProduct({...newProduct, sizeInput: e.target.value})} className="flex-1 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl" placeholder="e.g. 42, XL, 44" />
                    <button type="button" onClick={addSize} className="bg-slate-900 text-white px-6 rounded-2xl font-black text-xs uppercase">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newProduct.sizes?.map(s => <span key={s} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black">{s}</span>)}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Gallery ({newProduct.gallery.length}/3)</label>
                <div className="grid grid-cols-3 gap-4">
                  {newProduct.gallery.map((img, i) => <img key={i} src={img} className="aspect-square object-cover rounded-2xl border-2 border-indigo-600" />)}
                  {newProduct.gallery.length < 3 && <button type="button" onClick={() => startCamera('photo', 'product')} className="aspect-square bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400"><Icons.Camera /></button>}
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl">Add to Inventory</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-gray-400 font-black text-xs uppercase tracking-widest">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[110] p-6">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-2xl rounded-[3rem] bg-black shadow-2xl" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-12 flex gap-12 items-center">
            <button onClick={stopCamera} className="text-white/40 font-black text-xs uppercase tracking-widest">Cancel</button>
            <button onClick={capturePhoto} className="bg-white w-24 h-24 rounded-full flex items-center justify-center group">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-600 transition" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
