# Deploy em Cloudflare Workers

Este projeto já é construído para Cloudflare (o preset Nitro do
`@lovable.dev/vite-tanstack-config` faz o targeting automático). Para
publicar manualmente fora do Lovable:

## 1. Pré-requisitos

```bash
bun add -d wrangler
npx wrangler login
```

## 2. Configurar secrets no Worker

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put LOVABLE_API_KEY
```

Também configure as `VITE_*` no `.env` local — elas são embutidas em build.

## 3. Build + deploy

```bash
bun run deploy             # produção
bun run deploy:preview     # staging
bun run cf:tail            # logs ao vivo
```

## 4. Compatibilidade

- ✅ TanStack Start SSR (Nitro preset `cloudflare-module`)
- ✅ Supabase client + middleware de auth (usa `fetch` global)
- ✅ Lovable AI Gateway
- ✅ `nodejs_compat` flag ligado para `crypto`, `Buffer`, `stream`
- ⚠️  Sem `sharp`, `puppeteer`, `child_process`, `fs.watch`

Não edite `src/server.ts` — é o entrypoint SSR já configurado.