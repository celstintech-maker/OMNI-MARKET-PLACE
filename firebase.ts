
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Omni Marketplace Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGGabk52HnE2uE4zTvoGtgggMT8YaRb6o",
  authDomain: "omnimarketplace-live.firebaseapp.com",
  projectId: "omnimarketplace-live",
  storageBucket: "omnimarketplace-live.firebasestorage.app",
  messagingSenderId: "373197878288",
  appId: "1:373197878288:web:c8b4361a6e8f4cc0adc695",
  measurementId: "G-5MMW8732EE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
