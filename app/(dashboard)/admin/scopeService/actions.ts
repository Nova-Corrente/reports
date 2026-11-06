'use server'
import type { ScopeServiceSchema } from '@/lib/formValidationSchemas'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import type { ScopeService } from '@prisma/client'

export async function createScopeService(data: ScopeServiceSchema) {
  await requireSession()
  try {
    const scopeService = await prisma.scopeService.create({
      data: {
        ...data,
      },
    })
    return scopeService
  } catch (error) {
    console.log(error)
  }
}

export async function updateScopeService(data: ScopeService) {
  await requireSession()
  try {
    const scopeService = await prisma.scopeService.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
      },
    })
    return scopeService
  } catch (error) {
    console.log(error)
  }
}

export async function getScopeServiceByName(name: string) {
  await requireSession()
  try {
    const scopeService = await prisma.scopeService.findFirst({
      where: {
        name,
      },
    })
    return scopeService
  } catch (error) {
    console.log(error)
  }
}

export async function getScopeServiceById(id: number) {
  await requireSession()
  try {
    const scopeService = await prisma.scopeService.findFirst({
      where: {
        id,
      },
    })
    return scopeService
  } catch (error) {
    console.log(error)
  }
}

export async function getAllScopeService() {
  await requireSession()
  try {
    const data = await prisma.scopeService.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}
