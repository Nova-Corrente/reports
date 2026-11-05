import { hash } from 'bcryptjs'

export async function passwordsHash(password: string) {
  const passwordHash = await hash(password, 10)
  return passwordHash
}
