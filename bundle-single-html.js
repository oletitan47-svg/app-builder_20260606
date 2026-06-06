import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('Building app first...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Inlining assets...');
const distDir = path.join(process.cwd(), 'dist');
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// Find and inline stylesheet link tags
const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g;
html = html.replace(linkRegex, (match, href) => {
  const cssPath = path.join(distDir, href.startsWith('/') ? href.slice(1) : href);
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    return `<style>${cssContent}</style>`;
  }
  return match;
});

// Find and inline script tags
const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
html = html.replace(scriptRegex, (match, src) => {
  const jsPath = path.join(distDir, src.startsWith('/') ? src.slice(1) : src);
  if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    const cleanJs = jsContent.replace(/\/\/# sourceMappingURL=.*/g, '');
    return `<script type="module">${cleanJs}</script>`;
  }
  return match;
});

// Create public directory if it doesn't exist
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Write the compiled single html
fs.writeFileSync(path.join(publicDir, 'builder_standalone.html'), html, 'utf-8');
console.log('Single html bundle created successfully at public/builder_standalone.html');
