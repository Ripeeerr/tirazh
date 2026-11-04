import { describe, expect, test } from 'bun:test'
import { constrainViewport, normalizeZoom, zoomAt } from '../../src/lib/previewViewport'

const frame = { width: 600, height: 450 }
const sheet = { width: 350, height: 220 }

describe('print viewport', () => {
  test('never zooms below 1x or beyond 6x', () => {
    expect(normalizeZoom(-3)).toBe(1)
    expect(normalizeZoom(0.5)).toBe(1)
    expect(normalizeZoom(20)).toBe(6)
    expect(normalizeZoom(2.345)).toBe(2.35)
  })
  test('returns to the center at minimum zoom', () => {
    expect(constrainViewport({ zoom: 0.5, x: 500, y: -300 }, frame, sheet)).toEqual({
      zoom: 1,
      x: 0,
      y: 0,
    })
  })
  test('keeps the point under the cursor stable while zooming', () => {
    const before = { zoom: 2, x: 25, y: -10 }
    const anchor = { x: 120, y: 80 }
    const after = zoomAt(before, 3, anchor)
    expect((anchor.x - before.x) / before.zoom).toBeCloseTo((anchor.x - after.x) / after.zoom)
    expect((anchor.y - before.y) / before.zoom).toBeCloseTo((anchor.y - after.y) / after.zoom)
  })
  test('bounds dragging while allowing all enlarged edges to be inspected', () => {
    const moved = constrainViewport({ zoom: 6, x: 10000, y: -10000 }, frame, sheet)
    expect(moved.x).toBe(774)
    expect(moved.y).toBe(-459)
    expect(moved.x - (sheet.width * moved.zoom) / 2).toBeLessThan(frame.width / 2)
    expect(moved.y + (sheet.height * moved.zoom) / 2).toBeGreaterThan(-frame.height / 2)
  })
})
