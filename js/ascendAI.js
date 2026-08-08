document.addEventListener("DOMContentLoaded", () => {});

function createAIDrawer() {
  const drawer = document.createElement("aside");

  drawer.className = "ai-drawer";

  drawer.appendChild(createAIHeader());
  drawer.appendChild(createAIConversation());
  drawer.appendChild(createAIInput());

  const toggle = document.createElement("button");

  toggle.className = "ai-toggle";

  toggle.textContent = "AI";

  toggle.onclick = () => {
    drawer.classList.toggle("open");
  };

  document.body.appendChild(toggle);
  document.body.appendChild(drawer);
  initializeAI();
}

function createAIHeader() {
  const header = document.createElement("header");

  header.className = "ai-drawer-header";

  const title = document.createElement("h2");

  title.textContent = "Ascend AI";

  header.appendChild(title);

  return header;
}

function createAIConversation() {
  const conversation = document.createElement("section");

  conversation.className = "ai-drawer-conversation";
  conversation.id = "aiConversation";

  const welcome = document.createElement("div");

  welcome.className = "ai-welcome";

  welcome.innerHTML = `
    <h3>👋 Welcome to Ascend AI</h3>
    <p>Ask me anything about your goals, roadmap, quests, or learning.</p>
`;

  conversation.appendChild(welcome);

  return conversation;
}

function createAIInput() {
  const footer = document.createElement("footer");

  footer.className = "ai-drawer-input";

  const input = document.createElement("input");

  input.type = "text";

  input.placeholder = "Ask Ascend AI...";

  const button = document.createElement("button");

  button.textContent = "Send";

  input.id = "aiInput";

  button.id = "sendAIMessage";

  footer.appendChild(input);
  footer.appendChild(button);

  return footer;
}
function initializeAI() {
  const input = document.getElementById("aiInput");
  const button = document.getElementById("sendAIMessage");
  function setLoading(loading) {
    input.disabled = loading;
    button.disabled = loading;

    button.textContent = loading ? "Thinking..." : "Send";
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      button.click();
    }
  });

  button.onclick = async () => {
    const prompt = input.value.trim();

    if (!prompt) return;

    addMessage(prompt, "user");

    input.value = "";
    addThinkingMessage();
    setLoading(true);
    addThinkingMessage();

    try {
      console.log("Sending request...");

      const response = await fetch("http://localhost:3000/api/ai", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      console.log("Response:", data);

      removeThinkingMessage();

      setLoading(false);

      input.focus();

      if (data.success) {
        addMessage(data.response, "assistant");
      } else {
        addMessage(data.error || "Something went wrong.", "assistant");
      }
    } catch (err) {
      console.error(err);

      removeThinkingMessage();

      setLoading(false);

      addMessage("Something went wrong.", "assistant");

      input.focus();
    }
  };
}
function addMessage(text, role) {
  const conversation = document.getElementById("aiConversation");

  const welcome = conversation.querySelector(".ai-welcome");

  if (welcome) {
    welcome.remove();
  }

  const message = document.createElement("div");

  message.className = `message ${role}`;

  message.textContent = text;

  conversation.appendChild(message);

  conversation.scrollTop = conversation.scrollHeight;
}
function addThinkingMessage() {
  // Remove any old thinking message first
  removeThinkingMessage();

  const conversation = document.getElementById("aiConversation");

  const message = document.createElement("div");

  message.className = "message assistant";
  message.id = "thinkingMessage";

  message.textContent = "Thinking...";

  conversation.appendChild(message);

  conversation.scrollTop = conversation.scrollHeight;
}
function removeThinkingMessage() {
  const thinking = document.getElementById("thinkingMessage");

  if (thinking) {
    thinking.remove();
  }
}
