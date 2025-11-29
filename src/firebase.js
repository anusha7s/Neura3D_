// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMIifzku_9kS6bD7KZAYCjQeyWyzlAEQM",
  authDomain: "neura3d-fe416.firebaseapp.com",
  projectId: "neura3d-fe416",
  storageBucket: "neura3d-fe416.firebasestorage.app",
  messagingSenderId: "543351871578",
  appId: "1:543351871578:web:4a7003732ed86582572063",
  measurementId: "G-M341GM0ZK3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);