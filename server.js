const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.post("/generate-roadmap", async (req, res) => {
  console.log("POST RECEIVED");

  try {
    const result = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "gemma4:12b",
      prompt: "Say hello.",
      stream: false,
    });

    console.log("OLLAMA REPLIED");

    res.json(result.data);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Listening on 3000");
});
