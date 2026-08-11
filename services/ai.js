const ollama = require("ollama").default;

const statsPrompt = require("./prompts/stats");

async function askAI(data) {
  const { prompt, context, mode } = data;

  const page = context?.page || "unknown";
  // ==========================================
  // ROADMAP GENERATOR
  // ==========================================

  if (mode === "roadmap") {
    const roadmapPrompt = `
You are the Ascend Roadmap Generator.

Create a structured learning roadmap for the user's requested topic.

USER REQUEST:
${prompt}

Return ONLY a JSON object.

The JSON must follow this structure:

{
  "name": "Topic Name",
  "description": "A concise description of the roadmap.",
  "difficulty": "Medium",
  "estimatedHours": 20,
  "children": [
    {
      "name": "Skill Name",
      "description": "What this skill teaches.",
      "difficulty": "Easy",
      "estimatedHours": 5,
      "children": []
    }
  ]
}

Rules:

- The root name represents the overall topic.
- Create a logical progression from beginner to advanced.
- Each child represents a meaningful skill.
- Use nested children for important sub-skills.
- Put skills in prerequisite order.
- difficulty must be "Easy", "Medium", "Hard", or "Extreme".
- estimatedHours must be a number.
- children must always be an array.
- Every skill must have name, description, difficulty, estimatedHours, and children.
- Create approximately 4-8 major skills at each level when appropriate.
- Do not create XP, quests, levels, or progression fields.
- Do not write explanations outside the JSON.
`;

    const response = await ollama.chat({
      model: "llama3.2:3b",

      format: "json",

      messages: [
        {
          role: "system",
          content: roadmapPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.message.content;
  }
  let systemPrompt = `
You are Ascend AI, the personal AI assistant inside Ascend.

The user is currently on the ${page} page.

Be helpful, practical, accurate, and concise.
`;

  if (page === "stats") {
    systemPrompt = statsPrompt;
  }

  const liveContextRules = `
LIVE ASCEND CONTEXT RULES

The CURRENT ASCEND CONTEXT supplied below is the source of truth for the current state of Ascend.

GENERAL RULES:
- Use the supplied context before relying on assumptions or general knowledge.
- Do not invent values, features, quests, skills, stats, or other Ascend data.
- Do not claim something exists in Ascend unless it is present in the supplied context or explicitly known from the system instructions.
- If the context does not contain enough information to answer a question about the current state of Ascend, say that the information is not available.
- Do not replace missing data with guesses.

QUEST RULES:
- "quests.all" contains the quests supplied by the quest system.
- "quests.today" contains the quests supplied by getTodaysQuests().
- "quests.backlog" contains the quests supplied by getBacklogQuests().
- "quests.upcoming" contains the quests supplied by getUpcomingQuests().
- "quests.currentMission" contains the quest supplied by getCurrentMission().
- "quests.stats" contains the quest statistics supplied by the quest system.
- "quests.todayProgress" contains the supplied progress data.
- When listing today's quests, describe them as quests returned by the current Ascend quest data.
- Do not describe today's quests as "scheduled daily quests" unless the recurring field explicitly supports that description.
- Do not add explanations about why a quest appears in today's list unless the supplied data supports the explanation.

QUEST DATA INTEGRITY:
- Only use fields that are explicitly present in the supplied quest data.
- Do not invent statuses such as skipped, failed, abandoned, missed, or postponed.
- If a quest status is not represented by a supplied field, do not claim that status.
- Do not infer a "skipped" status from a quest being absent, recurring, overdue, or incomplete.

When discussing quests:
- Treat the supplied quest lists as authoritative.
- Do not move a quest between today, backlog, upcoming, or all.
- Do not assume a quest belongs to a different list.
- A quest is completed only when its supplied "completed" value is true.
- A quest is incomplete only when its supplied "completed" value is false.
- Do not infer completion status from recurring status.
- Do not say a quest is completed if the supplied data says it is incomplete.
- Do not say a quest is incomplete if the supplied data says it is completed.
- Do not claim a quest is in the backlog unless it appears in quests.backlog.
- Do not claim a quest is today's quest unless it appears in quests.today.
- Do not claim a quest is upcoming unless it appears in quests.upcoming.
- When asked for the current mission, use quests.currentMission rather than choosing a different quest yourself.
- Preserve the quest's supplied name, difficulty, priority, section, recurring status, date, and time.

XP RULES:
- Use the supplied player.currentXP as the player's current XP.
- Use the supplied player.xpRequired as the XP required for the current level.
- Use the supplied player.xpRemaining as the XP remaining to reach the next level.
- Do not invent an XP requirement or calculate a different XP system when these values are available.
- Do not assume the XP requirement is always 100.
- If asked how much XP remains, use player.xpRemaining.
- If asked how much XP the player currently has, use player.currentXP.
- If asked how much XP is required for the current level, use player.xpRequired.

PAGE RULES:
- Use the supplied page value to identify the current Ascend page.
- Do not claim the user is on another page.
- If page is "unknown", say that the current page is not available rather than guessing.

ACCURACY RULE:
When the supplied context and your assumptions conflict, trust the supplied context.

DO NOT:
- Hallucinate missing Ascend data.
- Create facts to make an answer sound more complete.
- Contradict the supplied live context.
- Present assumptions as facts.
`;

  const response = await ollama.chat({
    model: "llama3.2:3b",
    format: "json",

    messages: [
      {
        role: "system",
        content: `
${systemPrompt}

${liveContextRules}

CURRENT ASCEND CONTEXT:
${JSON.stringify(context, null, 2)}
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
