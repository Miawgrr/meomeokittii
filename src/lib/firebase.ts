import { initializeApp } from "firebase/app";
import { initializeFirestore, enableMultiTabIndexedDbPersistence, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import appletConfig from "../../firebase-applet-config.json";

// Use the official platform-provisioned config
const firebaseConfig = {
  ...appletConfig
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || "(default)");

// Enable offline persistence for seamless offline experience and robust reconnection
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore multi-tab persistence failed to enable:", err);
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Re-export Firestore methods to avoid runtime chunk conflicts
export { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove };

