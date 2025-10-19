import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import app from "./firebaseConfig";

export const db = getFirestore(app);

// Create a new user document after registration
export const createUserDocument = async (uid, username) => {
  const userRef = doc(db, "users", uid);

  await setDoc(userRef, {
    username: username,
    score: 0,
    timeSpent: 0 // in seconds
  });
};

// Get user data
export const getUserData = async (uid) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) return userSnap.data();
  return null;
};

// Update user score and/or timeSpent
export const updateUserData = async (uid, data) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
};
