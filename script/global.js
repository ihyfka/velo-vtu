import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { initializeApp } from "firebase/app";

async function startFirebase() {
  let app, auth, provider;
  try {
    const res = await fetch("/firebase-config");
    if(!res.ok) throw new Error(`firebase config loading failed: ${res.status}`);
    const firebaseConfig = await res.json();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
  }finally {
    return { app, auth, provider };
  }
}
const { app, auth, provider } = await startFirebase();
export { app, auth, provider } 

