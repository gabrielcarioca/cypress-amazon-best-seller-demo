function parsePriceFrom($context: JQuery<HTMLElement>): number | null {
    const whole = $context.find('.a-price .a-price-whole').first().text().replace(/[^\d]/g, '');
    const fracs = $context.find('.a-price .a-price-fraction').first().text().replace(/[^\d]/g, '');
    if (!whole) return null;
    const val = Number(`${whole}.${fracs || '00'}`);
    return Number.isFinite(val) ? val : null;
}

Cypress.Commands.add('closeAmazonPopups', () => {
    cy.get('body').then(($b) => {
        const cookieBtn = $b.find('#sp-cc-accept, input[name="accept"]');
        if (cookieBtn.length) cy.wrap(cookieBtn.first()).click({ force: true });
    });
    cy.get('body').then(($b) => {
        const closeButtons = $b.find('button[aria-label="Close"], .a-button-close, .a-popover-header .a-button-close');
    });
});

Cypress.Commands.add('openAmazonHamburger', () => {
    cy.get('#nav-hamburger-menu', { timeout: 15000 }).should('be.visible').click();
    cy.get('#hmenu-content').should('be.visible');
});

Cypress.Commands.add('expandAmazonShopByDepartmentSeeAll', () => {
    cy.get('#hmenu-content').within(() => {
        cy.contains('a.hmenu-item', /See all/i).first().click({ force: true });
    });
});

Cypress.Commands.add('goToAmazonElectronicsTvVideo', () => {
    cy.get('#hmenu-content').within(() => {
        cy.contains('a.hmenu-item', /^Electronics$/i).click({ force: true });
    });

    cy.intercept('GET', '**/gp/browse*').as('browse');

    cy.get('#hmenu-content').within(() => {
        cy.contains('a.hmenu-item', /TV\s*&\s*Video/i).click({ force: true });
    }); 

    cy.wait('@browse', { timeout: 20000 });
    
});

Cypress.Commands.add('getAmazonSecondBestSellerPrice', () => {
    return cy
        .contains('.octopus-pc-card-title span', /best\s*sellers/i, { timeout: 20000 })
        .scrollIntoView()
        .closest('.octopus-best-seller-card, .octopus-pc-card')
        .find('.octopus-pc-card-content')
        .find('[data-asin], li, div')
        .filter((_, el) => !!el.querySelector('.a-price'))
        .then(($candidates) => {
            expect($candidates.length, 'items with a price').to.be.greaterThan(1);

            const $item = $candidates.eq(1) as JQuery<HTMLElement>;
            const price = parsePriceFrom($item);
            if (price == null) {
                throw new Error(`Second Best Seller item has no visible price.`);
            }
            return price;
        });
});


Cypress.Commands.add('ensureAmazonLocationLink', (retries: number = 2) => {
  const attempt = (left: number) => {
    cy.get('body').then(($b) => {
      const hasLink =
        $b.find('#nav-global-location-popover-link:visible').length > 0;

      if (hasLink) {
        // already visible — done
        return;
      }

      // Not visible: click the Amazon logo (or fallback to visit('/')) to reload home
      const $logo = $b
        .find('a#nav-logo-sprites, a.nav-logo-link, #nav-logo-sprites')
        .filter(':visible')
        .first();

      if ($logo.length) {
        cy.wrap($logo).click({ force: true });
      } else {
        cy.visit('/'); // fallback – navigate to home directly
      }
    });

    // After navigating, check again (maybe reload once more)
    cy.get('body').then(($b) => {
      const present =
        $b.find('#nav-global-location-popover-link:visible').length > 0;

      if (!present) {
        if (left > 0) {
          cy.log(`"Deliver to" still missing — reloading (retries left: ${left})`);
          cy.reload();
          attempt(left - 1);
        } else {
          throw new Error(
            'Could not find the "Deliver to" link after retries.'
          );
        }
      }
    });
  };

  attempt(retries);
});

Cypress.Commands.add('setAmazonUSZip', (zip = '72716') => {
    cy.get('#nav-global-location-popover-link', { timeout: 20000 })
        .should('be.visible')
        .click({ force: true});

    cy.get('.a-popover-wrapper, [aria-label="Choose your location"]', { timeout: 20000 })
        .filter(':visible')
        .first()
        .as('locPopover');

        // Type ZIP -> Apply -> Done
    cy.get('@locPopover').within(() => {
        // ZIP Input
        cy.get('#GLUXZipUpdateInput, #GLUXPostalCode')
            .filter(':visible')
            .first()
            .as('zipInput')
            .clear()
            .type(zip, { delay: 0 });

        // hit Enter in the input
        cy.get('@zipInput').type('{enter}');
    });
    cy.get('body', { timeout: 15000 }).then(($b) => {
        const $buttons = $b.find('button, input[type="submit"], input[type="button"]');

        const textOf = (el: Element) =>
        (el.tagName === 'INPUT'
            ? (el as HTMLInputElement).value
            : (el.textContent || '')).trim();

        const findByText = (re: RegExp) =>
        $buttons
            .filter((_, el) => re.test(textOf(el)))
            .filter(':visible')
            .first();

        let $target = findByText(/^Continue$/i);        
        if (!$target.length) $target = findByText(/^Done$/i); // some variants show Done

        if ($target.length) {
        cy.wrap($target).click({ force: true });
        } else {
        // last resort: close icon if neither button exists
        const $close = $b.find('button[aria-label="Close"], .a-button-close, #GLUXConfirmClose').filter(':visible').first();
        if ($close.length) cy.wrap($close).click({ force: true });
        }
    });

    cy.reload();
})

Cypress.Commands.add('disableAnimations', () => {
  cy.window().then((win) => {
    const style = win.document.createElement('style');
    style.innerHTML = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }
    `;
    win.document.head.appendChild(style);
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      closeAmazonPopups(): Chainable<void>;
      openAmazonHamburger(): Chainable<void>;
      expandAmazonShopByDepartmentSeeAll(): Chainable<void>;
      goToAmazonElectronicsTvVideo(): Chainable<void>;
      getAmazonSecondBestSellerPrice(): Chainable<number>;
      setAmazonUSZip(zip?: string): Chainable<void>;
      ensureAmazonLocationLink(retries?: number): Chainable<void>;
      disableAnimations(): Chainable<void>;
    }
  }
}
export {};