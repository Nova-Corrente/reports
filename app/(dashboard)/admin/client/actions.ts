'use server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import type { ClientType } from '@/lib/types'
import { uploadObject } from '@/service/storage'
import type { Client } from '@prisma/client'

export async function uploadClientLogo(formData: FormData, idClient: string) {
  await requireSession()
  const file = formData.get('file') as File

  const binaryFile = await file.arrayBuffer()
  const fileBuffer = Buffer.from(binaryFile)

  const keyName = `clients/${idClient}/logo/${file.name}`

  const result = uploadObject(keyName, fileBuffer, file)

  return result
}

export async function createClient(data: ClientType) {
  await requireSession()
  try {
    const client = await prisma.client.create({
      data: {
        ...data,
      },
    })
    return client
  } catch (error) {
    console.log(error)
  }
}

export async function updateClient(data: Client) {
  await requireSession()
  try {
    const client = await prisma.client.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
      },
    })
    return client
  } catch (error) {
    console.log(error)
  }
}

export async function getClientByName(name: string) {
  await requireSession()
  try {
    const client = await prisma.client.findFirst({
      where: {
        name,
      },
    })
    return client
  } catch (error) {
    console.log(error)
  }
}

export async function getClientById(id: string) {
  await requireSession()
  try {
    const client = await prisma.client.findFirst({
      where: {
        id,
      },
    })
    return client
  } catch (error) {
    console.log(error)
  }
}

export async function getAllClient() {
  await requireSession()
  try {
    const data = await prisma.client.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}
