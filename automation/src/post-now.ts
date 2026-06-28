/**
 * One-shot script to immediately generate and publish an article.
 * Usage: npm run post-now
 */
import "dotenv/config";
import { generateArticle } from "./generate";
import { SubstackClient } from "./substack";

const SUBSTACK_SESSION_COOKIE = process.env.SUBSTACK_SESSION_COOKIE;
const SUBSTACK_PUBLICATION = process.env.SUBSTACK_PUBLICATION ?? "thefloorreport";

if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");
if (!SUBSTACK_SESSION_COOKIE) throw new Error("Missing SUBSTACK_SESSION_COOKIE");

const substack = new SubstackClient(SUBSTACK_PUBLICATION, SUBSTACK_SESSION_COOKIE);

(async () => {
  console.log("Generating article...");
  const article = await generateArticle();
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
