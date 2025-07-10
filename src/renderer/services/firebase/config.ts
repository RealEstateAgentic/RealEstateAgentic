import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDfPqnwA-7CStsT9vwRBdkJKaL4q3UPeHI",
  authDomain: "recursor-56f01.firebaseapp.com", 
  projectId: "recursor-56f01",
  storageBucket: "recursor-56f01.firebasestorage.app",
  messagingSenderId: "985037255869",
  appId: "1:985037255869:web:2dd373e7c334840672b3d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully');