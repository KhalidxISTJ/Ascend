const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { askAI } = require("./services/ai");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Ascend AI Server Running!");
});

app.post("/api/ai", async (req, res) => {
  try {
    const response = await askAI(req.body);

    res.json({
      success: true,
      response,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Ascend AI Server running on http://localhost:3000");
});
