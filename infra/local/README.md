# Ambiente local igual à produção

Sobe o app com a mesma imagem do `Dockerfile` que o Coolify usa (Node 20, Chromium do apt, `next start`), junto de um Postgres e um MinIO numa rede Docker interna. Serve para testar o que vai para `prod` antes do deploy: build, migrations, login, upload de fotos, `next/image` e geração de PDF.

O que fica igual à produção:

- O app fala com o MinIO pelo host interno `http://minio:9000`, que o navegador não resolve. Imagem que aparece sem `next/image` quebra aqui como quebraria lá.
- O MinIO responde na região `LOCAL`, o bucket tem leitura anônima, e o S3Client usa path-style.
- `STORAGE_ENDPOINT` e `NEXT_PUBLIC_URL_APP` entram no `next build` como build args, como as variáveis marcadas como build time no Coolify.
- O Puppeteer abre o `/reportviewer` por `URL_APP=http://localhost:3000`, de dentro do container, e o container tem `shm_size: 1g`.
- O `npm install` roda sem lockfile dentro da imagem, então as versões resolvidas são as que o deploy pegaria hoje.

## Uso

```bash
cd infra/local
cp .env.example .env          # troque o AUTH_SECRET: openssl rand -base64 32
docker compose up -d --build --wait
```

App em http://localhost:3100. Num banco vazio, o serviço `migrate` aplica as migrations e roda o seed (usuário `suporte@novacorrente.ind.br`, senha em `prisma/seed.ts`). O seed não cria `ScopeService`, `Client`, `Site` nem `Technician`: cadastre em `/admin` antes de criar um relatório.

Outros endereços, só em `127.0.0.1`:

| Serviço | Endereço |
|---|---|
| Postgres | `localhost:5433` (usuário `postgres`, banco `reports`) |
| MinIO API | http://localhost:9100 |
| MinIO console | http://localhost:9101 (`STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY`) |

Depois de mudar o código, reconstrua o app:

```bash
docker compose up -d --build --wait app
```

## Testar com dados reais

`restore-backup.sh` recria o ambiente do zero com um backup de produção. A cada execução ele:

1. apaga tudo: containers, banco e bucket locais;
2. restaura o dump no Postgres;
3. alinha o histórico de migrations do Prisma, como foi feito na migração para o Coolify (registro com falha da `20250109192353_`, default do `ScopeService.name` e baseline), e confere que o schema bate com o `prisma/schema.prisma`;
4. copia as imagens para o bucket e troca o prefixo das URLs das fotos e dos logos pelo MinIO local;
5. sobe o app.

```bash
# dump e pasta com o conteúdo do bucket (clients/ e reports/)
./restore-backup.sh ~/backup-reports/prod-qualy.dump ~/backup-reports/minio/prod-reports

# ou uma pasta no formato do migration/1-backup.sh (db.dump + minio/)
./restore-backup.sh migration/backup-AAAAMMDD-HHMMSS
```

## Limpar

```bash
docker compose down        # para tudo e mantém os dados
docker compose down -v     # apaga também o banco e as fotos locais
```

## Diferenças conhecidas

- O Postgres segue o banco de produção no Coolify (`postgres:17-alpine`, onde fica o `reports_prod`). A imagem do serviço MinIO de produção não aparece na API do Coolify, então `MINIO_IMAGE` pode ser outra. Ajuste no `.env` se precisar.
- A MinIO parou de publicar as imagens `minio/minio` e `minio/mc`. Aqui se usa `coollabsio/minio`, mantida pelo Coolify, que traz o `mc` junto.
- Num banco vazio, a migration `20250103122551_add_index_to_photoanalisys` roda antes do baseline e falha. O serviço `migrate` a marca como aplicada antes do `migrate deploy` (ver `DEBITO_TECNICO.md`). Em produção o banco vem de dump e não passa por isso.
- Não há proxy HTTPS na frente do app. O acesso é direto por `http://localhost:3100`.
