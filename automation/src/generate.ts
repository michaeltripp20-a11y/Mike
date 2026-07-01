import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const THEMES = [
  "coaching and developing your team",
  "building accountability without micromanaging",
  "leading through high turnover",
  "running effective pre-shift huddles",
  "giving feedback that actually changes behavior",
  "identifying and growing future leaders",
  "managing up to your district manager",
  "keeping morale high during slow seasons",
  "onboarding new hires so they stick around",
  "staying calm under pressure on the floor",
  "building a culture of ownership with hourly workers",
  "scheduling that balances the business and your team",
  "handling conflict between team members",
  "transitioning from associate to manager",
  "motivating a team when foot traffic is down",
  "retaining your best people in a competitive market",
  "running team meetings people actually want to attend",
  "recovering after a bad mystery shop or audit",
  "setting expectations that stick",
  "leading a multigenerational team",
];

function pickTheme(usedRecently: string[]): string {
  const available = THEMES.filter((t) => !usedRecently.includes(t));
  const pool = available.length > 0 ? available : THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface GeneratedArticle {
  title: string;
  subtitle: string;
  body: string;
  topic: string;
}

export async function generateArticle(usedTopics: string[] = []): Promise<GeneratedArticle> {
  const theme = pickTheme(usedTopics);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const systemPrompt = `You are the author of The Floor Report, a daily newsletter for retail store managers and floor leaders. Your voice is warm, direct, and peer-to-peer — like a great manager texting a tip to another manager. You follow the exact format of James Clear's 3-2-1 newsletter, adapted for retail leadership. Every issue has the same simple structure, no deviation. Keep total word count under 400 words.`;

  const userPrompt = `Write today's issue of The Floor Report newsletter. Today's theme: "${theme}".

Use EXACTLY this HTML structure — no extra sections, no deviations:

<p><em>The Floor Report — ${today}</em></p>

<h2>3 ideas for the floor</h2>
<p><strong>1.</strong> [A 2–3 sentence insight for retail leaders on this theme. Specific, practical, no fluff.]</p>
<p><strong>2.</strong> [A second distinct insight. Could be a mindset shift, a technique, or a hard truth.]</p>
<p><strong>3.</strong> [A third insight. Make it the most memorable of the three — something they'll think about on their next shift.]</p>

<h2>2 quotes worth repeating</h2>
<p><strong>"[Quote 1]"</strong><br/>— [Attribution]</p>
<p><strong>"[Quote 2]"</strong><br/>— [Attribution]</p>

<h2>1 question to sit with</h2>
<p>[A single, specific question tied to the theme that a retail leader can reflect on today. Make it personal and actionable — not abstract.]</p>

Rules:
- Use real, attributable quotes (not made up)
- Every idea must be grounded in the reality of running a retail floor, not corporate theory
- The question should feel like it came from a coach who knows your store
- Title: short and punchy (5 words or less), no "How To"
- Subtitle: one sentence, teases the theme

Respond with valid JSON in this exact shape:
{
  "title": "...",
  "subtitle": "...",
  "body": "..."
}`;

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: "adaptive" } as any,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { title: string; subtitle: string; body: string };

  return {
    title: parsed.title,
    subtitle: parsed.subtitle,
    body: parsed.body,
    topic: theme,
  };
}
