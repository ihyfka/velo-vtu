import DOMPurify from "dompurify";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
let app, auth, provider;
  
if(typeof document !== 'undefined') {
  /* pages, links */
  const signInPage = document.querySelector("#signin-view");
  const signUpPage = document.querySelector("#signup-view");
  const forgotPasswordPage = document.querySelector("#forgot-view");
  const signInLink = document.querySelectorAll(".signin-link");
  const signUpLink = document.querySelector(".signup-link");
  const forgotPasswordLink = document.querySelector(".forgot-link");
  /* inputs */
  const signUpName = signUpPage?.querySelectorAll("input")[0];
  const signUpEmail = signUpPage?.querySelectorAll("input")[1];
  const signUpPasskey = signUpPage?.querySelectorAll("input")[2];
  const signInEmail = signInPage?.querySelectorAll("input")[0];
  const signInPasskey = signInPage?.querySelectorAll("input")[1];
  const forgotEmailBtn = forgotPasswordPage?.querySelectorAll("input")[0];
  /* buttons & actions */
  const logWSocialBtn = document.querySelectorAll(".social-btn");
  const logWSignInBtn = signInPage?.querySelector(".btn-primary");
  const createAccountBtn = signUpPage?.querySelector(".btn-primary");
  const sendEmailBtn = forgotPasswordPage?.querySelector(".btn-primary");

  /* functions  */
for(let i=0;i<logWSocialBtn.length;i++) {
  logWSocialBtn[i]?.addEventListener("click", (e)=>{
    e.preventDefault();
    authWGoogle();
  })
}

logWSignInBtn?.addEventListener("click", signInWEmail);
signUpPasskey?.addEventListener("input", ()=>{
  if(signUpPasskey !== "") {
    document.querySelector("#requirements").style.display = "block";
  }
})

signInLink.forEach(link => {link.addEventListener("click", (e) => { e.preventDefault(); switchView('signin-view') })})
signUpLink?.addEventListener("click", (e) => { e.preventDefault(); switchView('signup-view') })
forgotPasswordLink?.addEventListener("click", (e) => { e.preventDefault(); switchView('forgot-view') })
createAccountBtn?.addEventListener("click", createAccountWEmail);
}

/* start firebase */
export async function startFirebase() {
  try {
    const res = await fetch("/firebase-config");
    if(!res.ok) throw new Error(`firebase config loading failed: ${res.status}`);
    const firebaseConfig = await res.json();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();  
  }finally {
    return app, auth, provider;
  }
} startFirebase();
export function initLoader(run) {
  if(run === false) return;
  const overlay = document.createElement('div');
  overlay.className = "loader-overlay";
  
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  
  const text = document.createElement('div');
  text.className = 'loader-text';
  // text.innerText = 'Loading...';
  overlay.appendChild(spinner, text);
  document.body.appendChild(overlay);
}
async function finalizeLogin(user) {
  try {
    const idToken = await user.getIdToken();
    const sessionAuthRes = await fetch("/sessionAuth", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
    if(!sessionAuthRes.ok) throw new Error(`Session auth failed: ${sessionAuthRes.status}`);    
    
    // Redirect to dashboard; add animation
    initLoader(true);
    window.location.replace("/dashboard");
  }catch(error) {
    console.error("Session creation failed:", error);
  }
}
async function authWGoogle() {
  const response = await fetch("/google/auth", {
    method: 'POST'
  });
  const data = await response.json();
  window.location.href = data.url;
}

/* actions. */
function switchView(viewId) {
  const views = document.querySelectorAll('.view-section');
  views.forEach(view => {
    view.classList.remove('active');
  });
  const targetView = document.getElementById(viewId);
  if(targetView) {
    targetView.classList.add('active');
  }
}

/* validate session for firebase auth */
async function signInWEmail() {
  const signInPage = document.querySelector("#signin-view");
  const signInEmail = signInPage?.querySelectorAll("input")[0];
  const signInPasskey = signInPage?.querySelectorAll("input")[1];
  let userEmailInput = signInEmail.value; 
  const userPasskeyInput = signInPasskey.value;
  const userSignInEmail = DOMPurify.sanitize(userEmailInput);
  if(!userEmailInput || !userPasskeyInput) {
    document.querySelector("#err-cred").classList.add("vis");
    document.querySelector("#err-cred").textContent = "Incomplete credentials.";
    setTimeout(()=>{
      document.querySelector("#err-cred").classList.remove("vis");
    }, 1000)
    return; //input missing
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, userSignInEmail, userPasskeyInput);
    await finalizeLogin(userCredential.user);
    console.log("signed in");
  }catch(err) {
    initLoader(false);
    document.querySelector("#err-cred").classList.add("vis");
    document.querySelector("#err-cred").textContent = "Invalid username or password.";
    setTimeout(()=>{
      document.querySelector("#err-cred").classList.remove("vis");
    }, 1000)
    console.log("signin error!!");
  }
}
async function createAccountWEmail() {
  const signUpPage = document.querySelector("#signup-view");
  const signUpName = signUpPage?.querySelectorAll("input")[0];
  const signUpEmail = signUpPage?.querySelectorAll("input")[1];
  const signUpPasskey = signUpPage?.querySelectorAll("input")[2];
  let userNameInput = signUpName.value;
  let userEmailInput = signUpEmail.value;
  const userEnteredName = DOMPurify.sanitize(userNameInput);
  const userEnteredEmailInput = DOMPurify.sanitize(userEmailInput);
  const userEnteredPasskeyInput = signUpPasskey.value;
  if(!userEnteredName || !userEnteredEmailInput || !userEnteredPasskeyInput) {
    document.querySelector("#err-cred").classList.add("vis");
    document.querySelector("#err-cred").textContent = "Incomplete credentials.";
    setTimeout(()=>{
      document.querySelector("#err-cred").classList.remove("vis");
    }, 1000)
    return; //input missing
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userEnteredEmailInput, userEnteredPasskeyInput);
    await updateProfile(userCredential.user, {displayName: userEnteredName});
    console.log("account creation successful")
    await finalizeLogin(userCredential.user);
  }catch {
    //password criteria not met..
    initLoader(false);
    document.querySelector("#requirements").style.display = "block";
    document.querySelector("#requirements").style.color = "#f33";
    setTimeout(()=>{
      document.querySelector("#requirements").style.color = "#444a";
    }, 4000)
    console.log("account creation unsuccessful");
  }
} 

     