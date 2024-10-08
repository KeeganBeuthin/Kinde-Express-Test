import dotenv from "dotenv";
dotenv.config();

import { setupKinde, protectRoute, getUser, GrantType, jwtVerify } from "@kinde-oss/kinde-node-express";
import express from "express";

const app = express();
const port = 3000;
app.use(express.static("public"));

const config = {
  grantType: GrantType.AUTHORIZATION_CODE,
  clientId: process.env.KINDE_CLIENT_ID,
  issuerBaseUrl: process.env.KINDE_ISSUER_URL,
  siteUrl: process.env.KINDE_SITE_URL,
  secret: process.env.KINDE_CLIENT_SECRET,
  redirectUrl: process.env.KINDE_REDIRECT_URL,
  unAuthorisedUrl: process.env.KINDE_UNAUTHORISED_URL,
  postLogoutRedirectUrl: process.env.KINDE_POST_LOGOUT_REDIRECT_URL,
  scope: "openid profile email",
};

const verifier = jwtVerify(config.issuerBaseUrl, config);

console.log("Kinde config:", config);

app.set("view engine", "pug");
const client = setupKinde(config, app);

app.get("/", async (req, res) => {
  if (await client.isAuthenticated(req)) {
    res.redirect("/admin");
  } else {
    res.render("index", {
      title: "KindeAuth Test",
      message: "Welcome to KindeAuth Test",
    });
  }
});

app.get("/admin", protectRoute, getUser, (req, res) => {
  console.log(req.user)
  res.render("admin", {
    title: "Admin",
    user: req.user,
  });
});

// Add a test route that requires authentication
app.get("/test-protected", protectRoute, getUser, verifier,(req, res) => {
  console.log("Accessed /test-protected route");
  console.log("User:", req.user);
  console.log(req)
  // if (req.user && req.user.id) {
  //   res.json({ 
  //     message: "Access granted", 
  //     userId: req.user.id 
  //   });
  // } else {
  //   res.status(500).json({ error: "User ID not found after verification" });
  // }
});

// Add an unauthorized route
app.get("/unauthorised", (req, res) => {
  res.render("no_auth", {
    title: "Unauthorized",
    message: "You are not authorized to access the requested resource.",
  });
});

// Add a route to check the current authentication status
app.get("/auth-status", (req, res) => {
  console.log("Checking auth status");
  
  console.log("Session:", req.session);
  console.log("User:", req.user);
  res.json({ 
    isAuthenticated: !!req.session?.access_token,
    sessionData: {
      access_token: req.session?.access_token ? 'Present' : 'Not present',
      id_token: req.session?.id_token ? 'Present' : 'Not present'
    },
    userData: req.user || 'No user data available',
    headers: req.headers
  });
});

app.listen(port, () => {
  console.log(`Kinde Express Starter Kit listening on port ${port}!`);
});
