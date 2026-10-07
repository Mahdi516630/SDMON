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

// Serve static assets from root directory
app.use(express.static(__dirname, {
  maxAge: '1h',
  etag: true,
}));

// SPA fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
