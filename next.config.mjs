// Host do MinIO/S3 atual (as imagens são servidas direto do storage)
const storageUrl = process.env.STORAGE_ENDPOINT
  ? new URL(process.env.STORAGE_ENDPOINT)
  : null

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Sem isso o next/image entrega SVG com a URL crua do storage, que o navegador não resolve
    // (host interno do Docker). A CSP impede que scripts dentro do SVG rodem.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      ...(storageUrl
        ? [
            {
              protocol: storageUrl.protocol.replace(':', ''),
              hostname: storageUrl.hostname,
              port: storageUrl.port,
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.115',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.120',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: '10.0.3.6',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
    ],
  },
}

export default nextConfig
