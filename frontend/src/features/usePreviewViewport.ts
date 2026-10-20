import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { constrainViewport, zoomAt } from '../lib/previewViewport'
import type { Point, Viewport } from '../lib/previewViewport'

type State = Viewport & { animated: boolean }
type Gesture =
  | { kind: 'pan'; start: Point; view: Viewport }
  | { kind: 'pinch'; center: Point; distance: number; view: Viewport }

function midpoint(points: Point[]) {
  return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
}

function distance(points: Point[]) {
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
}

export function usePreviewViewport() {
  const frameRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<State>({ zoom: 1, x: 0, y: 0, animated: false })
  const [interacting, setInteracting] = useState(false)
  const current = useRef(view)
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)

  const constrain = useCallback((next: Viewport) => {
    const frame = frameRef.current
    const sheet = sheetRef.current
    if (!frame || !sheet) return next
    const matrix = new DOMMatrixReadOnly(getComputedStyle(sheet).transform)
    return constrainViewport(
      next,
      { width: frame.clientWidth, height: frame.clientHeight },
      {
        width: Math.abs(matrix.a) * sheet.offsetWidth + Math.abs(matrix.c) * sheet.offsetHeight,
        height: Math.abs(matrix.b) * sheet.offsetWidth + Math.abs(matrix.d) * sheet.offsetHeight,
      },
    )
  }, [])
  const update = useCallback(
    (next: Viewport, animated = false) => {
      const state = { ...constrain(next), animated }
      const previous = current.current
      if (
        previous.zoom === state.zoom &&
        previous.x === state.x &&
        previous.y === state.y &&
        previous.animated === state.animated
      )
        return
      current.current = state
      setView(state)
    },
    [constrain],
  )
  const freezeAnimation = useCallback(() => {
    if (!current.current.animated || !cameraRef.current) return
    const matrix = new DOMMatrixReadOnly(getComputedStyle(cameraRef.current).transform)
    update({ zoom: matrix.a, x: matrix.e, y: matrix.f })
  }, [update])
  const relative = useCallback((point: Point) => {
    const box = frameRef.current?.getBoundingClientRect()
    if (!box) return { x: 0, y: 0 }
    return { x: point.x - box.left - box.width / 2, y: point.y - box.top - box.height / 2 }
  }, [])
  const startGesture = useCallback(() => {
    const points = [...pointers.current.values()]
    if (points.length >= 2)
      gesture.current = {
        kind: 'pinch',
        center: relative(midpoint(points)),
        distance: Math.max(1, distance(points)),
        view: current.current,
      }
    else if (points.length === 1)
      gesture.current = { kind: 'pan', start: points[0], view: current.current }
    else gesture.current = null
    setInteracting(points.length > 0)
  }, [relative])
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    freezeAnimation()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    startGesture()
  }
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const active = gesture.current
    if (active.kind === 'pinch') {
      const points = [...pointers.current.values()]
      if (points.length < 2) return
      const center = relative(midpoint(points))
      const next = zoomAt(
        active.view,
        (active.view.zoom * distance(points)) / active.distance,
        active.center,
      )
      update({
        ...next,
        x: next.x + center.x - active.center.x,
        y: next.y + center.y - active.center.y,
      })
    } else if (current.current.zoom > 1) {
      update({
        ...current.current,
        x: active.view.x + event.clientX - active.start.x,
        y: active.view.y + event.clientY - active.start.y,
      })
    }
  }
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return
    startGesture()
  }
  const setZoom = (zoom: number, animated = false) =>
    update(zoomAt(current.current, zoom, { x: 0, y: 0 }), animated)
  const panBy = (x: number, y: number) => {
    freezeAnimation()
    update({ ...current.current, x: current.current.x + x, y: current.current.y + y })
  }
  const preset = (zoom: number) => update({ zoom, x: 0, y: 0 }, true)
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home' || event.key === 'Escape') {
      event.preventDefault()
      preset(1)
      return
    }
    const movement: Record<string, Point> = {
      ArrowLeft: { x: 40, y: 0 },
      ArrowRight: { x: -40, y: 0 },
      ArrowUp: { x: 0, y: 40 },
      ArrowDown: { x: 0, y: -40 },
    }
    const delta = movement[event.key]
    if (!delta || current.current.zoom === 1) return
    event.preventDefault()
    freezeAnimation()
    update({ ...current.current, x: current.current.x + delta.x, y: current.current.y + delta.y })
  }

  useEffect(() => {
    const frame = frameRef.current
    const sheet = sheetRef.current
    if (!frame || !sheet) return
    const wheel = (event: WheelEvent) => {
      if (!event.deltaY) return
      freezeAnimation()
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? frame.clientHeight : 1
      const delta = Math.max(-120, Math.min(120, event.deltaY * units))
      const next = zoomAt(
        current.current,
        current.current.zoom * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002)),
        relative({ x: event.clientX, y: event.clientY }),
      )
      if (next.zoom === current.current.zoom) {
        if (event.ctrlKey) event.preventDefault()
        return
      }
      event.preventDefault()
      update(next)
      if (pointers.current.size) startGesture()
    }
    const observer = new ResizeObserver(() => update(current.current))
    observer.observe(frame)
    observer.observe(sheet)
    frame.addEventListener('wheel', wheel, { passive: false })
    return () => {
      observer.disconnect()
      frame.removeEventListener('wheel', wheel)
    }
  }, [freezeAnimation, relative, startGesture, update])

  return {
    view,
    interacting,
    frameRef,
    sheetRef,
    cameraRef,
    setZoom,
    preset,
    panBy,
    handlers: {
      onPointerDown: pointerDown,
      onPointerMove: pointerMove,
      onPointerUp: pointerEnd,
      onPointerCancel: pointerEnd,
      onLostPointerCapture: pointerEnd,
      onKeyDown: keyDown,
    },
  }
}
