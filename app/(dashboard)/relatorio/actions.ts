'use server'
import prisma from '@/lib/prisma'
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
  const result = await sharp(file).toBuffer()

  return result
}

export async function reduceImageSize(buffer: ArrayBuffer, width: number, height: number) {
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
  return await prisma.photoAnalisys.count({
    where: {
      idReport,
    },
  })
}

export async function savePhotoAnalisys(data: PhotoAnalisysType) {
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
  return await prisma.photoAnalisys.findMany({
    orderBy: {
      id: 'desc',
    },
  })
}

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

export async function deletePhotoAnalisys(photoAnalisysData: PhotoAnalisysType) {
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
  const result = await deleteObject(url)

  if (result) {
    return true
  }
}

export async function createDescriptionAnalisys(data: DescriptionAnalisysType, userId: string) {
  const userExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (!userExist) {
    console.error('User not found')
    return
  }
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
      data,
    })
  } catch (error) {
    console.log(error)
  }
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

export async function deleteDescriptionService(id: number) {
  return await prisma.descriptionAnalisys.delete({
    where: {
      id,
    },
  })
}

export async function createReport(report: ReportCreateType) {
  const userId = await prisma.user.findUnique({
    where: {
      id: report.userId,
    },
    select: {
      id: true,
    },
  })

  if (!userId) {
    console.error('User not found')
    return
  }

  try {
    const data = await prisma.report.create({
      data: {
        scopeServiceId: report.scopeServiceId,
        siteId: report.siteId,
        technicianId: report.technicianId,
        dateService: report.dateService,
        userId: userId?.id,
      },
    })
    return data
  } catch (error) {
    console.log(error)
  }
}

export async function updateReport(data: ReportUpdateType) {
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
      analyst: true,
      user: true,
    },
    orderBy: {
      id: 'desc',
    },
  })
  return relatorios as ReportRelType[]
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

export async function saveClient(data: Client) {
  return await prisma.client.create({
    data: {
      ...data,
    },
  })
}

export async function getClients() {
  return await prisma.client.findMany()
}

export async function getClientById(id: string) {
  return await prisma.client.findUnique({
    where: {
      id,
    },
  })
}

export async function getClientByName(name: string) {
  return await prisma.client.findMany({
    where: {
      name,
    },
  })
}

export async function getClientByPartialName(partialName: string) {
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
  const reportsCreated = await prisma.report.count()
  return reportsCreated
}

export async function getTotalReportsInProgress() {
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
  const reportsFinished = await prisma.report.count({
    where: {
      finishedAt: {
        not: null,
      },
    },
  })
  return reportsFinished
}
