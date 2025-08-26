const { chromium } = require('playwright');

const comprehensiveUITest = async () => {
  console.log('🎯 Comprehensive UI/UX Test');
  console.log('===========================');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to dashboard
    console.log('📱 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'ui-test-results.png', fullPage: true });
    console.log('📸 Screenshot saved as ui-test-results.png');
    
    // Test 1: Check for mock data removal
    console.log('\n🔍 Test 1: Mock Data Check');
    const pageContent = await page.content();
    const hasMockData = pageContent.includes('Mock Video') || pageContent.includes('mock-');
    
    if (hasMockData) {
      console.log('   ❌ Mock data still present');
    } else {
      console.log('   ✅ Mock data removed successfully');
    }
    
    // Test 2: Check channel selection state
    console.log('\n🔍 Test 2: Channel Selection State');
    const selectedCountText = await page.locator('text=/Channels \(\d+\/10\)/').first().textContent();
    console.log(`   📊 Selected count: ${selectedCountText}`);
    
    // Check if toggles reflect the selection
    const toggles = await page.locator('.ant-switch').all();
    console.log(`   🔘 Total toggles: ${toggles.length}`);
    
    let onToggles = 0;
    for (let i = 0; i < toggles.length; i++) {
      const isChecked = await toggles[i].getAttribute('aria-checked');
      if (isChecked === 'true') {
        onToggles++;
      }
    }
    console.log(`   ✅ Toggles ON: ${onToggles}`);
    console.log(`   ❌ Toggles OFF: ${toggles.length - onToggles}`);
    
    // Test 3: Check UI modernization
    console.log('\n🔍 Test 3: UI Modernization Check');
    
    // Check for removed elements
    const refreshCacheBtn = await page.locator('text=Refresh Cache').count();
    const quickActionsText = await page.locator('text=Quick Actions').count();
    const editBtn = await page.locator('text=Edit').count();
    const selectedForDigestText = await page.locator('text=Selected for Digest').count();
    
    console.log(`   🔄 "Refresh Cache" buttons: ${refreshCacheBtn} (should be 0)`);
    console.log(`   📋 "Quick Actions" text: ${quickActionsText} (should be 0)`);
    console.log(`   ✏️ "Edit" buttons: ${editBtn} (should be 0)`);
    console.log(`   ✅ "Selected for Digest" text: ${selectedForDigestText} (should be 0)`);
    
    // Check for modern elements
    const menuIcon = await page.locator('.anticon-menu').count();
    const channelsTitle = await page.locator('text=/Channels \(\d+\/10\)/').count();
    
    console.log(`   ☰ Menu icons: ${menuIcon} (should be > 0)`);
    console.log(`   📺 "Channels" title: ${channelsTitle} (should be > 0)`);
    
    // Test 4: Check for emoji icons
    console.log('\n🔍 Test 4: Emoji Icon Check');
    const emojiElements = await page.locator('text=/[🚀🎯📊📋🔍🔄]/').all();
    console.log(`   😀 Emoji icons found: ${emojiElements.length} (should be minimal)`);
    
    // Test 5: Overall UI assessment
    console.log('\n🔍 Test 5: Overall UI Assessment');
    
    const issues = [];
    if (hasMockData) issues.push('Mock data still present');
    if (refreshCacheBtn > 0) issues.push('Refresh Cache button not removed');
    if (quickActionsText > 0) issues.push('Quick Actions text not removed');
    if (editBtn > 0) issues.push('Edit button not removed');
    if (selectedForDigestText > 0) issues.push('Selected for Digest text not removed');
    if (menuIcon === 0) issues.push('Menu icon not found');
    if (channelsTitle === 0) issues.push('Channels title not found');
    
    if (issues.length === 0) {
      console.log('   ✅ All UI improvements implemented successfully');
    } else {
      console.log('   ❌ Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    // Test 6: Channel toggle functionality
    console.log('\n🔍 Test 6: Channel Toggle Functionality');
    
    if (toggles.length > 0) {
      // Try to toggle the first channel
      const firstToggle = toggles[0];
      const initialState = await firstToggle.getAttribute('aria-checked');
      console.log(`   🔘 First toggle initial state: ${initialState}`);
      
      // Click the toggle
      await firstToggle.click();
      await page.waitForTimeout(1000);
      
      const newState = await firstToggle.getAttribute('aria-checked');
      console.log(`   🔘 First toggle new state: ${newState}`);
      
      if (initialState !== newState) {
        console.log('   ✅ Toggle functionality working');
      } else {
        console.log('   ❌ Toggle functionality not working');
      }
    } else {
      console.log('   ⚠️ No toggles found to test');
    }
    
    console.log('\n🎯 Test Summary:');
    console.log(`   • Mock data: ${hasMockData ? 'PRESENT' : 'REMOVED'}`);
    console.log(`   • Channel toggles: ${onToggles}/${toggles.length} ON`);
    console.log(`   • UI modernization: ${issues.length === 0 ? 'COMPLETE' : 'INCOMPLETE'}`);
    console.log(`   • Toggle functionality: ${toggles.length > 0 ? 'TESTED' : 'NO TOGGLES'}`);
    
    if (issues.length === 0 && !hasMockData) {
      console.log('\n🎉 All tests passed! UI/UX improvements are working correctly.');
    } else {
      console.log('\n⚠️ Some issues remain. Check the details above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
};

comprehensiveUITest();



