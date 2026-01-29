import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Diagnostic check
console.log("Firebase Config initialized with Project ID:", firebaseConfig.projectId);
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key') {
    console.error("Firebase API Key is missing or invalid! Check your .env file.");
} else {
    console.log("Firebase API Key is present (masked):", firebaseConfig.apiKey.substring(0, 5) + "...");
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
