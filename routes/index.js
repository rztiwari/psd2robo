var express = require('express');
var {executeJourney, executeFromPool} = require('../services/clarity');
var JourneyExecutor = require('../services/JourneyExecutor');
var BrowserPool = require('../services/BrowserPool');
var {getBrowserFromPool, initializeBrowserPool} = require('../services/browserService');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'PSD2 Robo' });
  // initializeBrowserPool();
});

router.get('/slow', function(req, res, next) {
  res.render('slow', { title: 'PSD2 Robo' });
  // initializeBrowserPool();
});

router.post('/execute', async function(req, res, next){
  let indexPage = 'https://claritymobile.fs.capgemini.com/', 
  credentials = {};
  credentials.username = req.body.userid;
  credentials.password = req.body.password;
  let browser = getBrowserFromPool();
  let displayBrowser = process.argv[2] || false;
  let response = await executeJourney(!displayBrowser, indexPage, credentials);
  // let response = await executeFromPool(browser, credentials);
  res.render('data', { 
      title: 'PSD2 Robo' , 
      data: response.data, 
      errors: response.errors,
      timeElapsed: response.timeTaken, 
      browserLoadTime: response.browserLoadTime
    });
});

router.post('/execute-pool', async function(req, res, next){
  let indexPage = req.body.indexPage, 
  isHeadless = req.body.mode === 'Headless' ? true : false,
  credentials = {};
  credentials.username = req.body.userid;
  credentials.password = req.body.password;
  let browser = BrowserPool.getBrowser();
  let response = await JourneyExecutor.executeFromPool(browser, credentials);
  BrowserPool.returnBrowser(browser, 'https://claritymobile.fs.capgemini.com/');
  res.render('data', { 
      title: 'PSD2 Robo' , 
      data: response.data, 
      errors: response.errors,
      timeElapsed: response.timeTaken, 
      browserLoadTime: response.browserLoadTime
    });
});

module.exports = router;
