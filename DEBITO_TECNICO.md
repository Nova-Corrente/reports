# Débito técnico

Itens conhecidos que ficaram para depois. Ao resolver um item, remova-o daqui no mesmo commit.

## Fila para a geração de PDF

**Onde:** `app/api/reportpdf/[idReport]/route.ts`

**Problema:** cada requisição abre um Chromium próprio, sem limite de simultaneidade. Num teste em 03/11/2026, com até quatro gerações ao mesmo tempo, 13 PDFs foram disparados e 3 falharam com `TimeoutError: Timed out after waiting 30000ms` na etapa do `page.pdf`. Gerados um de cada vez, os relatórios 774 e 779 (cerca de 200 fotos cada) saíram sem falha, levando uns 40 s cada.

**Risco:** vários usuários gerando relatórios juntos esgotam CPU e memória do container, os PDFs falham por timeout e o app inteiro fica lento.

**Proposta:**

- Colocar as gerações numa fila, processando no máximo uma (ou N, configurável) por vez. As demais aguardam a vez.
- Reaproveitar uma única instância do Chromium entre gerações, em vez de abrir uma por requisição.
- Avaliar geração assíncrona: o usuário pede o PDF, a geração entra na fila e ele baixa quando ficar pronto, em vez de manter a requisição HTTP aberta.
- Evitar gerar o mesmo relatório duas vezes em paralelo. O leitor de PDF do navegador pode repetir a requisição.

**Paliativo atual:** o timeout do `page.goto` e do `page.pdf` foi aumentado para 120 s, e o navegador é sempre fechado num `finally`.

## Rotas dinâmicas sem proteção de login

**Onde:** `middleware.ts`, `lib/route/index.ts`, `config/routes/index.ts`

**Problema:** o middleware só exige login quando o pathname está em `protectedRoutes`, e `createRouteMatchers` compara por igualdade exata de texto. Entradas como `/relatorio/[id]`, `/reportviewer/[id]` e `/api/reportpdf/[idReport]` nunca casam com o caminho real (`/reportviewer/774`), então não protegem nada. Além disso, o `matcher` do middleware exclui tudo que começa com `/api`.

Verificado em produção em 03/11/2026, sem estar logado:

- `/reportviewer/774` responde 200 e mostra o relatório completo, com fotos.
- `/api/reportpdf/:id` gera e devolve o PDF.
- `/relatorio/774` redireciona para `/signin`, mas só porque a própria página chama `redirect('/signin')`, não por causa do middleware.

**Risco:** qualquer pessoa que saiba ou adivinhe um id (são sequenciais) vê os relatórios dos clientes e pode disparar gerações de PDF, que são pesadas (ver item da fila acima).

**Proposta:**

- Fazer o matcher de rotas aceitar padrões dinâmicos (prefixo ou regex) em vez de igualdade exata.
- Proteger `/api/reportpdf/:id` checando a sessão (`auth()`) dentro da rota.
- Dar ao Puppeteer outra forma de acessar `/reportviewer/:id`, já que hoje ele depende da página ser pública. Por exemplo, um token assinado e de curta duração na URL, ou repassar o cookie de sessão do usuário que pediu o PDF.

## Vulnerabilidades de dependências que exigem versão major

**Onde:** `package.json`

**Problema:** em 05/11/2026 o `npm audit` caiu de 79 para 56 alertas (45 moderate, 10 high, 1 critical) só com atualizações sem quebra. O que sobrou só se resolve subindo versão major:

- **Next 14 → 15/16** (o critical e o high do `postcss` interno): a linha 14 não recebe mais correções. Os alertas incluem DoS no otimizador de imagens com `remotePatterns`, DoS na desserialização de Server Components e request smuggling em `rewrites`. Exige migrar para APIs assíncronas (`params`, `cookies()`, `headers()`) e revalidar Auth.js e o build no Coolify.
- **Puppeteer 23 → 25** (9 high): `extract-zip`, `proxy-agent`/`get-uri`/`basic-ftp` e o `zod` do `chromium-bidi`. Na prática não são exercitados em produção, pois o download do Chromium está desligado (`PUPPETEER_SKIP_DOWNLOAD`) e não há proxy. A rota de PDF usa só `launch`, `goto`, `pdf`, que mudaram pouco, mas precisa de teste com relatórios grandes.
- **Zod 3 → 4** (1 high): consumo de memória ao validar coleções grandes com limites. Exige revisar os schemas e o `@hookform/resolvers`.
- **Tiptap 2 → 3** (45 moderate, todos a mesma falha): `mergeAttributes()` aceita uma chave `__proto__` e a transforma em atributo do DOM. Migração grande do editor de texto rico.

**Proposta:** depois do corte do servidor, atacar um por vez, com deploy e teste entre eles: Puppeteer e Zod primeiro (menores), depois Next e Tiptap.
