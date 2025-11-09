import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwdLplXXhm4bM_3ik_yGJuzXvs7NWmEJQ",
  authDomain: "travel-spendings-a36a3.firebaseapp.com",
  projectId: "travel-spendings-a36a3",
  storageBucket: "travel-spendings-a36a3.firebasestorage.app",
  messagingSenderId: "165855133517",
  appId: "1:165855133517:web:8a467844419b8c2ebc0104",
  measurementId: "G-LTFHJR844Y"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);