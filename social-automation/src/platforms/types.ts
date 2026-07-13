import type { Post } from '../types'

export interface PublishResult {
  ok: boolean
  error?: string
}

export type PublishFn = (post: Post) => Promise<PublishResult>

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
