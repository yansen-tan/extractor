const puppeteer = require('puppeteer');
const credential = require('./credential');
const url = require('url');
const _ = require('lodash');
const fs = require('fs');

const USERNAME_SELECTOR = 'input#email';
const PASSWORD_SELECTOR = 'input#pass';
const LOGIN_SELECTOR = 'button#loginbutton';
const URL_TO_EXTRACT = 'https://www.facebook.com/groups/1866789183611049/members';

async function scrollWholePage(page, scrollDelay = 3000) {
	try {
		let previousHeight;
		let currentHeight = await page.evaluate('document.body.scrollHeight'); 
		while (previousHeight !== currentHeight) {
			console.log('Current Height', currentHeight);
			console.log('Previous Height', previousHeight);
			await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
			await page.waitFor(scrollDelay);
			previousHeight = currentHeight;
			currentHeight = await page.evaluate('document.body.scrollHeight'); 			
			console.log('Current Height', currentHeight);
			console.log('Previous Height', previousHeight);
		}
	} catch(e) { 
		console.log(e) 
	}
}

/*
	RUN 
*/

async function run() {
	const browser = await puppeteer.launch({
		headless: false,
		args: ['--disable-notifications']
	});

	const page = await browser.newPage();

	await page.setViewport({width: 1440, height: 900});

	await page.goto('https://facebook.com/login');
	
	await page.click(USERNAME_SELECTOR);
	await page.keyboard.type(credential.facebook.username);

	await page.click(PASSWORD_SELECTOR);
	await page.keyboard.type(credential.facebook.password);

	await page.click('button#loginbutton');
	await page.waitFor(2000);

	await page.goto(URL_TO_EXTRACT);

	// Get Total Member
	let groupName = await page.evaluate((sel) => {
		return document.querySelector('h1#seo_h1_tag > a').textContent;
	});

	//Scrolling Page
	await scrollWholePage(page);
	await page.waitFor(1000);	

	let uris = await page.evaluate((sel) => {
		let elements = Array.from(document.querySelectorAll('div._60ri > a[data-hovercard]'));
    let links = elements.map(element => {
      return element.getAttribute('data-hovercard');
    })

    return links;
	});	

	let members = uris.map((uri) => {
		let facebook = url.parse(uri, true).query;
		return facebook.id;		
	});

	members = _.uniq(members);
	fs.writeFileSync(`${__dirname}/${groupName}`, members.join('\n'), 'UTF-8');
	browser.close();
	
}

console.log('Extracing members from:', URL_TO_EXTRACT);
run();