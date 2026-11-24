// The feature log shown by the version badge ("What's new").
// To add an update: copy the top entry, paste it ABOVE it, and change the text.
// Keep the newest entry first. A section's `title` is optional (leave it out for a plain list).
const ASCEND_VERSION = {
  version: "1.0.0",
  stage: "Alpha",

  updates: [
    {
      version: "1.1.0 Alpha",
      date: "2026-11-24",
      summary: "Quests page overhaul, reminders you can control, and new Codex review settings.",
      sections: [
        {
          title: "Quests",
          items: [
            "Sort by Adaptive (next review soonest). Category, Difficulty and Date Created sorting now really work.",
            "Hold a section tab, then drag it left or right to reorder.",
            "Manage sections (gear button): add, rename, reorder and delete. Quests are never deleted with a section.",
            "Deleting a quest now asks you to confirm.",
            "One tap adds all the Juz Amma review quests (Manage sections > Tools).",
            "New Must do option: add a small first action and a time window to a quest. Alerts for it are coming soon.",
          ],
        },
        {
          title: "Ongoing",
          items: [
            "Tap Ongoing on the Current Quest card when you start. That quest sends no reminders today.",
            "A green Ongoing badge shows on the quest while it is on.",
          ],
        },
        {
          title: "Notifications",
          items: [
            "Anytime quest summary at 12 PM, 5 PM and 9 PM (times are editable in Settings). Quiet hours still apply.",
          ],
        },
        {
          title: "Codex",
          items: [
            "New review settings screen before each review: order (shuffled or as created) and session size (15, 20, 30 or all cards).",
            "Optional timer: for the whole session, or per card. When the per-card time runs out, the answer shows and the card counts as Again.",
            "Review more reuses your saved settings.",
          ],
        },
        {
          title: "Fixed",
          items: ["Section tabs now refresh when your sections sync from another device."],
        },
      ],
    },
    {
      version: "1.0.0 Alpha",
      date: "2026-08-11",
      summary: "AI Roadmap Generator",
      sections: [
        {
          title: "AI roadmaps",
          items: [
            "Added AI-generated learning roadmaps.",
            "Generated roadmaps can be imported directly into the Skill Tree.",
            "Added structured roadmap JSON generation.",
            "Added roadmap persistence through localStorage.",
            "Improved the Skill Inspector and roadmap navigation.",
          ],
        },
        {
          title: "New",
          items: ["All Day bar on Calendar.", "Update panel (this screen)."],
        },
        {
          title: "Fixed",
          items: ["Completed one-time quests lingering forever."],
        },
      ],
    },
  ],
};