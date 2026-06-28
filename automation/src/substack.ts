import fetch from "node-fetch";

interface DraftPayload {
  title: string;
  subtitle: string;
  body_html: string;
}

interface SubstackDraft {
  id: number;
  title: string;
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
    const body = {
      draft_title: payload.title,
      draft_subtitle: payload.subtitle,
      draft_body: payload.body_html,
      draft_section_id: null,
      audience: "everyone",
      draft_podcast_url: "",
      draft_podcast_duration: null,
      draft_podcast_preview_upload_id: null,
      draft_video_upload_id: null,
      draft_podcast_upload_id: null,
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

  async createAndPublish(payload: DraftPayload): Promise<{ draftId: number; title: string }> {
    console.log(`[substack] Creating draft: "${payload.title}"`);
    const draft = await this.createDraft(payload);
    console.log(`[substack] Draft created with id=${draft.id}`);

    console.log(`[substack] Publishing draft ${draft.id}...`);
    await this.publishDraft(draft.id);
    console.log(`[substack] Published successfully.`);

    return { draftId: draft.id, title: payload.title };
  }
}
