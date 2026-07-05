import Anthropic from "@anthropic-ai/sdk";
import { DailyNote } from "./notes";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratedArticle {
  title: string;
  subtitle: string;
  body: string;
  topic: string;
}

export async function generateArticle(notes: DailyNote[]): Promise<GeneratedArticle> {
  const noteSummary = notes
    .map((n) => `- ${n.date} | ${n.theme}: ${n.insight}`)
    .join("\n");

  const primaryTheme = notes[notes.length - 1]?.theme ?? "retail floor leadership";

  const systemPrompt = `You are the author of The Floor Report, a weekly newsletter for retail store managers and floor leaders. Your voice is direct, warm, and peer-to-peer — like a great manager sharing a lesson with another manager. No corporate speak, no B2B jargon. You write tight: every sentence earns its place. Target length is 500–580 words.`;

  const userPrompt = `Write this week's issue of The Floor Report newsletter. You've been collecting these daily notes and insights all week:

${noteSummary}

Use these notes as raw material. Weave the best ideas into a cohesive, focused newsletter on the theme of "${primaryTheme}". Don't list the notes mechanically — synthesize them into a single, flowing piece with your own voice.

Structure:
- One opening paragraph that hooks the reader with a real scenario from the floor (2–3 sentences)
- 2 short sections with <h2> headers covering the core insight and how to apply it
- A closing paragraph with one concrete thing to try this week

Requirements:
- Title: punchy, 5 words or fewer, not generic
- Subtitle: one sentence that makes the manager feel seen
- Total body: 500–580 words
- Tone: direct, peer-to-peer, grounded in real store life
- Format with <h2> headers, <p> paragraphs, <ul>/<li> for lists, <strong> for emphasis
- Do NOT include the title or subtitle in the body HTML

Respond with valid JSON in this exact shape:
{
  "title": "...",
  "subtitle": "...",
  "body": "<p>...</p><h2>...</h2>..."
}`;

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1500,
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
    topic: primaryTheme,
  };
}
