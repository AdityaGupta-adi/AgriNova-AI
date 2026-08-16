import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA_4mn_t7BwBSr4Zfl6fQm_jc8TutdeRYc",
  authDomain: "agrinova-ai-996db.firebaseapp.com",
  projectId: "agrinova-ai-996db",
  storageBucket: "agrinova-ai-996db.firebasestorage.app",
  messagingSenderId: "862644287702",
  appId: "1:862644287702:web:27e61158685010f07df177",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

export default app;