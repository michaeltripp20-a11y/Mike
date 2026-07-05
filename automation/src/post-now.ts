/**
 * One-shot script to immediately generate and publish the weekly newsletter.
 * Uses any saved notes, or generates a fresh one if none exist.
 * Usage: npm run post-now
 */
import "dotenv/config";
import { generateArticle } from "./generate";
import { generateDailyNote, loadNotes } from "./notes";
import { SubstackClient } from "./substack";

const SUBSTACK_SESSION_COOKIE = process.env.SUBSTACK_SESSION_COOKIE;
const SUBSTACK_PUBLICATION = process.env.SUBSTACK_PUBLICATION ?? "thefloorreport";

if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");
if (!SUBSTACK_SESSION_COOKIE) throw new Error("Missing SUBSTACK_SESSION_COOKIE");

const substack = new SubstackClient(SUBSTACK_PUBLICATION, SUBSTACK_SESSION_COOKIE);

(async () => {
  let notes = loadNotes();

  if (notes.length === 0) {
    console.log("No saved notes found — generating a fresh note...");
    await generateDailyNote();
    notes = loadNotes();
  }

  console.log(`Generating newsletter from ${notes.length} note(s)...`);
  const article = await generateArticle(notes);
  console.log(`Title: ${article.title}`);
  console.log(`Topic: ${article.topic}`);
  console.log(`Body length: ${article.body.length} chars`);

  await substack.createAndPublish({
    title: article.title,
    subtitle: article.subtitle,
    body_html: article.body,
  });

  console.log("Done.");
})();
