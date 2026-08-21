import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMVO4_2XN157pOVqhewuyzdN2uLT1mhxo",
  authDomain: "ecoheroadventure.firebaseapp.com",
  projectId: "ecoheroadventure",
  storageBucket: "ecoheroadventure.firebasestorage.app",
  messagingSenderId: "601374307348",
  appId: "1:601374307348:web:acd0c9984eec235ec06301",
  measurementId: "G-7HK0QZDE1F"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);