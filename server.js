import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const KOMGA = process.env.KOMGA_URL;
const USER = process.env.KOMGA_USER;
const PASS = process.env.KOMGA_PASS;

app.post("/signup", async (req,res)=>{

  const { email, password } = req.body;

  try {

    await axios.post(
      `${KOMGA}/api/v2/users`,
      {
        email,
        password,
        roles: ["USER"],
        sharedAllLibraries: true,
        sharedLibrariesIds: [],
        labelsAllow: [],
        labelsExclude: [],
        ageRestriction: null
      },
      {
        auth: { username: USER, password: PASS }
      }
    );

    res.send("Account created");

  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(e.response?.status || 500)
       .send(e.response?.data || "Komga error");
  }
});

app.get("/", (req,res)=>res.send("Signup API running"));

app.listen(process.env.PORT || 3000);
