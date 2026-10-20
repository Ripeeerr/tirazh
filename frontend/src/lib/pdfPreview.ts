import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import manifest from 'pdfjs-dist/package.json'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export async function renderPdfPreview(file: File, signal: AbortSignal) {
  const data = new Uint8Array(await file.arrayBuffer())
  signal.throwIfAborted()
  const task = getDocument({
    data,
    useSystemFonts: true,
    cMapUrl: `/pdfjs/${manifest.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `/pdfjs/${manifest.version}/standard_fonts/`,
    wasmUrl: `/pdfjs/${manifest.version}/wasm/`,
  })
  const cancel = () => {
    void task.destroy()
  }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    const pdf = await task.promise
    signal.throwIfAborted()
    const page = await pdf.getPage(1)
    const original = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: 1800 / Math.max(original.width, original.height) })
    const canvas = window.document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await page.render({ canvas, viewport }).promise
    signal.throwIfAborted()
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('Не удалось подготовить PDF'))),
        'image/png',
      ),
    )
    return { blob, pages: pdf.numPages }
  } finally {
    signal.removeEventListener('abort', cancel)
    await task.destroy()
  }
}
