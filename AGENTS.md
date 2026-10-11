# Boardmates development instructions

This is an editable source export of the Thai Boardmates multiplayer game site, including global chat. Read README.md and EXPORT-GUIDE.md before making changes.

- Preserve the existing React/TypeScript + Vinext/Vite + Cloudflare Worker/D1 architecture, package manager, and lockfile unless a requested migration requires changes.
- Guest identity is verified on the server through the HttpOnly session cookie. Do not trust client-supplied player IDs or names for authorization or message authorship.
- Shared rooms and chat persist in D1. Do not replace shared state with browser storage or process memory.
- Preserve server-side game permissions and private role views. Never reveal other players' hidden information in API responses.
- Keep cross-origin mutation checks and chat rate limits/idempotency.
- Render user messages as plain text, not raw HTML.
- Existing drizzle migrations and snapshots have been deployed. Treat them as immutable; generate new migrations for schema changes.
- Use the portable local development flow in README.md. Local D1 IDs are placeholders; configure real bindings separately for production.
- Run pnpm typecheck, pnpm test:integration, and pnpm build after substantive changes. Test multi-player changes with independent sessions.
- Preserve Thai user-facing language and responsive desktop/mobile behavior.
- Do not commit secrets, .env files, node_modules, build artifacts, or local database files. Preserve vendor license notices.
- Production runs on Cloudflare Workers + D1 (see DEPLOY-CLOUDFLARE.md). The earlier OpenAI Sites hosting is no longer used. Merging to main may trigger a deploy once Workers Builds is connected; do not merge, publish, or change access controls unless the user asks for that action.
