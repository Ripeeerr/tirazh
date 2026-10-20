export const MIN_ZOOM = 1
export const MAX_ZOOM = 6

export type Point = { x: number; y: number }
export type Viewport = Point & { zoom: number }
export type Size = { width: number; height: number }

export function normalizeZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom * 100) / 100))
}

export function constrainViewport(view: Viewport, frame: Size, sheet: Size): Viewport {
  const zoom = normalizeZoom(view.zoom)
  if (zoom === MIN_ZOOM) return { zoom, x: 0, y: 0 }
  const xLimit =
    Math.abs(sheet.width * zoom - frame.width) / 2 + Math.min(24, sheet.width * zoom * 0.2)
  const yLimit =
    Math.abs(sheet.height * zoom - frame.height) / 2 + Math.min(24, sheet.height * zoom * 0.2)
  return {
    zoom,
    x: Math.min(xLimit, Math.max(-xLimit, view.x)),
    y: Math.min(yLimit, Math.max(-yLimit, view.y)),
  }
}

export function zoomAt(view: Viewport, requestedZoom: number, anchor: Point): Viewport {
  const zoom = normalizeZoom(requestedZoom)
  const factor = zoom / view.zoom
  return {
    zoom,
    x: anchor.x - (anchor.x - view.x) * factor,
    y: anchor.y - (anchor.y - view.y) * factor,
  }
}
