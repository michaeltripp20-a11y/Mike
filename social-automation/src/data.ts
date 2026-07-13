import type { Platform, PlatformMeta, Post } from './types'

export const PLATFORMS: PlatformMeta[] = [
  { id: 'twitter', label: 'X / Twitter', color: '#1d9bf0', charLimit: 280, live: false },
  { id: 'instagram', label: 'Instagram', color: '#e1306c', charLimit: 2200, live: false },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', charLimit: 3000, live: true },
  { id: 'tiktok', label: 'TikTok', color: '#fe2c55', charLimit: 2200, live: false },
  { id: 'facebook', label: 'Facebook', color: '#1877f2', charLimit: 63206, live: false },
]

export function platformMeta(id: Platform): PlatformMeta {
  return PLATFORMS.find(p => p.id === id)!
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isoOffset(days: number, hours = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(d.getHours() + hours, 0, 0, 0)
  return d.toISOString()
}

const SEED_CAPTIONS: Record<Platform, string[]> = {
  twitter: [
    'New week, new goals. What are you shipping in the next 7 days? 🚀',
    'Behind every good product is a team that sweats the details.',
    'Poll: what should we build next? Reply with your vote.',
  ],
  instagram: [
    'Sneak peek at what we\'ve been building 👀 Full reveal coming soon.',
    'Meet the team making it happen. Swipe to see who\'s behind the scenes →',
    'Customer story: how our tools helped a small team move faster.',
  ],
  linkedin: [
    'We\'re excited to share a milestone: our team just crossed a major product update this quarter. Here\'s what we learned along the way.',
    'Hiring update: we\'re growing the team. If you love solving hard problems, check out our open roles.',
    'Three lessons from scaling our platform this year — a short thread on what worked and what didn\'t.',
  ],
  tiktok: [
    'Day in the life at a fast-moving startup 🎬',
    'Quick tip: 3 ways to save time on your weekly workflow.',
  ],
  facebook: [
    'We just launched something new — check it out and let us know what you think!',
    'Thank you to our community for an incredible year. Here\'s to what\'s next.',
  ],
}

function randomFrom<T>(arr: T[]): T {
  return arr[randomBetween(0, arr.length - 1)]
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function generateSeedPosts(): Post[] {
  const posts: Post[] = []

  // Posted (with engagement)
  const postedPlatforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'facebook', 'twitter', 'instagram']
  postedPlatforms.forEach((platform, i) => {
    posts.push({
      id: makeId(),
      platform,
      content: randomFrom(SEED_CAPTIONS[platform]),
      mediaUrl: platform === 'instagram' || platform === 'tiktok' ? 'demo-media' : undefined,
      scheduledFor: isoOffset(-(i + 1) * 2),
      status: 'posted',
      createdAt: isoOffset(-(i + 1) * 2, -2),
      engagement: {
        likes: randomBetween(40, 2400),
        comments: randomBetween(2, 180),
        shares: randomBetween(0, 90),
      },
    })
  })

  // Scheduled (future)
  const scheduledPlatforms: Platform[] = ['linkedin', 'twitter', 'tiktok', 'instagram']
  scheduledPlatforms.forEach((platform, i) => {
    posts.push({
      id: makeId(),
      platform,
      content: randomFrom(SEED_CAPTIONS[platform]),
      mediaUrl: platform === 'instagram' || platform === 'tiktok' ? 'demo-media' : undefined,
      scheduledFor: isoOffset(i + 1, randomBetween(8, 18)),
      status: 'scheduled',
      createdAt: isoOffset(0, -1),
    })
  })

  // Drafts
  const draftPlatforms: Platform[] = ['facebook', 'twitter']
  draftPlatforms.forEach(platform => {
    posts.push({
      id: makeId(),
      platform,
      content: randomFrom(SEED_CAPTIONS[platform]),
      scheduledFor: isoOffset(randomBetween(2, 6), 12),
      status: 'draft',
      createdAt: isoOffset(0),
    })
  })

  // One failed, for the Queue view
  posts.push({
    id: makeId(),
    platform: 'tiktok',
    content: randomFrom(SEED_CAPTIONS.tiktok),
    mediaUrl: 'demo-media',
    scheduledFor: isoOffset(-1),
    status: 'failed',
    createdAt: isoOffset(-1, -3),
    error: 'App not yet approved for Content Posting API (simulated)',
  })

  return posts.sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
}
