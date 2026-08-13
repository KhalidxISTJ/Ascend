const express = require("express");
const cors = require("cors");

const { askAI } = require("./services/ai");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.send("Ascend AI Server Running!");
});

// ==========================================
// AI API — STREAMING
// ==========================================

app.post("/api/ai", async (req, res) => {
  try {
    console.log("AI REQUEST:");
    console.log("Prompt:", req.body.prompt);
    console.log("Mode:", req.body.mode);

    // ==========================================
    // STREAM HEADERS
    // ==========================================

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send headers immediately
    res.flushHeaders();

    // ==========================================
    // AI STREAM
    // ==========================================

    await askAI(req.body, (chunk) => {
      if (!chunk) return;

      console.log("STREAM CHUNK:", JSON.stringify(chunk));

      res.write(
        `data: ${JSON.stringify({
          type: "chunk",
          content: chunk,
        })}\n\n`,
      );

      // Force Node to send it immediately
      if (typeof res.flush === "function") {
        res.flush();
      }
    });

    // ==========================================
    // COMPLETE
    // ==========================================

    res.write(
      `data: ${JSON.stringify({
        type: "done",
      })}\n\n`,
    );

    res.end();
  } catch (err) {
    console.error(err);

    // ==========================================
    // ERROR BEFORE STREAMING
    // ==========================================

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    // ==========================================
    // ERROR DURING STREAM
    // ==========================================

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: err.message,
      })}\n\n`,
    );

    res.end();
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(3000, () => {
  console.log("🚀 Ascend AI Server running on http://localhost:3000");
});
