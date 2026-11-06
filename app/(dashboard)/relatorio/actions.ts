'use server'
import prisma from '@/lib/prisma'
import * as reportData from '@/lib/reportData'
import { requireSession } from '@/lib/session'
import type {
  DescriptionAnalisysType,
  PhotoAnalisysType,
  Relatorio,
  ReportCreateType,
  ReportRelType,
  ReportUpdateType,
} from '@/lib/types'
import { deleteObject, uploadObject } from '@/service/storage'
import type { Client } from '@prisma/client'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'

export async function teste(file: ArrayBuffer) {
  await requireSession()
  const result = await sharp(file).toBuffer()

  return result
}

export async function reduceImageSize(buffer: ArrayBuffer, width: number, height: number) {
  await requireSession()
  const result = await sharp(buffer)
    .resize(width, height, {
      fit: 'fill',
      kernel: sharp.kernel.nearest,
      withoutEnlargement: true,
    })
    .toBuffer()

  const formData = new FormData()
  formData.append('file', new Blob([new Uint8Array(result)], { type: 'image/jpeg' }))

  return formData
}

export async function upLoadPhotoAnalisys(formData: FormData, idReport: number) {
  await requireSession()
  if (!formData || !idReport) {
    throw new Error('Parâmetros inválidos')
  }
  const file = formData.get('file') as File
  const fileName = file.name

  try {
    const binaryFile = await file.arrayBuffer()
    const fileBuffer = Buffer.from(binaryFile)
    const keyName = `reports/${idReport}/${Date.now()}-${fileName}`
    const result = await uploadObject(keyName, fileBuffer, file)
    return result
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    throw new Error('Erro ao processar imagem')
  }
}

export async function photoAnalisysLength(idReport: number) {
  await requireSession()
  return await prisma.photoAnalisys.count({
    where: {
      idReport,
    },
  })
}

export async function savePhotoAnalisys(data: PhotoAnalisysType) {
  await requireSession()
  // save relatorio to database asynchronously
  if (data.id) {
    return await prisma.photoAnalisys.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
      },
    })
  }

  return await prisma.photoAnalisys.create({
    data: {
      ...data,
    },
  })
  // try {
  //   const result = await prisma.photoAnalisys.update({
  //     where: {
  //       id: data.id,
  //     },
  //     data: {
  //       url: data.url,
  //       name: data.name,
  //       description: data.description,
  //     },
  //   })
  //   revalidatePath(`/relatorio/${data.idReport}`)
  //   return result
  // } catch (error) {
  //   console.error('Erro ao salvar foto:', error)
  //   return null
  // }
}

export async function saveDescriptionAnalisys(data: { id: number; description: string }) {
  await requireSession()
  try {
    const photo = await prisma.photoAnalisys.findUnique({
      where: { id: data.id },
      select: { idReport: true },
    })

    const result = await prisma.photoAnalisys.update({
      where: {
        id: data.id,
      },
      data: {
        description: data.description,
      },
    })

    if (photo) {
      revalidatePath(`/relatorio/${photo.idReport}`)
    }
    return result
  } catch (error) {
    console.error('Erro ao salvar descrição:', error)
    return null
  }
}

export async function getPhotoAnalisys() {
  await requireSession()
  return await prisma.photoAnalisys.findMany({
    orderBy: {
      id: 'desc',
    },
  })
}

export async function getPhotoAnalisysById(id: number) {
  await requireSession()
  return await reportData.getPhotoAnalisysById(id)
}

export async function deletePhotoAnalisys(photoAnalisysData: PhotoAnalisysType) {
  await requireSession()
  const id = photoAnalisysData.id

  const result = await deleteObject(photoAnalisysData.url)

  if (!result) {
    throw new Error('Erro ao deletar imagem no storage')
  }

  const resultDelete = await prisma.photoAnalisys.delete({
    where: {
      id,
    },
  })

  if (resultDelete) {
    await prisma.photoAnalisys.updateMany({
      where: {
        idReport: photoAnalisysData.idReport,
        index: {
          gt: photoAnalisysData.index,
        },
      },
      data: {
        index: {
          decrement: 1,
        },
      },
    })
    return true
  }
}

export async function updateNewIndexPhotoAnalisys(id: number, index: number) {
  await requireSession()
  return await prisma.photoAnalisys.update({
    where: {
      id,
    },
    data: {
      index,
    },
  })
}

export async function deletePhoto(url: string) {
  await requireSession()
  const result = await deleteObject(url)

  if (result) {
    return true
  }
}

export async function createDescriptionAnalisys(data: DescriptionAnalisysType) {
  const { id: userId } = await requireSession()
  const existingDescription = await prisma.descriptionAnalisys.findFirst({
    where: {
      idReport: data.idReport,
    },
  })

  if (existingDescription === null) {
    await prisma.report.update({
      where: {
        id: data.idReport,
      },
      data: {
        updatedAt: new Date(),
        analystId: userId,
      },
    })
  }

  try {
    return await prisma.descriptionAnalisys.create({
      data: {
        idReport: data.idReport,
        service: data.service,
        status: data.status,
      },
    })
  } catch (error) {
    console.log(error)
  }
}

export async function getDescriptionsId(id: number) {
  await requireSession()
  return await reportData.getDescriptionsId(id)
}

export async function deleteDescriptionService(id: number) {
  await requireSession()
  return await prisma.descriptionAnalisys.delete({
    where: {
      id,
    },
  })
}

export async function createReport(report: ReportCreateType) {
  const { id: userId } = await requireSession()
  try {
    const data = await prisma.report.create({
      data: {
        scopeServiceId: report.scopeServiceId,
        siteId: report.siteId,
        technicianId: report.technicianId,
        dateService: report.dateService,
        userId,
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function updateReport(data: ReportUpdateType) {
  await requireSession()
  return await prisma.report.update({
    where: {
      id: data.id,
    },
    data: {
      scopeServiceId: data.scopeServiceId,
      siteId: data.siteId,
      technicianId: data.technicianId,
      dateService: data.dateService,
    },
  })
}

export async function updateReportFinished(id: number) {
  await requireSession()
  return await prisma.report.update({
    where: {
      id,
    },
    data: {
      finishedAt: new Date(),
    },
  })
}

export async function reopenReport(id: number) {
  await requireSession()
  return await prisma.report.update({
    where: {
      id,
    },
    data: {
      finishedAt: null,
    },
  })
}

export async function getRelatorios() {
  await requireSession()
  const relatorios = await prisma.report.findMany({
    select: {
      id: true,
      scopeServiceId: true,
      siteId: true,
      technicianId: true,
      dateService: true,
      createdAt: true,
      updatedAt: true,
      finishedAt: true,
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
          idClient: true,
          siteTypeId: true,
          structureTypeId: true,
          client: true,
          structureType: true,
          siteType: true,
        },
      },
      technician: true,
      scopeService: true,
      analyst: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: {
      id: 'desc',
    },
  })
  return relatorios as ReportRelType[]
}

export async function getRelatorioById(id: number) {
  await requireSession()
  return await reportData.getRelatorioById(id)
}

export async function saveClient(data: Client) {
  await requireSession()
  return await prisma.client.create({
    data: {
      ...data,
    },
  })
}

export async function getClients() {
  await requireSession()
  return await prisma.client.findMany()
}

export async function getClientById(id: string) {
  await requireSession()
  return await prisma.client.findUnique({
    where: {
      id,
    },
  })
}

export async function getClientByName(name: string) {
  await requireSession()
  return await prisma.client.findMany({
    where: {
      name,
    },
  })
}

export async function getClientByPartialName(partialName: string) {
  await requireSession()
  return await prisma.client.findMany({
    where: {
      name: {
        contains: partialName,
        mode: 'insensitive',
      },
    },
  })
}

export async function getTotalReportsCreated() {
  await requireSession()
  const reportsCreated = await prisma.report.count()
  return reportsCreated
}

export async function getTotalReportsInProgress() {
  await requireSession()
  const reportsFinished = await prisma.report.count({
    where: {
      finishedAt: {
        not: null,
      },
    },
  })

  const reportsInProgress = await prisma.report.count({
    where: {
      updatedAt: {
        not: null,
      },
    },
  })

  return reportsInProgress - reportsFinished
}

export async function getTotalReportsFinished() {
  await requireSession()
  const reportsFinished = await prisma.report.count({
    where: {
      finishedAt: {
        not: null,
      },
    },
  })
  return reportsFinished
}
