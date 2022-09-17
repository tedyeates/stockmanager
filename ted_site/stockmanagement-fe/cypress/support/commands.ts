/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }


Cypress.Commands.add('login', () => { 
    return cy.request('POST', Cypress.env('apiLoginUrl'), {
        'username': Cypress.env('username'),
        'password': Cypress.env('password'),
    })
})

Cypress.Commands.add('navbarOpen', (tab) => { 

    cy.get(`button[aria-label="view ${tab}"]`)
        .then((button) => {
            if(!button.is(':visible'))
                cy.get('button[aria-label="open menu"]').click()
            cy.get(`button[aria-label="view ${tab}"]`).click()
        })
    
    cy.wait(500)
    cy.get('table').should('be.visible')
})

Cypress.Commands.add('checkRequiredFields', (model) => { 
    cy.get(`button[aria-label="create ${model}"]`).click()
    cy.get('button[name="save-button"]').click()

    cy.get(`form[name="${model}-form"]`)
        .get('.input-container')
        .each(input => {
            cy.wrap(input).should('contain', 'required')
        })
})

Cypress.Commands.add('setupTests', (model, shouldAddModels=true, url=Cypress.env('cypressUrl')) => {
    let token: string
    cy.login().then((response) => {
        token = response.body.token
        sessionStorage.setItem('token', token)

        cy.request({
            method: 'DELETE', 
            url: Cypress.env('cypressUrl'),
            headers: {
                'Authorization': `token ${token}`
            }
        }).then((response) => {
            if(shouldAddModels){
                cy.request({
                    method: 'POST',
                    url: url,
                    headers: {
                        'Authorization': `token ${token}`
                    }
                })
            }

            cy.visit(Cypress.env('homeUrl'))

            // Avoid glitching between pages, wait until fully loaded before switching
            cy.get(`table[aria-label="instock table"]`).should('be.visible')
            cy.navbarOpen(model)
        })

    })
})

Cypress.Commands.add('getInputByType', (input:HTMLInputElement, values=null, isUpdate=false) => {
        let name = input.getAttribute('name')
        if(name === null || name === 'id') return cy.wrap('')

        if(input.hasAttribute('autocomplete')){
            cy.wrap(input).click()
            
            if(values && name in values){
                cy.wrap(input).clear().type(values[name])
                cy.get('li').contains(values[name]).click()
                return cy.wrap('')
            }

            if(isUpdate) return cy.wrap('')
            
            cy.get('li[data-option-index="0"]').click()
            return cy.wrap('')
        }

        if(values && name in values) return values[name]
        if(isUpdate) return cy.wrap('') // Only enter values to inputs that need to be updated

        if(name === "stock_date") return cy.wrap('20/11/1996')

        if(input.getAttribute('type') === 'number') return cy.wrap('10')
        if(input.getAttribute('type') === 'text') return cy.wrap("testing")
        

        return cy.wrap('')
})


Cypress.Commands.add('inputDataIntoForm', (formSelector, values=null, isUpdate=false) => {
    let formData = {}
    cy.get(formSelector)
        .should('be.visible')
        .find('input')
        .then(inputs => {
            inputs.each((index, input) => {
                let name = input.getAttribute('name')
                if(name === null) return
                
                cy.getInputByType(input, values, isUpdate).then((value) => {
                    if(value === '' || name ===null) return

                    formData[name] = value
                    cy.wrap(input).click().clear().type(value)
                })

            })
        })

    cy.get('button[name="save-button"]').click()

    return cy.wrap(formData)
})


Cypress.Commands.add('testTable', {
    prevSubject: true,
}, (formData, tableSelector, id=null) => {
    let row = cy.get(`${tableSelector} tbody tr`)
        .should('be.visible')
    
    if(id) 
        row = row.contains(id).parent()
    else 
        row = row.first()
    
    row.within(() => {
            cy.get('td').each(cell => {
                let name = cell.attr('data-name')
                if(name === undefined) return

                if(name in formData) {
                    // Check cell contains value that was inputted
                    expect(cell).to.contain(formData[name])
                }
            })
        })
})

function getCreateSelector(model:string, createSelectorButton: string | undefined) {
    if(createSelectorButton === undefined) return `button[aria-label="create ${model}"]`
    return createSelectorButton
}

Cypress.Commands.add('testStockInputFor', (model, createSelectorButton) => {
    const formSelector = `form[name="${model}-form"]`
    const createSelector = getCreateSelector(model, createSelectorButton)
    const tableSelector = `table[aria-label="${model} table"]`

    return cy.wrap({formSelector, createSelector, tableSelector})
})

Cypress.Commands.add('withInputData', {
    prevSubject: true,
}, ({formSelector, createSelector, tableSelector}, inputValues, isUpdate=false, shouldTestTable=true) => {
    cy.get(createSelector).click()
    const inputData = cy.inputDataIntoForm(formSelector, inputValues, isUpdate)
    
    if(shouldTestTable) {
        cy.get(formSelector).should('not.exist')
        inputData.testTable(tableSelector)
    }
})

Cypress.Commands.add('testItemRow', (id, expectedItemValues) => {
    const itemTableSelector = 'table[aria-label="item table"]'
    cy.wrap(expectedItemValues).testTable(itemTableSelector, id)
})



// Cypress.Commands.add('search', (searchTerm) => { 

// })

type SelectorTypes = {
    formSelector: string
    createSelector: string
    tableSelector: string
}


declare namespace Cypress {
    interface Chainable {
        login(): Chainable<Cypress.Response<any>>
        setupTests(model:string, shouldAddModels?:boolean, url?:string): Chainable<void>
        navbarOpen(tab: string): Chainable<void>
        checkRequiredFields(model: string): Chainable<void>
        getInputByType(input: HTMLInputElement, values?: {[key:string]:any} | null, isUpdate?: boolean): Chainable<string>
        inputDataIntoForm(formSelector:string, values?: {[key:string]:any} | null, isUpdate?: boolean): Chainable<{[key:string]:any}>
        testTable(tableSelector:string, id?:string|null): Chainable<void>
        
        testStockInputFor(model: string, createSelectorButton?:string): Chainable<SelectorTypes>
        withInputData(inputValues: {[key:string]:any}, isUpdate?: boolean, shouldTestTable?:boolean): Chainable<void>
        testItemRow(id:string|null, expectedItemValues: {[key:string]:any}): Chainable<void>
    
    }


}