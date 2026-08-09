const ollama = require("ollama").default;

const statsPrompt = require("./prompts/stats");

async function askAI(data) {
  const { prompt, context } = data;

  const page = context?.page || "unknown";

  let systemPrompt = `
You are Ascend AI, the personal AI assistant inside Ascend.

The user is currently on the ${page} page.

Be helpful, practical, and concise.
`;

  if (page === "stats") {
    systemPrompt = statsPrompt;
  }

  const response = await ollama.chat({
    model: "llama3.2:3b",

    messages: [
      {
        role: "system",
        content: `
        ${systemPrompt}

        CURRENT ASCEND CONTEXT:
        ${JSON.stringify(context, null, 2)}

        Use the provided context as the source of truth for the current state of Ascend.

        Do not invent values or features that are not present in the context.
        If the context does not contain the information needed to answer, say that you do not have that information.
        `,
      },
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
