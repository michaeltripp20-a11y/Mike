import type { Platform } from '../types'
import type { PublishFn } from './types'
import { publish as publishTwitter } from './twitter'
import { publish as publishInstagram } from './instagram'
import { publish as publishLinkedin } from './linkedin'
import { publish as publishTiktok } from './tiktok'
import { publish as publishFacebook } from './facebook'

export const PUBLISHERS: Record<Platform, PublishFn> = {
  twitter: publishTwitter,
  instagram: publishInstagram,
  linkedin: publishLinkedin,
  tiktok: publishTiktok,
  facebook: publishFacebook,
}
