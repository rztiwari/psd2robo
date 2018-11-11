const puppeteer = require('puppeteer');

const JOURNEY = {
    LOGIN_FIELD: 'input[id="ppm_login_username"]',
    PASSWORD_FIELD: 'input[id="ppm_login_password"]',
    LOGIN_BUTTON_FIELD: 'input[id="ppm_login_button"]',
    PAGINATION_INPUT_FIELD: 'table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field',
    NEXT_BUTTON_FIELD: 'button[id="nextPageButton"]'
};

async function executeFromPool(browserInstance, credentials){
    let ALL_DATA = [];
    let ERRORS = [];

    let browser = browserInstance.browser,
        page = browserInstance.page;

    let startTime = new Date();
    try{
        await page.click(JOURNEY.LOGIN_FIELD);
        await page.keyboard.type(credentials.username);
    
        await page.click(JOURNEY.PASSWORD_FIELD);
        await page.keyboard.type(credentials.password);
    
        await page.click(JOURNEY.LOGIN_BUTTON_FIELD);
        await page.waitForNavigation();
        // console.log('Navigated to 2nd page');
    
        await updatePageDetails(page, ALL_DATA);
    
        const text = await page.evaluate(() => document.querySelector('table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field').getAttribute('aria-label'));
    
        let numberOfPages, temp = text.split('of ');
        if(temp && temp.length > 0){
            numberOfPages = parseInt(temp[1], 10);
        }
        // console.log('Number of  pages', numberOfPages);
        if(numberOfPages){
            for(let i= 1; i < numberOfPages; i++){
                try {
                    await page.click(JOURNEY.NEXT_BUTTON_FIELD);
                    await page.waitForNavigation();
                    // console.log('Navigated to page', i);
                    await updatePageDetails(page, ALL_DATA);
                } catch(e) {
                    ERRORS.push('Error in step' + i);
                }
                
            }
        }
        browser.close();
    } catch (e){
        ERRORS.push('System exception occured. Please try again!')
    }
    // console.log('Browser closed');

    let endTime = new Date();
    // console.log(ALL_DATA);

    // console.log('Elapsed Time', endTime.getTime() - startTime.getTime());
    return {   
        data: ALL_DATA,
        errors: ERRORS,
        timeTaken: parseInt((endTime.getTime() - startTime.getTime()), 10)/1000,
    };
}

/**
 * 
 * @param {*} isHeadless 
 * @param {*} launchPage 
 * @param {*} credentials 
 */
async function executeJourney(isHeadless, launchPage, credentials) {
    let ALL_DATA = [];
    let ERRORS = [];
    // console.log('Inside execute');
    let browserLoadedTime, startTime = new Date();

    try {
        const browser = await puppeteer.launch({
            headless: isHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    
        // console.log('Browser lunched');
    
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('.png') || 
                interceptedRequest.url().endsWith('.jpg') ||
                interceptedRequest.url().endsWith('.svg') ||
                interceptedRequest.url().endsWith('.gif')
                // ||
                // interceptedRequest.url().endsWith('.css')
                )
              interceptedRequest.abort();
            else
              interceptedRequest.continue();
        });
        await page.goto(launchPage, {waitUntil: 'networkidle0'});
        // console.log('Page launched!');
        browserLoadedTime = new Date();
    
        await page.click(JOURNEY.LOGIN_FIELD);
        await page.keyboard.type(credentials.username);
    
        await page.click(JOURNEY.PASSWORD_FIELD);
        await page.keyboard.type(credentials.password);
    
        await page.click(JOURNEY.LOGIN_BUTTON_FIELD);
        await page.waitForNavigation();
        // console.log('Navigated to 2nd page');
    
        await updatePageDetails(page, ALL_DATA);
    
        const text = await page.evaluate(() => document.querySelector('table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field').getAttribute('aria-label'));
    
        let numberOfPages, temp = text.split('of ');
        if(temp && temp.length > 0){
            numberOfPages = parseInt(temp[1], 10);
        }
        // console.log('Number of  pages', numberOfPages);
        if(numberOfPages){
            for(let i= 1; i < numberOfPages; i++){
                try {
                    await page.click(JOURNEY.NEXT_BUTTON_FIELD);
                    await page.waitForNavigation();
                    // console.log('Navigated to page', i);
                    await updatePageDetails(page, ALL_DATA);
                } catch(e) {
                    ERRORS.push('Error in step' + i);
                }
                
            }
        }
        browser.close();
    } catch (e){
        ERRORS.push('System exception occured. Please try again!')
    }
    // console.log('Browser closed');

    let endTime = new Date();
    // console.log(ALL_DATA);

    // console.log('Elapsed Time', endTime.getTime() - startTime.getTime());
    return {   
        data: ALL_DATA,
        errors: ERRORS,
        timeTaken: parseInt((endTime.getTime() - startTime.getTime()), 10)/1000,
        browserLoadTime: (browserLoadedTime.getTime() - startTime.getTime())/1000
    };
}

async function updatePageDetails(page, dataArr) {
    let items = await page.evaluate(() => document.querySelectorAll('table[id="portlet-table-timeadmin.timesheetBrowser"] table tbody tr'));
    if(items && Object.keys(items).length){
        for(let i = 1; i <= Object.keys(items).length; i++){
            let baseString = 'table[id="portlet-table-timeadmin.timesheetBrowser"] table tbody tr:nth-child('+i+')';
            let name = await page.evaluate((sel) => {
                    return document.querySelector(sel +' td[column="8"]').innerText
                }, baseString),
                startDate = await page.evaluate((sel) => document.querySelector(sel +'  td[column="10"]').innerText, baseString),
                status = await page.evaluate((sel) => document.querySelector(sel +'  td[column="11"]').innerText, baseString),
                pending = await page.evaluate((sel) => document.querySelector(sel +'  td[column="14"]').innerText, baseString);
                dataArr.push({name, startDate, status, pending});
        }
    }
    
}

module.exports = {executeJourney, executeFromPool};