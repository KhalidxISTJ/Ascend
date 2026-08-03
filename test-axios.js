const axios = require("axios");

async function test() {
  console.log("Starting axios test...");

  try {
    const { data } = await axios.post(
      "http://127.0.0.1:11434/api/generate",
      {
        model: "gemma4:12b",
        prompt: "Say hello in one sentence.",
        stream: false,
      },
      {
        timeout: 300000,
      },
    );

    console.log("SUCCESS!");
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

test();
