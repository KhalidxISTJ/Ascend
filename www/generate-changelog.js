const { execSync } = require("child_process");
const fs = require("fs");
const axios = require("axios");

async function generateChangelog() {
  try {
    console.log("🔍 Checking latest Git changes...");

    const diff = execSync("git diff --unified=0 HEAD~1 HEAD", {
      encoding: "utf8",
    });

    if (!diff.trim()) {
      console.log("⚠️ No changes found.");
      return;
    }

    const limitedDiff = diff.slice(0, 8000);

    if (!diff.trim()) {
      console.log("⚠️ No changes found.");
      return;
    }

    // Prevent sending an enormous diff to the model.

    console.log(`📦 Sending ${limitedDiff.length} characters to Ollama...`);

    console.log("🧠 Asking Ollama to summarize the changes...");

    const response = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: "llama3.2:3b",

        format: "json",

        stream: false,

        options: {
          num_predict: 300,
        },

        messages: [
          {
            role: "system",
            content: `
You generate release notes for the Ascend application.

Analyze the Git diff provided by the user.

Return ONLY valid JSON using this exact structure:

{
  "title": "Short title describing the main update",
  "changes": [
    "Meaningful user-facing change",
    "Another meaningful user-facing change"
  ]
}

Rules:

- Describe actual changes found in the diff.
- Focus on user-facing features and improvements.
- Ignore formatting-only changes.
- Ignore debugging console logs.
- Ignore temporary development code.
- Do not mention Git.
- Do not invent features.
- Do not exaggerate changes.
- Keep each change concise.
- Return between 2 and 8 changes.
`,
          },

          {
            role: "user",
            content: `
Here is the Git diff from the latest Ascend commit:

${limitedDiff}
`,
          },
        ],
      },
      {
        timeout: 120000,
      },
    );

    const rawResponse = response.data.message.content;

    console.log("✅ Ollama responded.");

    const update = JSON.parse(rawResponse);

    console.log("\nGenerated update:\n");

    console.log(`Title: ${update.title}`);

    update.changes.forEach((change) => {
      console.log(`• ${change}`);
    });

    // ==========================================
    // UPDATE VERSION FILE
    // ==========================================

    const versionPath = "./js/version.js";

    if (!fs.existsSync(versionPath)) {
      throw new Error("js/version.js was not found.");
    }

    const versionFile = fs.readFileSync(versionPath, "utf8");

    const today = new Date().toISOString().split("T")[0];

    const newUpdate = {
      version: "1.0.0 Alpha",
      date: today,
      title: update.title,
      changes: update.changes,
    };

    const updateText = JSON.stringify(newUpdate, null, 2);

    const updatesStart = versionFile.indexOf("updates: [");

    if (updatesStart === -1) {
      throw new Error("Could not find updates array in version.js.");
    }

    const insertPosition = updatesStart + "updates: [".length;

    const formattedUpdate = `
    ${updateText.replace(/^/gm, "      ")},
`;

    const updatedVersionFile =
      versionFile.slice(0, insertPosition) +
      formattedUpdate +
      versionFile.slice(insertPosition);

    fs.writeFileSync(versionPath, updatedVersionFile);

    console.log("\n✅ version.js updated successfully.");
  } catch (error) {
    console.error("\n❌ Failed to generate changelog.");

    if (error.response) {
      console.error("Ollama error:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

generateChangelog();
