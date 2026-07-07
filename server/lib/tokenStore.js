import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const FILE = path.join(DATA_DIR, 'tokens.json')

function ensureFile() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(FILE)) writeFileSync(FILE, '{}')
}

function readAll() {
  ensureFile()
  return JSON.parse(readFileSync(FILE, 'utf-8'))
}

function writeAll(data) {
  ensureFile()
  writeFileSync(FILE, JSON.stringify(data, null, 2))
}

export function getToken(platform) {
  return readAll()[platform] || null
}

export function setToken(platform, data) {
  const all = readAll()
  all[platform] = data
  writeAll(all)
}

export function clearToken(platform) {
  const all = readAll()
  delete all[platform]
  writeAll(all)
}
