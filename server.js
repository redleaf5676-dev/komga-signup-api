import express from "express";

const app = express();
app.use(express.json());

/* ===== ENV CONFIG ===== */

const KOMGA_URL = process.env.KOMGA_URL;
const KOMGA_USER = process.env.KOMGA_USER;
const KOMGA_PASS = process.env.KOMGA_PASS;

/* ===== SIGNUP ENDPOINT ===== */

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Missing fields");
  }

  if (password.length < 6) {
    return res.status(400).send("Password too short");
  }

  try {
    const r = await fetch(`${KOMGA_URL}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization":
          "Basic " + Buffer.from(KOMGA_USER + ":" + KOMGA_PASS).toString("base64")
      },
      body: JSON.stringify({
        email: username,
        password: password,
        roles: ["ROLE_USER"]
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(400).send(t);
    }

    res.send("Account created");

  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

/* ===== HEALTH CHECK ===== */

app.get("/", (req,res)=>res.send("Signup API running"));

/* ===== START ===== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
