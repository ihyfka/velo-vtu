import express from "express";
import dotenv from "dotenv"; dotenv.config();
import admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import serviceAccount from "./serviceAccountKey.json" with {type: "json"};
import { JWT, OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { initLoader } from "./script/login.js";
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

app.use(cors({ origin: true, credentials: true }));
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json());


/* start the OAuth client */
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET_ID,
  process.env.AUTH_REDIRECT_URL,
)

/* start google auth */
app.post("/google/auth", async (req, res) => {
  const authorizeUrl = client.generateAuthUrl({
    access_type: "offline", // to get refresh tokens
    prompt: "consent",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  })
  res.json({ url: authorizeUrl })
})

/* S2S and intermediary redirect handling {callback} */
app.get("/google-auth", async (req, res) => {
  const { code } = req.query;
  if(!code) return res.status(400).send("No authorization.");
  try { 
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload(); // payload contains name, email, picture, etc.
    const trimmedPayload = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      id: payload.sub, // Google's unique user ID
      provider: "google"
    };
    const token = jwt.sign(trimmedPayload, process.env.JWT_SIGN, { expiresIn: "1d" });
    
    res.cookie("userInfo", token, { // JSON.stringify(trimmedPayload), {
      path: "/",
      maxAge: 900000,
      httpOnly: true,
      secure: true, 
      sameSite: "lax",
    })
    res.redirect("/dashboard");
  }catch (err) {
    res.status(401).json({ err: "Invalid or tampered session" });
    return res.redirect("/login");
  }
})

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

/* initializing admin */
initializeApp({
  credential: cert(serviceAccount),
});

const SESSION_COOKIE_NAME = "session";
const SESSION_EXPIRES = 3 * 24 * 60 * 60 * 1000;
/* create a firebase session */
app.post("/sessionAuth", async (req, res) => {
  // check for idTokens
  const idToken = req.body.idToken || req.headers.authorization?.split('Bearer ')[1];
  if(!idToken) return res.status(400).json({error: "No token"});
  try {
    // verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // advanced security
    if(new Date().getTime() / 1000 - decodedToken.auth_time > 10 * 60) {
      return res.status(401).json({ error: "Recent sign-in required" });
    }
    // create a session cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES,
    });
    // set cookie (HTTP-only, secure)
    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_EXPIRES,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return res.json();
    // res.json({ message: "Login successful", uid: decodedToken.uid });
  }catch (err) {
    console.error(err);
    res.status(401).json({ err: "Unauthorized" });
  }
});

/* middleware to protect routes */
async function authenticate(req, res, next) {
  const sessionCookie = req.cookies[SESSION_COOKIE_NAME] || "";
  const userInfoCookie = req.cookies.userInfo;
  try {
    let decodedClaims;
    if(sessionCookie) { // for firebase
      decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      req.user = decodedClaims; // attach user info to request
      console.log("firebase session verified");
      return next();
    }else if(userInfoCookie) {
      const decodedClaims = jwt.verify(userInfoCookie, process.env.JWT_SIGN);
      req.user = decodedClaims;
      console.log("google session verified");
      return next();
    }
    console.error("No credentials found. Blocking access.");
    res.redirect("/login");
  }catch(err) {
    res.clearCookie("session");
    res.clearCookie("userInfo");
    return res.redirect("/login");
  }
}

/* landing page */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
})

/* signup/login page */
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "src", "resources", "login.html"));
})
app.get("/getstarted", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "src", "resources", "login.html"));
})

/* dashboard */
app.get("/dashboard", authenticate, (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "dist", "src", "main", "app.html"));
})

/* terms */
app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "dist","src", "resources", "terms.html"));
})

/* policy */
app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "dist","src", "resources", "policy.html"));
})

/* user logout */
app.post("/logout", (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME);
  res.json({ message: "Logged." });
  window.location.replace("/");
});

/* routing endboss-- for routing files that dont actually exist i.e /dashboard */
app.use(express.static(path.join(__dirname, "dist"))); // use vite to serve static
app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

/* server active */
app.listen(PORT, ()=>{
  console.log(`Server is active: ${PORT}`);
})