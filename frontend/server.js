/**
 * Node.js Express server — MediScribe AI frontend
 *
 * WHERE NODE.JS IS USED IN THIS PROJECT
 * ──────────────────────────────────────
 * 1. HERE (server.js)       — Express serves the built React app and proxies
 *                             all API calls to the FastAPI backend (port 8009).
 *                             Run with: node server.js
 *
 * 2. Vite dev server        — `npm run dev` starts Vite on Node.js (port 3000).
 *                             Vite's built-in proxy forwards /process, /health,
 *                             /ws to FastAPI automatically (vite.config.js).
 *
 * 3. Build pipeline         — `npm run build` uses Node.js + Rollup (via Vite)
 *                             to bundle React → static files in dist/.
 *
 * 4. npm / package manager  — npm itself runs on Node.js and manages all
 *                             frontend dependencies (lucide-react, jsPDF, etc).
 *
 * WHY USE THIS SERVER?
 * ─────────────────────
 * In production you can either:
 *   A) Serve dist/ from FastAPI (already wired up in main.py)
 *   B) Serve dist/ from this Node.js server (independent of Python)
 *
 * Option B is useful when the frontend team deploys independently,
 * or when you want Node.js middleware (auth, rate-limiting, logging).
 */

import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const app        = express()
const PORT       = process.env.PORT       || 4000
const API_TARGET = process.env.API_TARGET || 'http://localhost:8009'

/* ── 1. Request logger (Node.js middleware) ─────────────────── */
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

/* ── 2. Proxy API calls → FastAPI backend ───────────────────── */
const apiRoutes = ['/health', '/process', '/appointments', '/ws']

apiRoutes.forEach(route => {
  app.use(
    route,
    createProxyMiddleware({
      target:      API_TARGET,
      changeOrigin: true,
      ws:          route === '/ws',          // enable WebSocket proxy for /ws
      on: {
        error: (err, _req, res) => {
          console.error('Proxy error:', err.message)
          if (res.writeHead) res.writeHead(502).end('Bad Gateway — FastAPI unreachable')
        },
      },
    }),
  )
})

/* ── 3. Serve built React app (dist/) ───────────────────────── */
const DIST = join(__dirname, 'dist')
app.use(express.static(DIST))

/* ── 4. SPA fallback — all unmatched routes → index.html ────── */
app.get('*', (_req, res) => {
  res.sendFile(join(DIST, 'index.html'))
})

/* ── 5. Start ───────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  MediScribe frontend running at http://localhost:${PORT}`)
  console.log(`🔗  API proxy target: ${API_TARGET}`)
  console.log(`📁  Serving: ${DIST}\n`)
})
