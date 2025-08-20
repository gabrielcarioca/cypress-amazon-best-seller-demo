# Amazon “Best Sellers (TV & Video)” – E2E Test (Cypress)

A tiny Cypress project that:

1. Opens **amazon.com**  
2. Sets location to a **US ZIP** (so the menu/items are US-based)  
3. Hamburger menu → **See all** → **Electronics** → **TV & Video**  
4. Finds the **2nd item** in the **Best Sellers** module  
5. Parses its price and **fails** if it’s **> PRICE_THRESHOLD**, otherwise **passes**

---

## Prerequisites

- **Node.js 18+** and **npm**

---

## Install

```bash
# clone your repo (replace with your URL)
git clone https://github.com/gabrielcarioca/cypress-amazon-best-seller-demo.git
cd <repo>

# install deps
npm install
```

If you haven’t installed Cypress before, the first run will also download its binary.

---

## Configure

Create a **.env** file in the project root with the desired PRICE_THRESHOLD:

```dotenv
# .env
BASE_URL=https://www.amazon.com
PRICE_THRESHOLD=120
```

> `cypress.config.ts` loads `.env` automatically via `import 'dotenv/config'`.  
> Values are read via `process.env.*` and exposed in the test with `Cypress.env()` where needed.

---

## Run

### Headless (entire suite)
```bash
npx cypress run
```

### Headed Chrome (single spec)
```bash
npm run test:amazon:headed
```

### Interactive mode (GUI)
```bash
npx cypress open --e2e
```

> If you need another browser: `npx cypress run --browser chrome|edge|electron`.

---

## NPM scripts (package.json)

```json
{
  "scripts": {
    "cy:open": "cypress open --e2e",
    "cy:run": "cypress run --browser chrome --e2e",
    "test:amazon": "cypress run --browser chrome --spec cypress/e2e/amazon/best_seller_price.cy.ts",
    "test:amazon:headed": "cypress run --e2e --browser chrome --headed --spec cypress/e2e/amazon/best_seller_price.cy.ts"
  }
}
```

---

## Project layout (minimal)

```
.
├─ cypress/
│  ├─ e2e/
│  │  └─ amazon/
│  │     └─ best_seller_price.cy.ts   # the test (visits, nav, price assert)
│  ├─ support/
│  │  ├─ commands.ts                  # custom commands (zip/menu/best-sellers helpers)
│  │  └─ e2e.ts                       # imports ./commands and the reporter register
│  └─ reports/                        # mochawesome HTML (gitignored)
├─ cypress.config.ts                  # loads .env, baseUrl, reporter, plugins
├─ package.json
├─ .env                               # ZIP, PRICE_THRESHOLD, BASE_URL
└─ .gitignore
```

---

## Reporter & artifacts

This project uses **cypress-mochawesome-reporter** to produce an HTML report and embed screenshots of failures.

**`cypress.config.ts`** (relevant bits):
```ts
import 'dotenv/config';
import { defineConfig } from 'cypress';
import cypressMochawesomeReporter from 'cypress-mochawesome-reporter/plugin';

export default defineConfig({
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',

  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportFilename: 'index',
    overwrite: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true
  },

  e2e: {
    baseUrl: process.env.BASE_URL || 'https://www.amazon.com',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      // register mochawesome plugin
      cypressMochawesomeReporter(on);
      return config;
    }
  }
});
```

**`cypress/support/e2e.ts`**:
```ts
import 'cypress-mochawesome-reporter/register';
import './commands';
```

Open the report after a run:
- Headless: open **`cypress/reports/index.html`** in a browser
- Screenshots/videos on failure: see `cypress/screenshots` and `cypress/videos`

---

## What the test asserts

- After setting the ZIP (e.g., **10001**) the header updates to reflect US location.
- Hamburger navigation reaches **TV & Video** (menu closes; “Televisions & Video” pill/link is visible).
- In **Best Sellers**, it takes the **2nd** product that has a price and parses it.
- Assertion:
```ts
expect(price, `2nd Best Seller price ($${price})`).to.be.lte(PRICE_THRESHOLD);
```

---

## Troubleshooting

- **“Mixing async and sync” error**  
  Don’t put `cy.*` commands inside a `.then(...)` where you return a plain value. Either return the Cypress chain or keep the callback free of `cy.*` calls.

- **ZIP dialog or “Continue” click flaky**  
  Use the custom commands that:  
  - type ZIP with delay,  
  - click the hidden “Apply” input if needed,  
  - handle Amazon’s temporary overlay,  
  - verify the dialog actually closes, and  
  - wait for the **header text** to change (don’t use `cy.wait` blindly).

- **Hamburger “TV & Video” click ignored**  
  The helper retries and, when needed, falls back to triggering a DOM click or navigating by `href`, then confirms the menu closed.

---

## Optional: GitHub Actions CI

**`.github/workflows/cypress.yml`**
```yaml
name: e2e
on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci

      # Official Cypress GitHub Action (installs Cypress binary & runs tests)
      - name: Cypress run
        uses: cypress-io/github-action@v6
        with:
          command: npx cypress run
        env:
          BASE_URL: https://www.amazon.com
          ZIP: 10001
          PRICE_THRESHOLD: 120

      # Upload artifacts (report + screenshots/videos)
      - name: Upload Mochawesome HTML
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-report
          path: cypress/reports
          if-no-files-found: ignore

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-screenshots
          path: cypress/screenshots
          if-no-files-found: ignore

      - name: Upload videos
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-videos
          path: cypress/videos
          if-no-files-found: ignore
```

---
