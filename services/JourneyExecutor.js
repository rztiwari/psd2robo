const puppeteer = require('puppeteer');

const JOURNEY = {
    LOGIN_FIELD: 'input[id="ppm_login_username"]',
    PASSWORD_FIELD: 'input[id="ppm_login_password"]',
    LOGIN_BUTTON_FIELD: 'input[id="ppm_login_button"]',
    PAGINATION_INPUT_FIELD: 'table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field',
    NEXT_BUTTON_FIELD: 'button[id="nextPageButton"]',
    LOGOUT_FIELD: 'a#ppm_header_logout'
};

class JourneyExecutor {

    static async executeFromPool(browserInstance, credentials){
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
        
            await this.updatePageDetails(page, ALL_DATA);
        
            const text = await page.evaluate(() => document.querySelector('table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field').getAttribute('aria-label'));
        
            let numberOfPages, temp = text.split('of ');
            if(temp && temp.length > 0){
                numberOfPages = parseInt(temp[1], 10);
            }
            if(numberOfPages){
                for(let i= 1; i < numberOfPages; i++){
                    try {
                        await page.click(JOURNEY.NEXT_BUTTON_FIELD);
                        await page.waitForNavigation();
                        await this.updatePageDetails(page, ALL_DATA);
                    } catch(e) {
                        ERRORS.push('Error in step' + i);
                    }
                    
                }
            }
            await page.click(JOURNEY.LOGOUT_FIELD);
        } catch (e){
            ERRORS.push('System exception occured. Please try again!')
        }
    
        let endTime = new Date();
        return {   
            data: ALL_DATA,
            errors: ERRORS,
            timeTaken: parseInt((endTime.getTime() - startTime.getTime()), 10)/1000,
        };
    }

    static async updatePageDetails(page, dataArr) {
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
}

module.exports = JourneyExecutor;