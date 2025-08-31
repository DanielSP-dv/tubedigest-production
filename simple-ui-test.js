const { chromium } = require('playwright');

const simpleUITest = async () => {
  console.log('🎯 Simple UI/UX Test');
  console.log('====================');
  
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
    await page.screenshot({ path: 'simple-ui-test.png', fullPage: true });
    console.log('📸 Screenshot saved as simple-ui-test.png');
    
    // Test 1: Check for mock data removal
    console.log('\n🔍 Test 1: Mock Data Check');
    const pageContent = await page.content();
    const hasMockData = pageContent.includes('Mock Video') || pageContent.includes('mock-');
    
    if (hasMockData) {
      console.log('   ❌ Mock data still present');
    } else {
      console.log('   ✅ Mock data removed successfully');
    }
    
    // Test 2: Check for removed UI elements
    console.log('\n🔍 Test 2: Removed UI Elements Check');
    
    const refreshCacheBtn = await page.locator('text=Refresh Cache').count();
    const quickActionsText = await page.locator('text=Quick Actions').count();
    const editBtn = await page.locator('text=Edit').count();
    const selectedForDigestText = await page.locator('text=Selected for Digest').count();
    
    console.log(`   🔄 "Refresh Cache" buttons: ${refreshCacheBtn} (should be 0)`);
    console.log(`   📋 "Quick Actions" text: ${quickActionsText} (should be 0)`);
    console.log(`   ✏️ "Edit" buttons: ${editBtn} (should be 0)`);
    console.log(`   ✅ "Selected for Digest" text: ${selectedForDigestText} (should be 0)`);
    
    // Test 3: Check for modern elements
    console.log('\n🔍 Test 3: Modern UI Elements Check');
    
    const menuIcon = await page.locator('.anticon-menu').count();
    const channelsText = await page.locator('text=/Channels/').count();
    const selectAllBtn = await page.locator('text=Select All').count();
    
    console.log(`   ☰ Menu icons: ${menuIcon} (should be > 0)`);
    console.log(`   📺 "Channels" text: ${channelsText} (should be > 0)`);
    console.log(`   🔘 "Select All" buttons: ${selectAllBtn} (should be > 0)`);
    
    // Test 4: Check for emoji icons
    console.log('\n🔍 Test 4: Emoji Icon Check');
    const emojiElements = await page.locator('text=/[🚀🎯📊📋🔍🔄]/').all();
    console.log(`   😀 Emoji icons found: ${emojiElements.length} (should be minimal)`);
    
    // Test 5: Overall assessment
    console.log('\n🔍 Test 5: Overall Assessment');
    
    const issues = [];
    if (hasMockData) issues.push('Mock data still present');
    if (refreshCacheBtn > 0) issues.push('Refresh Cache button not removed');
    if (quickActionsText > 0) issues.push('Quick Actions text not removed');
    if (editBtn > 0) issues.push('Edit button not removed');
    if (selectedForDigestText > 0) issues.push('Selected for Digest text not removed');
    if (menuIcon === 0) issues.push('Menu icon not found');
    if (channelsText === 0) issues.push('Channels text not found');
    
    if (issues.length === 0) {
      console.log('   ✅ All UI improvements implemented successfully');
    } else {
      console.log('   ❌ Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    console.log('\n🎯 Test Summary:');
    console.log(`   • Mock data: ${hasMockData ? 'PRESENT' : 'REMOVED'}`);
    console.log(`   • UI modernization: ${issues.length === 0 ? 'COMPLETE' : 'INCOMPLETE'}`);
    console.log(`   • Emoji icons: ${emojiElements.length} found`);
    
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

simpleUITest();




