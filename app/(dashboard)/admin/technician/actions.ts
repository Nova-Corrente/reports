'use server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import type { TechnicianType } from '@/lib/types'
import type { Technician } from '@prisma/client'

export async function createTechnician(data: TechnicianType) {
  await requireSession()
  try {
    const technician = await prisma.technician.create({
      data: {
        ...data,
      },
    })
    return technician
  } catch (error) {
    console.log(error)
  }
}

export async function updateTechnician(data: Technician) {
  await requireSession()
  try {
    const technician = await prisma.technician.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
      },
    })
    return technician
  } catch (error) {
    console.log(error)
  }
}

export async function getTechnicianByName(name: string) {
  await requireSession()
  try {
    const technician = await prisma.technician.findFirst({
      where: {
        name,
      },
    })
    return technician
  } catch (error) {
    console.log(error)
  }
}

export async function getTechnicianById(id: string) {
  await requireSession()
  try {
    const technician = await prisma.technician.findFirst({
      where: {
        id,
      },
    })
    return technician
  } catch (error) {
    console.log(error)
  }
}

export async function getAllTechnician() {
  await requireSession()
  try {
    const data = await prisma.technician.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}
