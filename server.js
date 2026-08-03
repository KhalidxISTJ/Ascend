const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Ascend AI Server Running!");
});

app.post("/generate-roadmap", async (req, res) => {
  console.log("Received request:", req.body);

  try {
    console.log("Calling Ollama...");

    const { data } = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "qwen2.5:3b",
      prompt: `
You are creating a learning roadmap.

Topic: ${req.body.prompt}

Return ONLY valid JSON.

Example:
{
  "name": "CSS",
  "children": [
    {
      "name": "Selectors",
      "children": []
    },
    {
      "name": "Box Model",
      "children": []
    }
  ]
}

Do not explain anything.
Do not use markdown.
Only return JSON.
`,
      stream: false,
    });

    console.log("Ollama replied!");

    console.log("Success!");

    res.json({
      success: true,
      response: data.response,
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
