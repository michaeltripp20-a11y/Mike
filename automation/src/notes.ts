import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NOTES_FILE = path.join(__dirname, "../data/weekly-notes.json");

export interface DailyNote {
  date: string;
  theme: string;
  insight: string;
}

export function loadNotes(): DailyNote[] {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      return JSON.parse(fs.readFileSync(NOTES_FILE, "utf-8")) as DailyNote[];
    }
  } catch {}
  return [];
}

export function saveNotes(notes: DailyNote[]): void {
  const dir = path.dirname(NOTES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

export function clearNotes(): void {
  saveNotes([]);
}

const THEMES = [
  "coaching associates who resist feedback",
  "building accountability without micromanaging",
  "leading through high turnover",
  "running pre-shift huddles that energize",
  "giving feedback that changes behavior",
  "identifying and growing future leaders",
  "managing up to your district manager",
  "keeping morale high during slow seasons",
  "onboarding new hires so they stay",
  "staying calm under pressure on the floor",
  "building ownership culture with hourly workers",
  "scheduling that balances business and team",
  "handling conflict between team members",
  "transitioning from associate to manager",
  "motivating a team when traffic is down",
  "retaining top performers in a competitive market",
  "running meetings people actually want to attend",
  "recovering after a bad mystery shop or audit",
  "setting expectations that stick",
  "leading a multigenerational team",
];

function pickTheme(usedRecently: string[]): string {
  const available = THEMES.filter((t) => !usedRecently.includes(t));
  const pool = available.length > 0 ? available : THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function generateDailyNote(): Promise<DailyNote> {
  const existing = loadNotes();
  const recentThemes = existing.slice(-7).map((n) => n.theme);
  const theme = pickTheme(recentThemes);

  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: "adaptive" } as any,
    messages: [
      {
        role: "user",
        content: `You write daily notes for retail store managers. Write a short, practical note on this topic: "${theme}".

Structure it as 3 short paragraphs:
1. Open with a specific scenario from the floor (2 sentences)
2. The core insight or lesson (2–3 sentences)
3. One concrete thing to try today (1–2 sentences)

Format using HTML: wrap each paragraph in <p> tags. Use <strong> for one key phrase per paragraph. No headers, no bullet lists — just 3 clean paragraphs. Tone: direct, peer-to-peer, like a seasoned manager texting a tip to another manager.`,
      },
    ],
  });

  const textBlock = res.content.find((b) => b.type === "text");
  const insight = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

  const note: DailyNote = {
    date: new Date().toISOString().split("T")[0],
    theme,
    insight,
  };

  const updated = [...existing, note];
  saveNotes(updated);

  console.log(`[notes] Saved daily note: "${theme}"`);
  return note;
}
