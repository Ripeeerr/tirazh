import { expect, test } from 'bun:test'
import { safeReturnPath } from '../../src/lib/returnPath'

test.each([
  null,
  '',
  'https://evil.example',
  '//evil.example',
  '/\\evil.example',
  '/\n/evil.example',
  '/\t/evil.example',
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
])('rejects unsafe login return path %j', (path) => {
  expect(safeReturnPath(path)).toBe('/account/orders')
})

test.each(['/checkout', '/account/orders/123?created=1#artwork', '/catalog/flyers'])(
  'preserves internal return path %s',
  (path) => {
    expect(safeReturnPath(path)).toBe(path)
  },
)
