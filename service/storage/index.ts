import { CONFIG } from '@/config/config'
import validateImageType from '@/lib/validateImageType'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const clientS3 = new S3Client({
  region: CONFIG.providers.storage.region,
  endpoint: CONFIG.providers.storage.endpoint,
  // MinIO usa o bucket no caminho (host/bucket/key). Sem isso o SDK monta bucket.host, que não resolve no Docker
  forcePathStyle: true,
  credentials: {
    accessKeyId: CONFIG.providers.storage.accessKeyId,
    secretAccessKey: CONFIG.providers.storage.secretAccessKey,
  },
})

export const uploadObject = async (key: string, body: Buffer | Uint8Array | Blob | string, file: File) => {
  const command = new PutObjectCommand({
    Bucket: CONFIG.providers.storage.bucket,
    Key: key,
    Body: body,
    ContentType: file.type,
  })

  if (validateImageType(file)) {
    try {
      await clientS3.send(command)
      const url = `${CONFIG.providers.storage.endpoint}/${CONFIG.providers.storage.bucket}/${key}`
      return url
    } catch (error) {
      console.log(error)
      return null
    }
  } else {
    return null
  }
}

export const deleteObject = async (url: string) => {
  const key = url.replace(`${CONFIG.providers.storage.endpoint}/${CONFIG.providers.storage.bucket}/`, '')

  const command = new DeleteObjectCommand({
    Bucket: CONFIG.providers.storage.bucket,
    Key: key,
  })

  try {
    await clientS3.send(command)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
