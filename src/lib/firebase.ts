import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Client credentials for the Eco Hero Firebase project.
 *
 * These values are public by design. They identify the project to Google,
 * they do not authorise anything on their own. Everything that actually
 * protects player data lives in the Firestore security rules and in the
 * admins collection check performed on sign in.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCMVO4_2XN157pOVqhewuyzdN2uLT1mhxo",
  authDomain: "ecoheroadventure.firebaseapp.com",
  projectId: "ecoheroadventure",
  storageBucket: "ecoheroadventure.firebasestorage.app",
  messagingSenderId: "601374307348",
  appId: "1:601374307348:web:acd0c9984eec235ec06301",
};

// Next re-executes modules across hot reloads and route segments, so the app
// is only created once and reused after that.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
