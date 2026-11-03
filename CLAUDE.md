# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

App interno da Nova Corrente para relatórios de qualidade / não conformidade de sites (torres): o técnico registra fotos com análise e descrições de serviço, um analista aprova, e o relatório é exportado em PDF. UI, comentários e mensagens de commit em pt-br.

Stack: Next.js 14 (App Router, Server Actions) + TypeScript, Tailwind + shadcn/Radix (`components/ui`), Prisma + PostgreSQL, Auth.js v5 beta (Credentials + JWT), MinIO via AWS SDK S3, Puppeteer + Chromium para o PDF, Tiptap para texto rico.

## Branches e deploy

- Todo desenvolvimento acontece na branch **`developer`**.
- **`prod`** é o que roda em produção: o Coolify faz deploy automático (webhook do GitHub) a cada push nela, em https://reports.smarttower.app. Não commitar direto em `prod`.
- `main` e `coolify-deploy` são linhas antigas, anteriores à migração para o Coolify.
- `DEBITO_TECNICO.md` lista o débito técnico conhecido. Ao resolver um item, remova-o no mesmo commit.

## Comandos

```bash
npm install                  # não há package-lock.json: cada install resolve versões novas dentro dos ranges
npm run dev                  # dev server em :3000
npm run build                # next build — inclui checagem de tipos; é o que o deploy roda
npm run lint                 # next lint
npx @biomejs/biome check .   # lint/format do Biome (formatador padrão do projeto, ver biome.json)
npx prisma migrate dev --name <nome>   # nova migration
npx prisma generate
npx prisma db seed           # prisma/seed.ts (usuário inicial e tipos de estrutura)
```

Não há testes automatizados. Para validar uma mudança, rode `npm run build`. Como não há lockfile, o build no deploy pode pegar `@types/node` mais novo que o local; erros de tipo com `Buffer`/`Uint8Array` em `Blob` e `Response` já apareceram por isso (converta com `new Uint8Array(...)`).

Estilo (Biome): 2 espaços, linha de 120, aspas simples, sem ponto e vírgula. `components/ui/**` é gerado pelo shadcn e fica fora do lint.

## Arquitetura

### Dados e regras de negócio

`prisma/schema.prisma`: `Report` é o centro e liga `Site` (com `Client`, `SiteType`, `StructureType`), `Technician`, `User` (autor) e `User` analista (`analystId`, relação `"ANALYST"`), `ScopeService`, `PhotoAnalisys[]` (fotos ordenadas por `index`) e `DescriptionAnalisys[]`. `finishedAt` preenchido = relatório aprovado/finalizado. `Role`: ADMIN, USER, ANALYST, TECHNICIAN, COORDINATOR.

Não há camada de API para o CRUD: cada rota em `app/(dashboard)/**` tem um `actions.ts` com Server Actions (`'use server'`) que chamam o Prisma (`lib/prisma.ts`, singleton) e fazem `revalidatePath`. As páginas `admin/*` seguem o mesmo molde: `page.tsx` + `_components/` com `columns.tsx`, `data-table.tsx` (TanStack Table) e dialogs de criar/editar. `app/(dashboard)/relatorio/actions.ts` concentra a lógica de relatórios, fotos e descrições, e também é importado pelo `reportviewer`.

### Imagens (MinIO)

- Upload: o client manda `FormData` para uma Server Action, que redimensiona com `sharp` (`lib/imageSharp.ts`) e grava via `service/storage/index.ts` (`PutObjectCommand`).
- O banco guarda a **URL absoluta** `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/<key>` (em `PhotoAnalisys.url` e `Client.img`). `deleteObject` remove esse prefixo para achar a key, então trocar `STORAGE_ENDPOINT` exige reescrever as URLs no banco.
- As imagens são exibidas com `next/image` (o servidor Next busca no MinIO, que precisa permitir leitura anônima no bucket). `next.config.mjs` libera o host do `STORAGE_ENDPOINT` em `remotePatterns` **no build**.
- Em produção o endpoint é o host interno da rede Docker do Coolify, que o navegador não resolve: qualquer `<img src>` com a URL crua do storage (ex.: `editPhoto.tsx`, `UploadImage.tsx`) não carrega no browser.
- `STORAGE_REGION` precisa bater com a região do MinIO (`LOCAL` em produção).

### Autenticação e rotas

- `lib/auth.ts`: Credentials com `bcryptjs` contra `User.passwordHash`, sessão JWT de 4h, `role` e `id` copiados para a sessão (tipos em `types/next-auth.d.ts`). `lib/auth.config.ts` é a versão enxuta usada no `middleware.ts`.
- `middleware.ts` redireciona para `/signin` quando a rota está em `config/routes/index.ts` → `protectedRoutes`. A comparação em `lib/route/index.ts` é por igualdade exata do pathname, então entradas dinâmicas como `/relatorio/[id]`, `/reportviewer/[id]` e `/api/reportpdf/[idReport]` **não protegem nada**, e o matcher do middleware ainda exclui `/api`. Na prática, `/reportviewer/:id` e `/api/reportpdf/:id` são públicos, e a geração de PDF depende disso (o Chromium acessa a página sem cookie). Proteger essas rotas exige dar outra forma de acesso ao Puppeteer.

### Geração de PDF

`app/api/reportpdf/[idReport]/route.ts` abre um Chromium (Puppeteer) por requisição, navega até `${URL_APP}/reportviewer/:id` (em produção `URL_APP=http://localhost:3000`, para não passar pelo proxy), espera `networkidle2` e imprime em LETTER. O botão `relatorio/_components/generatePdf.tsx` faz `fetch` dessa rota e baixa o blob. Cada PDF de ~200 fotos leva ~40 s. Não há fila: várias gerações simultâneas disputam CPU/memória e podem dar timeout (ver `DEBITO_TECNICO.md`).

## Deploy (Coolify)

- `Dockerfile`: `node:20-slim` + Chromium e `openssl` do apt (`PUPPETEER_SKIP_DOWNLOAD`, `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`). O `CMD` roda `prisma migrate deploy` antes do `next start`, então migrations novas são aplicadas sozinhas no deploy. O container usa `--shm-size=1g` (configurado no Coolify) por causa do Chromium.
- Não há `.env` na imagem; as variáveis vêm do Coolify. `STORAGE_ENDPOINT` e `NEXT_PUBLIC_URL_APP` precisam estar marcadas também como build time, pois são lidas no `next build`. `AUTH_URL`, `AUTH_SECRET`, `DATABASE_URL`, `URL_APP` e as demais `STORAGE_*` são runtime. Lista de referência em `.env.example`.
- O histórico de migrations foi rebaseado: `20250110033712_restart_bd` é o baseline do banco atual. Migrations novas devem partir dele.
- `migration/` contém scripts de apoio à migração do servidor antigo (dump do banco e espelho do bucket); não fazem parte do app.
