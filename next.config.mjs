// Host do MinIO/S3 atual (as imagens são servidas direto do storage)
const storageUrl = process.env.STORAGE_ENDPOINT
  ? new URL(process.env.STORAGE_ENDPOINT)
  : null

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
