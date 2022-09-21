/// <reference types="cypress" />

describe('Login Page', () => {
  it('set auth token when submitting via form', () => {
    cy.visit(Cypress.env("loginUrl"))

    cy.get("input[name=username]").type(Cypress.env("username"))
    cy.get("input[name=password]").type(Cypress.env("password"))
    cy.get("button[type=submit]").click()

    cy.url().should("equal", Cypress.env("homeUrl"))

    cy.get("nav").should("contain", "PCElemac")
  })
})