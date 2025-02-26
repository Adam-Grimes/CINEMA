const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

// Firebase configuration (Keep this private!)
const firebaseConfig = {
    apiKey: "AIzaSyCC7-vWNa4SgO33fzzkfa-6u6lj4vfP-r8",
    authDomain: "cinema-system-5ab41.firebaseapp.com",
    projectId: "cinema-system-5ab41",
    storageBucket: "cinema-system-5ab41.firebasestorage.app",
    messagingSenderId: "89048477298",
    appId: "1:89048477298:web:a6ad2f872b671c94a1dceb",
    measurementId: "G-8BLQ1YBNBC"
};

// Initialize Firebase on the backend
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };
