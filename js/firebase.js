import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAFhr4gbj3FEHjtSBMPCJHEluy3DaNk97s",
    authDomain: "chat-app-1f3bc.firebaseapp.com",
    databaseURL: "https://chat-app-1f3bc-default-rtdb.firebaseio.com",
    projectId: "chat-app-1f3bc",
    storageBucket: "chat-app-1f3bc.firebasestorage.app",
    messagingSenderId: "671382274295",
    appId: "1:671382274295:web:5f484d169b7aca889613f2",
    measurementId: "G-31S4CQ8RVV"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
