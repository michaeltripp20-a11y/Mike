import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAllPosts, saveAllPosts } from '../_lib/kv'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam

  try {
    const posts = await getAllPosts()

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const idx = posts.findIndex(p => p.id === id)
      if (idx === -1) {
        res.status(404).json({ error: 'Post not found' })
        return
      }
      posts[idx] = { ...posts[idx], ...body }
      await saveAllPosts(posts)
      res.status(200).json({ post: posts[idx] })
      return
    }

    if (req.method === 'DELETE') {
      await saveAllPosts(posts.filter(p => p.id !== id))
      res.status(204).end()
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
