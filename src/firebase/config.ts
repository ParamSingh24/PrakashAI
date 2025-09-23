// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAG3CitDeRrjoMDUZCXO0ppym8T1GrJ_GA",
  authDomain: "mits-careerboost.firebaseapp.com",
  projectId: "mits-careerboost",
  storageBucket: "mits-careerboost.firebasestorage.app",
  messagingSenderId: "620529797748",
  appId: "1:620529797748:web:dd4ac290be44ffbf43df21",
  measurementId: "G-1RCL0037GE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;