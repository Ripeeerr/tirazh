import { useEffect, useState } from 'react'

type PreviewState = {
  file: File
  url: string | null
  loading: boolean
  error: string | null
  pages: number | null
}

export function useArtworkPreview(file: File | null) {
  const [state, setState] = useState<PreviewState | null>(null)
  useEffect(() => {
    if (!file) {
      setState(null)
      return
    }
    const controller = new AbortController()
    let disposed = false
    let objectUrl: string | null = null
    const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf'
    setState({ file, url: null, loading: true, error: null, pages: null })
    const prepare = async () => {
      let pages: number | null = null
      if (isPdf) {
        const { renderPdfPreview } = await import('../lib/pdfPreview')
        controller.signal.throwIfAborted()
        const result = await renderPdfPreview(file, controller.signal)
        if (disposed) return
        objectUrl = URL.createObjectURL(result.blob)
        pages = result.pages
      } else if (
        /\.(png|jpe?g)$/i.test(file.name) ||
        ['image/png', 'image/jpeg'].includes(file.type)
      ) {
        objectUrl = URL.createObjectURL(file)
        const image = new Image()
        image.src = objectUrl
        await image.decode()
      } else {
        throw new Error('Неподдерживаемый формат')
      }
      if (!disposed) setState({ file, url: objectUrl, loading: false, error: null, pages })
    }
    void prepare().catch(() => {
      if (disposed) return
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
      }
      setState({
        file,
        url: null,
        loading: false,
        error: isPdf
          ? 'Не удалось открыть PDF. Возможно, файл повреждён или защищён паролем. Файл можно отправить на проверку менеджеру.'
          : 'Не удалось открыть изображение. Попробуйте другой PNG или JPEG.',
        pages: null,
      })
    })
    return () => {
      disposed = true
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])
  return state?.file === file ? state : null
}
