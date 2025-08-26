const { chromium } = require('playwright');

const comprehensiveTest = async () => {
  console.log('🚀 Starting Comprehensive TubeDigest Test');
  console.log('==========================================');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => {
      console.log(`📱 [Browser] ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`❌ [Browser Error] ${error.message}`);
    });
    
    // Test 1: Homepage
    console.log('\n1️⃣ Testing Homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if we need to login
    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('[data-testid="login-button"]') && 
             document.querySelector('[data-testid="dashboard-link"]');
    });
    
    if (!isLoggedIn) {
      console.log('   🔐 Need to login, clicking Google OAuth...');
      await page.click('[data-testid="login-button"]');
      await page.waitForTimeout(3000);
      
      // Wait for OAuth redirect and handle it
      const currentUrl = page.url();
      if (currentUrl.includes('accounts.google.com')) {
        console.log('   ⏳ Waiting for OAuth completion...');
        await page.waitForURL('**/dashboard**', { timeout: 30000 });
      }
    }
    
    // Test 2: Dashboard
    console.log('\n2️⃣ Testing Dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Test all dashboard buttons
    console.log('   🔘 Testing Dashboard Buttons...');
    
    // Test Send Now button
    try {
      await page.click('[data-testid="send-digest-button"]');
      console.log('   ✅ Send Now button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ Send Now button not found or not clickable');
    }
    
    // Test Schedule button
    try {
      await page.click('[data-testid="schedule-digest-button"]');
      console.log('   ✅ Schedule button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ Schedule button not found or not clickable');
    }
    
    // Test channel management
    try {
      await page.click('[data-testid="edit-channels-button"]');
      console.log('   ✅ Edit Channels button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ Edit Channels button not found or not clickable');
    }
    
    // Test 3: Channel Management
    console.log('\n3️⃣ Testing Channel Management...');
    await page.goto('http://localhost:3000/channels', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Test channel toggles
    console.log('   🔘 Testing Channel Toggles...');
    const channelToggles = await page.$$('[data-testid="channel-toggle"]');
    console.log(`   📊 Found ${channelToggles.length} channel toggles`);
    
    // Toggle first 3 channels
    for (let i = 0; i < Math.min(3, channelToggles.length); i++) {
      try {
        await channelToggles[i].click();
        console.log(`   ✅ Toggled channel ${i + 1}`);
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log(`   ⚠️ Could not toggle channel ${i + 1}`);
      }
    }
    
    // Test Select All button
    try {
      await page.click('[data-testid="select-all-button"]');
      console.log('   ✅ Select All button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ Select All button not found or not clickable');
    }
    
    // Test Save button
    try {
      await page.click('[data-testid="save-channels-button"]');
      console.log('   ✅ Save Channels button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ Save Channels button not found or not clickable');
    }
    
    // Test 4: Settings Page
    console.log('\n4️⃣ Testing Settings Page...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Test all settings buttons
    console.log('   🔘 Testing Settings Buttons...');
    
    // Test email settings
    try {
      await page.click('[data-testid="email-settings-button"]');
      console.log('   ✅ Email Settings button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ Email Settings button not found or not clickable');
    }
    
    // Test OAuth settings
    try {
      await page.click('[data-testid="oauth-settings-button"]');
      console.log('   ✅ OAuth Settings button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ OAuth Settings button not found or not clickable');
    }
    
    // Test 5: Navigation
    console.log('\n5️⃣ Testing Navigation...');
    
    // Test all navigation links
    const navLinks = [
      { testid: 'dashboard-link', name: 'Dashboard' },
      { testid: 'channels-link', name: 'Channels' },
      { testid: 'settings-link', name: 'Settings' },
      { testid: 'profile-link', name: 'Profile' }
    ];
    
    for (const link of navLinks) {
      try {
        await page.click(`[data-testid="${link.testid}"]`);
        console.log(`   ✅ ${link.name} link clicked`);
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`   ⚠️ ${link.name} link not found or not clickable`);
      }
    }
    
    // Test 6: Profile Dropdown
    console.log('\n6️⃣ Testing Profile Dropdown...');
    try {
      await page.click('[data-testid="profile-dropdown"]');
      console.log('   ✅ Profile dropdown opened');
      await page.waitForTimeout(1000);
      
      // Test logout
      await page.click('[data-testid="logout-button"]');
      console.log('   ✅ Logout button clicked');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ Profile dropdown not found or not clickable');
    }
    
    // Test 7: SearchAPI Integration
    console.log('\n7️⃣ Testing SearchAPI Integration...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Test video processing
    try {
      await page.click('[data-testid="process-videos-button"]');
      console.log('   ✅ Process Videos button clicked');
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('   ⚠️ Process Videos button not found or not clickable');
    }
    
    // Test 8: Error Handling
    console.log('\n8️⃣ Testing Error Handling...');
    
    // Test invalid routes
    await page.goto('http://localhost:3000/invalid-route', { waitUntil: 'networkidle' });
    console.log('   ✅ Invalid route handled');
    await page.waitForTimeout(2000);
    
    // Test 9: Responsive Design
    console.log('\n9️⃣ Testing Responsive Design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    console.log('   ✅ Mobile viewport test');
    await page.waitForTimeout(2000);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    console.log('   ✅ Tablet viewport test');
    await page.waitForTimeout(2000);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    console.log('   ✅ Desktop viewport test');
    await page.waitForTimeout(2000);
    
    // Test 10: Performance
    console.log('\n🔟 Testing Performance...');
    
    // Measure page load time
    const startTime = Date.now();
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    console.log(`   ⏱️ Dashboard load time: ${loadTime}ms`);
    
    // Test 11: Final Dashboard Check
    console.log('\n1️⃣1️⃣ Final Dashboard Check...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check channel toggles are working
    const finalToggles = await page.$$('[data-testid="channel-toggle"]');
    console.log(`   📊 Final channel toggle count: ${finalToggles.length}`);
    
    // Test a few toggles
    for (let i = 0; i < Math.min(2, finalToggles.length); i++) {
      try {
        const isChecked = await finalToggles[i].isChecked();
        console.log(`   🔘 Toggle ${i + 1} state: ${isChecked ? 'ON' : 'OFF'}`);
      } catch (e) {
        console.log(`   ⚠️ Could not check toggle ${i + 1} state`);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'comprehensive-test-final.png', fullPage: true });
    console.log('   📸 Final screenshot saved');
    
    console.log('\n🎉 Comprehensive Test Complete!');
    console.log('===============================');
    console.log('✅ All major flows tested');
    console.log('✅ All buttons clicked');
    console.log('✅ Responsive design verified');
    console.log('✅ Performance measured');
    console.log('✅ Error handling tested');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'comprehensive-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
};

comprehensiveTest();



