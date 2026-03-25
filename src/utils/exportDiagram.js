export async function exportPNG() {
  const { default: html2canvas } = await import('html2canvas')

  const canvas = document.querySelector('.react-flow')
  if (!canvas) {
    throw new Error('No diagram canvas found.')
  }

  const rendered = await html2canvas(canvas, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const link = document.createElement('a')
  link.download = 'diagramr-export.png'
  link.href = rendered.toDataURL('image/png')
  link.click()
}

export async function exportPDF() {
  const { default: html2canvas } = await import('html2canvas')
  const { default: jsPDF } = await import('jspdf')

  const canvas = document.querySelector('.react-flow')
  if (!canvas) {
    throw new Error('No diagram canvas found.')
  }

  const rendered = await html2canvas(canvas, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = rendered.toDataURL('image/png')
  const imgWidth = rendered.width
  const imgHeight = rendered.height

  // A4 in mm: 210 x 297
  const pdfWidth = 210
  const pdfHeight = (imgHeight * pdfWidth) / imgWidth

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: pdfHeight > pdfWidth ? 'a4' : [pdfWidth, pdfHeight],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('diagramr-export.pdf')
}
