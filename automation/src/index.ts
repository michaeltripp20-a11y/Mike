import "dotenv/config";
import cron from "node-cron";
import { generateArticle } from "./generate";
import { generateDailyNote, loadNotes, clearNotes } from "./notes";
import { SubstackClient } from "./substack";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUBSTACK_SESSION_COOKIE = process.env.SUBSTACK_SESSION_COOKIE;
const SUBSTACK_PUBLICATION = process.env.SUBSTACK_PUBLICATION ?? "thefloorreport";

if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY in environment");
if (!SUBSTACK_SESSION_COOKIE) throw new Error("Missing SUBSTACK_SESSION_COOKIE in environment");

const substack = new SubstackClient(SUBSTACK_PUBLICATION, SUBSTACK_SESSION_COOKIE);

// Daily at 9:00 AM ET — publish a note to Substack
cron.schedule("0 9 * * *", async () => {
  const now = new Date().toISOString();
  console.log(`\n[${now}] Generating and publishing daily note...`);
  try {
    const note = await generateDailyNote();
    await substack.createAndPublish({
      title: note.theme.charAt(0).toUpperCase() + note.theme.slice(1),
      subtitle: "A quick insight from the floor.",
      body_html: note.insight,
    });
    console.log(`[done] Daily note published: "${note.theme}"`);
  } catch (err) {
    console.error("[error] Daily note failed:", err);
  }
}, { timezone: "America/New_York" });

// Every Friday at 9:00 AM ET — publish the weekly newsletter
cron.schedule("0 9 * * 5", async () => {
  const now = new Date().toISOString();
  console.log(`\n[${now}] Starting weekly post...`);
  try {
    const notes = loadNotes();
    if (notes.length === 0) {
      console.log("[weekly] No notes collected yet — generating one now...");
      await generateDailyNote();
    }
    const freshNotes = loadNotes();
    console.log(`[weekly] Publishing from ${freshNotes.length} notes...`);
    const article = await generateArticle(freshNotes);
    console.log(`[weekly] Article: "${article.title}"`);

    await substack.createAndPublish({
      title: article.title,
      subtitle: article.subtitle,
      body_html: article.body,
    });

    clearNotes();
    console.log("[weekly] Published and notes cleared.");
  } catch (err) {
    console.error("[error] Weekly post failed:", err);
  }
}, { timezone: "America/New_York" });

console.log("The Floor Report automation running.");
console.log("  - Daily note: every day at 9:00 AM ET");
console.log("  - Weekly newsletter: every Friday at 9:00 AM ET");
console.log(`  - Publication: ${SUBSTACK_PUBLICATION}.substack.com`);
