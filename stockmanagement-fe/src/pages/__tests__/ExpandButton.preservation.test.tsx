// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { render, fireEvent } from '@testing-library/react'
import { ExpandButton } from '../ExpandButton'
import { LoadingSpinner } from '../table/LoadingSpinner'
import fc from 'fast-check'

/**
 * Preservation Property Tests - Property 2: Functional Behavior Unchanged
 * 
 * These tests observe and lock in existing behavior BEFORE the CSS fix.
 * They must PASS on unfixed code (confirms baseline to preserve).
 * They must CONTINUE to pass after the fix (confirms no regressions).
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

describe('ExpandButton Preservation Properties', () => {

    describe('3.1 - Click handler fires for enabled buttons', () => {

        it('should fire onClick for any text/icon combination', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (text) => {
                        const onClick = vi.fn()
                        const { container } = render(
                            <ExpandButton text={text} icon={<svg />} onClick={onClick} />
                        )
                        const button = container.querySelector('button')!
                        fireEvent.click(button)
                        expect(onClick).toHaveBeenCalledTimes(1)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('should pass mouse event to onClick handler', () => {
            const onClick = vi.fn()
            const { container } = render(
                <ExpandButton text="test" icon={<svg />} onClick={onClick} />
            )
            fireEvent.click(container.querySelector('button')!)
            expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }))
        })
    })

    describe('3.2 - Disabled state prevents interaction', () => {

        it('should have disabled attribute and opacity-50 class when disabled', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (text) => {
                        const { container } = render(
                            <ExpandButton text={text} icon={<svg />} disabled={true} />
                        )
                        const button = container.querySelector('button')!
                        expect(button.disabled).toBe(true)
                        expect(button.className).toContain('disabled:opacity-50')
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('should not fire onClick when disabled', () => {
            const onClick = vi.fn()
            const { container } = render(
                <ExpandButton text="test" icon={<svg />} onClick={onClick} disabled={true} />
            )
            fireEvent.click(container.querySelector('button')!)
            expect(onClick).not.toHaveBeenCalled()
        })
    })

    describe('3.3 - LoadingSpinner renders correctly as icon', () => {

        it('should render LoadingSpinner div when passed as icon', () => {
            const { container } = render(
                <ExpandButton
                    text="dowloading..."
                    icon={<LoadingSpinner className="h-4 w-4" />}
                />
            )
            const spinner = container.querySelector('.loader')
            expect(spinner).not.toBeNull()
        })

        it('should display downloading text in text span', () => {
            const { container } = render(
                <ExpandButton
                    text="dowloading..."
                    icon={<LoadingSpinner className="h-4 w-4" />}
                />
            )
            const textSpan = container.querySelector('.t-button-text')
            expect(textSpan?.textContent).toBe('Dowloading...')
        })
    })

    describe('3.4 - Toolbar flex layout structure preserved', () => {

        it('should render button with flex and whitespace-nowrap classes', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (text) => {
                        const { container } = render(
                            <ExpandButton text={text} icon={<svg />} />
                        )
                        const button = container.querySelector('button')!
                        expect(button.className).toContain('flex')
                        expect(button.className).toContain('whitespace-nowrap')
                        expect(button.className).toContain('h-full')
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('should render aria-label for accessibility', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (text) => {
                        const { container } = render(
                            <ExpandButton text={text} icon={<svg />} />
                        )
                        const button = container.querySelector('button')!
                        expect(button.getAttribute('aria-label')).toBe(text)
                    }
                ),
                { numRuns: 20 }
            )
        })
    })
})
