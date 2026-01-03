import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { initLoader } from "./login.js";

async function startFirebase() {
  let app, auth, provider;
  try {
    const res = await fetch("/firebase-config");
    if(!res.ok) throw new Error(`firebase config loading failed: ${res.status}`);
    const firebaseConfig = await res.json();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    onAuthStateChanged(auth, (user) => {
      if(user) {
        // initLoader(true);
        window.location.href = "/dashboard";
      } return;
    })
  }finally {
    return { app, auth, provider };
  }
}
const { app, auth, provider } = await startFirebase();
export { app, auth, provider }

