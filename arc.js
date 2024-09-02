const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function parseUrlParams(url) {
    const params = new URLSearchParams(new URL(url).search);
    return {
        hwid: params.get('hwid') || 'unknown',
        zone: params.get('zone') || 'unknown',
        os: params.get('os') || 'unknown'
    };
}

async function promptForUrl() {
    return new Promise((resolve) => {
        rl.question('Enter the URL for Layer 1: ', (url) => {
            resolve(url);
            rl.close();
        });
    });
}

async function fetchLayer(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
                'Referer': 'https://spdmteam.com/'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return null;
    }
}

async function createNotification(message) {
    console.log(`[NOTIFICATION]: ${message}`);
}

async function bypassLayer(page) {
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const hwidFound = $('*').filter((i, el) => $(el).text().includes(hwid)).length > 0;
    if (hwidFound) {
        console.log('HWID found on the page.');
        return true;
    }

    await delay(1000);  // Delay before trying alternative methods
    return await alternativeMethod(page);
}

async function alternativeMethod(page) {
    const content = await page.content();
    const $ = cheerio.load(content);
    const success = $('*').filter((i, el) => $(el).text().includes('success')).length > 0;
    if (success) {
        console.log('Alternative method successful.');
        return true;
    }
    console.log('Alternative method failed.');
    return false;
}

async function searchForKeyElements(page) {
    const content = await page.content();
    const $ = cheerio.load(content);
    let foundKey = false;
    $('*').each((i, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('key') || text.includes('token')) {
            foundKey = true;
        }
    });
    return foundKey;
}

async function searchForRobloxConnections(page) {
    const content = await page.content();
    const $ = cheerio.load(content);
    let foundConnection = false;
    $('*').each((i, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('roblox') || text.includes('key system') || text.includes('token')) {
            foundConnection = true;
        }
    });
    return foundConnection;
}

async function scanAndActivateFinalLayer(page) {
    const keyFound = await searchForKeyElements(page);
    if (keyFound) {
        console.log('Final layer key found. Activating...');
        await createNotification('Arc Bypass Completed');
        return;
    }
    const connectionFound = await searchForRobloxConnections(page);
    if (connectionFound) {
        console.log('Final layer Roblox connection found. Activating...');
        await createNotification('Arc Bypass Completed');
        return;
    }
    await createNotification('Arc Bypass Failed');
}

async function solveCaptcha(page) {
    console.log('Attempting to solve captcha...');
    try {
        const captchaButton = await page.$('selector-for-captcha-button');
        if (captchaButton) {
            await captchaButton.click();
            await delay(2000);  // Wait for captcha to be solved
        } else {
            console.log('Captcha button not found.');
        }
    } catch (error) {
        console.error(`Error solving captcha: ${error.message}`);
    }
}

async function runProcess() {
    const url = await promptForUrl();
    const { hwid, zone, os } = parseUrlParams(url);
    const finalUrl = `https://spdmteam.com/key-system-getkey?hwid=${hwid}&zone=${zone}&os=${os}`;

    await createNotification('Arc Bypass V1');
    await delay(3000);
    await createNotification('Please Wait');

    const startTime = performance.now();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const layerUrls = [
        `https://spdmteam.com/key-system-1?hwid=${hwid}&zone=${zone}&os=${os}`,
        `https://spdmteam.com/key-system-2?hwid=${hwid}&zone=${zone}&os=${os}`,
        `https://spdmteam.com/key-system-3?hwid=${hwid}&zone=${zone}&os=${os}`
    ];

    for (let i = 0; i < layerUrls.length; i++) {
        await page.goto(layerUrls[i], { waitUntil: 'networkidle2' });
        await solveCaptcha(page);

        const html = await page.content();
        const layerSuccess = await bypassLayer(page);
        if (layerSuccess) {
            if (i === 2) {
                const endTime = performance.now();
                const bypassTime = ((endTime - startTime) / 1000).toFixed(2);
                await createNotification(`Arc Bypass: ${bypassTime} seconds`);
                await delay(3000);
            }
            break;
        } else {
            await delay(3000);
        }
    }

    await delay(3000);

    await page.goto(finalUrl, { waitUntil: 'networkidle2' });
    await scanAndActivateFinalLayer(page);

    await browser.close();
}

runProcess();
      
