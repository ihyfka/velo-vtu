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
import session from "express-session";
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
app.use(session({
  secret: process.env.SESSION_SIGN,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, 
    sameSite: "lax",   
  }
}))

/* start OAuth client */
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET_ID,
  process.env.AUTH_REDIRECT_URL,
)

/* middleware */
async function authenticate(req, res, next) {
  if(req.session && req.session.user) {
    req.user = req.session.user;
    console.log(`exp session for ${req.user.email} verified`);
    return next();
  }else {
    console.error("No credentials found. Blocking access.");
    return res.redirect("/login");
  }
}
async function alreadyAuthenticated(req, res, next) {
  if(req.session && req.session.user) {
    console.log(`exp session for ${req.session.user.email} verified`);
    return res.redirect("/dashboard");
  }
  next();
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
/* initializing admin */
initializeApp({
  credential: cert(serviceAccount),
});

/* fb session */
app.post("/sessionAuth", async (req, res) => {
  // get idToken
  const idToken = req.body.idToken || req.headers.authorization?.split('Bearer ')[1];
  if(!idToken) return res.status(400).json({error: "No token"});
  try {
    // verify idtoken
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // added security
    if(new Date().getTime() / 1000 - decodedToken.auth_time > 10 * 60) {
      return res.status(401).json({ error: "Recent sign-in required" });
    }
    req.session.regenerate((err) => {
      if(err) return res.status(500).json({ error: "session zombie hit" }); //zombie session present
    })
    // create session
    req.session.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || "User",
      provider: "firebase"
    }; req.session.save((err) => {
      if(err) console.error("fb session save failed", err);
    })
    return res.json();
  }catch (err) {
    console.error(err);
    res.status(401).json({ err: "Unauthorized firebase session" });
  }
});

/* start social auth */
app.post("/google/auth", async (req, res) => {
  const authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  })
  res.json({ url: authorizeUrl })
})

/* S2S and intermediary redirect handling {g session} */
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
    const payload = ticket.getPayload(); // payload contains user info.    

    req.session.user = {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      provider: "google"
    };
    
    req.session.save((err) => { //saved and redirected
      if(err) console.error("google-session creation err", err);      
      return res.redirect("/dashboard");
    })
  }catch (err) {
    res.status(401).json({ err: "Invalid or tampered google session" });
    return res.redirect("/login");
  }
})


/* landing page */
app.get("/", alreadyAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
})

/* signup/login page */
app.get("/login", alreadyAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "src", "resources", "login.html"));
})
app.get("/getstarted", alreadyAuthenticated, (req, res) => {
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
  // res.clearCookie(SESSION_COOKIE_NAME);
  res.json({ message: "Logged out." });
  window.location.replace("/login");
});

/* routing endboss-- for routing files that dont actually exist i.e /dashboard */
app.use(express.static(path.join(__dirname, "dist"))); // use vite to serve static
app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

/* start server */
app.listen(PORT, ()=>{
  console.log(`Server is active: ${PORT}`);
})