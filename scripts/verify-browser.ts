/**
 * SIRK Browser Verification - Automated Dashboard Validation
 *
 * Purpose: Verify dashboard renders correctly in headless browser
 * Exit codes: 0 = verified, 1 = failed
 *
 * Usage:
 *   npx tsx scripts/verify-browser.ts [instance_number]
 *   echo $?  # Check exit code: 0 = success, 1 = failure
 *
 * Prerequisites: Build must exist (npm run build)
 */

import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Simple static file server for dist/
function startStaticServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    let filePath = path.join(process.cwd(), 'dist', req.url === '/' ? 'index.html' : req.url || '');

    // Security: prevent directory traversal
    if (!filePath.startsWith(path.join(process.cwd(), 'dist'))) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath);
      const contentTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.map': 'application/json'
      };

      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      res.end(data);
    });
  });

  server.listen(port);
  return server;
}

async function verifyBrowser(instanceNumber?: number): Promise<boolean> {
  let driver: WebDriver | null = null;
  let server: http.Server | null = null;

  try {
    // Check build exists
    if (!fs.existsSync('dist/index.html')) {
      console.error('\n❌ BROWSER VERIFICATION FAILED: dist/ not found');
      console.error('   Run: npm run build\n');
      return false;
    }

    // Start static server
    const port = 3456;
    server = startStaticServer(port);
    console.log(`📡 Started static server on port ${port}`);

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Configure headless Chrome
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    console.log('🌐 Launching headless Chrome...');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Navigate to dashboard
    const url = `http://localhost:${port}`;
    console.log(`📄 Loading: ${url}`);
    await driver.get(url);

    // Wait for React to render
    await driver.wait(until.elementLocated(By.css('h1')), 5000);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Extra wait for charts

    // Verify title
    const title = await driver.findElement(By.css('h1')).getText();
    if (!title.includes('SIRK')) {
      console.error('\n❌ VERIFICATION FAILED: Title missing "SIRK"');
      console.error(`   Found: "${title}"\n`);
      return false;
    }
    console.log(`✅ Title verified: "${title}"`);

    // Check for metrics data (canvas elements from charts)
    const canvases = await driver.findElements(By.css('canvas'));
    if (canvases.length === 0) {
      console.error('\n❌ VERIFICATION FAILED: No chart canvas elements found\n');
      return false;
    }
    console.log(`✅ Charts detected: ${canvases.length} canvas elements`);

    // If specific instance requested, verify it exists in DOM
    if (instanceNumber !== undefined) {
      const bodyText = await driver.findElement(By.css('body')).getText();
      const instancePattern = new RegExp(`Instance ${instanceNumber}|instance.${instanceNumber}`, 'i');

      if (!instancePattern.test(bodyText)) {
        console.error(`\n❌ VERIFICATION FAILED: Instance ${instanceNumber} not found in page`);
        console.error(`   Page may not have loaded Instance ${instanceNumber} data\n`);
        return false;
      }
      console.log(`✅ Instance ${instanceNumber} data verified in page`);
    }

    console.log('\n✅ BROWSER VERIFICATION PASSED\n');
    return true;

  } catch (error) {
    console.error(`\n❌ BROWSER VERIFICATION ERROR: ${error}\n`);
    return false;
  } finally {
    // Cleanup
    if (driver) {
      await driver.quit();
      console.log('🔒 Browser closed');
    }
    if (server) {
      server.close();
      console.log('🔒 Server stopped\n');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const instanceNumber = args[0] ? parseInt(args[0]) : undefined;

  if (args[0] && isNaN(instanceNumber!)) {
    console.error('\n❌ ERROR: Invalid instance number\n');
    console.error('Usage:');
    console.error('  npx tsx scripts/verify-browser.ts              # Verify dashboard loads');
    console.error('  npx tsx scripts/verify-browser.ts 26           # Verify Instance 26 data\n');
    process.exit(1);
  }

  const isValid = await verifyBrowser(instanceNumber);
  process.exit(isValid ? 0 : 1);
}

main();
