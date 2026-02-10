// services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0pK-wDAKeTT2VdE7gAqu_PCmor5N5QnA",
  authDomain: "chattie-65187.firebaseapp.com",
  projectId: "chattie-65187",
  storageBucket: "chattie-65187.firebasestorage.app",
  messagingSenderId: "229479964802",
  appId: "1:229479964802:web:560844b288a964c740549b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
