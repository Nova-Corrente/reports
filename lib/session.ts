import { auth } from '@/lib/auth'
import type { Role } from '@/lib/types'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
}

// Server Actions são endpoints POST públicos: toda action precisa chamar uma destas no início
export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Não autenticado')
  }
  return session.user as SessionUser
}

export async function requireRole(...roles: Role[]) {
  const user = await requireSession()
  if (!roles.includes(user.role)) {
    throw new Error('Sem permissão')
  }
  return user
}
