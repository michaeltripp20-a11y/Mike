import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3000
const DIST = join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

createServer((req, res) => {
  const url = req.url.split('?')[0]
  let filePath = join(DIST, url === '/' ? 'index.html' : url)
  if (!existsSync(filePath)) filePath = join(DIST, 'index.html')
  try {
    const body = readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`FloorTracker frontend listening on 0.0.0.0:${PORT}`)
})
