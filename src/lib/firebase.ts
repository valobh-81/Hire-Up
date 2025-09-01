import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "hire-up-r92r6",
  appId: "1:280298877187:web:afab75d8b159a5b98b3936",
  storageBucket: "hire-up-r92r6.appspot.com",
  apiKey: "AIzaSyAK85gxg5e3bqXQVHjbNGvDrB-o7IMNRzU",
  authDomain: "hire-up-r92r6.firebaseapp.com",
  messagingSenderId: "280298877187",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
