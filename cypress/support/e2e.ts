import './commands';
import 'cypress-mochawesome-reporter/register';


Cypress.on('uncaught:exception', (err) => {
  // match by message
  if (/cardModuleFactory is not a function/i.test(err.message)) {
    return false; // prevents Cypress from failing the test
  }
  // match by origin in the stack (optional)
  if (err.stack?.includes('m.media-amazon.com')) {
    return false;
  }
  // let everything else fail normally
});

beforeEach(() => {
    cy.session('us-zip-72716', () =>{
        cy.visit('/', { log: false });
        cy.setCookie('i18n-prefs', 'USD');
        cy.setCookie('lc-main', 'en_US');
        cy.ensureAmazonLocationLink();
        cy.setAmazonUSZip('72716')
        cy.disableAnimations();
    });
});