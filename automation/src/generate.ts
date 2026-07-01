import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPICS = [
  "how to lead a retail team through a slow season without losing momentum",
  "the difference between a store manager and a store leader",
  "how to coach associates who don't think they need coaching",
  "building accountability on a retail floor without micromanaging",
  "how to run a pre-shift huddle that actually energizes your team",
  "developing your best part-timers into future leaders",
  "handling conflict between team members on the floor",
  "how to motivate a team when foot traffic is down",
  "the hardest part of moving from associate to manager",
  "setting performance expectations that stick",
  "how great retail leaders handle a bad mystery shop",
  "leading through turnover without burning out your core team",
  "how to give feedback that changes behavior, not just feelings",
  "building a culture of ownership when most of your team is hourly",
  "the daily habits of highly effective floor leaders",
  "how to identify and grow your next assistant manager",
  "managing up: how to influence decisions your DM makes about your store",
  "why your best employee might be your worst promotion",
  "how to run a team meeting when nobody wants to be there",
  "recovering team morale after a tough holiday season",
  "leading a multigenerational team on the retail floor",
  "how to stay calm and lead well during a difficult customer situation",
  "the real reason your top performers leave — and how to keep them",
  "how to onboard a new hire so they actually stay past 90 days",
  "scheduling strategies that balance business needs and team loyalty",
];

function pickTopic(usedRecently: string[]): string {
  const available = TOPICS.filter((t) => !usedRecently.includes(t));
  const pool = available.length > 0 ? available : TOPICS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface GeneratedArticle {
  title: string;
  subtitle: string;
  body: string;
  topic: string;
}

export async function generateArticle(usedTopics: string[] = []): Promise<GeneratedArticle> {
  const topic = pickTopic(usedTopics);

  const systemPrompt = `You are an expert retail leadership coach writing for The Floor Report, a Substack newsletter for frontline retail managers and store leaders. Your writing is direct, practical, and grounded in the realities of leading hourly teams on the sales floor — scheduling pressure, high turnover, district manager expectations, and the daily grind of running a store. You write like a seasoned store manager sharing hard-won lessons with a peer. No corporate buzzwords. No B2B jargon. Your articles are concise (600–750 words), structured with 2–3 clear sections using headers, include one specific example or framework, and end with 3 punchy bullet takeaways. Format the article in Substack-compatible HTML using <h2> for section headers, <p> for paragraphs, <ul>/<li> for lists, and <strong> for emphasis. Do not include the title or subtitle in the body HTML.`;

  const userPrompt = `Write a long-form article about: "${topic}".

Requirements:
- Title: punchy, specific, not generic (avoid "The Ultimate Guide to...")
- Subtitle: one sentence that teases the core insight
- Body: 1200–1800 words, structured with 4–6 sections using <h2> headers
- Include at least one concrete framework, model, or step-by-step process
- Use a specific real-world scenario or example to illustrate the main point
- End with a "Key Takeaways" section using a bullet list
- Tone: direct, practical, peer-to-peer — like a seasoned manager sharing what actually works

Respond with valid JSON in this exact shape:
{
  "title": "...",
  "subtitle": "...",
  "body": "<h2>...</h2><p>...</p>..."
}`;

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 2048,
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
    topic,
  };
}
