'use server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import type { Site } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createSite(site: Site) {
  await requireSession()
  try {
    const data = await prisma.site.create({
      data: {
        ...site,
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function updateSite(site: Site) {
  await requireSession()
  try {
    const data = await prisma.site.update({
      where: {
        id: site.id,
      },
      data: {
        ...site,
      },
    })
    revalidatePath('/admin/site')
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function getSiteById(id: number) {
  await requireSession()
  try {
    const data = await prisma.site.findUnique({
      where: {
        id,
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function getSiteByName(idSite: string) {
  await requireSession()
  try {
    const data = await prisma.site.findFirst({
      where: {
        idSite,
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function getAllSites() {
  await requireSession()
  try {
    const data = await prisma.site.findMany({
      include: {
        client: true,
        structureType: true,
        siteType: true,
      },
      orderBy: {
        idSite: 'asc',
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function getSiteByClientName(clientId: string) {
  await requireSession()
  try {
    const data = await prisma.site.findMany({
      where: {
        idClient: clientId,
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}
