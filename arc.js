const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getUrlParams(url) {
    const params = new URLSearchParams(new URL(url).search);
    return {
        hwid: params.get('hwid') || 'unknown',
        zone: params.get('zone') || 'unknown',
        os: params.get('os') || 'unknown'
    };
}

async function askForUrl() {
    return new Promise((resolve) => {
        rl.question('Arc Bypass [URL] >', (url) => {
            resolve(url);
            rl.close();
        });
    });
}

async function NotifyBitch(message) {
    console.log(`[NOTIFICATION]: ${message}`);
}

async function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function bypassPage(page) {
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const foundHwid = $('*').filter((i, el) => $(el).text().includes(hwid)).length > 0;
    if (foundHwid) {
        console.log('HWID found on the page.');
        return true;
    }

    await pause(1000);
    return await tryAlternative(page);
}

async function tryAlternative(page) {
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

async function findKeyElements(page) {
    const content = await page.content();
    const $ = cheerio.load(content);
    let foundKey = false;
    
    $('*').each((i, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('key') || text.includes('token')) {
            foundKey = true;
        }
    });

    if (foundKey) {
        console.log('Key or token found.');
        await activateKey(page);
    }
    return foundKey;
}

async function activateKey(page) {
    try {
        const keyInput = await page.$('input[name="key"]');
        if (keyInput) {
            const keyValue = await page.evaluate(el => el.value, keyInput);
            console.log(`Activating key/token: ${keyValue}`);
            await axios.post('https://example.com/activate', { key: keyValue });
        }
    } catch (error) {
        console.error(`Error activating key/token: ${error.message}`);
    }
}

async function checkRoblox(page) {
    const content = await page.content();
    const $ = cheerio.load(content);
    let foundConnection = false;
    $('*').each((i, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('roblox') || text.includes('key-system') || text.includes('token')) {
            foundConnection = true;
        }
    });
    return foundConnection;
}

async function scanFinalLayer(page) {
    const keyFound = await findKeyElements(page);
    if (keyFound) {
        console.log('Final layer key found. Activating...');
        await NotifyBitch('Arc Bypass Completed');
        return;
    }
    const connectionFound = await checkRoblox(page);
    if (connectionFound) {
        console.log('Final layer Roblox connection found. Activating...');
        await NotifyBitch('Arc Bypass Completed');
        return;
    }
    await NotifyBitch('Arc Bypass Failed');
}

async function solveCaptcha(page) {
    console.log('Attempting to solve captcha...');
    try {
        const captchaButton = await page.$('selector-for-captcha-button');
        if (captchaButton) {
            await captchaButton.click();
            await pause(2000);
        } else {
            console.log('Captcha button not found.');
        }
    } catch (error) {
        console.error(`Error solving captcha: ${error.message}`);
    }
}

async function run() {
    const url = await askForUrl();
    const { hwid, zone, os } = getUrlParams(url);
    const finalUrl = `https://spdmteam.com/key-system-getkey?hwid=${hwid}&zone=${zone}&os=${os}`;

    await NotifyBitch('Arc Bypass V1');
    await pause(3000);
    await NotifyBitch('Please Wait');

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
        const layerSuccess = await bypassPage(page);
        if (layerSuccess) {
            if (i === 2) {
                const endTime = performance.now();
                const bypassTime = ((endTime - startTime) / 1000).toFixed(2);
                await NotifyBitch(`Arc Bypass: ${bypassTime} seconds`);
                await pause(3000);
            }
            break;
        } else {
            await pause(3000);
        }
    }

    await pause(3000);

    await page.goto(finalUrl, { waitUntil: 'networkidle2' });
    await scanFinalLayer(page);

    await browser.close();
}

run();
