'use server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import type { StructureTypeType } from '@/lib/types'

export async function getAllStructuresType() {
  await requireSession()
  try {
    const data = await prisma.structureType.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function createStructureType(data: StructureTypeType) {
  await requireSession()
  try {
    const response = await prisma.structureType.create({
      data,
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export async function updateStructureType(data: StructureTypeType) {
  await requireSession()
  try {
    const response = await prisma.structureType.update({
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

export async function deleteStructureType(id: number) {
  await requireSession()
  try {
    const response = await prisma.structureType.delete({
      where: {
        id,
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export async function getStructureTypeById(id: number) {
  await requireSession()
  try {
    const response = await prisma.structureType.findUnique({
      where: {
        id,
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export async function getStructureTypeByName(name: string) {
  await requireSession()
  try {
    const response = await prisma.structureType.findFirst({
      where: {
        name,
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}
