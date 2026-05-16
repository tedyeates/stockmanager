import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getNavigationAction, NavigationAction } from 'util/keyboardNavigation'

// Feature: inline-editing, Property 5: Keyboard navigation focus management

function makeKeyEvent(key: string, shiftKey = false): React.KeyboardEvent {
  return { key, shiftKey } as React.KeyboardEvent
}

describe('Feature: inline-editing, Property 5: Keyboard navigation focus management', () => {
  it('returns correct NavigationAction for all key/position combinations', () => {
    const keyEventArb = fc.oneof(
      fc.record({ key: fc.constant('Tab'), shiftKey: fc.boolean() }),
      fc.record({ key: fc.constant('Enter'), shiftKey: fc.constant(false) }),
      fc.record({ key: fc.constant('Escape'), shiftKey: fc.constant(false) })
    )

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        keyEventArb,
        (totalFields, eventData) => {
          const indexArb = fc.integer({ min: 0, max: totalFields - 1 })

          fc.assert(
            fc.property(indexArb, (currentIndex) => {
              const event = makeKeyEvent(eventData.key, eventData.shiftKey)
              const result = getNavigationAction(event, currentIndex, totalFields)

              const isLast = currentIndex === totalFields - 1
              const isFirst = currentIndex === 0

              let expected: NavigationAction
              if (eventData.key === 'Escape') {
                expected = 'cancel'
              } else if (eventData.key === 'Enter') {
                expected = isLast ? 'save' : 'next'
              } else if (eventData.key === 'Tab' && eventData.shiftKey) {
                expected = isFirst ? 'none' : 'previous'
              } else {
                expected = isLast ? 'none' : 'next'
              }

              expect(result).toBe(expected)
            }),
            { numRuns: 10 }
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})
