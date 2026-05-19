// export-pdf.mjs
// Core PDF export worker. Invoked by export-pdf.sh after Chrome is located and
// puppeteer-core is installed in an isolated tmp dir.
//
// Strategy: per-slide screenshot, then stitch into a single PDF via a second
// inline HTML page that uses @page CSS for fixed page size. Animation-aware:
// before each screenshot we force every .reveal* element on the active slide
// to its final state (opacity:1, transform:none, filter:none) so paused CSS
// transitions are captured visible, not blank.

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

    // Inject helpers once. force-final + activate one slide at a time.
    await page.evaluate(() => {
      window.__exportForceFinal = (i) => {
        const slides = document.querySelectorAll('.slide');
        slides.forEach((s, idx) => {
          s.style.opacity = '';
          s.style.visibility = '';
          s.style.display = '';
          s.classList.toggle('active', idx === i);
          s.classList.toggle('visible', idx === i);
        });
        if (window.presentation && typeof window.presentation.goToSlide === 'function') {
          try { window.presentation.goToSlide(i); } catch {}
        }
        slides[i].scrollIntoView({ behavior: 'instant', block: 'start' });
        // Force every reveal class on the active slide to final state.
        slides[i].querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-blur').forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.filter = 'none';
          el.style.visibility = 'visible';
        });
      };
    });

    // Capture each slide to PNG
    const pngs = [];
    for (let i = 0; i < slideCount; i++) {
      await page.evaluate((idx) => window.__exportForceFinal(idx), i);
      await new Promise((r) => setTimeout(r, 250));
      const buf = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      });
      pngs.push(buf);
      log(`slide ${String(i + 1).padStart(2, '0')}/${slideCount} captured (${buf.length} bytes)`);
    }

    // Stitch via second page with @page CSS
    const wrapper = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: ${WIDTH}px ${HEIGHT}px; margin: 0; }
      html, body { margin: 0; padding: 0; background: #000; }
      .page { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .page img { width: 100%; height: 100%; display: block; }
    </style></head><body>
      ${pngs.map((b) => `<div class="page"><img src="data:image/png;base64,${b.toString('base64')}"></div>`).join('\n')}
    </body></html>`;

    const pdfPage = await browser.newPage();
    await pdfPage.setContent(wrapper, { waitUntil: 'load' });
    await pdfPage.pdf({
      path: outputAbs,
      printBackground: true,
      preferCSSPageSize: true,
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    log(`PDF written to ${outputAbs}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }
})().catch((err) => {
  console.error('[export-pdf.mjs] FATAL', err && err.stack || err);
  process.exit(1);
});
