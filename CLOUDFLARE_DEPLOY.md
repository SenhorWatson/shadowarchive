# Deploy em Cloudflare Workers

## Arquitetura

O build (Vite + Nitro preset `cloudflare-module`) gera tudo o que o Wrangler
precisa dentro de `dist/server/`:

```
dist/
├── client/              # assets estáticos (binding ASSETS)
└── server/
    ├── index.mjs        # entrypoint do Worker
    ├── wrangler.json    # config canônica gerada pelo Nitro
    └── _ssr/, _server/  # chunks SSR
```

O `wrangler.json` gerado usa caminhos relativos (`main: "index.mjs"`,
`assets.directory: "../client"`), portanto basta executar `wrangler deploy`
a partir de `dist/server/` — sem `wrangler.toml` na raiz, sem
`.wrangler/deploy/config.json`, sem ambiguidade de caminho.

## Configuração na Cloudflare (Workers Builds)

- **Root Directory**: (vazio — raiz do repo)
- **Build Command**: `npm install`
- **Deploy Command**: `npm run deploy`

O script `deploy` faz `vite build` e em seguida `cd dist/server && wrangler
deploy` — build e deploy acontecem na mesma fase, no mesmo workspace. Isso
elimina o erro `ENOENT: dist/server/index.mjs` causado por CI que executa
build e deploy em workspaces separados ou em ordens diferentes.

Para o ambiente de preview, use Deploy Command `npm run deploy:preview`.

## Secrets do Worker

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put LOVABLE_API_KEY
```

Variáveis `VITE_*` ficam no `.env` local (embutidas em build).

## Comandos locais

```bash
npm run deploy           # build + deploy produção
npm run deploy:preview   # build + deploy preview
npm run cf:dev           # wrangler dev a partir de dist/server
npm run cf:tail          # logs ao vivo
```

## Compatibilidade

- ✅ TanStack Start SSR (Nitro preset `cloudflare-module`)
- ✅ Supabase client + auth middleware
- ✅ Lovable AI Gateway
- ✅ `nodejs_compat` flag ligado
- ⚠️ Sem `sharp`, `puppeteer`, `child_process`, `fs.watch`

Não edite `src/server.ts` (entrypoint SSR) nem `src/integrations/supabase/*`
(auto-gerados).