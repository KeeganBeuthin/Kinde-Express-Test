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
  res.render("admin", {
    title: "Admin",
    user: req.user,
  });
});

// Add a test route for jwtVerify
app.get("/verify-jwt", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const verifier = jwtVerify(config.issuerBaseUrl);
    const result = await verifier(token);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Add a test route that requires authentication
app.get("/test-protected", protectRoute, (req, res) => {
  res.send("If you see this, you're authenticated!");
});

// Add an unauthorized route
app.get("/unauthorised", (req, res) => {
  res.render("no_auth", {
    title: "Unauthorized",
    message: "You are not authorized to access the requested resource.",
  });
});

app.listen(port, () => {
  console.log(`Kinde Express Starter Kit listening on port ${port}!`);
});
