import express from "express";
import dotenv from "dotenv"; dotenv.config();
import admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import serviceAccount from "./serviceAccountKey.json" with {type: "json"};
import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";
import axios from "axios"; 
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
const app = express();
const PORT = process.env.PORT || 80;

const CARRIER_CHECKER_URL = process.env.CARRIER_CHECKER_URL;
const CARRIER_KEY_HEADER = process.env.CARRIER_KEY_HEADER;
const CARRIER_HOST_HEADER = process.env.CARRIER_HOST_HEADER;
const CARRIER_SERVICE_KEY = process.env.CARRIER_SERVICE_KEY;
const CARRIER_SERVICE_HOST = process.env.CARRIER_SERVICE_HOST;

app.use(cors({ origin: true, credentials: true }));
app.set('trust proxy', 1);
app.use(cookieParser(process.env.P_SIGN));
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist"))); /* vite for static */

/* start client */
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET_ID,
  process.env.AUTH_REDIRECT_URL,
)

/* middleware */
async function authenticate(req, res, next) {
  const sessionCookie = req.cookies.session || "";
  if(!sessionCookie) console.error("No credentials found. Blocking access.");
  try {
    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true); 
    req.user = decodedToken;
    console.log(`session for ${req.user.email} verified`);
    return next();
  }
  catch(error) {
    console.error(error.code, "Server verification failed");
    res.clearCookie("session");
    return res.redirect("/login");
  }
}
async function alreadyAuthenticated(req, res, next) {
  const sessionCookie = req.cookies.session || "";
  if(!sessionCookie) return next();
  try {
    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, false); 
    console.log(`Active ${decodedToken.email} session detected`);
    return res.redirect("/dashboard");
  }
  catch(error) {
    res.clearCookie("session");
    return next();
  }
}

/* serves firebase.config */
app.get("/firebase-config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  })
})

/* init admin */
initializeApp({ credential: cert(serviceAccount) });

app.post("/sessionAuth", async (req, res) => {
  const idToken = req.body.idToken || req.headers.authorization?.split('Bearer ')[1];
  if(!idToken) return res.status(400).json({error: "No token"});
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if(new Date().getTime() / 1000 - decodedToken.auth_time > 7 * 60) {
      return res.status(401).json({ error: "Recent sign-in required" });
    }
    const expiresIn = 60* 60* 24* 5* 1000;
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    res.cookie("session", sessionCookie, {  
      httpOnly: true, 
      sameSite: "lax",
      maxAge: expiresIn,
      secure: process.env.NODE_ENV === "production", 
    })
    return res.redirect("/dashboard");
  }catch (err) {
    console.error(err);
    res.status(401).json({ err: "Unauthorized session" });
  }
});

app.post("/google/auth", async (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");
  res.cookie("aState", state, {
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60* 4* 1000
  })
  const authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ],
    state: state,
  })
  res.json({ url: authorizeUrl })
})

/* S2S relay */
app.get("/google-auth", async (req, res) => {
  const { code, state } = req.query;
  if(!code) return res.status(400).send("No authorization.");
  if(!state || state !== req.signedCookies.aState) return res.status(403).send("Invalid state param");
  try { 
    res.clearCookie("aState");
    const { tokens } = await client.getToken(code);
    const googleIdToken = tokens.id_token;
    const fbExchangeUrl = `${process.env.FB_EXCHANGE_URL}=${process.env.FIREBASE_API_KEY}`;
    const exchangeRes = await fetch(fbExchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postBody: `id_token=${googleIdToken}&providerId=google.com`,
        requestUri: process.env.AUTH_REDIRECT_URL,
        returnIdpCredential: true,
        returnSecureToken: true,
      })
    })
    const exchangeData = await exchangeRes.json();
    if(!exchangeRes.ok) throw new Error("Token exchange failed");
    const gIdToken = exchangeData.idToken;  
    const expiresIn = 60* 60* 24* 5* 1000;
    const sessionCookie = await admin.auth().createSessionCookie(gIdToken, { expiresIn });
    res.cookie("session", sessionCookie, {  
      httpOnly: true, 
      sameSite: "lax",
      maxAge: expiresIn,
      secure: process.env.NODE_ENV === "production", 
    })
    return res.redirect("/dashboard");
  }catch (err) {
    console.log(`${err}: Invalid or tampered Auth`);
    return res.redirect("/login");
  }
})

app.get("/", alreadyAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "src", "resources", "login.html"));
})
app.get("/getstarted", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "src", "resources", "login.html"));
})

app.get("/dashboard", authenticate, (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "dist", "src", "main", "app.html"));
})

app.get("/mobile/validate", async (req, res) => {
  try {
    const apiRes = await axios.get(`${CARRIER_CHECKER_URL}`, {
      headers: {
        [CARRIER_KEY_HEADER]: process.env.CARRIER_SERVICE_KEY,
        [CARRIER_HOST_HEADER]: process.env.CARRIER_SERVICE_HOST,
      },
      params: req.query,
    })
    res.json(apiRes.data);
  }catch(error){
    console.error('Error proxying request:', error.message);
    res.status(500).json({error: 'Internal Server Error' });
  }
})

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "dist","src", "resources", "terms.html"));
})

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "dist","src", "resources", "policy.html"));
})

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.json({ message: `user @ ${req.user} logged out.` });
  return res.redirect("/login");
});

app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, ()=>{ console.log(`Server is active: ${PORT}`) });