import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, ViteDevServer } from 'vite'

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? (JSON.parse(raw) as unknown) : {}
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function paintRadarDevApi() {
  const handle =
    (server: ViteDevServer): Connect.NextHandleFunction =>
    async (req, res, next) => {
      const url = req.url?.split('?')[0] ?? ''
      if (!url.startsWith('/api/')) {
        next()
        return
      }

      try {
        if (url === '/api/leads/ingest' && req.method === 'POST') {
          const body = (await readJson(req)) as Record<string, unknown>
          const { handleIngest } = (await server.ssrLoadModule('/src/services/leads/ingestApi.ts')) as {
            handleIngest: (raw: unknown) => Promise<unknown>
          }
          send(res, 200, await handleIngest(body))
          return
        }

        if (url === '/api/scan' && (req.method === 'POST' || req.method === 'GET')) {
          const { scanAllSources } = (await server.ssrLoadModule('/src/services/scan/scanAllSources.ts')) as {
            scanAllSources: () => Promise<unknown>
          }
          send(res, 200, await scanAllSources())
          return
        }

        if (url === '/api/sources/reddit' && (req.method === 'POST' || req.method === 'GET')) {
          const body =
            req.method === 'POST' ? ((await readJson(req)) as { keywords?: string[]; locations?: string[] }) : {}
          const { fetchRedditRawLeads } = (await server.ssrLoadModule('/src/services/leadSources/redditServer.ts')) as {
            fetchRedditRawLeads: (input?: { keywords?: string[]; locations?: string[] }) => Promise<unknown>
          }
          try {
            send(res, 200, { leads: await fetchRedditRawLeads(body) })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Reddit unavailable'
            send(res, 200, { leads: [], error: message, configured: false })
          }
          return
        }

        send(res, 404, { error: 'Not found' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'API error'
        console.error('[devApi]', message)
        send(res, 500, { error: message })
      }
    }

  return {
    name: 'paintradar-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handle(server))
    },
  }
}
