import ncLogo from '@/assets/ncLogo.png'
import type { PhotoAnalisysType, Relatorio, User } from '@/lib/types'
import { PlusIcon } from 'lucide-react'
import Image from 'next/image'
import AproveReport from './aproveReport'
import { DialogServiceDescription } from './dialogServiceDescription'
import GeneratePdf from './generatePdf'
import HeaderReportSite from './headerReportSite'
import ModalAddCardPhoto from './photo/modalAddCardPhoto'
import { RemoveServices } from './removerServices'
import ReopenReport from './reopenReport'

interface RelatorioHeaderProps {
  relatorioHeader: Relatorio
  descriptions: {
    id: number
    idReport: number
    service: string
    status: string
  }[]
  photoAnalisys: PhotoAnalisysType[]
  id: number
  user: User
}

export default function HeaderReport({ relatorioHeader, descriptions, photoAnalisys, id, user }: RelatorioHeaderProps) {
  return (
    <header className="flex flex-col bg-white">
      <div className="flex items-center justify-between">
        <div className="h-20 w-44">
          <Image src={ncLogo} alt="Logo" width={400} height={400} className="h-full w-full" />
        </div>
        <div className="flex justify-center items-center h-full w-[515px]">
          <h1 className="text-2xl font-bold uppercase">{relatorioHeader.scopeService.name}</h1>
        </div>
        <div className="h-20 w-44">
          <Image
            src={relatorioHeader.sites.client.img ?? ncLogo}
            alt="LogoClient"
            width={400}
            height={400}
            className="h-full w-full"
          />
        </div>
      </div>
      <HeaderReportSite relatorioHeader={relatorioHeader} />
      <div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="w-4/5 px-2">Serviços</th>
              <th className="text-center">OK</th>
              <th className="text-center">NA</th>
            </tr>
          </thead>
          <tbody>
            {descriptions.length > 0
              ? descriptions.map((description) => (
                <tr key={description.id} className="border-2">
                  <td className="border-2 px-2">{description.service}</td>
                  <td className="border-2 text-center">{description.status === 'ok' ? 'X' : ''}</td>
                  <td className="border-2 text-center">{description.status === 'na' ? 'X' : ''}</td>
                  <td className="flex items-center justify-center">
                    {descriptions.length === 1 || relatorioHeader.finishedAt ? (
                      <p className="cursor-pointer rounded-sm bg-destructive bg-red-300 p-2 text-destructive-foreground text-white shadow-sm hover:bg-destructive/90">
                        Del
                      </p>
                    ) : (
                      <RemoveServices idService={description.id} />
                    )}
                  </td>
                </tr>
              ))
              : ''}
          </tbody>
        </table>
        <hr />
        <div className="flex justify-end gap-2 p-2">
          {relatorioHeader.finishedAt ? (
            <ReopenReport
              dialogButton={'Reabrir Relatório'}
              dialogTitle={'Reabrir Relatório'}
              dialogDescription={'Tela para reabrir um relatório'}
              idReport={id}
            />
          ) : (
            <> </>
          )}
          {relatorioHeader.finishedAt ? (
            <GeneratePdf
              dialogButton={'Gerar PDF'}
              dialogTitle={'Gerar PDF'}
              dialogDescription={'Tela para gerar um PDF'}
              idReport={id}
            />
          ) : (
            <> </>
          )}
          {photoAnalisys.length > 4 && relatorioHeader.finishedAt === null ? (
            <AproveReport
              dialogButton={'Finalizar Relatório'}
              dialogTitle={'Finalizar Relatório'}
              dialogDescription={'Tela para finalizar um relatório'}
              idReport={id}
            />
          ) : (
            ''
          )}
          {relatorioHeader.finishedAt === null && user ? (
            <DialogServiceDescription
              dialogButton={'Adicionar Serviço'}
              dialogDescription={'Adicione um novo serviço'}
              dialogTitle={'Adicionar Serviço'}
              idReport={id}
              serviceDescription={descriptions}
            />
          ) : (
            ''
          )}
          {descriptions.length > 0 && relatorioHeader.finishedAt === null ? (
            <ModalAddCardPhoto
              textButton={<PlusIcon className="h-6 w-6" />}
              textDescription={'Adicione uma nova foto'}
              textTitle={'Adicionar Foto'}
            />
          ) : (
            ''
          )}
        </div>
      </div>
    </header>
  )
}
