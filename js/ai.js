const ollama = require("ollama").default;

async function test() {
  try {
    console.log("Testing Ollama...");

    const response = await ollama.chat({
      model: "gemma4:12b",
      messages: [
        {
          role: "user",
          content: "Say hello in one sentence.",
        },
      ],
    });

    console.log("SUCCESS!");
    console.log(response);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}

test();
