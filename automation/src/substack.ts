import fetch from "node-fetch";

interface DraftPayload {
  title: string;
  subtitle: string;
  body_html: string;
  type?: "newsletter" | "note";
}

interface SubstackDraft {
  id: number;
  title: string;
}

// Convert simple HTML to Substack's ProseMirror JSON format
function htmlToSubstackDoc(html: string): object {
  const content: object[] = [];

  // Split on block-level tags
  const blockRegex = /<(h2|p|ul)([\s\S]*?)(?:<\/\1>)/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[0].replace(/<\/?[^>]+>/g, "").trim();

    if (tag === "h2") {
      content.push({
        type: "heading",
        attrs: { level: 2, id: null, class: null },
        content: [{ type: "text", text: inner }],
      });
    } else if (tag === "p") {
      const parsed = parseInline(match[0]);
      if (parsed.length > 0) {
        content.push({ type: "paragraph", content: parsed });
      }
    } else if (tag === "ul") {
      const items: object[] = [];
      const liRegex = /<li>([\s\S]*?)<\/li>/gi;
      let li: RegExpExecArray | null;
      while ((li = liRegex.exec(match[0])) !== null) {
        const liContent = parseInline(li[1]);
        items.push({
          type: "list_item",
          content: [{ type: "paragraph", content: liContent }],
        });
      }
      if (items.length > 0) {
        content.push({ type: "bullet_list", content: items });
      }
    }
  }

  if (content.length === 0) {
    // Fallback: treat entire html as a single paragraph
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: html.replace(/<[^>]+>/g, "") }],
    });
  }

  return { type: "doc", content };
}

function parseInline(html: string): object[] {
  const nodes: object[] = [];
  // Strip outer block tag
  const inner = html.replace(/^<[^>]+>|<\/[^>]+>$/g, "");
  // Replace <br/> and <br /> with a placeholder
  const withBreaks = inner.replace(/<br\s*\/?>/gi, "\n");
  // Tokenize bold and italic inline tags
  const tokenRegex = /<(strong|em)>([\s\S]*?)<\/\1>|([^<]+)/g;
  let m: RegExpExecArray | null;

  while ((m = tokenRegex.exec(withBreaks)) !== null) {
    if (m[1] === "strong" && m[2]) {
      const text = m[2].replace(/<[^>]+>/g, "");
      if (text) nodes.push({ type: "text", marks: [{ type: "strong" }], text });
    } else if (m[1] === "em" && m[2]) {
      const text = m[2].replace(/<[^>]+>/g, "");
      if (text) nodes.push({ type: "text", marks: [{ type: "em" }], text });
    } else if (m[3]) {
      // Plain text — split on line breaks and insert hard_break nodes
      const parts = m[3].split("\n");
      parts.forEach((part, i) => {
        if (part) nodes.push({ type: "text", text: part });
        if (i < parts.length - 1) nodes.push({ type: "hard_break" });
      });
    }
  }

  return nodes;
}

export class SubstackClient {
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(publication: string, sessionCookie: string) {
    this.baseUrl = `https://${publication}.substack.com`;
    this.cookie = `connect.sid=${sessionCookie}`;
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      Cookie: this.cookie,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: this.baseUrl,
      Origin: this.baseUrl,
    };
  }

  async createDraft(payload: DraftPayload): Promise<SubstackDraft> {
    const isNote = payload.type === "note";
    const doc = htmlToSubstackDoc(payload.body_html);

    const body = {
      draft_title: isNote ? null : payload.title,
      draft_subtitle: isNote ? null : payload.subtitle,
      draft_body: JSON.stringify(doc),
      draft_section_id: null,
      audience: "everyone",
      draft_bylines: [],
      draft_podcast_url: "",
      draft_podcast_duration: null,
      draft_podcast_preview_upload_id: null,
      draft_video_upload_id: null,
      draft_podcast_upload_id: null,
      ...(isNote ? { type: "feed" } : {}),
    };

    const res = await fetch(`${this.baseUrl}/api/v1/drafts`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create draft: ${res.status} ${res.statusText}\n${text}`);
    }

    return res.json() as Promise<SubstackDraft>;
  }

  async publishDraft(draftId: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/drafts/${draftId}/publish`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        send_email: true,
        share_automatically: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to publish draft ${draftId}: ${res.status} ${res.statusText}\n${text}`);
    }
  }

  async publishNote(body_html: string): Promise<void> {
    const doc = htmlToSubstackDoc(body_html);
    const res = await fetch(`https://substack.com/api/v1/comment/feed`, {
      method: "POST",
      headers: {
        ...this.headers(),
        Origin: "https://substack.com",
        Referer: "https://substack.com",
      },
      body: JSON.stringify({
        body: JSON.stringify(doc),
        type: "publication",
        publication_id: null,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to publish note: ${res.status} ${res.statusText}\n${text}`);
    }
    console.log(`[substack] Note published.`);
  }

  async createAndPublish(payload: DraftPayload): Promise<{ draftId: number; title: string }> {
    if (payload.type === "note") {
      await this.publishNote(payload.body_html);
      return { draftId: 0, title: "" };
    }

    console.log(`[substack] Creating draft: "${payload.title}"`);
    const draft = await this.createDraft(payload);
    console.log(`[substack] Draft created with id=${draft.id}`);

    console.log(`[substack] Publishing draft ${draft.id}...`);
    await this.publishDraft(draft.id);
    console.log(`[substack] Published successfully.`);

    return { draftId: draft.id, title: payload.title };
  }
}
