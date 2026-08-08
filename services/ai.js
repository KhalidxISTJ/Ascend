const ollama = require("ollama").default;

async function askAI(prompt) {
  const response = await ollama.chat({
    model: "llama3.2:3b",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.message.content;
}

module.exports = {
  askAI,
};
