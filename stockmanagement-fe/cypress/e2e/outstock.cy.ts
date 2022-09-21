/// <reference types="cypress" />

context('create/edit/read operations on Outstock page work correctly', () => {
    beforeEach(() => {
        cy.setupTests('outstock', true, Cypress.env('cypressAdvanced'))
    })

    it('outstock created returns error with invalid quantities', () => {
        const inputValues = {
            quantity: -11,
        }
        const formSelector = `form[name="outstock-form"]`

        cy.testStockInputFor('outstock').withInputData(inputValues, false, false)
        cy.get(formSelector)
            .should('be.visible')
            .should('contain', 'Ensure this value is greater than or equal to 0')
    })

    it('Outstock updated with quantity higher than quantity left', () => {
        const inputValues = {
            quantity: 11,
        }

        const formSelector = `form[name="outstock-form"]`

        cy.testStockInputFor('outstock').withInputData(inputValues, false, false)
        cy.get(formSelector)
            .should('be.visible')
            .should('contain', 'Not enough items instock')
    })

    it('Outstock updated with higher quantity', () => {
        const inputValues = {
            quantity: 9,
        }

        const expectedItemValues = {
            instock_number: 2, 
            outstock_number: 2, 
            max_price: 300, 
            sum_price: 3100, 
            min_price: 10,
            quantity: 9
        }

        // Row to click
        cy.get('tr').contains('650672').as('updateRow')
        cy.testStockInputFor('outstock', '@updateRow').withInputData(inputValues, true)
        cy.navbarOpen('item')
        cy.testItemRow('GLN60150X230', expectedItemValues)
    })


    it('Outstock updated with lower quantity', () => {
        const inputValues = {
            quantity: 4.4,
        }

        const expectedItemValues = {
            instock_number: 2, 
            outstock_number: 2, 
            max_price: 300, 
            sum_price: 3100, 
            min_price: 10,
            quantity: 13.6
        }

        // Row to click
        cy.get('tr').contains('650672').as('updateRow')
        cy.testStockInputFor('outstock', '@updateRow').withInputData(inputValues, true)
        cy.navbarOpen('item')
        cy.testItemRow('GLN60150X230', expectedItemValues)
    })

    it('outstock update item', () => {
        const inputValues = {
            item: 'Test'
        }

        const expectedItemValues = {
            instock_number: 2, 
            outstock_number: 1, 
            max_price: 300, 
            sum_price: 3100, 
            min_price: 10,
            quantity: 18
        }

        const expectedItemValuesTest = {
            instock_number: 1, 
            outstock_number: 1, 
            max_price: 10, 
            sum_price: 100, 
            min_price: 10,
            quantity: 2
        }

        // Row to click
        cy.get('tr').contains('650672').as('updateRow')
        cy.testStockInputFor('outstock', '@updateRow').withInputData(inputValues, true)
        cy.navbarOpen('item')
        cy.testItemRow('Test', expectedItemValuesTest)
        cy.testItemRow('GLN60150X230', expectedItemValues)
    })

    
})