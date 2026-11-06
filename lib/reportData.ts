// Leituras do relatório sem checagem de sessão, para o /reportviewer, que o Chromium do PDF acessa sem cookie.
// Não é um módulo 'use server': estas funções não viram endpoints. Nas telas logadas, use as actions de relatorio/actions.ts.
import prisma from '@/lib/prisma'
import type { Relatorio } from '@/lib/types'

export async function getPhotoAnalisysById(id: number) {
  const photoAnalisys = await prisma.photoAnalisys.findMany({
    orderBy: {
      index: 'asc',
    },
    where: {
      idReport: id,
    },
  })

  return photoAnalisys
}

export async function getDescriptionsId(id: number) {
  const idReport = id

  return await prisma.descriptionAnalisys.findMany({
    select: {
      id: true,
      idReport: true,
      service: true,
      status: true,
    },
    where: {
      idReport,
    },
  })
}

export async function getRelatorioById(id: number) {
  const relatorio = await prisma.report.findUnique({
    where: {
      id,
    },
    include: {
      scopeService: true,
      technician: true,
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      analyst: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      sites: {
        select: {
          id: true,
          idSite: true,
          altura: true,
          endereco: true,
          bairro: true,
          cidade: true,
          numero: true,
          uf: true,
          client: true,
          structureType: true,
          siteType: true,
        },
      },
    },
  })
  return relatorio as Relatorio
}
