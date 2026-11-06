'use server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import type { TipoSiteType } from '@/lib/types'

export async function getAllSitesType() {
  await requireSession()
  try {
    const data = await prisma.siteType.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function createSiteType(data: TipoSiteType) {
  await requireSession()
  try {
    const response = await prisma.siteType.create({
      data,
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export async function updateTipoSiteType(data: TipoSiteType) {
  await requireSession()
  try {
    const response = await prisma.siteType.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export async function deleteSiteType(id: number) {
  await requireSession()
  try {
    const response = await prisma.siteType.delete({
      where: {
        id,
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export async function getSiteTypeById(id: number) {
  await requireSession()
  try {
    const response = await prisma.siteType.findUnique({
      where: {
        id,
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export async function getSiteTypeByName(name: string) {
  await requireSession()
  try {
    const response = await prisma.siteType.findFirst({
      where: {
        name,
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}
