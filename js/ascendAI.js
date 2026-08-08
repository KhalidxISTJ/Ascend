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

  const message = document.createElement("p");

  message.textContent = "Hello! How can I help?";

  conversation.appendChild(message);

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

  button.onclick = async () => {
    const prompt = input.value.trim();

    if (!prompt) return;

    addMessage(prompt, "user");

    input.value = "";

    const response = await fetch("http://localhost:3000/api/ai", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        prompt,
      }),
    });

    const data = await response.json();

    addMessage(data.response, "assistant");
  };
}
function addMessage(text, role) {
  const conversation = document.getElementById("aiConversation");

  const message = document.createElement("div");

  message.className = `message ${role}`;

  message.textContent = text;

  conversation.appendChild(message);

  conversation.scrollTop = conversation.scrollHeight;
}
