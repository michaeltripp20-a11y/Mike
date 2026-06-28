import "dotenv/config";
import cron from "node-cron";
import { generateArticle } from "./generate";
import { SubstackClient } from "./substack";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUBSTACK_SESSION_COOKIE = process.env.SUBSTACK_SESSION_COOKIE;
const SUBSTACK_PUBLICATION = process.env.SUBSTACK_PUBLICATION ?? "thefloorreport";

if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY in environment");
if (!SUBSTACK_SESSION_COOKIE) throw new Error("Missing SUBSTACK_SESSION_COOKIE in environment");

const substack = new SubstackClient(SUBSTACK_PUBLICATION, SUBSTACK_SESSION_COOKIE);

const recentTopics: string[] = [];

async function runPost(): Promise<void> {
  const now = new Date().toISOString();
  console.log(`\n[${now}] Starting post run...`);

  try {
    console.log("[generate] Generating article with Claude...");
    const article = await generateArticle(recentTopics);
    console.log(`[generate] Article ready: "${article.title}" (topic: ${article.topic})`);

    recentTopics.push(article.topic);
    if (recentTopics.length > 10) recentTopics.shift();

    await substack.createAndPublish({
      title: article.title,
      subtitle: article.subtitle,
      body_html: article.body,
    });

    console.log(`[done] Posted: "${article.title}"`);
  } catch (err) {
    console.error("[error] Post run failed:", err);
  }
}

// Tuesday at 9:00 AM
cron.schedule("0 9 * * 2", runPost, { timezone: "America/New_York" });

// Friday at 9:00 AM
cron.schedule("0 9 * * 5", runPost, { timezone: "America/New_York" });

console.log("Substack automation running. Posts scheduled for Tuesday and Friday at 9:00 AM ET.");
console.log(`Publication: ${SUBSTACK_PUBLICATION}.substack.com`);
