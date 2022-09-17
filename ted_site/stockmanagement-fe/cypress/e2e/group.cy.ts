/// <reference types="cypress" />

context('create/edit/read operations on Group page work correctly', () => {
    beforeEach(() => {
        cy.setupTests('group', false)
    })

    it('page displays correctly', () => {
        cy.get('button[aria-label="create group"]').should('be.visible')
        cy.get('button[aria-label="export CSV"]').should('be.visible')
    })

    it('required fields returns error message', () => {
        cy.checkRequiredFields('group')
    })

    it('create group through popup', () => {

        let formData = {}
        cy.get('button[aria-label="create group"]').click()
        cy.get('form[name="group-form"]')
            .find('input')
            .should('be.visible')
            .then(inputs => {
                inputs.each((index, input) => {
                    let name = input.getAttribute('name')
                    if(name !== null && name !== 'id'){
                        formData[name] = "testing"
                        cy.wrap(input).type(formData[name])
                    }
                })
            })

        cy.get('button[name="save-button"]').click()
        cy.wait(100) // TODO: replace with something to wait for new table row to appear
        // Newly added data should be added to the top
        cy.get('table[aria-label="group table"] tbody tr')
            .first().within(() => {
                cy.get('td').each(cell => {
                    let name = cell.attr('data-name')
                    if(name === undefined) return
    
                    if(name in formData) {
                        // Check cell contains value that was inputted
                        cy.get(`td[data-name=${name}]`).should('contain', formData[name])
                    }
                })
            })
    })
})