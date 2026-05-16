export type NavigationAction = 'next' | 'previous' | 'save' | 'cancel' | 'none'

export function getNavigationAction(
  event: React.KeyboardEvent,
  currentIndex: number,
  totalFields: number
): NavigationAction {
  const isLast = currentIndex === totalFields - 1
  const isFirst = currentIndex === 0

  if (event.key === 'Escape') return 'cancel'

  if (event.key === 'Enter') {
    return isLast ? 'save' : 'next'
  }

  if (event.key === 'Tab') {
    if (event.shiftKey) {
      return isFirst ? 'none' : 'previous'
    }
    return isLast ? 'none' : 'next'
  }

  return 'none'
}
