const { chromium } = require('playwright');

async function runVisualTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Starting visual test of TubeDigest app...');
  
  try {
    // 1. Test Home Page
    console.log('📸 Testing home page...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/01-home-page.png', fullPage: true });
    console.log('✅ Home page screenshot saved');
    
    // 2. Test Health Endpoint
    console.log('📸 Testing health endpoint...');
    await page.goto('http://localhost:3000/health');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-health-endpoint.png', fullPage: true });
    console.log('✅ Health endpoint screenshot saved');
    
    // 3. Test Channels API
    console.log('📸 Testing channels API...');
    await page.goto('http://localhost:3000/channels');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/03-channels-api.png', fullPage: true });
    console.log('✅ Channels API screenshot saved');
    
    // 4. Test Digest Latest
    console.log('📸 Testing digest latest...');
    await page.goto('http://localhost:3000/digests/latest');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/04-digest-latest.png', fullPage: true });
    console.log('✅ Digest latest screenshot saved');
    
    // 5. Test Digest Test
    console.log('📸 Testing digest test...');
    await page.goto('http://localhost:3000/digests/test');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/05-digest-test.png', fullPage: true });
    console.log('✅ Digest test screenshot saved');
    
    // 6. Test Email Test
    console.log('📸 Testing email test...');
    await page.goto('http://localhost:3000/digests/test-email');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06-email-test.png', fullPage: true });
    console.log('✅ Email test screenshot saved');
    
    // 7. Test with some interaction
    console.log('📸 Testing page interactions...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the main page
    await page.screenshot({ path: 'screenshots/07-main-page-interaction.png', fullPage: true });
    console.log('✅ Main page interaction screenshot saved');
    
    console.log('🎉 Visual test completed successfully!');
    console.log('📁 Screenshots saved in screenshots/ directory');
    
  } catch (error) {
    console.error('❌ Visual test failed:', error);
    await page.screenshot({ path: 'screenshots/error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
  console.log('📁 Created screenshots directory');
}

runVisualTest();
