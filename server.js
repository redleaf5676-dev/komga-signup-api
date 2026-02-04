import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Komga server details from ENV
const KOMGA_URL = process.env.KOMGA_URL;
const ADMIN_EMAIL = process.env.KOMGA_USER;
const ADMIN_PASSWORD = process.env.KOMGA_PASS;

app.post("/signup", async (req, res) => {

  const { email, password } = req.body;

  try {

    const response = await axios.post(
      `${KOMGA_URL}/api/v1/users`,
      {
        email: email,
        password: password,
        roles: ['USER']   // unchanged as you requested
      },
      {
        auth: {
          username: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        }
      }
    );

    res.send("User created");

  } catch (error) {
    console.error(
      'Error creating user:',
      error.response ? error.response.data : error.message
    );

    res.status(500).send(
      error.response ? error.response.data : error.message
    );
  }
});

app.get("/", (req,res)=>res.send("Signup API running"));

app.listen(process.env.PORT || 3000);
