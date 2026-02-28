import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();

// Desktop
await page.setViewport({ width: 1280, height: 800 });
await page.goto("http://localhost:5174/rankingofclaws/", { waitUntil: "networkidle0", timeout: 15000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: "/tmp/rok-desktop.png" });

// Mobile
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto("http://localhost:5174/rankingofclaws/", { waitUntil: "networkidle0", timeout: 15000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: "/tmp/rok-mobile.png" });

await browser.close();
console.log("done");
