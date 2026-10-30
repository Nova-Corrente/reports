import puppeteer from 'puppeteer'

export async function GET(
  request: Request,
  { params }: { params: { idReport: number } },
) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1024 })
  await page.goto(`${process.env.URL_APP}/reportviewer/${params.idReport}`, {
    waitUntil: 'networkidle0',
  })
  const pdf = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px',
    },
  })

  await browser.close()

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
    },
  })

  // return Response.json({ message: `Hello ${Number(params.idreport)}` })
}
