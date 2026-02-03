import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

/* ===== ENV ===== */

const KOMGA_URL = process.env.KOMGA_URL;
const KOMGA_USER = process.env.KOMGA_USER;
const KOMGA_PASS = process.env.KOMGA_PASS;

const auth = {
  username: KOMGA_USER,
  password: KOMGA_PASS
};

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* ===== SIGNUP ===== */

app.post("/signup", limiter, async (req, res) => {
  const { email, password, website } = req.body;

  if (website) return res.status(400).send("Bot rejected");
  if (!email || !password) return res.status(400).send("Missing fields");
  if (!validEmail(email)) return res.status(400).send("Invalid email");
  if (password.length < 6) return res.status(400).send("Password too short");

  try {

    /* check users */

    const list = await axios.get(
      `${KOMGA_URL}/api/v2/users`,
      { auth }
    );

    if (list.data.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return res.status(400).send("Account exists");

    /* create */

    await axios.post(
      `${KOMGA_URL}/api/v2/users`,
      {
        email,
        password,
        roles: ["USER"],
        sharedAllLibraries: true,
        sharedLibrariesIds: [],
        labelsAllow: [],
        labelsExclude: []
      },
      {
        auth,
        headers: { "Content-Type": "application/json" }
      }
    );

    res.send("Account created");

  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(e.response?.status || 500)
       .send(e.response?.data || "Server error");
  }
});

/* ===== HEALTH ===== */

app.get("/", (req,res)=>res.send("Signup API running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on", PORT));
