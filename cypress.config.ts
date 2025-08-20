import { defineConfig } from "cypress";
import 'dotenv/config'
import path from "node:path";
import cypressMochawesomeReporter from 'cypress-mochawesome-reporter/plugin';

export default defineConfig({
    video: false,
    viewportWidth: 1366,
    viewportHeight: 800,
    defaultCommandTimeout: 15000,
    retries: {runMode: 2, openMode: 0},

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
        inlineAssets: true,
    },

    env: {
        PRICE_THRESHOLD: 100,
    },

    e2e: {
        baseUrl: "https://www.amazon.com",
        specPattern: "cypress/e2e/amazon/*.cy.ts",
        supportFile: "cypress/support/e2e.ts",
        setupNodeEvents(on, config) {
            on("task", {
                log(message: string) {
                    console.log(message);
                    return null;
                }
            });
            
            on("before:browser:launch", (browser, launchOptions) => {
                if (browser.family === "chromium") {
                    launchOptions.args.push("--lang=en-US");
                    launchOptions.preferences ??= { default: {} };
                    launchOptions.preferences.default.download = {
                        default_directory: path.resolve("cypress/downloads"),
                        prompt_for_download: false,
                    };
                }
                return launchOptions;
            });
            
            if (process.env.PRICE_THRESHOLD) {
                config.env.PRICE_THRESHOLD = Number(process.env.PRICE_THRESHOLD);
            }

            // register mochawesome plugin
            cypressMochawesomeReporter(on);
            return config;
        }
    },

});