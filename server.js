import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();

app.use(cors());          // ✅ allow GitHub Pages → Render requests
app.use(express.json());

/* =========================
   RATE LIMIT
========================= */

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many accounts created. Try again later."
});

/* =========================
   ENV
========================= */

const KOMGA_URL = process.env.KOMGA_URL;
const KOMGA_USER = process.env.KOMGA_USER;
const KOMGA_PASS = process.env.KOMGA_PASS;

function authHeader() {
  return "Basic " + Buffer.from(KOMGA_USER + ":" + KOMGA_PASS).toString("base64");
}

/* =========================
   VALIDATION
========================= */

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* =========================
   SIGNUP
========================= */

app.post("/signup", signupLimiter, async (req, res) => {
  const { email, password, website } = req.body;

  if (website) {
    return res.status(400).send("Bot rejected");
  }

  if (!email || !password)
    return res.status(400).send("Missing fields");

  if (!validEmail(email))
    return res.status(400).send("Invalid email");

  if (password.length < 6)
    return res.status(400).send("Password must be at least 6 characters");

  try {
    const check = await fetch(`${KOMGA_URL}/api/v1/users`, {
      headers: { Authorization: authHeader() }
    });

    if (!check.ok)
      return res.status(500).send("Cannot verify users");

    const users = await check.json();

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return res.status(400).send("Account already exists");

    const create = await fetch(`${KOMGA_URL}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader()
      },
      body: JSON.stringify({
        email: email,
        password: password,
        roles: ["ROLE_USER"]
      })
    });

    if (!create.ok)
      return res.status(400).send(await create.text());

    res.send("Account created");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

/* =========================
   HEALTH
========================= */

app.get("/", (req, res) => {
  res.send("Signup API running");
});

/* =========================
   START
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
