import { z } from 'zod'

export const userSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(3, {
      message: 'Nome de usuário deve ter pelo menos 3 caracteres.',
    }),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'USER', 'ANALYST', 'TECHNICIAN', 'COORDINATOR']),
    passwordHash: z.string().min(8, {
      message: 'A senha deve ter pelo menos 8 caracteres.',
    }),
    confirmPassword: z.string().min(8, {
      message: 'A senha deve ter pelo menos 8 caracteres.',
    }),
  })
  .refine((data) => data.passwordHash === data.confirmPassword, {
    message: 'As senhas devem ser iguais.',
    path: ['confirmPassword'],
  })

export type UserSchema = z.infer<typeof userSchema>

export const userRePwdSchema = z
  .object({
    id: z.string().optional(),
    currentPassword: z.string().optional(),
    passwordHash: z.string().min(8, {
      message: 'A senha deve ter pelo menos 8 caracteres.',
    }),
    confirmPassword: z.string().min(8, {
      message: 'A senha deve ter pelo menos 8 caracteres.',
    }),
  })
  .refine((data) => data.passwordHash === data.confirmPassword, {
    message: 'As senhas devem ser iguais.',
    path: ['confirmPassword'],
  })

export type UserRePwdSchema = z.infer<typeof userRePwdSchema>

export const userUpdateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, {
    message: 'Nome de usuário deve ter pelo menos 3 caracteres.',
  }),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER', 'ANALYST', 'TECHNICIAN', 'COORDINATOR']),
})

export type UserUpdateSchema = z.infer<typeof userUpdateSchema>

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Nome do Cliente é obrigatório.' }),
  img: z.string().optional(),
})

export type ClientSchema = z.infer<typeof clientSchema>

export const technicianSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Nome do Técnico é obrigatório.' }),
})

export type TechnicianSchema = z.infer<typeof technicianSchema>

export const structureTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, { message: 'Nome do Tipo de Estrutura é obrigatório.' }),
})

export type StructureTypeSchema = z.infer<typeof structureTypeSchema>

export const siteTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, { message: 'Nome do Tipo de Site é obrigatório.' }),
})

export type SiteTypeSchema = z.infer<typeof siteTypeSchema>

export const siteSchema = z.object({
  id: z.number().optional(),
  idSite: z.string().min(5, { message: 'ID do Site é obrigatório.' }),
  altura: z.string().optional(),
  endereco: z.string().min(3, { message: 'Endereço é obrigatório.' }),
  bairro: z.string().min(3, { message: 'Bairro é obrigatório.' }),
  numero: z.string().min(1, { message: 'Número é obrigatório.' }),
  cidade: z.string().min(3, { message: 'Cidade é obrigatório.' }),
  uf: z.string().min(2, { message: 'UF é obrigatório.' }),
  idClient: z.string().min(1, { message: 'Cliente é obrigatório.' }),
  structureTypeId: z.preprocess((val) => (val ? Number(val) : undefined), z.number()),
  siteTypeId: z.preprocess((val) => (val ? Number(val) : undefined), z.number()),
})

export type SiteSchema = z.infer<typeof siteSchema>

export const reportSchema = z.object({
  id: z.number().optional(),
  siteId: z.number().min(1, { message: 'Site é obrigatório.' }),
  scopeServiceId: z.number().min(1, { message: 'Escopo de serviço é obrigatório.' }),
  technicianId: z.string().min(1, { message: 'Técnico é obrigatório.' }),
  dateService: z.date({
    required_error: 'Uma data de serviço é obrigatória.',
  }),
})

export type ReportSchema = z.infer<typeof reportSchema>

export const scopeServiceSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, { message: 'Nome do escopo é obrigatório.' }),
})

export type ScopeServiceSchema = z.infer<typeof scopeServiceSchema>
