import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// Google Search Console & Domain Verification routes
app.get('/xfkazewdi2of', (req, res) => {
  res.type('text/plain').send('google-site-verification: xfkazewdi2of');
});

app.get('/xfkazewdi2of.html', (req, res) => {
  res.type('text/html').send('google-site-verification: xfkazewdi2of');
});

// Explicit SEO routes with correct MIME types
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').sendFile(path.join(__dirname, 'sitemap.xml'));
});

function sendNoCacheIndex(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'index.html'), {
    etag: false,
    lastModified: false,
    cacheControl: false,
  });
}

// Always serve index.html uncached so updates appear immediately
app.get(['/', '/index.html'], (req, res) => {
  sendNoCacheIndex(res);
});

// Serve static assets from root directory without stale caching
app.use(express.static(__dirname, {
  maxAge: 0,
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  },
}));

// SPA fallback to index.html
app.get('*', (req, res) => {
  sendNoCacheIndex(res);
});

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
