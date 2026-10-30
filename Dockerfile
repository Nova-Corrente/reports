# Imagem Debian (glibc): o Chromium do apt, usado pelo puppeteer no PDF, não roda em alpine
FROM node:20-slim

WORKDIR /app

# openssl: exigido pelo Prisma | chromium: gera o PDF do relatório
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl chromium fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# Usa o Chromium do sistema em vez de baixar outro no npm install
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json .npmrc ./
RUN npm install

COPY . .

RUN npx prisma generate

# O next.config.mjs lê STORAGE_ENDPOINT no build: o Coolify precisa
# expor essa variável também em build time
RUN npm run build

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Aplica as migrations pendentes e sobe o app. As variáveis vêm do Coolify (sem .env na imagem)
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT}"]
