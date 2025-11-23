**Resumo**

Este repositório é uma aplicação Next.js (app-router) em TypeScript com integração ao Supabase. Use estas instruções para ser produtivo rapidamente: onde procurar código relevante, convenções do projeto e comandos para executar/buildar localmente.

**Como rodar**

- Instalação e desenvolvimento (PowerShell):

```powershell
npm install
npm run dev
```

- Build / produção:

```powershell
npm run build
npm run start
```

**Variáveis de ambiente importantes**

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: usadas pelo cliente (veja `src/lib/supabase/client.ts`).
- O projeto também usa `@supabase/auth-helpers-nextjs` — ver `src/lib/supabase/server.ts` que cria o cliente em Server Components usando `cookies`.

**Arquitetura e padrões chave**

- Next.js app-router: código de rotas e páginas está em `src/app` (ex.: `src/app/dashboard/page.tsx`).
- Componentes de interface estão em `src/components/ui` (ex.: `button.tsx`, `card.tsx`, `input.tsx`). Reutilize esses componentes para consistência visual.
- Utilitários: `src/lib/utils.ts` exporta `cn(...)` (combina `clsx` + `tailwind-merge`) — use para classes CSS.
- Supabase:
  - Cliente no browser: `src/lib/supabase/client.ts` (use em componentes cliente).
  - Cliente para Server Components / SSR: `src/lib/supabase/server.ts` (usa `createServerComponentClient` e `cookies`).
- Tipos/DB: tipos compartilhados em `src/types/database.types.ts` — prefira usá-los em endpoints e componentes.

**Fluxos comuns / exemplos**

- Autenticação em Server Component (ex):

```ts
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()
const { data } = await supabase.from('users').select('*')
```

- Cliente no browser (ex):

```ts
import { createClient as createBrowserClient } from '@/lib/supabase/client'
const supabase = createBrowserClient()
await supabase.auth.signInWithPassword({ email, password })
```

**Padrões de código e convenções específicas**

- Estrutura: mantenha páginas no `src/app` e componentes compartilhados em `src/components`.
- Styling: Tailwind + componentes em `src/components/ui` — use `cn(...)` para combinar classes.
- Evite lógica de negócio em componentes; prefira endpoints API em `src/app/api/*` ou chamadas diretas ao Supabase em Server Components quando precisar de dados protegidos.
- Use os tipos de `src/types` ao retornar/consumir dados em endpoints.

**Scripts e checks**

- `npm run dev` — desenvolvimento (next dev)
- `npm run build` / `npm run start` — produção
- `npm run lint` — roda o ESLint (nenhum test runner configurado detectado)

**Onde procurar para entender funcionalidades específicas**

- Autenticação / sessão: `src/lib/supabase/*` e `@supabase/auth-helpers-nextjs` imports
- APIs: `src/app/api/*` (subpastas: `classes`, `grupos`, `lancamentos`, `relatorios`)
- Relatórios / exportação: `src/app/api/relatorios/export` (CSV/XLSX libs: `papaparse`, `xlsx`)

Se algo aqui estiver incompleto ou você quiser que eu acrescente exemplos de endpoints, patterns de commit ou regras de PR, diga o que prefere e ajusto o arquivo.
