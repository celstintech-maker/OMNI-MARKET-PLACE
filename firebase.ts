
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Omni Marketplace Firebase Configuration
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
const analytics = getAnalytics(app);

// Initialize Services
export const db = getFirestore(app);
export const storage = getStorage(app);

export { analytics };
export default app;
