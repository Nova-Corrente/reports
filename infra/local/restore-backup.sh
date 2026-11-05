#!/usr/bin/env bash
# Uso: ./restore-backup.sh <pasta-do-backup>
# Carrega no ambiente local um backup gerado por migration/1-backup.sh (db.dump + minio/).
# Apaga o banco e as fotos locais, restaura, e aponta as URLs das imagens para o MinIO local.
set -euo pipefail
cd "$(dirname "$0")"
set -a; source ./.env; set +a
B="$(realpath "$1")"
[ -f "$B/db.dump" ] && [ -d "$B/minio" ] || { echo "Esperado $B/db.dump e $B/minio/"; exit 1; }

dc() { docker compose "$@"; }
psql_db() { dc exec -T db psql -U postgres -v ON_ERROR_STOP=1 "$@"; }

echo ">> parando o app"
dc stop app

echo ">> recriando o banco $POSTGRES_DB"
dc up -d --wait db
psql_db -d postgres -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE)" -c "CREATE DATABASE \"$POSTGRES_DB\""

echo ">> pg_restore"
dc exec -T db pg_restore -U postgres -d "$POSTGRES_DB" --no-owner --no-privileges <"$B/db.dump"

# O banco guarda a URL absoluta do storage de origem: troca o prefixo pelo MinIO local
echo ">> reescrevendo URLs das imagens para $STORAGE_ENDPOINT/$STORAGE_BUCKET"
psql_db -d "$POSTGRES_DB" \
  -c "UPDATE \"PhotoAnalisys\" SET url = regexp_replace(url, '^https?://[^/]+/[^/]+/', '$STORAGE_ENDPOINT/$STORAGE_BUCKET/')" \
  -c "UPDATE \"Client\" SET img = regexp_replace(img, '^https?://[^/]+/[^/]+/', '$STORAGE_ENDPOINT/$STORAGE_BUCKET/') WHERE img IS NOT NULL"

echo ">> copiando as imagens para o bucket $STORAGE_BUCKET"
dc up -d --wait minio
dc run --rm --no-deps -v "$B/minio":/backup:ro --entrypoint sh minio-init -c \
  "mc mb --ignore-existing local/$STORAGE_BUCKET && mc anonymous set download local/$STORAGE_BUCKET \
  && mc mirror --overwrite --remove /backup local/$STORAGE_BUCKET"

echo ">> subindo o app"
dc up -d --wait app

psql_db -d "$POSTGRES_DB" -tAc "SELECT count(*) || ' relatórios, ' || (SELECT count(*) FROM \"PhotoAnalisys\") || ' fotos' FROM \"Report\""
echo "Pronto: $AUTH_URL"
