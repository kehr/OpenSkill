// export-pdf.mjs
// Core PDF export worker. Invoked by export-pdf.sh after Chrome is located and
// puppeteer-core is installed in an isolated tmp dir.
//
// Strategy (rev 2, 2026-05-19):
// Use Chrome's native print engine via page.pdf() with print emulation.
// The deck's @media print block + @page size declaration in viewport-base.css
// drive pagination natively — no manual screenshot loop, no scroll, no clip.
//
// Why this changed: the previous "scroll → screenshot → stitch" strategy
// collided with `scroll-snap-type: y mandatory` in viewport-base.css. The snap
// would yank every scrollIntoView() back to slide 1, producing 22 identical
// pages of the cover. Going through @media print sidesteps scroll-snap
// entirely (print layout discards scroll containers) and yields a vector PDF
// roughly 10× smaller than the screenshot-stitched bitmap version.

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

// ----- arg parsing -----

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--compact') { args.compact = true; continue; }
  if (a.startsWith('--')) {
    args[a.slice(2)] = argv[i + 1];
    i++;
  }
}

const INPUT  = args.input;
const OUTPUT = args.output;
const CHROME = args.chrome;
const COMPACT = !!args.compact;

if (!INPUT || !OUTPUT || !CHROME) {
  console.error('usage: node export-pdf.mjs --input <path> --output <path> --chrome <executable> [--compact]');
  process.exit(1);
}

const WIDTH  = COMPACT ? 1280 : 1920;
const HEIGHT = COMPACT ? 720  : 1080;

const log = (m) => process.stderr.write(`[export-pdf.mjs] ${m}\n`);

// ----- mini static server (serve the input HTML's parent dir) -----

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
};

function startServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        const safePath = path.normalize(urlPath).replace(/^\/+/, '');
        const fullPath = path.join(rootDir, safePath);
        if (!fullPath.startsWith(rootDir)) {
          res.writeHead(403); res.end('forbidden'); return;
        }
        const stat = await fs.stat(fullPath).catch(() => null);
        if (!stat || !stat.isFile()) {
          res.writeHead(404); res.end('not found'); return;
        }
        const ext = path.extname(fullPath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(await fs.readFile(fullPath));
      } catch (e) {
        res.writeHead(500); res.end(String(e));
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
    server.on('error', reject);
  });
}

// ----- main -----

(async () => {
  const inputAbs = path.resolve(INPUT);
  const outputAbs = path.resolve(OUTPUT);
  const rootDir = path.dirname(inputAbs);
  const filename = path.basename(inputAbs);

  log(`viewport ${WIDTH}x${HEIGHT}`);
  log(`serving ${rootDir}`);

  const { server, port } = await startServer(rootDir);
  log(`local http server on :${port}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        `--window-size=${WIDTH},${HEIGHT}`,
      ],
      defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
    });

    const page = await browser.newPage();
    const url = `http://127.0.0.1:${port}/${encodeURIComponent(filename)}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for web fonts to load before measuring/screenshotting
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    const slideCount = await page.$$eval('.slide', (els) => els.length);
    if (!slideCount) {
      throw new Error('no .slide elements found in HTML');
    }
    log(`${slideCount} slides detected`);

    // Force-finalize all reveal animations across every slide so the printed
    // PDF doesn't capture mid-transition blank elements. (The deck's print
    // CSS already sets opacity:1 etc., but inline styles defeat any race
    // condition with the IntersectionObserver still in flight.)
    await page.evaluate(() => {
      document.querySelectorAll('.slide').forEach((s) => s.classList.add('visible'));
      document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-blur').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
        el.style.transition = 'none';
      });
    });

    // Switch to print media so the deck's @media print + @page rules apply.
    // This is the key fix: deck CSS declares `@page { size: 1920px 1080px }`
    // and `.slide { page-break-after: always }`, so Chrome's print pipeline
    // paginates correctly with one .slide per page, in landscape.
    await page.emulateMediaType('print');

    // Brief settle so layout reflows under print media before pdf() snapshots.
    await new Promise((r) => setTimeout(r, 400));

    await page.pdf({
      path: outputAbs,
      printBackground: true,
      preferCSSPageSize: true,   // honor the deck's @page size declaration
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '',            // all pages
    });

    log(`PDF written to ${outputAbs}`);
    log(`${slideCount} slides rendered via native print pipeline`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }
})().catch((err) => {
  console.error('[export-pdf.mjs] FATAL', err && err.stack || err);
  process.exit(1);
});
