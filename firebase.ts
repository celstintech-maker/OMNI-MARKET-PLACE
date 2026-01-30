import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  query, 
  orderBy, 
  where, 
  limit, 
  arrayUnion 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA6_Yj9aD9gzuP-Ye6YqofO6mX-ilhVi-U",
  authDomain: "omni-marketplace-c34ab.firebaseapp.com",
  projectId: "omni-marketplace-c34ab",
  storageBucket: "omni-marketplace-c34ab.firebasestorage.app",
  messagingSenderId: "280702093091",
  appId: "1:280702093091:web:5a76f228b449ce41e1ee96",
  measurementId: "G-BY16RDQN72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics (Safe initialization)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.log("Analytics not supported in this environment");
  }
}

// Export services and functions to match the app's structure
export { 
  db, 
  storage, 
  analytics,
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  query, 
  orderBy, 
  where, 
  limit, 
  arrayUnion,
  ref,
  uploadBytes,
  getDownloadURL
};

export default app;