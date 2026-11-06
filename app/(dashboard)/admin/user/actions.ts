'use server'
import prisma from '@/lib/prisma'
import { requireRole, requireSession } from '@/lib/session'
import type { Role, UserCreate, UserRePwd, UserUpdate } from '@/lib/types'
import { compare, hash } from 'bcryptjs'

export async function createUser(user: UserCreate) {
  await requireRole('ADMIN')
  const passwordHash = await hash(user.password, 10)
  try {
    const data = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
      },
      select: { id: true },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function updateUser(user: UserUpdate) {
  await requireRole('ADMIN')
  const data = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    select: { id: true },
  })
  return data
}

// Só o ADMIN troca a senha de outra conta; quem troca a própria precisa informar a senha atual
export async function updatePassword(user: UserRePwd) {
  const sessionUser = await requireSession()
  const isAdmin = sessionUser.role === 'ADMIN'
  if (sessionUser.id !== user.id && !isAdmin) {
    throw new Error('Sem permissão')
  }
  if (!isAdmin || user.currentPassword !== undefined) {
    const current = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
    const isValid = await compare(user.currentPassword ?? '', current?.passwordHash ?? '')
    if (!isValid) {
      return { error: 'Senha atual incorreta.' }
    }
  }
  const passwordHash = await hash(user.passwordHash, 10)
  const data = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash,
    },
  })
  return { id: data.id }
}

export async function getData() {
  await requireRole('ADMIN')
  const data = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
  return data
}

export async function getUserAnalysts(role: Role) {
  await requireSession()
  const data = await prisma.user.findMany({
    where: {
      role,
    },
    select: {
      id: true,
      name: true,
    },
  })
  return data
}

export async function getUserRoleCount(role: Role) {
  await requireSession()
  const data = await prisma.user.count({
    where: {
      role,
    },
  })
  return data
}

export async function getUserByEmail(email: string) {
  const sessionUser = await requireSession()
  if (sessionUser.email !== email && sessionUser.role !== 'ADMIN') {
    throw new Error('Sem permissão')
  }
  const data = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  })
  return data
}
