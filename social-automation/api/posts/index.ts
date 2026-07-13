import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAllPosts, saveAllPosts } from '../_lib/kv'
import type { Post } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const posts = await getAllPosts()
      res.status(200).json({ posts })
      return
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const newPosts = (Array.isArray(body?.posts) ? body.posts : [body]) as Post[]
      const existing = await getAllPosts()
      await saveAllPosts([...newPosts, ...existing])
      res.status(201).json({ posts: newPosts })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
