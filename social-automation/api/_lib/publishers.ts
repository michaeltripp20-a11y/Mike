import type { Post } from '../../src/types'
import { publishLinkedIn } from './linkedin'
import { publish as publishTwitter } from '../../src/platforms/twitter'
import { publish as publishInstagram } from '../../src/platforms/instagram'
import { publish as publishTiktok } from '../../src/platforms/tiktok'
import { publish as publishFacebook } from '../../src/platforms/facebook'

export interface ServerPublishResult {
  ok: boolean
  error?: string
}

// Server-side publish dispatch used by the cron job. LinkedIn is real;
// the rest reuse the same simulated adapters the frontend uses (they're
// plain functions with no DOM dependency, so they run fine in a
// serverless Node function too).
export async function publishForPlatform(post: Post): Promise<ServerPublishResult> {
  switch (post.platform) {
    case 'linkedin':
      return publishLinkedIn(post.content)
    case 'twitter':
      return publishTwitter(post)
    case 'instagram':
      return publishInstagram(post)
    case 'tiktok':
      return publishTiktok(post)
    case 'facebook':
      return publishFacebook(post)
  }
}
