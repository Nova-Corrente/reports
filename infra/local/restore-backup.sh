#!/usr/bin/env bash
# Recria o ambiente local do zero com os dados de um backup de produção (Postgres + MinIO).
#
# Uso:
#   ./restore-backup.sh <arquivo.dump> <pasta-das-imagens>
#   ./restore-backup.sh <pasta-do-backup>     # formato do migration/1-backup.sh: db.dump + minio/
#
# <pasta-das-imagens> é o conteúdo do bucket (as pastas clients/ e reports/), por exemplo
# ~/backup-reports/minio/prod-reports.
#
# Sempre apaga tudo antes (containers, banco e bucket locais), restaura o dump, copia as imagens,
# aponta as URLs do banco para o MinIO local e sobe o app.
set -euo pipefail
cd "$(dirname "$0")"

if [ $# -eq 1 ] && [ -d "$1" ]; then
  DUMP="$1/db.dump"
  IMAGES="$1/minio"
elif [ $# -eq 2 ]; then
  DUMP="$1"
  IMAGES="$2"
else
  sed -n '4,9p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi
[ -f "$DUMP" ] || { echo "Dump não encontrado: $DUMP"; exit 1; }
[ -d "$IMAGES" ] || { echo "Pasta de imagens não encontrada: $IMAGES"; exit 1; }
DUMP="$(realpath "$DUMP")"
IMAGES="$(realpath "$IMAGES")"

# Variável do ambiente, senão do .env (o ambiente tem precedência, como no docker compose)
conf() { printenv "$1" || sed -n "s/^$1=//p" .env | tail -1; }
DB="$(conf POSTGRES_DB)"
ENDPOINT="$(conf STORAGE_ENDPOINT)"
BUCKET="$(conf STORAGE_BUCKET)"
APP_URL="$(conf AUTH_URL)"

dc() { docker compose "$@"; }
psql_db() { dc exec -T db psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 "$@"; }

echo ">> apagando o ambiente local (containers, banco e bucket)"
dc down -v --remove-orphans

echo ">> subindo Postgres e MinIO vazios"
dc up -d --wait db minio

echo ">> restaurando $(basename "$DUMP") no banco $DB"
dc exec -T db pg_restore -U postgres -d "$DB" --no-owner --no-privileges --exit-on-error <"$DUMP"

# Mesmo alinhamento feito na migração para o Coolify (~/backup-reports/migrations.sh): o banco do
# servidor antigo tem um registro com falha da 20250109192353_ e o histórico anterior ao baseline.
# Cada passo só roda se for preciso; no fim o schema tem que bater com o prisma/schema.prisma.
echo ">> alinhando o histórico de migrations do Prisma"
docker image inspect reports-local-app >/dev/null 2>&1 || dc build app
applied() { psql_db -tAc "SELECT 1 FROM _prisma_migrations WHERE migration_name = '$1' AND finished_at IS NOT NULL"; }
failed() { psql_db -tAc "SELECT 1 FROM _prisma_migrations WHERE migration_name = '$1' AND finished_at IS NULL AND rolled_back_at IS NULL"; }
prisma() { dc run --rm --no-deps -T --entrypoint npx migrate prisma "$@" >/dev/null; }
[ -n "$(failed 20250109192353_)" ] && prisma migrate resolve --rolled-back 20250109192353_
psql_db -q -c "ALTER TABLE \"ScopeService\" ALTER COLUMN \"name\" SET DEFAULT 'RELATÓRIO DE MANUTENÇÃO CORRETIVA'"
for m in 20250103122551_add_index_to_photoanalisys 20250110033712_restart_bd; do
  [ -z "$(applied "$m")" ] && prisma migrate resolve --applied "$m"
done
if ! dc run --rm --no-deps -T --entrypoint sh migrate -c \
  'npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code'; then
  echo "O schema restaurado difere do prisma/schema.prisma (diferença acima). Nada foi marcado além disso."
  exit 1
fi

# O banco guarda a URL absoluta do storage de origem: troca host e bucket pelos do MinIO local
echo ">> apontando as URLs das imagens para $ENDPOINT/$BUCKET"
psql_db -q \
  -c "UPDATE \"PhotoAnalisys\" SET url = regexp_replace(url, '^https?://[^/]+/[^/]+/', '$ENDPOINT/$BUCKET/')" \
  -c "UPDATE \"Client\" SET img = regexp_replace(img, '^https?://[^/]+/[^/]+/', '$ENDPOINT/$BUCKET/') WHERE img IS NOT NULL"

echo ">> copiando $(find "$IMAGES" -type f | wc -l) imagens para o bucket $BUCKET"
dc run --rm --no-deps -v "$IMAGES":/backup:ro --entrypoint sh minio-init -c \
  "mc mb --ignore-existing local/$BUCKET && mc anonymous set download local/$BUCKET \
  && mc --quiet mirror /backup local/$BUCKET >/dev/null"

echo ">> subindo o app (migrations pendentes rodam no serviço migrate)"
if ! dc up -d --wait; then
  dc logs migrate app --tail 30
  exit 1
fi

echo ">> conferência"
psql_db -tA -c "SELECT (SELECT count(*) FROM \"Report\") || ' relatórios, '
  || (SELECT count(*) FROM \"PhotoAnalisys\") || ' fotos, '
  || (SELECT count(*) FROM \"User\") || ' usuários'"
dc run --rm --no-deps --entrypoint sh minio-init -c "mc ls -r local/$BUCKET | wc -l" | xargs echo "objetos no bucket:"
echo "Pronto: $APP_URL"
