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
