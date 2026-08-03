async function test() {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma4:12b",
        prompt: "Say hello in one sentence.",
        stream: false,
      }),
    });

    const data = await response.json();

    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

test();
