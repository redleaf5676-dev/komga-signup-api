import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();

app.use(cors());
app.use(express.json());

/* ========= RATE LIMIT ========= */

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

/* ========= ENV ========= */

const KOMGA_URL  = process.env.KOMGA_URL;
const KOMGA_USER = process.env.KOMGA_USER;
const KOMGA_PASS = process.env.KOMGA_PASS;

function authHeader() {
  return "Basic " + Buffer
    .from(`${KOMGA_USER}:${KOMGA_PASS}`)
    .toString("base64");
}

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* ========= SIGNUP ========= */

app.post("/signup", signupLimiter, async (req, res) => {

  const { email, password, website } = req.body;

  if (website) return res.status(400).send("Bot rejected");
  if (!email || !password) return res.status(400).send("Missing fields");
  if (!validEmail(email)) return res.status(400).send("Invalid email");
  if (password.length < 6) return res.status(400).send("Password too short");

  try {

    /* check existing users */

    const check = await fetch(`${KOMGA_URL}/api/v2/users`, {
      headers: { Authorization: authHeader() }
    });

    if (!check.ok) {
      console.error("Auth failed status:", check.status);
      return res.status(500).send("Komga auth failed");
    }

    const users = await check.json();

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return res.status(400).send("Account already exists");

    /* create */

    const create = await fetch(`${KOMGA_URL}/api/v2/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: authHeader()
      },
      body: JSON.stringify({
        email: email,
        password: password,
        roles: ["ROLE_USER"]
      })
    });

    if (!create.ok) {
      const t = await create.text();
      console.error("Create failed:", t);
      return res.status(400).send(t);
    }

    res.send("Account created");

  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

/* ========= HEALTH ========= */

app.get("/", (_,res)=>res.send("Signup API running"));

/* ========= START ========= */

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
