import { getDescriptionsId, getPhotoAnalisysById, getRelatorioById } from '@/lib/reportData'
import type { PhotoAnalisysType, Relatorio } from '@/lib/types'
import HeaderReport from '../_components/headerReport'
import PhotoAnalisys from '../_components/photoAnalisys'

export default async function reportViewer({
  params,
}: {
  params: { id: string }
}) {
  const id = Number.parseInt(params.id)
  const photoAnalisys: PhotoAnalisysType[] = await getPhotoAnalisysById(id)
  const relatorioHeader: Relatorio = await getRelatorioById(id)
  const descriptions = await getDescriptionsId(id)

  return (
    <main className=" flex w-full justify-center">
      <div className="container flex w-[780px] flex-col ">
        <HeaderReport
          relatorioHeader={relatorioHeader}
          descriptions={descriptions}
          photoAnalisys={photoAnalisys}
          id={id}
        />
        <aside className="container flex w-[780px] flex-col py-4">
          <PhotoAnalisys photoAnalisys={photoAnalisys} />
        </aside>
      </div>
    </main>
  )
}
