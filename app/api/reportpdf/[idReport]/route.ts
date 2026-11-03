import puppeteer from 'puppeteer'

export async function GET(request: Request, { params }: { params: { idReport: number } }) {
  console.log('Iniciando o puppeteer')

  const browser = await puppeteer.launch({
    // --disable-dev-shm-usage: o /dev/shm do Docker tem só 64MB e o Chromium trava em páginas grandes
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    protocolTimeout: 180_000,
  })
  console.log('Navegador iniciado.')

  try {
    const page = await browser.newPage()
    console.log('Nova página aberta.')

    await page.setViewport({ width: 1600, height: 65536 })
    console.log('Tamanho da página definido.')

    // Acessa o próprio app por dentro do container, sem passar pelo proxy público
    const baseUrl = process.env.URL_APP ?? process.env.NEXT_PUBLIC_URL_APP
    await page.goto(`${baseUrl}/reportviewer/${params.idReport}`, {
      waitUntil: 'networkidle2',
      timeout: 120_000,
    })
    console.log('Pagina carregada.')

    await page.emulateMediaType('print')
    console.log('Tipo de midia definido.')

    const pdf = await page.pdf({
      format: 'LETTER',
      // O padrão é 30s; relatórios com centenas de fotos passam disso com o servidor ocupado
      timeout: 120_000,
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

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } finally {
    await browser.close()
    console.log('Navegador fechado.')
  }
}
