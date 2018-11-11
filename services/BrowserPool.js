const puppeteer = require('puppeteer');

const BROWSER_POOL = [];
const MAX_LIMIT = 5;

class BrowserPool {

    static getBrowser(){
        let browser;
        if (BROWSER_POOL.length > 0){
            browser = BROWSER_POOL.shift();
        } 
        return browser;
    }

    static async returnBrowser(browserInstance, launchPage){
        try{

            let {browser, page} = browserInstance;
            if(page){
                await page.close();
            }
    
            if(browser && BROWSER_POOL.length < MAX_LIMIT){
                const newPage = await BrowserPool.launchLandingPage(browser, launchPage);
                BROWSER_POOL.push({browser, page: newPage});
            }
        } catch (e){
            console.log(e);
        }
    }

    static async initializeBrowserPool(isHeadless, baseUrl) {
        let i = BROWSER_POOL.length;
        try {
            while (i < MAX_LIMIT) {
                let browserInstance = await BrowserPool.createBrowser(isHeadless, baseUrl);
                BROWSER_POOL.push(browserInstance);
                i++;
            }
        } catch (e) {
            console.log(e);
        }
    }

    static async createBrowser(isHeadless, launchPage) {
        try {
            const browser = await puppeteer.launch({
                headless: isHeadless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await BrowserPool.launchLandingPage(browser, launchPage);
            return { browser, page };
        } catch (e) {
            ERRORS.push('System exception occured. Please try again!');
        }
        return;
    }

    static async launchLandingPage(browser, launchPage){
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('.png') ||
                interceptedRequest.url().endsWith('.jpg') ||
                interceptedRequest.url().endsWith('.svg') ||
                interceptedRequest.url().endsWith('.gif'))
                interceptedRequest.abort();
            else
                interceptedRequest.continue();
        });
        await page.goto(launchPage, { waitUntil: 'networkidle0' });
        return page;
    }
}

module.exports = BrowserPool;