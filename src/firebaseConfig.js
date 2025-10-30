import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2j9gP910dTMwaNeNgYg6qn9zUbED_JMg",
  authDomain: "train-asat.firebaseapp.com",
  projectId: "train-asat",
  storageBucket: "train-asat.firebasestorage.app",
  messagingSenderId: "668292534953",
  appId: "1:668292534953:web:c008cbd52f8b6e4af3cfb8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
