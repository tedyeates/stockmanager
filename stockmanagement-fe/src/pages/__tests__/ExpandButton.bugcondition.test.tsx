// @vitest-environment jsdom
/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import { ExpandButton } from '../ExpandButton'
import fc from 'fast-check'
import fs from 'fs'
import path from 'path'

/**
 * Bug Condition Exploration Test - Property 1: Smooth Expand With Icon Visible
 * 
 * Bug condition: isBugCondition(input) where element.hasClass('t-expand') AND
 *   (text hidden via display:none in default OR icon hidden via display:none on hover)
 * 
 * Expected behavior after fix:
 *   - Icon always visible (no display:none on hover for svg/div)
 *   - Text transitions via max-width/opacity (not display:none/block)
 *   - Compact styled default with background/shadow
 * 
 * This test MUST FAIL on unfixed code (proves bug exists).
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

const buttonsCssPath = path.resolve(__dirname, '../../styles/buttons.css')
const cssContent = fs.readFileSync(buttonsCssPath, 'utf-8')

describe('ExpandButton Bug Condition Exploration', () => {

    describe('CSS Rule Analysis - Bug Condition Detection', () => {

        it('should NOT hide icon on hover (no display:none for svg/div on hover)', () => {
            // Bug: .t-button.t-expand:hover svg, .t-button.t-expand:hover div { display: none; }
            const iconHiddenOnHover = /\.t-button\.t-expand:hover\s+(svg|div)\s*[,{].*display\s*:\s*none/s.test(cssContent)
                || /\.t-button\.t-expand:hover\s+(svg|div)\s*\{[^}]*display\s*:\s*none/s.test(cssContent)
                || cssContent.includes('.t-button.t-expand:hover svg') && cssContent.includes('display: none')
            
            expect(iconHiddenOnHover).toBe(false)
        })

        it('should NOT use display:none to hide text in default state', () => {
            // Bug: .t-button.t-expand .t-button-text { display: none; }
            const textHiddenViaDisplay = /\.t-button\.t-expand\s+\.t-button-text\s*\{[^}]*display\s*:\s*none/s.test(cssContent)
            
            expect(textHiddenViaDisplay).toBe(false)
        })

        it('should use max-width and opacity for text visibility transitions', () => {
            // Expected: .t-button-text uses max-width: 0 and opacity: 0 in default
            const usesMaxWidth = /\.t-button.*\.t-button-text[^}]*max-width\s*:/s.test(cssContent)
            const usesOpacity = /\.t-button.*\.t-button-text[^}]*opacity\s*:\s*0/s.test(cssContent)
            
            expect(usesMaxWidth).toBe(true)
            expect(usesOpacity).toBe(true)
        })

        it('should have transition property on text element for smooth animation', () => {
            // Expected: transition includes max-width
            const hasTransition = /\.t-button.*\.t-button-text[^}]*transition\s*:[^}]*max-width/s.test(cssContent)
            
            expect(hasTransition).toBe(true)
        })

        it('should have compact icon-button styling with background', () => {
            // Expected: .t-button.t-expand has a background (not bg-transparent only)
            const hasBackground = /\.t-button\.t-expand\s*\{[^}]*(background|bg-)/s.test(cssContent)
                || /\.t-button\.t-expand\s*\{[^}]*box-shadow/s.test(cssContent)
            
            expect(hasBackground).toBe(true)
        })
    })

    describe('Component Structure - Property-Based', () => {

        it('should always render icon element regardless of button text', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (text) => {
                        const { container } = render(
                            <ExpandButton text={text} icon={<svg data-testid="icon" />} />
                        )
                        // Icon should be present in DOM
                        const icon = container.querySelector('svg[data-testid="icon"]')
                        expect(icon).not.toBeNull()
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('should render text span with t-button-text class for CSS targeting', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (text) => {
                        const { container } = render(
                            <ExpandButton text={text} icon={<svg />} />
                        )
                        const textSpan = container.querySelector('.t-button-text')
                        expect(textSpan).not.toBeNull()
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('should have t-expand class on button for CSS expand behavior', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    (text) => {
                        const { container } = render(
                            <ExpandButton text={text} icon={<svg />} />
                        )
                        const button = container.querySelector('.t-button.t-expand')
                        expect(button).not.toBeNull()
                    }
                ),
                { numRuns: 20 }
            )
        })
    })
})
