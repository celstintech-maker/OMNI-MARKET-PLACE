
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

// Initialize Analytics conditionally to avoid "API Key not valid" errors during dev/test if not fully configured
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics failed to initialize. This is often due to API key restrictions or environment setup. Proceeding without Analytics.", error);
}

// Initialize Services
export const db = getFirestore(app);
export const storage = getStorage(app);

export { analytics };
export default app;
