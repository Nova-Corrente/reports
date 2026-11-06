import type { Role } from '@/lib/types'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: Role | undefined | unknown
  }
  interface Session {
    user: {
      id: string
      role: Role | undefined | unknown
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role | undefined | unknown
  }
}
