import puppeteer from 'puppeteer'

export async function GET(request: Request, { params }: { params: { idReport: number } }) {
  console.log('Iniciando o puppeteer')

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  console.log('Navegador iniciado.')

  const page = await browser.newPage()
  console.log('Nova página aberta.')

  await page.setViewport({ width: 1600, height: 65536 })
  console.log('Tamanho da página definido.')

  page.goto(`${process.env.NEXT_PUBLIC_URL_APP}/reportviewer/${params.idReport}`, {
    waitUntil: 'networkidle2',
  })

  console.log('Pagina carregada.')

  await page.emulateMediaType('print')
  console.log('Tipo de midia definido.')

  const pdf = await page.pdf({
    format: 'LETTER',
    printBackground: true,
    displayHeaderFooter: true,
    // headerTemplate: `<div style="font-size: 10px; padding-bottom: 5px; display: flex; justify-content: space-between; width: 100%; margin-left: 20px; margin-right: 20px;">
    //   <div style="text-align: left;">
    //     <span class="date"></span>
    //   </div>
    // </div>`,
    footerTemplate: `
      <div style="font-size: 10px; padding-top: 5px; display: flex; justify-content: space-between; width: 100%; margin-left: 20px; margin-right: 20px;">
        <div style="text-align: left;">
          <span>${new Date().toLocaleDateString('pt-BR')}</span>
        </div>
        <div>
        <span>Pagina</span> - <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      </div>
    `,
    margin: {
      top: '20px',
      right: '15px',
      bottom: '20px',
      left: '15px',
    },
  })
  console.log('PDF gerado.')

  await browser.close()
  console.log('Navegador fechado.')

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
    },
  })
}
