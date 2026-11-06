# Plano de melhorias

Levantamento de 05/11/2026, feito sobre o código da `developer` após três revisões (segurança, UX/UI e performance/qualidade). O app não recebia mudanças desde 01/2025.

## Como usar

Preencha as colunas **Decisão** e **Quando** de cada item:

- **Decisão**: `fazer`, `adiar` ou `descartar`
- **Quando**: data, sprint ou "antes do corte", "depois do corte" etc.

Cada item decidido vira um PR para a `developer`, testado no `infra/local` (ver "Como testar" no `CLAUDE.md`), e vai para `prod` junto com o resto. Quando um item for concluído, marque ✅ na coluna **Decisão** e cite o PR. Itens que também estão no `DEBITO_TECNICO.md` estão marcados com (débito); ao concluir, remova-os de lá.

**Legenda**

- **Impacto**: alto, médio ou baixo, para o usuário ou para a segurança.
- **Esforço**: P = horas, M = 1 a 3 dias, G = mais que isso.
- Os caminhos estão relativos à raiz. `(d)` = `app/(dashboard)`.

## Fase 0: hotfix de segurança (urgente)

Nenhuma Server Action nem rota de API checa sessão ou role. Server Actions são endpoints POST: um anônimo consegue chamá-las sem login. Isso foi confirmado no `infra/local`, onde um POST sem cookie devolveu a lista de usuários. O código em produção é o mesmo.

| # | Item | Onde | Impacto | Esforço | Decisão | Quando |
|---|---|---|---|---|---|---|
| 0.1 | Criar `requireSession()`/`requireRole()` e chamar no início de **todas** as Server Actions e rotas `app/api/*`. Fecha a troca de senha de qualquer conta, a criação de ADMIN, a exclusão de fotos do MinIO e a aprovação ou reabertura de relatórios. | `(d)/**/actions.ts`, `app/api/**` | alto | M | ✅ fazer (#6) | antes do corte |
| 0.2 | `updatePassword`: só o próprio usuário (com a senha atual) ou ADMIN | `(d)/admin/user/actions.ts:37` | alto | P | ✅ fazer (#6) | antes do corte |
| 0.3 | `createUser`/`updateUser`: só ADMIN pode definir a role; páginas `admin/*` checam a role no servidor | `(d)/admin/user/actions.ts:6,23`, `(d)/admin/*/page.tsx` | alto | P | ✅ fazer (#6) | antes do corte |
| 0.4 | `getRelatorios` traz o `User` inteiro, com `passwordHash`, para o navegador. Trocar por `select: { id, name }` | `(d)/relatorio/actions.ts:360` | alto | P | ✅ fazer (#6) | antes do corte |
| 0.5 | `userId` vindo da sessão, não do cliente, em `createReport` e `createDescriptionAnalisys` | `(d)/relatorio/actions.ts:200,262` | alto | P | ✅ fazer (#6) | antes do corte |
| 0.6 | Trocar o `AUTH_SECRET` real versionado por um placeholder; conferir no Coolify se a produção usa o mesmo valor e, se usar, trocar | `.env.example:10` | alto | P | descartar | antes do corte |
| 0.7 | Remover a rota pública `app/teste` (expõe IPs internos) e `components/teste` | `app/teste`, `components/teste` | médio | P | ✅ fazer (#6) | antes do corte |

## Fase 1: segurança restante

| # | Item | Onde | Impacto | Esforço | Decisão | Quando |
|---|---|---|---|---|---|---|
| 1.1 | Validação com zod no servidor, aceitando só os campos esperados. Hoje vários `update` gravam o objeto recebido inteiro (`...data`), o que permite, por exemplo, mover uma foto para outro relatório | `savePhotoAnalisys`, `updateClient`, `createSite`/`updateSite` | alto | M | | |
| 1.2 | Upload: reprocessar com sharp e gravar o resultado, chave com UUID em vez do nome do arquivo, checar o conteúdo real do arquivo, limite de tamanho, nunca aceitar SVG/HTML. Hoje o logo de um cliente pode sobrescrever o de outro | `(d)/relatorio/actions.ts:37`, `(d)/admin/client/actions.ts:7`, `lib/validateImageType.ts` | alto | M | | |
| 1.3 | Sanitizar o HTML do Tiptap ao salvar e ao exibir. Hoje há XSS armazenado, que roda também no Chromium do PDF (sem sandbox, dentro da rede Docker) | `saveDescriptionAnalisys`, `photoCard.tsx:82`, `removePhoto.tsx:61`, `reportviewer/_components/photoAnalisys.tsx:28` | alto | P | | |
| 1.4 | Excluir foto pelo id, buscando a URL no banco. Hoje a exclusão recebe a URL do cliente e apaga qualquer objeto | `deletePhoto`, `deletePhotoAnalisys` | alto | P | | |
| 1.5 | `/api/photos/reorder`: login, validação e transação | `app/api/photos/reorder/route.ts` | médio | P | | |
| 1.6 | Proteger `/reportviewer` e `/api/reportpdf` com token assinado de curta duração para o Puppeteer (débito) | `middleware.ts`, `lib/route`, rota do PDF | alto | M | | |
| 1.7 | Bloquear requisições fora do app no Puppeteer (`setRequestInterception`) e validar `idReport` como inteiro | `app/api/reportpdf/[idReport]/route.ts` | médio | P | | |
| 1.8 | Login: limite de tentativas por IP e e-mail; tempo de resposta igual para e-mail inexistente; validação da senha no servidor | `lib/auth.ts` | médio | M | | |
| 1.9 | Reler a role no JWT, para que um rebaixamento valha antes das 4 h da sessão | `lib/auth.ts:54` | baixo | P | | |
| 1.10 | Cabeçalhos de segurança e CSP (`headers()` no `next.config.mjs`) | `next.config.mjs` | médio | P | | |

## Fase 2: bugs e integridade dos dados

| # | Item | Onde | Impacto | Esforço | Decisão | Quando |
|---|---|---|---|---|---|---|
| 2.1 | O botão de girar foto não faz nada: o estado `rotation` nunca é aplicado | `photo/UploadImage.tsx:31,135`, `photo/editPhoto.tsx` | alto | P | | |
| 2.2 | Toda foto vira 400x300 fixo: distorce fotos em retrato e deixa o PDF com resolução baixa. Manter a proporção e limitar o lado maior | `photo/UploadImage.tsx:37`, `photo/editPhoto.tsx` | alto | P | | |
| 2.3 | Editar foto apaga a antiga antes de subir a nova; se o upload falha, a foto se perde. Subir, gravar e só depois apagar | `photo/editPhoto.tsx:122` | alto | P | | |
| 2.4 | Apagar foto e reordenar sem transação | `deletePhotoAnalisys` (`actions.ts:151`) | médio | P | | |
| 2.5 | Índice da nova foto calculado no navegador (`count+1`), que repete com uploads simultâneos. Calcular `max+1` no servidor | `photo/UploadImage.tsx:110` | médio | P | | |
| 2.6 | Relatório inexistente dá erro 500. Validar o id e usar `notFound()` | `reportviewer/[id]/page.tsx`, `(d)/relatorio/[id]/page.tsx` | médio | P | | |
| 2.7 | Um erro 500 no PDF é baixado como arquivo corrompido, e a tela fica presa em loading. Checar `res.ok` e usar `try/finally` | `_components/generatePdf.tsx:272` | médio | P | | |
| 2.8 | O botão "Del" exclui o serviço sem confirmação | `_components/removerServices.tsx` | médio | P | | |
| 2.9 | Estado do sidebar não é salvo (lógica do cookie invertida) | `(d)/layout.tsx:22` | baixo | P | | |
| 2.10 | Check do técnico no formulário nunca aparece (compara nome com id) | `_components/dialogRelatorioForm.tsx:246` | baixo | P | | |
| 2.11 | "Finalizar" some sem explicação com menos de 5 fotos. Desabilitar o botão e explicar com um Tooltip | `_components/headerReport.tsx:99` | baixo | P | | |
| 2.12 | Status do relatório depende de `updatedAt`. Definir uma regra única ou um campo de status explícito | `table/columnDef.tsx:36`, `actions.ts:456` | médio | M | | |

## Fase 3: performance

| # | Item | Onde | Impacto | Esforço | Decisão | Quando |
|---|---|---|---|---|---|---|
| 3.1 | Índices: `PhotoAnalisys(idReport, index)`, `DescriptionAnalisys(idReport)` e campos de filtro do `Report`. Hoje abrir um relatório varre as 35 mil fotos | `prisma/schema.prisma` | alto | P | | |
| 3.2 | Lista de relatórios: paginação no servidor, `select` enxuto e consultas em paralelo. Hoje carrega os 780 relatórios, faz 6 consultas em sequência e 3 actions por linha | `(d)/relatorio/page.tsx`, `getRelatorios`, `columnDef.tsx:226` | alto | M | | |
| 3.3 | Reorder: um único `UPDATE` em transação, no lugar de até 640 updates sem `await` | `app/api/photos/reorder/route.ts` | alto | P | | |
| 3.4 | PDF: fotos sem lazy-load, viewport normal (hoje 1600x65536), esperar as imagens carregarem, viewer como Server Component | rota do PDF, `reportviewer/_components/photoAnalisys.tsx` | médio | P | | |
| 3.5 | Investigar o PDF de 127 MB do relatório 756 (643 fotos): as imagens somam menos de 1 MB. Suspeita de sombras e efeitos rasterizados por card | `reportviewer/**` | médio | M | | |
| 3.6 | Fila para a geração de PDF e reaproveitamento do Chromium (débito) | rota do PDF | alto | G | | |
| 3.7 | Dashboard: contagens em paralelo e feitas no banco | `(d)/page.tsx`, `actions.ts:456` | baixo | P | | |
| 3.8 | `minimumCacheTTL` alto no `next/image` (as chaves são imutáveis) e limpar hosts antigos em `remotePatterns` | `next.config.mjs` | baixo | P | | |
| 3.9 | `key={JSON.stringify(photoAnalisys)}` serializa até 640 objetos a cada render. Usar uma chave estável | `(d)/relatorio/[id]/page.tsx:44` | baixo | P | | |

## Fase 4: UX/UI com shadcn/ui

| # | Item | Onde | Impacto | Esforço | Decisão | Quando |
|---|---|---|---|---|---|---|
| 4.1 | Montar o Sonner (não há `<Toaster>` montado) e mostrar sucesso ou erro em toda ação; apagar o toast antigo | `app/layout.tsx`, `components/hooks/use-toast.ts` | alto | M | | |
| 4.2 | Botões com estado de envio (`isSubmitting`), para evitar duplo envio | formulários de foto, relatório, cliente, aprovação, login | alto | M | | |
| 4.3 | `AlertDialog` em todas as confirmações (hoje são Dialogs feitos à mão ou não existem) | `removePhoto.tsx`, `aproveReport.tsx`, `reopenReport.tsx`, `removerServices.tsx` | médio | P | | |
| 4.4 | `loading.tsx` com `Skeleton` e `error.tsx` por seção | `app/**` | médio | M | | |
| 4.5 | Dashboard: gráficos e seletor de datas usam dados fixos de exemplo ("January - June 2024", "Jan 20, 2023"). Ligar a dados reais ou remover | `components/dashboard.tsx`, `components/date-range-picker.tsx` | alto | M | | |
| 4.6 | Toda a UI em pt-BR ("No results", "Reset", "Toggle Sidebar", placeholders) e role exibida com nome amigável | tabelas, `sidebar.tsx`, dialogs de usuário, `nav-user.tsx` | médio | P | | |
| 4.7 | Menu de Administração filtrado por role (o filtro está comentado) | `components/app-sidebar.tsx:113` | médio | P | | |
| 4.8 | Navegação com `Link` e item ativo; breadcrumb de verdade | `nav-main.tsx`, `nav-adm.tsx`, `header-page.tsx` | médio | P | | |
| 4.9 | Celular: tirar larguras fixas (`w-[430px]`, `w-[515px]`), usar `Drawer` no lugar de `Dialog` e quebrar linha na toolbar da tabela | `photoCard.tsx`, `headerReport.tsx`, `dialogRelatorioForm.tsx`, `data-table-toolbar.tsx` | alto | M | | |
| 4.10 | Upload de várias fotos de uma vez, com fila e `Progress` | `photo/UploadImage.tsx` | alto | M | | |
| 4.11 | Avisar quando o reorder falhar e desfazer a troca na tela | `_components/photoAnalisys.tsx:63` | médio | P | | |
| 4.12 | Acessibilidade: reordenar pelo teclado (`KeyboardSensor`), `aria-label` em botões só com ícone, labels visíveis nos formulários | `photoAnalisys.tsx`, `toolBar.tsx`, `photoCard.tsx`, `dialogRelatorioForm.tsx` | médio | M | | |
| 4.13 | Combobox (`Command` + `Popover`) para escolher cliente no cadastro de site | `admin/site/_components/dialogSite.tsx:80` | baixo | P | | |
| 4.14 | Variantes de `Badge` para status (cores fixas com contraste ruim) | `table/columnDef.tsx:50` | baixo | P | | |
| 4.15 | Unificar o "Gerar PDF" da tabela e o da tela do relatório num só fluxo, com feedback | `table/columnDef.tsx:202`, `generatePdf.tsx` | baixo | P | | |
| 4.16 | Dark mode (`next-themes` está instalado e sem uso) | `app/layout.tsx` | baixo | M | | |

## Fase 5: limpeza e atualizações

| # | Item | Onde | Impacto | Esforço | Decisão | Quando |
|---|---|---|---|---|---|---|
| 5.1 | Remover dependências sem uso: 23 extensões do Tiptap, `@hello-pangea/dnd`, `@types/react-beautiful-dnd`, `@aws-sdk/s3-presigned-post`, `prettier` e o plugin dele | `package.json` | médio | P | | |
| 5.2 | Remover código morto: editor duplicado (`Tiptap.tsx`, `ToolBar.tsx`, `ColorHighlighter.ts`, `findColors.ts`), `imagemCard.tsx`, `buttonFloat.tsx`, `lib/rotateImage.ts`, `lib/imageSharp.ts`, funções sem uso em `relatorio/actions.ts` (`teste`, `reduceImageSize`, `getPhotoAnalisys`, funções de cliente duplicadas) | vários | baixo | P | | |
| 5.3 | Um `DataTable` genérico no lugar dos 7 dos CRUDs admin (876 linhas quase iguais) | `(d)/admin/*/_components/data-table.tsx` | baixo | M | | |
| 5.4 | Parar de engolir erros: retornar `{ error }` tratado em vez de `catch { console.log }`, e usar um logger com nível (há 52 `console.log`) | `(d)/**/actions.ts`, `service/storage` | médio | M | | |
| 5.5 | Zerar os 44 erros do Biome (formatação e `.vscode/settings.json`) | vários | baixo | P | | |
| 5.6 | Versionar o `package-lock.json`, para que o deploy instale exatamente o que foi testado | `.gitignore`, `package-lock.json` | alto | P | | |
| 5.7 | Node 22 na imagem, antes de janeiro de 2027, por causa do AWS SDK (débito) | `Dockerfile` | alto | P | | |
| 5.8 | Puppeteer 23 → 25 (débito) | `package.json`, rota do PDF | médio | M | | |
| 5.9 | Zod 3 → 4 (débito) | schemas, `@hookform/resolvers` | médio | M | | |
| 5.10 | Next 14 → 15/16 (débito) | app inteiro | alto | G | | |
| 5.11 | Tiptap 2 → 3, depois do 5.1 (débito) | editor | médio | G | | |
| 5.12 | Corrigir a migration `20250103122551`, que quebra o `migrate deploy` em banco vazio (débito) | `prisma/migrations` | baixo | P | | |
| 5.13 | Testes de fumaça automatizados no `infra/local`: login, upload de foto e PDF | novo | médio | M | | |

## Ordem sugerida

1. **Fase 0** é a única que justifica ir para produção fora do fluxo normal.
2. **Fases 1, 2 e 3** são correções de risco médio e podem andar juntas depois do corte. Comece por 1.2, 1.3, 2.1–2.3 e 3.1–3.3.
3. **Fase 4** é a maior em esforço e pode ir tela por tela, começando pelo fluxo do relatório (4.1, 4.2, 4.9, 4.10).
4. **Fase 5** se intercala com as outras. A limpeza (5.1, 5.2, 5.6) vem antes dos upgrades (5.7–5.11), e os upgrades vão um por vez.
