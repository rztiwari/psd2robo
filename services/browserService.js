const puppeteer = require('puppeteer');

let BROWSER_POOL = [];

function getBrowserFromPool(){
    var browser = BROWSER_POOL.shift();
    return browser;
}

async function initializeBrowserPool(){
    let i = BROWSER_POOL.length;
    while(i < 5) {
        let browserInstance = await getBrowser(false, 'https://claritymobile.fs.capgemini.com/');
        BROWSER_POOL.push(browserInstance);
        i++;
    }
}

async function getBrowser(isHeadless, launchPage){
    try {
        const browser = await puppeteer.launch({
            headless: isHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
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
        await page.goto(launchPage, {waitUntil: 'networkidle0'});
        return {browser, page};
    } catch(e) {
        ERRORS.push('System exception occured. Please try again!');
    }
    return;
}

module.exports = {getBrowserFromPool, initializeBrowserPool};
