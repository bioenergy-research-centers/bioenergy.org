describe('Landing Page', () => {
  it('Contains links to all four bioenergy research centers', () => {
    cy.visit("http://localhost:3000")

    cy.get('[href="https://cabbi.bio/"]')
    cy.get('[href="https://cbi.ornl.gov/"]')
    cy.get('[href="https://www.glbrc.org/"]')
    cy.get('[href="https://www.jbei.org/"]')

  })
})

describe('Dataset Page', () => {
  it('Can be rendered', () => {
    cy.visit("http://localhost:3000/data")

    // this spec needs to be fleshed out once there are migrations and some seed data for the database
    // cy.get('table')
  })
})

describe('Contact Page', () => {
  it('Contains reference to FAIR data principles', () => {
    cy.visit("http://localhost:3000/contact")

    cy.contains('This site is dedicated to creating FAIR datasets to share across bioenergy research centers (BRCs) and to the global research community.')
  })
})

describe('Search Box', () => {
  it('Can be used to search for datasets', () => {
    cy.visit("http://localhost:3000")

    cy.get('[name="q"]').type('Beam me up Scotty')
    cy.get('button').click()
    cy.contains('Uh oh! Your search did not match any records. Please refine your query and try again.')
    cy.url().should('include', '/data?q=Beam+me+up+Scotty')
  })
})