import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

try {
  if (!fs.existsSync(indexPath)) {
    console.error('Error: dist/index.html does not exist. Run vite build first.');
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  // 1. Inline Stylesheets
  const cssRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g;
  let cssMatch;
  // Use a temporary copy of html to find matches to prevent regex state skewing
  const cssMatchesToReplace = [];
  while ((cssMatch = cssRegex.exec(html)) !== null) {
    cssMatchesToReplace.push({
      tag: cssMatch[0],
      href: cssMatch[1]
    });
  }

  for (const match of cssMatchesToReplace) {
    const fileName = path.basename(match.href);
    const fullAssetPath = path.join(distDir, 'assets', fileName);
    
    if (fs.existsSync(fullAssetPath)) {
      const cssContent = fs.readFileSync(fullAssetPath, 'utf-8');
      const styleTag = `<style>${cssContent}</style>`;
      html = html.replace(match.tag, styleTag);
      console.log(`Successfully inlined CSS: ${fileName}`);
    } else {
      console.warn(`CSS asset not found at path: ${fullAssetPath}`);
    }
  }

  // 2. Inline Scripts
  const jsRegex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
  let jsMatch;
  const jsMatchesToReplace = [];
  while ((jsMatch = jsRegex.exec(html)) !== null) {
    jsMatchesToReplace.push({
      tag: jsMatch[0],
      src: jsMatch[1]
    });
  }

  for (const match of jsMatchesToReplace) {
    const fileName = path.basename(match.src);
    const fullAssetPath = path.join(distDir, 'assets', fileName);
    
    if (fs.existsSync(fullAssetPath)) {
      const jsContent = fs.readFileSync(fullAssetPath, 'utf-8');
      const scriptTag = `<script type="module">${jsContent}</script>`;
      html = html.replace(match.tag, scriptTag);
      console.log(`Successfully inlined JS: ${fileName}`);
    } else {
      console.warn(`JS asset not found at path: ${fullAssetPath}`);
    }
  }

  // Save the monolithic HTML file
  const singleHtmlPath = path.join(distDir, 'builder_single.html');
  fs.writeFileSync(singleHtmlPath, html, 'utf-8');
  console.log(`🎉 Monolithic single HTML builder app generated at dist/builder_single.html`);
} catch (err) {
  console.error('Postbuild script failed with error:', err);
  process.exit(1);
}
