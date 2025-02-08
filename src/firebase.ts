// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsOg0o3RGczlOYm7A4W6EBO98bKdXce70",
  authDomain: "studentmarknew.firebaseapp.com",
  projectId: "studentmarknew",
  storageBucket: "studentmarknew.firebasestorage.app",
  messagingSenderId: "472997938076",
  appId: "1:472997938076:web:ebaf0fb9e5c3c5c967be59",
  measurementId: "G-RZ0EF5Y01M",
  databaseURL: "https://studentmarknew-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, analytics, auth, database }; 