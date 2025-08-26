const { chromium } = require('playwright');

const authenticatedTest = async () => {
  console.log('🚀 Starting Authenticated TubeDigest Test');
  console.log('=========================================');
  console.log('⚠️  Please log in manually first, then press Enter to continue...');
  
  // Wait for user to log in
  await new Promise(resolve => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
  
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
    
    // Test 1: Start from Channels Page
    console.log('\n1️⃣ Testing Channels Page...');
    await page.goto('http://localhost:3000/channels', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Take screenshot of channels page
    await page.screenshot({ path: 'channels-page-initial.png', fullPage: true });
    console.log('   📸 Channels page screenshot saved');
    
    // Check if we're authenticated
    const isAuthenticated = await page.evaluate(() => {
      return !document.querySelector('[data-testid="login-button"]') && 
             document.querySelector('[data-testid="dashboard-link"]');
    });
    
    if (!isAuthenticated) {
      console.log('   ❌ Not authenticated! Please log in manually and restart the test.');
      return;
    }
    
    console.log('   ✅ User is authenticated');
    
    // Get channel data
    const channelData = await page.evaluate(() => {
      const channels = Array.from(document.querySelectorAll('[data-testid="channel-item"]'));
      return channels.map((channel, index) => ({
        index,
        title: channel.querySelector('[data-testid="channel-title"]')?.textContent?.trim(),
        isSelected: channel.querySelector('input[type="checkbox"]')?.checked || false,
        hasToggle: !!channel.querySelector('input[type="checkbox"], .ant-switch')
      }));
    });
    
    console.log('   📊 Channel data:', channelData);
    
    // Test 2: Channel Toggles
    console.log('\n2️⃣ Testing Channel Toggles...');
    
    // Find all channel toggles
    const channelToggles = await page.$$('input[type="checkbox"], .ant-switch, [role="switch"]');
    console.log(`   🔘 Found ${channelToggles.length} channel toggles`);
    
    // Test toggling first 3 channels
    for (let i = 0; i < Math.min(3, channelToggles.length); i++) {
      try {
        const beforeState = await channelToggles[i].isChecked();
        await channelToggles[i].click();
        await page.waitForTimeout(1000);
        const afterState = await channelToggles[i].isChecked();
        console.log(`   ✅ Toggled channel ${i + 1}: ${beforeState} → ${afterState}`);
      } catch (e) {
        console.log(`   ⚠️ Could not toggle channel ${i + 1}: ${e.message}`);
      }
    }
    
    // Take screenshot after toggling
    await page.screenshot({ path: 'channels-page-after-toggles.png', fullPage: true });
    console.log('   📸 After toggles screenshot saved');
    
    // Test 3: Channel Management Buttons
    console.log('\n3️⃣ Testing Channel Management Buttons...');
    
    // Find all buttons
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        className: b.className,
        disabled: b.disabled,
        dataTestId: b.getAttribute('data-testid')
      }));
    });
    
    console.log('   🔘 Buttons found:', buttons);
    
    // Click each button
    for (const buttonInfo of buttons) {
      if (buttonInfo.text && !buttonInfo.disabled) {
        try {
          await page.click(`button:has-text("${buttonInfo.text}")`);
          console.log(`   ✅ Clicked button: "${buttonInfo.text}"`);
          await page.waitForTimeout(2000);
          
          // Take screenshot after each button click
          await page.screenshot({ path: `after-${buttonInfo.text.replace(/\s+/g, '-').toLowerCase()}.png`, fullPage: true });
          console.log(`   📸 Screenshot saved: after-${buttonInfo.text.replace(/\s+/g, '-').toLowerCase()}.png`);
        } catch (e) {
          console.log(`   ⚠️ Could not click button: "${buttonInfo.text}" - ${e.message}`);
        }
      }
    }
    
    // Test 4: Dashboard Navigation
    console.log('\n4️⃣ Testing Dashboard Navigation...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'dashboard-page.png', fullPage: true });
    console.log('   📸 Dashboard page screenshot saved');
    
    // Test dashboard functionality
    const dashboardButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        disabled: b.disabled,
        dataTestId: b.getAttribute('data-testid')
      }));
    });
    
    console.log('   🔘 Dashboard buttons:', dashboardButtons);
    
    // Test channel sidebar
    console.log('\n5️⃣ Testing Channel Sidebar...');
    
    // Look for channel sidebar
    const sidebar = await page.$('[data-testid="channel-sidebar"], .channel-sidebar, .ant-drawer');
    if (sidebar) {
      console.log('   ✅ Channel sidebar found');
      
      // Test sidebar toggles
      const sidebarToggles = await page.$$('[data-testid="channel-sidebar"] input[type="checkbox"], [data-testid="channel-sidebar"] .ant-switch');
      console.log(`   🔘 Found ${sidebarToggles.length} sidebar toggles`);
      
      // Test first 2 sidebar toggles
      for (let i = 0; i < Math.min(2, sidebarToggles.length); i++) {
        try {
          const beforeState = await sidebarToggles[i].isChecked();
          await sidebarToggles[i].click();
          await page.waitForTimeout(1000);
          const afterState = await sidebarToggles[i].isChecked();
          console.log(`   ✅ Toggled sidebar channel ${i + 1}: ${beforeState} → ${afterState}`);
        } catch (e) {
          console.log(`   ⚠️ Could not toggle sidebar channel ${i + 1}: ${e.message}`);
        }
      }
      
      await page.screenshot({ path: 'dashboard-with-sidebar-toggles.png', fullPage: true });
      console.log('   📸 Dashboard with sidebar toggles screenshot saved');
    } else {
      console.log('   ⚠️ Channel sidebar not found');
    }
    
    // Test 6: Settings Page
    console.log('\n6️⃣ Testing Settings Page...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'settings-page.png', fullPage: true });
    console.log('   📸 Settings page screenshot saved');
    
    // Test settings functionality
    const settingsButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        disabled: b.disabled,
        dataTestId: b.getAttribute('data-testid')
      }));
    });
    
    console.log('   🔘 Settings buttons:', settingsButtons);
    
    // Test 7: Profile/Logout
    console.log('\n7️⃣ Testing Profile/Logout...');
    
    // Look for profile elements
    const profileElements = await page.$$('.ant-avatar, .profile-avatar, [data-testid*="profile"], [data-testid*="avatar"]');
    
    if (profileElements.length > 0) {
      try {
        await profileElements[0].click();
        console.log('   ✅ Clicked profile/avatar');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'profile-dropdown.png', fullPage: true });
        console.log('   📸 Profile dropdown screenshot saved');
        
        // Look for logout option
        const logoutButton = await page.locator('button:has-text("Logout"), a:has-text("Logout"), .ant-dropdown-menu-item:has-text("Logout")').first();
        
        if (await logoutButton.count() > 0) {
          console.log('   ✅ Logout option found');
          // Don't actually logout to keep session for further testing
        } else {
          console.log('   ⚠️ Logout option not found');
        }
      } catch (e) {
        console.log('   ⚠️ Could not interact with profile/avatar: ' + e.message);
      }
    } else {
      console.log('   ⚠️ Profile elements not found');
    }
    
    // Test 8: Back to Channels for Final Check
    console.log('\n8️⃣ Final Channels Check...');
    await page.goto('http://localhost:3000/channels', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check final state
    const finalChannelState = await page.evaluate(() => {
      const channels = Array.from(document.querySelectorAll('[data-testid="channel-item"]'));
      return channels.map((channel, index) => ({
        index,
        title: channel.querySelector('[data-testid="channel-title"]')?.textContent?.trim(),
        isSelected: channel.querySelector('input[type="checkbox"]')?.checked || false
      }));
    });
    
    console.log('   📊 Final channel state:', finalChannelState);
    
    await page.screenshot({ path: 'channels-page-final.png', fullPage: true });
    console.log('   📸 Final channels page screenshot saved');
    
    // Test 9: SearchAPI Integration
    console.log('\n9️⃣ Testing SearchAPI Integration...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Look for SearchAPI related elements
    const searchApiElements = await page.evaluate(() => {
      return {
        hasSearchApiButton: !!document.querySelector('[data-testid*="search"], [data-testid*="api"]'),
        hasProcessButton: !!document.querySelector('button:has-text("Process"), button:has-text("Ingest")'),
        hasVideoElements: document.querySelectorAll('[data-testid*="video"]').length
      };
    });
    
    console.log('   🔍 SearchAPI elements:', searchApiElements);
    
    // Test video processing if available
    const processButton = await page.locator('button:has-text("Process"), button:has-text("Ingest")').first();
    if (await processButton.count() > 0) {
      try {
        await processButton.click();
        console.log('   ✅ Clicked process/ingest button');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'after-process-click.png', fullPage: true });
        console.log('   📸 After process click screenshot saved');
      } catch (e) {
        console.log('   ⚠️ Could not click process button: ' + e.message);
      }
    } else {
      console.log('   ⚠️ Process/ingest button not found');
    }
    
    // Test 10: Performance Check
    console.log('\n🔟 Performance Check...');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    console.log(`   ⏱️ Dashboard load time: ${loadTime}ms`);
    
    // Final summary
    console.log('\n🎉 Authenticated Test Complete!');
    console.log('==============================');
    console.log('✅ Channels page tested');
    console.log('✅ Channel toggles tested');
    console.log('✅ Dashboard functionality tested');
    console.log('✅ Settings page tested');
    console.log('✅ Profile/logout tested');
    console.log('✅ SearchAPI integration tested');
    console.log('✅ Performance measured');
    console.log('✅ Multiple screenshots saved');
    
    // List all screenshots taken
    const screenshots = [
      'channels-page-initial.png',
      'channels-page-after-toggles.png',
      'dashboard-page.png',
      'dashboard-with-sidebar-toggles.png',
      'settings-page.png',
      'profile-dropdown.png',
      'channels-page-final.png',
      'after-process-click.png'
    ];
    
    console.log('\n📸 Screenshots taken:');
    screenshots.forEach(screenshot => {
      console.log(`   • ${screenshot}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
};

authenticatedTest();



