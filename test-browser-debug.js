const puppeteer = require('puppeteer');

const testBrowserDebug = async () => {
  console.log('🔍 Testing Browser Debug Output');
  console.log('================================');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the dashboard
    console.log('\n1. Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    console.log('2. Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    // Get console logs
    console.log('3. Checking console logs...');
    const logs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });
    
    console.log('   📋 Console logs:');
    logs.forEach((log, index) => {
      console.log(`      ${index + 1}. ${log}`);
    });
    
    // Check if channels are loaded
    console.log('4. Checking channel data...');
    const channelData = await page.evaluate(() => {
      // Try to access React Query data
      if (window.__REACT_QUERY_DEVTOOLS_GLOBAL__) {
        return 'React Query DevTools available';
      }
      return 'React Query DevTools not available';
    });
    
    console.log(`   📊 Channel data: ${channelData}`);
    
    // Take a screenshot
    console.log('5. Taking screenshot...');
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('   📸 Screenshot saved as debug-screenshot.png');
    
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
  } finally {
    await browser.close();
  }
};

testBrowserDebug();



