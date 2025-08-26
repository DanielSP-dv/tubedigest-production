const { chromium } = require('playwright');

const analyzeDashboard = async () => {
  console.log('🔍 Analyzing Dashboard Issues');
  console.log('============================');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500,
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
    await page.screenshot({ path: 'dashboard-analysis.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-analysis.png');
    
    // Analyze channel selection state
    console.log('\n🔍 Analyzing Channel Selection:');
    
    // Check selected channels count
    const selectedCountText = await page.locator('text=Selected Channels').first().textContent();
    console.log(`   Selected count text: ${selectedCountText}`);
    
    // Check if any toggles are actually ON
    const toggles = await page.locator('.ant-switch').all();
    console.log(`   Total toggles found: ${toggles.length}`);
    
    let onToggles = 0;
    for (let i = 0; i < toggles.length; i++) {
      const isChecked = await toggles[i].getAttribute('aria-checked');
      if (isChecked === 'true') {
        onToggles++;
      }
    }
    console.log(`   Toggles ON: ${onToggles}`);
    console.log(`   Toggles OFF: ${toggles.length - onToggles}`);
    
    // Check for mock data
    console.log('\n🔍 Analyzing Video Content:');
    const videoCards = await page.locator('.ant-card').all();
    console.log(`   Video cards found: ${videoCards.length}`);
    
    for (let i = 0; i < videoCards.length; i++) {
      const cardText = await videoCards[i].textContent();
      if (cardText.includes('Mock')) {
        console.log(`   ❌ Mock data found in card ${i + 1}: ${cardText.substring(0, 100)}...`);
      }
    }
    
    // Check UI elements that need improvement
    console.log('\n🔍 Analyzing UI Elements:');
    
    // Check for emoji icons
    const emojiElements = await page.locator('text=/[🚀🎯📊📋🔍🔄]/').all();
    console.log(`   Emoji icons found: ${emojiElements.length}`);
    
    // Check for "Refresh Cache" button
    const refreshCacheBtn = await page.locator('text=Refresh Cache').count();
    console.log(`   "Refresh Cache" buttons: ${refreshCacheBtn}`);
    
    // Check for "Quick Actions" text
    const quickActionsText = await page.locator('text=Quick Actions').count();
    console.log(`   "Quick Actions" text instances: ${quickActionsText}`);
    
    // Check for "Edit" button
    const editBtn = await page.locator('text=Edit').count();
    console.log(`   "Edit" buttons: ${editBtn}`);
    
    console.log('\n📋 Summary of Issues:');
    console.log('   1. Channel toggles not reflecting selected state');
    console.log('   2. Mock video data being displayed');
    console.log('   3. Too many emoji icons (not modern/minimal)');
    console.log('   4. "Refresh Cache" button should be removed');
    console.log('   5. "Quick Actions" text should be simplified');
    console.log('   6. "Edit" button may be unnecessary');
    console.log('   7. Overall UI needs modernization');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await browser.close();
  }
};

analyzeDashboard();



