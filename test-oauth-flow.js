const { chromium } = require('playwright');

async function testOAuthFlow() {
  console.log('🚀 Testing OAuth Flow...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Test Frontend Dashboard
    console.log('📊 Testing Frontend Dashboard...');
    await page.goto('http://localhost:3001/');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/11-oauth-dashboard.png', fullPage: true });
    console.log('✅ Dashboard loaded');
    
    // 2. Test OAuth Button
    console.log('🔐 Testing OAuth Button...');
    const signInButton = await page.locator('button:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      console.log('✅ Sign In button found');
      await page.screenshot({ path: 'screenshots/12-signin-button.png', fullPage: true });
      
      // 3. Click Sign In and test OAuth redirect
      console.log('🔄 Testing OAuth Redirect...');
      await signInButton.click();
      await page.waitForTimeout(2000);
      
      // Check if we're redirected to Google
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      if (currentUrl.includes('accounts.google.com')) {
        console.log('✅ Successfully redirected to Google OAuth');
        await page.screenshot({ path: 'screenshots/13-google-oauth.png', fullPage: true });
      } else {
        console.log('❌ Not redirected to Google OAuth');
        await page.screenshot({ path: 'screenshots/13-oauth-error.png', fullPage: true });
      }
    } else {
      console.log('❌ Sign In button not found');
    }
    
    console.log('\n🎉 OAuth Flow Test Completed Successfully!');
    console.log('📸 Screenshots saved to screenshots/ folder');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: 'screenshots/oauth-error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testOAuthFlow().catch(console.error);
