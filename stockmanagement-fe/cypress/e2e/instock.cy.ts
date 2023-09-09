/// <reference types="cypress" />

context('create/edit/read operations on Instock page work correctly', () => {

    context('basic tests', () => {

        beforeEach(() => {
            cy.setupTests('instock', true)
        })
    
        it('page displays correctly', () => {
            cy.get('button[aria-label="create instock"]').should('be.visible')
            cy.get('button[aria-label="export CSV"]').should('be.visible')
        })
    
        it('required fields returns error message', () => {
            cy.checkRequiredFields('instock')
        })
    
        it('test basic create', () => {
            const inputValues = {
                item: 'test item2'
            }
            
            const expectedItemValues = {
                instock_number: 1, 
                outstock_number: 0, 
                max_price: 10, 
                sum_price: 100, 
                min_price: 10,
                quantity: 10
            }

            cy.testStockInputFor('instock').withInputData({})
            cy.navbarOpen('item')
            cy.testItemRow('test item2', expectedItemValues)
        })
    })

    context('advanced tests', () => {
        beforeEach(() => {
            cy.setupTests('instock', true, Cypress.env('cypressAdvanced'))
        })

        it('instock added with low price', () => {
            const inputValues = {
                quantity: 12.3,
                price: 9.4,
                item: 'GLN60150X230'
            }

            const expectedItemValues = {
                instock_number: 3, 
                outstock_number: 2, 
                max_price: 300, 
                sum_price: 3215.62, 
                min_price: 9.4,
                quantity: 22.3
            }
            
            cy.testStockInputFor('instock').withInputData(inputValues)
            cy.navbarOpen('item')
            cy.testItemRow('GLN60150X230', expectedItemValues)
        })

        it('instock added with high price', () => {
            const inputValues = {
                quantity: 12.3,
                price: 400.32,
                item: 'GLN60150X230'
            }

            const expectedItemValues = {
                instock_number: 3, 
                outstock_number: 2, 
                max_price: 400.32, 
                sum_price: 8023.94, 
                min_price: 10,
                quantity: 22.3
            }
            
            cy.testStockInputFor('instock').withInputData(inputValues)
            cy.navbarOpen('item')
            cy.testItemRow('GLN60150X230', expectedItemValues)
        })

        it('instock updated with higher price and higher quantity', () => {
            const inputValues = {
                quantity: 12.6,
                price: 200.32,
            }

            const expectedItemValues = {
                instock_number: 2, 
                outstock_number: 2, 
                max_price: 300, 
                sum_price: 5524.03, 
                min_price: 200.32,
                quantity: 12.6
            }

            // Row to click
            cy.get('tr').contains('ยกยอด65').as('updateRow')
            cy.testStockInputFor('instock', '@updateRow').withInputData(inputValues, true)
            cy.navbarOpen('item')
            cy.testItemRow('GLN60150X230', expectedItemValues)
        })

        it('instock created returns error with invalid quantities', () => {
            const inputValues = {
                quantity: -11,
            }
            const formSelector = `form[name="instock-form"]`

            cy.testStockInputFor('instock').withInputData(inputValues, false, false)
            cy.get(formSelector)
                .should('be.visible')
                .should('contain', 'Ensure this value is greater than or equal to 0')
        })

        it('instock updated with lower price and lower quantity', () => {
            const inputValues = {
                quantity: 9.4,
                price: 9.4,
            }

            const expectedItemValues = {
                instock_number: 2, 
                outstock_number: 2, 
                max_price: 300, 
                sum_price: 3088.36, 
                min_price: 9.4,
                quantity: 9.4
            }

            // Row to click
            cy.get('tr').contains('ยกยอด65').as('updateRow')
            cy.testStockInputFor('instock', '@updateRow').withInputData(inputValues, true)
            cy.navbarOpen('item')
            cy.testItemRow('GLN60150X230', expectedItemValues)
        })

        it('instock moved to outstock', () => {
            const inputValues = {
                quantity: 10,
                customer: 'testing',
                stock_id: '123',
                requester: 'testing',
                department: 'testing'
            }

            const expectedItemValues = {
                instock_number: 2, 
                outstock_number: 3, 
                max_price: 300, 
                sum_price: 3100, 
                min_price: 10,
                quantity: 0
            }

            // Row to click
            cy.get('tr').contains('ยกยอด65').click()
            cy.get('button').contains('Move to Outstock').as('outstockButton')


            cy.testStockInputFor('outstock', '@outstockButton').withInputData(inputValues, true)
            cy.navbarOpen('item')
            cy.testItemRow('GLN60150X230', expectedItemValues)
        })


        it('instock update item', () => {
            const inputValues = {
                item: 'Test'
            }

            const expectedItemValues = {
                instock_number: 1, 
                outstock_number: 2, 
                max_price: 300, 
                sum_price: 3000, 
                min_price: 300,
                quantity: 0
            }

            const expectedItemValuesTest = {
                instock_number: 2, 
                outstock_number: 0, 
                max_price: 10, 
                sum_price: 200, 
                min_price: 10,
                quantity: 20
            }

            // Row to click
            cy.get('tr').contains('ยกยอด65').as('updateRow')
            cy.testStockInputFor('instock', '@updateRow').withInputData(inputValues, true)
            cy.navbarOpen('item')
            cy.testItemRow('Test', expectedItemValuesTest)
            cy.testItemRow('GLN60150X230', expectedItemValues)
        })
        
    })


})