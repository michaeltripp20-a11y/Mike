import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPICS = [
  "pipeline management and forecasting accuracy",
  "sales coaching techniques that actually move the needle",
  "how to run effective one-on-ones with reps",
  "building a repeatable sales process",
  "quota setting and territory design",
  "managing underperformers without destroying morale",
  "hiring and onboarding top sales talent",
  "sales metrics that matter vs. vanity metrics",
  "transitioning from individual contributor to sales manager",
  "how to build a culture of accountability on your team",
  "navigating deals stuck in late-stage limbo",
  "using CRM data to coach instead of just track",
  "handling pushback on pricing without discounting",
  "motivating a team through a tough quarter",
  "the difference between managing and leading a sales team",
  "how top sales managers run their weekly forecasting calls",
  "building a strong bench: developing future sales leaders",
  "cross-functional alignment: sales and marketing partnership",
  "how to retain your best reps in a competitive market",
  "structuring comp plans that drive the right behaviors",
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

  const systemPrompt = `You are an expert sales management coach and thought leader writing for The Floor Report, a Substack publication for frontline sales managers and revenue leaders. Your writing is direct, practical, and based on real-world experience. You avoid corporate buzzwords and write like you're sharing hard-won lessons with a peer. Your articles are long-form (1200–1800 words), structured with clear headers, include specific examples or frameworks, and always end with actionable takeaways. Format the article in Substack-compatible HTML using <h2> for section headers, <p> for paragraphs, <ul>/<li> for lists, and <strong> for emphasis. Do not include the title or subtitle in the body HTML.`;

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
    max_tokens: 4096,
    thinking: { type: "enabled", budget_tokens: 2000 },
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
