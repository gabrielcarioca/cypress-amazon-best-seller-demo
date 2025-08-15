/**
 * Flow:
 * 1) Visit amazon.com
 * 2) Open hamburger menu (#nav-hamburger-menu)
 * 3) Under "Shop by Department" click "See All"
 * 4) Click "Eletronics"
 * 5) Click "TV & Video"
 * 6) Find the "Best Sellers" section
 * 7) Get the 2nd item's price. Assert price <= $100
 */

const PRICE_THRESHOLD = Number(Cypress.env('PRICE_THRESHOLD') ?? 100);

describe('Amazon - Best Sellerss price check (TV & Video)', () => {
    it(`fails if 2nd Best Seller > $$(PRICE_THRESHOLD)`, () => {
        cy.visit('/');
        cy.closeAmazonPopups();
        cy.openAmazonHamburger();
        cy.expandAmazonShopByDepartmentSeeAll();
        cy.goToAmazonElectronicsTvVideo();

        cy.getAmazonSecondBestSellerPrice().then((price) => {
            expect(price, `2nd Best Seller price ($${price})`).to.be.lte(PRICE_THRESHOLD);
        });
    });

    it.skip('partial: navigate only', () => {
        cy.visit('/');
        cy.closeAmazonPopups();
        cy.openAmazonHamburger();
        cy.expandAmazonShopByDepartmentSeeAll();
        cy.goToAmazonElectronicsTvVideo();
    })
})